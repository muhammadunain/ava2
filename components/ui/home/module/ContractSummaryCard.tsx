'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

export default function ContractSummaryCard() {
  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Heading Section */}
      <div>
        <h2 className="text-lg font-semibold">Got it! Here's the effective date I found.</h2>
        <p className="text-sm text-muted-foreground">
          Take a quick look and confirm it's correct.
        </p>
      </div>

      {/* Card Section */}
      <Collapsible>
        <Card className="shadow-md border rounded-xl">
          <CardHeader className="flex items-center justify-between cursor-pointer">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <CardTitle className="text-base font-semibold">Effective Date</CardTitle>
                </div>
                <span className="text-sm text-muted-foreground">07/26/2025</span>
              </div>
            </CollapsibleTrigger>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              ✏️
            </Button>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="py-4">
              <h4 className="text-sm font-semibold mb-1">Summary:</h4>
              <p className="text-sm leading-relaxed">
                The Effective Date of this Contract shall be the last date either <b>SELLER</b> or <b>BUYER</b> signs or initials this Contract. ALL CHANGES TO THE OFFER OR COUNTEROFFER MUST BE INITIALED AND DATED. THE LATEST DATE SET FORTH ON THIS CONTRACT BY EITHER PARTY'S SIGNATURE OR INITIALS SHALL BE THE EFFECTIVE DATE.
              </p>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      
    </div>
  )
}
