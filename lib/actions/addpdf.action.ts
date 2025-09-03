'use server'

import PdfParse from "pdf-parse";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { imagekit } from "../imagekit";

// Helper function to safely parse JSON with fallbacks
function safeJsonParse(text: string) {
  try {
    // First, try direct parsing
    return JSON.parse(text);
  } catch (error) {
    console.log('Direct JSON parse failed, trying cleanup...');
    
    // Try to extract JSON from markdown code blocks or other formatting
    let cleanedText = text.trim();
    
    // Remove markdown code blocks
    cleanedText = cleanedText.replace(/^```json\s*/gim, '').replace(/^```\s*/gim, '').replace(/```\s*$/gim, '');
    
    // Remove any leading/trailing whitespace and newlines
    cleanedText = cleanedText.trim();
    
    // Try to find JSON object boundaries
    const jsonStart = cleanedText.indexOf('{');
    const jsonEnd = cleanedText.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1);
    }
    
    try {
      return JSON.parse(cleanedText);
    } catch (secondError) {
      console.error('JSON cleanup failed:', secondError);
      
      // Return a default structure if all parsing fails
      return {
        accordion: [],
        tables: [],
        timeline: [],
        summary: "Failed to parse document structure. Please try again.",
        tasks: [],
        deadlines: []
      };
    }
  }
}

// Retry function with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Check if it's a rate limit or overload error
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      const isRetryableError = errorMessage.includes('overloaded') || 
                              errorMessage.includes('rate limit') || 
                              errorMessage.includes('too many requests') ||
                              errorMessage.includes('quota exceeded');
      
      if (!isRetryableError || attempt === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`Attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

export const uploadPDFMain = async (formData: FormData) => {
  try {
    const file = formData.get('pdf') as File;
    if (!file) throw new Error('No file provided');

    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadResult = await imagekit.upload({
      file: buffer,
      fileName: file.name,
      folder: '/pdfs/',
    });
    console.log('PDF uploaded to ImageKit:', uploadResult);

    const pdfData = await PdfParse(buffer);
    const pdfText = pdfData.text;

    // Truncate extremely long text to avoid token limits
    const maxTextLength = 45000; // Reduced to be more conservative
    const truncatedText = pdfText.length > maxTextLength 
      ? pdfText.substring(0, maxTextLength) + "\n\n[Document truncated due to length...]"
      : pdfText;

    const prompt = `
You are Ava, an expert **real estate contract intelligence assistant**. 
Analyze this PDF thoroughly and extract **comprehensive structured JSON data**. 
Your output must always be valid JSON (no markdown, no explanations, no text outside JSON).  

### OUTPUT SCHEMA:
{
  "propertyDetails": {
    "datesAndDeadlines": [
      { "itemNo": 1, "reference": "string", "event": "string", "deadline": "YYYY-MM-DD or 'TBD'" }
    ]
  },
  "tasks": [
    { "id": 1, "title": "string", "dueDate": "YYYY-MM-DD or 'TBD'", "relatedTo": "string" }
  ],
  "accordion": [
    { "question": "string", "answer": "string", "page": 1 }
  ],
  "tables": [
    { "title": "string", "headers": ["string"], "rows": [["string"]], "page": 1 }
  ],
  "timeline": [
    { "milestone": "string", "date": "YYYY-MM-DD or 'TBD'", "description": "string", "page": 1 }
  ],
  "summary": "Detailed plain-language summary in 5-7 sentences covering key terms, responsibilities, and parties.",
  "deadlines": [
    { "name": "string", "deadline": "YYYY-MM-DD or 'TBD'", "relatedTask": "string", "page": 1 }
  ]
}

### CRITICAL INSTRUCTIONS:
- Always **return a valid JSON object only**. No markdown, no text before/after.
- **First**, fill \`propertyDetails.datesAndDeadlines\` as a structured table-style list (Item No., Reference, Event, Deadline).
- **Second**, derive actionable \`tasks\` from each deadline (buyer, seller, agent, lender, inspector, etc.).
- After that, fill the other sections (\`accordion\`, \`tables\`, \`timeline\`, \`summary\`, \`deadlines\`).
- Always include **all key obligations, deadlines, and milestones** — offer acceptance, inspection, financing, closing, contingency periods, lease/rent deadlines, signatures, etc.
- Use **TBD** if a date is blank, missing, or has placeholders.
- For timeline: include **all chronological events** (not just deadlines, but also notices, approvals, payments, contingencies).
- For tasks: assign **priority levels** (High | Medium | Low) when appropriate.
- For summary: provide a **clear, human-readable overview**: parties, property, financial terms, major deadlines, and risk points.
- Add page numbers wherever possible.
- If a section has no data, return an empty array.

### DOCUMENT CONTENT:
${truncatedText}
`;

    // Use retry logic for AI generation
    const response = await retryWithBackoff(async () => {
      return await generateText({
        model: google('gemini-2.5-pro'),
        prompt,
        temperature: 0.1,
      });
    }, 3, 2000); // 3 retries with 2 second base delay

    console.log('Raw AI response:', response.text);
    console.log('Response length:', response.text.length);

    // Use the safe JSON parser
    const structuredData = safeJsonParse(response.text);
    
    // Validate the structure has required fields
    const requiredFields = ['accordion', 'tables', 'timeline', 'summary', 'tasks', 'deadlines'];
    for (const field of requiredFields) {
      if (!(field in structuredData)) {
        structuredData[field] = field === 'summary' ? 'No summary available' : [];
      }
    }

    console.log('Parsed structured data:', structuredData);

    return { success: true, url: uploadResult.url, structuredData };

  } catch (error: any) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error during PDF processing:', message);
    
    // Provide more specific error messages
    let userFriendlyMessage = message;
    if (message.toLowerCase().includes('overloaded')) {
      userFriendlyMessage = 'AI service is currently overloaded. Please try again in a few minutes.';
    } else if (message.toLowerCase().includes('rate limit')) {
      userFriendlyMessage = 'Rate limit exceeded. Please wait a moment and try again.';
    } else if (message.toLowerCase().includes('quota')) {
      userFriendlyMessage = 'API quota exceeded. Please try again later.';
    }
    
    // Return a more informative error response instead of throwing
    return { 
      success: false, 
      error: userFriendlyMessage,
      structuredData: {
        accordion: [],
        tables: [],
        timeline: [],
        summary: `Error processing document: ${userFriendlyMessage}`,
        tasks: [],
        deadlines: [],
        propertyDetails: {
          datesAndDeadlines: []
        }
      }
    };
  }
};