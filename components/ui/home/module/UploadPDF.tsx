'use client'
import { uploadPDFMain } from "@/lib/actions/addpdf.action";
import { FileMeta } from "@/types";
import { useState } from "react";
import { Calendar, FileText, CheckCircle, Users, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { OnboardingLayout } from "./OnboardingLayout";
import ContractSummaryCard from "./ContractSummaryCard";
import { Button } from "../../button";
import PropertyProcessingLoader from "@/components/loading/Loading";
import { AnalysisResults } from "./AnalysisResult";
import { OnboardingSteps } from "./OnboardingSteps";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../dialog";
import { SideSelection } from "./SideSelection";
import { UploadArea } from "./UploadArea";

const TransactionModalComponent = () => {
  const [selectedSide, setSelectedSide] = useState('Both');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileMeta, setFileMeta] = useState<FileMeta | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPreview, setShowPreview] = useState(false); // New state for preview
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [expandedAccordion, setExpandedAccordion] = useState('accordion');
  const [showOptions, setShowOptions] = useState(true);
  const [showContractIntake, setShowContractIntake] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState<string>(''); // For preview accordion
  const [showSummaryDialog, setShowSummaryDialog] = useState(false); // For summary dialog

  // Static preview data
  const previewSections = [
    {
      id: 'accordion',
      title: 'Key Contract Details',
      icon: <FileText className="w-5 h-5" />,
      description: 'Important contract terms, conditions, and clauses',
      items: [
        'Property address and legal description',
        'Purchase price and financing terms',
        'Contingencies and conditions',
        'Closing date and possession details'
      ]
    },
    {
      id: 'timeline',
      title: 'Transaction Timeline',
      icon: <Calendar className="w-5 h-5" />,
      description: 'Key dates and milestones throughout the transaction',
      items: [
        'Contract effective date',
        'Inspection period deadlines',
        'Financing contingency dates',
        'Closing and possession timeline'
      ]
    },
    {
      id: 'tasks',
      title: 'Action Items & Tasks',
      icon: <CheckCircle className="w-5 h-5" />,
      description: 'Tasks that need to be completed for successful closing',
      items: [
        'Schedule home inspection',
        'Submit loan application',
        'Review title commitment',
        'Coordinate closing arrangements'
      ]
    },
    {
      id: 'deadlines',
      title: 'Critical Deadlines',
      icon: <AlertTriangle className="w-5 h-5" />,
      description: 'Time-sensitive deadlines that cannot be missed',
      items: [
        'Inspection objection deadline',
        'Loan approval deadline',
        'Final walkthrough date',
        'Closing deadline'
      ]
    },
    {
      id: 'tables',
      title: 'Financial Summary',
      icon: <Users className="w-5 h-5" />,
      description: 'Financial breakdowns and cost summaries',
      items: [
        'Purchase price breakdown',
        'Closing cost estimates',
        'Earnest money details',
        'Commission structure'
      ]
    }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.size <= 25 * 1024 * 1024) {
      setUploadedFile(file);
      setFileMeta({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      });
      
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setFileMeta(null);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  const resetModalState = () => {
    setShowOnboarding(false);
    setShowPreview(false);
    setShowOptions(true);
    setShowContractIntake(false);
    setCurrentStep(1);
    setResult(null);
    setLoading(false);
    setUploadedFile(null);
    setFileMeta(null);
    setSelectedSide('Both');
    setExpandedAccordion('accordion');
    setPreviewExpanded('');
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  const handleModalClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetModalState();
    }
  };

  const handleShowPreview = () => {
    if (!uploadedFile) return;
    setShowContractIntake(false);
    setShowPreview(true);
  };

  const handleStartAnalysis = async () => {
    if (!uploadedFile) return;
    
    setLoading(true);
    setShowPreview(false);
    setShowOnboarding(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('pdf', uploadedFile);
      const res = await uploadPDFMain(formData);
      
      if (res.success) {
        setResult(res.structuredData);
        console.log('Success:', res.structuredData);
      } else {
        console.error('Processing failed:', res.error);
        
        // Show user-friendly error message
        const errorMessage = res.error || 'Unknown error occurred';
        if (errorMessage.toLowerCase().includes('overloaded')) {
          alert('🤖 AI service is currently busy. Please wait a few minutes and try again.');
        } else if (errorMessage.toLowerCase().includes('rate limit')) {
          alert('⏱️ Too many requests. Please wait a moment and try again.');
        } else if (errorMessage.toLowerCase().includes('quota')) {
          alert('📊 Daily usage limit reached. Please try again tomorrow.');
        } else {
          alert(`❌ Error processing the PDF: ${errorMessage}`);
        }
        
        // Still set the result to show partial data if available
        setResult(res.structuredData);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      if (errorMessage.toLowerCase().includes('network')) {
        alert('🌐 Network error. Please check your connection and try again.');
      } else {
        alert('❌ Error processing the PDF. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleAccordion = (section: string) => {
    setExpandedAccordion(expandedAccordion === section ? '' : section);
  };

  const togglePreviewAccordion = (section: string) => {
    setPreviewExpanded(previewExpanded === section ? '' : section);
  };

  const handleCreateNewTransaction = () => {
    console.log("Navigate to onboarding page");
    setIsOpen(false);
    resetModalState();
  };

  const handleContractIntake = () => {
    setShowOptions(false);
    setShowContractIntake(true);
  };

  const handleBackToOptions = () => {
    setShowOptions(true);
    setShowContractIntake(false);
    setShowPreview(false);
  };

  const handleBackToUpload = () => {
    setShowPreview(false);
    setShowContractIntake(true);
  };

  const handleOnboardingComplete = () => {
    resetModalState();
    setIsOpen(false);
  };

  const handleBackToUploadFromOnboarding = () => {
    setShowOnboarding(false);
    setCurrentStep(1);
    setResult(null);
  };

  // Generate comprehensive extraction analysis summary
  const generateExtractionSummary = (result: any) => {
    if (!result) return null;

    interface ExtractionItem {
      type: string;
      count: number;
      method: string;
      confidence: string;
      pages: (string | number)[];
    }

    interface PartialExtractionItem {
      type: string;
      reason: string;
      extractedCount: number;
      suggestion: string;
    }

    interface FailedExtractionItem {
      type: string;
      reason: string;
      suggestion: string;
    }

    interface TableDetail {
      title: string;
      rowCount: number;
      columnCount: number;
      page: string | number;
      hasHeaders: boolean;
      completeness: string;
    }

    interface TimelineDetail {
      milestone: string;
      date: string;
      page: string | number;
      hasDescription: boolean;
      dateFormat: string;
    }

    interface DeadlineDetail {
      name: string;
      deadline: string;
      priority: string;
      page: string | number;
      urgency: string;
    }

    interface TaskDetail {
      title: string;
      priority: string;
      dueDate: string;
      page: string | number;
      actionability: string;
    }

    interface FinancialDetail {
      date: string;
      amount: string;
      type: string;
      status: string;
      completeness: string;
    }

    interface QADetail {
      question: string;
      hasAnswer: boolean;
      page: string | number;
      completeness: string;
    }

    interface DetailedFinding {
      found: boolean;
      count?: number;
      extractionMethod: string;
      dataQuality: string;
      details?: (TableDetail | TimelineDetail | DeadlineDetail | TaskDetail | FinancialDetail | QADetail)[];
      length?: number;
      preview?: string;
      completeness?: string;
    }

    const summary = {
      extractionOverview: {
        totalDataPoints: 0,
        successfulExtractions: 0,
        failedExtractions: 0,
        extractionRate: 0,
        documentComplexity: 'Medium' as string,
        processingApproach: [
          'AI-powered document parsing',
          'Structured data extraction',
          'Page-by-page analysis',
          'Context-aware field identification'
        ]
      },
      dataAnalysis: {
        successfullyExtracted: [] as ExtractionItem[],
        partiallyExtracted: [] as PartialExtractionItem[],
        failedToExtract: [] as FailedExtractionItem[],
        extractionChallenges: [] as string[]
      },
      methodologyBreakdown: {
        aiApproach: [
          'Natural Language Processing (NLP)',
          'Pattern Recognition',
          'Table Structure Detection',
          'Date & Timeline Parsing',
          'Legal Document Understanding'
        ],
        dataSourcePages: new Set<string | number>(),
        extractionTechniques: [] as string[],
        confidenceScores: {} as Record<string, number>
      },
      detailedFindings: {
        propertyDetails: null as DetailedFinding | null,
        timeline: null as DetailedFinding | null,
        deadlines: null as DetailedFinding | null,
        tasks: null as DetailedFinding | null,
        financialInfo: null as DetailedFinding | null,
        terms: null as DetailedFinding | null,
        qaAnalysis: null as DetailedFinding | null
      },
      extractionInsights: {
        strongDataPoints: [] as string[],
        weakDataPoints: [] as string[],
        missingCriticalInfo: [] as string[],
        dataQualityAssessment: {} as Record<string, any>
      },
      recommendations: [] as string[]
    };

    let totalAttempts = 0;
    let successfulExtractions = 0;

    // Analyze Property Details (Tables)
    if (result.tables && result.tables.length > 0) {
      summary.detailedFindings.propertyDetails = {
        found: true,
        count: result.tables.length,
        extractionMethod: 'Table structure detection and cell parsing',
        dataQuality: 'High',
        details: result.tables.map((table: any) => ({
          title: table.title || 'Property Information',
          rowCount: table.rows?.length || 0,
          columnCount: table.headers?.length || 0,
          page: table.page,
          hasHeaders: table.headers && table.headers.length > 0,
          completeness: table.rows?.length > 0 ? 'Complete' : 'Partial'
        }))
      };
      summary.dataAnalysis.successfullyExtracted.push({
        type: 'Property Details',
        count: result.tables.length,
        method: 'Structured table parsing',
        confidence: 'High',
        pages: result.tables.map((t: any) => t.page).filter(Boolean)
      });
      summary.extractionInsights.strongDataPoints.push('Property information tables with clear structure');
      summary.methodologyBreakdown.extractionTechniques.push('Table boundary detection');
      totalAttempts++;
      successfulExtractions++;
      result.tables.forEach((table: any) => {
        if (table.page) summary.methodologyBreakdown.dataSourcePages.add(table.page);
      });
    } else {
      summary.dataAnalysis.failedToExtract.push({
        type: 'Property Details',
        reason: 'No structured tables found in document',
        suggestion: 'Document may contain unstructured property information'
      });
      summary.extractionInsights.missingCriticalInfo.push('Property details in tabular format');
      totalAttempts++;
    }

    // Analyze Timeline
    if (result.timeline && result.timeline.length > 0) {
      summary.detailedFindings.timeline = {
        found: true,
        count: result.timeline.length,
        extractionMethod: 'Date pattern recognition and milestone identification',
        dataQuality: 'High',
        details: result.timeline.map((item: any) => ({
          milestone: item.milestone,
          date: item.date,
          page: item.page,
          hasDescription: !!item.description,
          dateFormat: item.date && item.date !== 'TBD' ? 'Structured' : 'Missing/TBD'
        }))
      };
      summary.dataAnalysis.successfullyExtracted.push({
        type: 'Timeline Events',
        count: result.timeline.length,
        method: 'Date parsing and milestone extraction',
        confidence: 'High',
        pages: result.timeline.map((t: any) => t.page).filter(Boolean)
      });
      summary.extractionInsights.strongDataPoints.push('Timeline milestones with clear date references');
      summary.methodologyBreakdown.extractionTechniques.push('Date pattern recognition');
      totalAttempts++;
      successfulExtractions++;
      result.timeline.forEach((item: any) => {
        if (item.page) summary.methodologyBreakdown.dataSourcePages.add(item.page);
      });
    } else {
      summary.dataAnalysis.failedToExtract.push({
        type: 'Timeline Events',
        reason: 'No clear timeline or milestone patterns detected',
        suggestion: 'Document may contain dates in non-standard format'
      });
      summary.extractionInsights.missingCriticalInfo.push('Transaction timeline and key milestones');
      totalAttempts++;
    }

    // Analyze Deadlines
    if (result.deadlines && result.deadlines.length > 0) {
      summary.detailedFindings.deadlines = {
        found: true,
        count: result.deadlines.length,
        extractionMethod: 'Critical date identification and urgency assessment',
        dataQuality: 'High',
        details: result.deadlines.map((deadline: any) => ({
          name: deadline.name,
          deadline: deadline.deadline,
          priority: deadline.priority || 'Medium',
          page: deadline.page,
          urgency: deadline.deadline && deadline.deadline !== 'TBD' ? 'Time-bound' : 'Open-ended'
        }))
      };
      summary.dataAnalysis.successfullyExtracted.push({
        type: 'Critical Deadlines',
        count: result.deadlines.length,
        method: 'Deadline pattern matching and priority assessment',
        confidence: 'High',
        pages: result.deadlines.map((d: any) => d.page).filter(Boolean)
      });
      summary.extractionInsights.strongDataPoints.push('Critical deadlines with clear time constraints');
      summary.methodologyBreakdown.extractionTechniques.push('Deadline urgency analysis');
      totalAttempts++;
      successfulExtractions++;
      result.deadlines.forEach((deadline: any) => {
        if (deadline.page) summary.methodologyBreakdown.dataSourcePages.add(deadline.page);
      });
    } else {
      summary.dataAnalysis.failedToExtract.push({
        type: 'Critical Deadlines',
        reason: 'No explicit deadline language or time constraints found',
        suggestion: 'Review document for implicit time requirements'
      });
      summary.extractionInsights.missingCriticalInfo.push('Time-sensitive deadlines and constraints');
      totalAttempts++;
    }

    // Analyze Tasks
    if (result.tasks && result.tasks.length > 0) {
      summary.detailedFindings.tasks = {
        found: true,
        count: result.tasks.length,
        extractionMethod: 'Action item identification and responsibility assignment',
        dataQuality: 'Medium',
        details: result.tasks.map((task: any) => ({
          title: task.title,
          priority: task.priority,
          dueDate: task.dueDate,
          page: task.page,
          actionability: task.title && task.dueDate ? 'Actionable' : 'Needs clarification'
        }))
      };
      summary.dataAnalysis.successfullyExtracted.push({
        type: 'Action Items',
        count: result.tasks.length,
        method: 'Task extraction and priority classification',
        confidence: 'Medium',
        pages: result.tasks.map((t: any) => t.page).filter(Boolean)
      });
      summary.extractionInsights.strongDataPoints.push('Actionable tasks with assigned responsibilities');
      summary.methodologyBreakdown.extractionTechniques.push('Action verb identification');
      totalAttempts++;
      successfulExtractions++;
      result.tasks.forEach((task: any) => {
        if (task.page) summary.methodologyBreakdown.dataSourcePages.add(task.page);
      });
    } else {
      summary.dataAnalysis.partiallyExtracted.push({
        type: 'Action Items',
        reason: 'Tasks may be embedded within other sections',
        extractedCount: 0,
        suggestion: 'Review deadlines and timeline for implicit action items'
      });
      totalAttempts++;
    }

    // Analyze Financial Information
    if (result.financingHistory && result.financingHistory.length > 0) {
      summary.detailedFindings.financialInfo = {
        found: true,
        count: result.financingHistory.length,
        extractionMethod: 'Financial data parsing and amount recognition',
        dataQuality: 'High',
        details: result.financingHistory.map((item: any) => ({
          date: item.date,
          amount: item.amount,
          type: item.type,
          status: item.status,
          completeness: item.amount && item.type ? 'Complete' : 'Partial'
        }))
      };
      summary.dataAnalysis.successfullyExtracted.push({
        type: 'Financial Information',
        count: result.financingHistory.length,
        method: 'Currency and financial pattern recognition',
        confidence: 'High',
        pages: ['Multiple'] // Financial info often spans pages
      });
      summary.extractionInsights.strongDataPoints.push('Financial transactions with clear amounts and dates');
      summary.methodologyBreakdown.extractionTechniques.push('Currency pattern matching');
      totalAttempts++;
      successfulExtractions++;
    } else {
      summary.dataAnalysis.failedToExtract.push({
        type: 'Financial Information',
        reason: 'No structured financial data or transaction history found',
        suggestion: 'Financial details may be embedded in property tables'
      });
      totalAttempts++;
    }

    // Analyze Terms & Conditions
    if (result.terms) {
      summary.detailedFindings.terms = {
        found: true,
        length: result.terms.length,
        extractionMethod: 'Legal language processing and clause identification',
        dataQuality: 'Medium',
        preview: result.terms.substring(0, 200) + (result.terms.length > 200 ? '...' : ''),
        completeness: result.terms.length > 100 ? 'Comprehensive' : 'Basic'
      };
      summary.dataAnalysis.successfullyExtracted.push({
        type: 'Terms & Conditions',
        count: 1,
        method: 'Legal text extraction and clause parsing',
        confidence: 'Medium',
        pages: ['Multiple']
      });
      summary.extractionInsights.strongDataPoints.push('Legal terms and contractual language');
      summary.methodologyBreakdown.extractionTechniques.push('Legal clause identification');
      totalAttempts++;
      successfulExtractions++;
    } else {
      summary.dataAnalysis.failedToExtract.push({
        type: 'Terms & Conditions',
        reason: 'No dedicated terms section or legal clauses identified',
        suggestion: 'Legal terms may be distributed throughout the document'
      });
      totalAttempts++;
    }

    // Analyze Q&A
    if (result.accordion && result.accordion.length > 0) {
      summary.detailedFindings.qaAnalysis = {
        found: true,
        count: result.accordion.length,
        extractionMethod: 'Question-answer pair identification and context matching',
        dataQuality: 'Medium',
        details: result.accordion.map((item: any) => ({
          question: item.question,
          hasAnswer: !!item.answer,
          page: item.page,
          completeness: item.question && item.answer ? 'Complete' : 'Partial'
        }))
      };
      summary.dataAnalysis.successfullyExtracted.push({
        type: 'Q&A Analysis',
        count: result.accordion.length,
        method: 'Context-based question-answer extraction',
        confidence: 'Medium',
        pages: result.accordion.map((q: any) => q.page).filter(Boolean)
      });
      summary.extractionInsights.strongDataPoints.push('Question-answer pairs with contextual relevance');
      summary.methodologyBreakdown.extractionTechniques.push('Context-aware Q&A matching');
      totalAttempts++;
      successfulExtractions++;
      result.accordion.forEach((item: any) => {
        if (item.page) summary.methodologyBreakdown.dataSourcePages.add(item.page);
      });
    } else {
      summary.dataAnalysis.partiallyExtracted.push({
        type: 'Q&A Analysis',
        reason: 'Document structure not conducive to Q&A extraction',
        extractedCount: 0,
        suggestion: 'Information may be better represented in other formats'
      });
      totalAttempts++;
    }

    // Calculate extraction metrics
    summary.extractionOverview.totalDataPoints = totalAttempts;
    summary.extractionOverview.successfulExtractions = successfulExtractions;
    summary.extractionOverview.failedExtractions = totalAttempts - successfulExtractions;
    summary.extractionOverview.extractionRate = totalAttempts > 0 ? Math.round((successfulExtractions / totalAttempts) * 100) : 0;

    // Determine document complexity
    const pageCount = summary.methodologyBreakdown.dataSourcePages.size;
    if (pageCount <= 2) {
      summary.extractionOverview.documentComplexity = 'Simple';
    } else if (pageCount <= 5) {
      summary.extractionOverview.documentComplexity = 'Medium';
    } else {
      summary.extractionOverview.documentComplexity = 'Complex';
    }

    // Generate extraction challenges
    if (summary.extractionOverview.extractionRate < 50) {
      summary.dataAnalysis.extractionChallenges.push('Low extraction success rate - document may have non-standard formatting');
    }
    if (summary.dataAnalysis.failedToExtract.length > 3) {
      summary.dataAnalysis.extractionChallenges.push('Multiple data types not found - document may be incomplete or use different terminology');
    }
    if (pageCount > 10) {
      summary.dataAnalysis.extractionChallenges.push('Large document size may have caused some information to be truncated');
    }

    // Generate recommendations
    if (summary.extractionOverview.extractionRate >= 80) {
      summary.recommendations.push('Excellent extraction rate - document is well-structured and AI-friendly');
    } else if (summary.extractionOverview.extractionRate >= 60) {
      summary.recommendations.push('Good extraction rate - some manual review recommended for missing data');
    } else {
      summary.recommendations.push('Low extraction rate - manual document review strongly recommended');
    }

    if (summary.dataAnalysis.failedToExtract.length > 0) {
      summary.recommendations.push(`Review ${summary.dataAnalysis.failedToExtract.length} failed extraction(s) for critical missing information`);
    }

    if (summary.extractionInsights.missingCriticalInfo.length > 0) {
      summary.recommendations.push('Consider supplementing with additional document sources for missing critical information');
    }

    // Convert Set to Array
    summary.methodologyBreakdown.dataSourcePages = Array.from(summary.methodologyBreakdown.dataSourcePages);

    // Set confidence scores
    summary.methodologyBreakdown.confidenceScores = {
      overall: summary.extractionOverview.extractionRate,
      propertyDetails: result.tables?.length > 0 ? 90 : 0,
      timeline: result.timeline?.length > 0 ? 85 : 0,
      deadlines: result.deadlines?.length > 0 ? 88 : 0,
      tasks: result.tasks?.length > 0 ? 75 : 0,
      financial: result.financingHistory?.length > 0 ? 92 : 0,
      terms: result.terms ? 70 : 0,
      qaAnalysis: result.accordion?.length > 0 ? 65 : 0
    };

    return summary;
  };

  // Preview screen
  if (showPreview) {
    return (
      <OnboardingLayout pdfUrl={pdfUrl} fileMeta={fileMeta} currentStep={0}>
      <ContractSummaryCard/>
       <div className="flex justify-between items-center my-5">
            <Button className="cursor-pointer" onClick={handleBackToUpload} variant="outline">
              Back to Upload
            </Button>
            
            <Button
              onClick={handleStartAnalysis}
             className="bg-black cursor-pointer text-white hover:bg-black/80"
            >
              Extract Remaining Details
            </Button>
          </div>
      </OnboardingLayout>
    );
  }

  // Full screen onboarding view
  if (showOnboarding) {
    return (
      <OnboardingLayout pdfUrl={pdfUrl} fileMeta={fileMeta} currentStep={currentStep}>
        {loading ? (
          <PropertyProcessingLoader />
        ) : result ? (
          <>
            {currentStep === 1 && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Transaction Details</h2>
                  <p className="text-gray-600 text-xs">
                    Take a look a moment to review the key details I pulled from your document.
                    You can make any edits before we finalize your life.
                  </p>
                </div>

                <AnalysisResults 
                  result={result} 
                  expandedAccordion={expandedAccordion} 
                  onToggleAccordion={toggleAccordion} 
                />

                <div className="mt-8 flex justify-between">
                  <Button onClick={handleBackToUploadFromOnboarding} variant="outline">
                    Back to Upload
                  </Button>
                  <div className="flex gap-3">
                    <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="cursor-pointer">
                          <FileText className="w-4 h-4 mr-2" />
                          View Summary
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-hidden p-0 bg-gradient-to-br from-slate-50 to-gray-100">
                        <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 border-b border-blue-200">
                          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                              <FileText className="w-6 h-6" />
                            </div>
                            AI Extraction Analysis Report
                            <div className="ml-auto text-sm bg-white/20 px-3 py-1 rounded-full">
                              Professional Analysis
                            </div>
                          </DialogTitle>
                          <p className="text-blue-100 mt-2">
                            Comprehensive AI-powered document analysis with detailed extraction insights
                          </p>
                        </DialogHeader>
                        <div className="mt-4">
                          {(() => {
                            const summary = generateExtractionSummary(result);
                            if (!summary) return <div>No analysis available</div>;
                            
                            return (
                              <div className="space-y-6">
                                {/* Extraction Overview */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                                  <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    Extraction Overview
                                  </h3>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center">
                                      <div className="text-3xl font-bold text-blue-700">{summary.extractionOverview.extractionRate}%</div>
                                      <div className="text-sm text-blue-600">Success Rate</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-3xl font-bold text-green-700">{summary.extractionOverview.successfulExtractions}</div>
                                      <div className="text-sm text-green-600">Successful</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-3xl font-bold text-red-700">{summary.extractionOverview.failedExtractions}</div>
                                      <div className="text-sm text-red-600">Failed</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-3xl font-bold text-purple-700">{summary.extractionOverview.documentComplexity}</div>
                                      <div className="text-sm text-purple-600">Complexity</div>
                                    </div>
                                  </div>
                                </div>

                                {/* AI Processing Approach */}
                                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                                  <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                                    <Users className="w-5 h-5 mr-2" />
                                    AI Processing Methodology
                                  </h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                      <h4 className="font-medium text-green-800 mb-2">Processing Approach:</h4>
                                      <ul className="space-y-1">
                                        {summary.extractionOverview.processingApproach.map((approach: string, idx: number) => (
                                          <li key={idx} className="text-sm text-green-700 flex items-center">
                                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                            {approach}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-green-800 mb-2">AI Techniques Used:</h4>
                                      <ul className="space-y-1">
                                        {summary.methodologyBreakdown.aiApproach.map((technique: string, idx: number) => (
                                          <li key={idx} className="text-sm text-green-700 flex items-center">
                                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                            {technique}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                </div>

                                {/* Data Analysis Results */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {/* Successfully Extracted */}
                                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                    <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Successfully Extracted ({summary.dataAnalysis.successfullyExtracted.length})
                                    </h4>
                                    <div className="space-y-2">
                                      {summary.dataAnalysis.successfullyExtracted.map((item: any, idx: number) => (
                                        <div key={idx} className="bg-white p-3 rounded border border-green-100">
                                          <div className="font-medium text-green-900 text-sm">{item.type}</div>
                                          <div className="text-xs text-green-700">Method: {item.method}</div>
                                          <div className="text-xs text-green-600">Confidence: {item.confidence}</div>
                                          <div className="text-xs text-green-600">Count: {item.count}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Partially Extracted */}
                                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                                    <h4 className="font-semibold text-yellow-800 mb-3 flex items-center">
                                      <AlertTriangle className="w-4 h-4 mr-2" />
                                      Partially Extracted ({summary.dataAnalysis.partiallyExtracted.length})
                                    </h4>
                                    <div className="space-y-2">
                                      {summary.dataAnalysis.partiallyExtracted.map((item: any, idx: number) => (
                                        <div key={idx} className="bg-white p-3 rounded border border-yellow-100">
                                          <div className="font-medium text-yellow-900 text-sm">{item.type}</div>
                                          <div className="text-xs text-yellow-700">Reason: {item.reason}</div>
                                          <div className="text-xs text-yellow-600">Suggestion: {item.suggestion}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Failed to Extract */}
                                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                                    <h4 className="font-semibold text-red-800 mb-3 flex items-center">
                                      <AlertTriangle className="w-4 h-4 mr-2" />
                                      Failed to Extract ({summary.dataAnalysis.failedToExtract.length})
                                    </h4>
                                    <div className="space-y-2">
                                      {summary.dataAnalysis.failedToExtract.map((item: any, idx: number) => (
                                        <div key={idx} className="bg-white p-3 rounded border border-red-100">
                                          <div className="font-medium text-red-900 text-sm">{item.type}</div>
                                          <div className="text-xs text-red-700">Reason: {item.reason}</div>
                                          <div className="text-xs text-red-600">Suggestion: {item.suggestion}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Detailed Findings */}
                                <div className="space-y-4">
                                  <h3 className="text-lg font-semibold text-gray-900">Detailed Extraction Analysis</h3>
                                  
                                  {Object.entries(summary.detailedFindings).map(([key, finding]: [string, any]) => {
                                    if (!finding) return null;
                                    
                                    return (
                                      <div key={key} className="bg-white rounded-lg p-4 border border-gray-200">
                                        <h4 className="font-semibold text-gray-800 mb-2 capitalize flex items-center">
                                          <FileText className="w-4 h-4 mr-2 text-blue-600" />
                                          {key.replace(/([A-Z])/g, ' $1').trim()}
                                        </h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                          <div>
                                            <span className="text-xs text-gray-500">Count:</span>
                                            <div className="font-medium">{finding.count || 'N/A'}</div>
                                          </div>
                                          <div>
                                            <span className="text-xs text-gray-500">Data Quality:</span>
                                            <div className={`font-medium ${
                                              finding.dataQuality === 'High' ? 'text-green-600' :
                                              finding.dataQuality === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                                            }`}>{finding.dataQuality}</div>
                                          </div>
                                          <div>
                                            <span className="text-xs text-gray-500">Method:</span>
                                            <div className="font-medium text-sm">{finding.extractionMethod}</div>
                                          </div>
                                          <div>
                                            <span className="text-xs text-gray-500">Status:</span>
                                            <div className="font-medium text-green-600">Found</div>
                                          </div>
                                        </div>
                                        
                                        {finding.details && (
                                          <div className="space-y-2">
                                            <h5 className="text-sm font-medium text-gray-700">Extracted Items:</h5>
                                            <div className="grid gap-2">
                                              {finding.details.slice(0, 3).map((detail: any, idx: number) => (
                                                <div key={idx} className="text-xs bg-gray-50 p-2 rounded">
                                                  {Object.entries(detail).map(([k, v]: [string, any]) => (
                                                    <span key={k} className="mr-3">
                                                      <span className="font-medium">{k}:</span> {String(v)}
                                                    </span>
                                                  ))}
                                                </div>
                                              ))}
                                              {finding.details.length > 3 && (
                                                <div className="text-xs text-gray-500 italic">
                                                  ... and {finding.details.length - 3} more items
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Confidence Scores */}
                                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Confidence Scores</h3>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {Object.entries(summary.methodologyBreakdown.confidenceScores).map(([key, score]: [string, any]) => (
                                      <div key={key} className="text-center">
                                        <div className={`text-2xl font-bold ${
                                          score >= 80 ? 'text-green-600' :
                                          score >= 60 ? 'text-yellow-600' : 'text-red-600'
                                        }`}>{score}%</div>
                                        <div className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Extraction Challenges */}
                                {summary.dataAnalysis.extractionChallenges.length > 0 && (
                                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                                    <h3 className="text-lg font-semibold text-orange-900 mb-3">Extraction Challenges</h3>
                                    <ul className="space-y-2">
                                      {summary.dataAnalysis.extractionChallenges.map((challenge: string, idx: number) => (
                                        <li key={idx} className="text-sm text-orange-800 flex items-start">
                                          <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 text-orange-600" />
                                          {challenge}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* AI Recommendations */}
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                  <h3 className="text-lg font-semibold text-blue-900 mb-3">AI Recommendations</h3>
                                  <ul className="space-y-2">
                                    {summary.recommendations.map((rec: string, idx: number) => (
                                      <li key={idx} className="text-sm text-blue-800 flex items-start">
                                        <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
                                        {rec}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {/* Data Sources */}
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Data Sources & Methodology</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-medium text-gray-800 mb-2">Pages Analyzed:</h4>
                                      <p className="text-sm text-gray-600">
                                        {summary.methodologyBreakdown.dataSourcePages.length > 0 
                                          ? summary.methodologyBreakdown.dataSourcePages.join(', ')
                                          : 'All pages processed'}
                                      </p>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-gray-800 mb-2">Document Info:</h4>
                                      <p className="text-sm text-gray-600">
                                        {fileMeta?.name} ({fileMeta?.size})
                                      </p>
                                    </div>
                                  </div>
                                  <div className="mt-4">
                                    <h4 className="font-medium text-gray-800 mb-2">Extraction Techniques Applied:</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {summary.methodologyBreakdown.extractionTechniques.map((technique: string, idx: number) => (
                                        <span key={idx} className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                                          {technique}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button onClick={() => setCurrentStep(2)} className="cursor-pointer">
                      Let's Review
                    </Button>
                  </div>
                </div>
              </>
            )}

            {currentStep > 1 && (
              <OnboardingSteps 
                result={result}
                currentStep={currentStep}
                onStepChange={setCurrentStep}
                onComplete={handleOnboardingComplete}
                expandedAccordion={expandedAccordion}
                onToggleAccordion={toggleAccordion}
              />
            )}
          </>
        ) : null}
      </OnboardingLayout>
    );
  }

  return (
    <div className=" w-full ">
     
            <>
              <DialogHeader className="p-6 pb-4 relative ">
             
              </DialogHeader>

              <div className="px-6 pb-6 space-y-6">
                {/* <SideSelection selectedSide={selectedSide} onSideChange={setSelectedSide} /> */}
                <UploadArea onFileUpload={handleFileUpload} fileMeta={fileMeta} onRemoveFile={removeFile} />

                <div className="flex justify-between items-center">
                  <Button
                    onClick={handleBackToOptions}
                    variant="outline"
                    className="text-gray-600 cursor-pointer border-gray-300 hover:bg-gray-50"
                  >
                    Back
                  </Button>

                  <Button
                    onClick={handleShowPreview}
                    disabled={!uploadedFile}
                   className="cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    Start Intake
                  </Button>
                </div>
              </div>
            </>
     
    </div>
  );
};

export default TransactionModalComponent;