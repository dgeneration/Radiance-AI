"use client";

import React, { useState, useEffect } from 'react';
import { useChainDiagnosis } from '@/contexts/chain-diagnosis-context';
import { MedicalAnalystResponse } from '@/types/chain-diagnosis';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, TestTube, FileText, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { AnimatedSection } from '@/components/animations';
import { cn } from '@/lib/utils';

interface MedicalAnalystViewProps {
  isActive: boolean;
  onContinue: () => void;
}

export function MedicalAnalystView({ isActive, onContinue }: MedicalAnalystViewProps) {
  const {
    currentSession,
    streamingContent,
    isStreaming,
    isLoading,
    error
  } = useChainDiagnosis();

  const [parsedResponse, setParsedResponse] = useState<MedicalAnalystResponse | null>(null);
  const [activeTab, setActiveTab] = useState('findings');
  const [showRawJson, setShowRawJson] = useState(false);

  // Parse the streaming content or use the stored response
  useEffect(() => {
    try {
      // First priority: use the stored response from the session if available
      if (currentSession?.medical_analyst_response) {
        console.log('Using stored medical analyst response from session');
        setParsedResponse(currentSession.medical_analyst_response);
        return;
      }

      // Second priority: try to parse streaming content if available
      if (streamingContent.medicalAnalyst) {
        try {
          // Try to extract JSON from the content
          const jsonMatch = streamingContent.medicalAnalyst.match(/```json\s*([\s\S]*?)\s*```/);

          if (jsonMatch && jsonMatch[1]) {
            console.log('Parsed JSON from markdown code block');
            const parsed = JSON.parse(jsonMatch[1]);
            setParsedResponse(parsed);
            return;
          }

          // Try to parse the entire content as JSON
          console.log('Attempting to parse entire streaming content as JSON');
          const parsed = JSON.parse(streamingContent.medicalAnalyst);
          setParsedResponse(parsed);
        } catch (e) {
          console.error('Error parsing streaming content:', e);
        }
      }
    } catch (e) {
      console.error('Error parsing Medical Analyst response:', e);
    }
  }, [streamingContent.medicalAnalyst, currentSession?.medical_analyst_response]);

  // If no medical report or image is present, show a message
  if (!currentSession?.user_input.medical_report?.text && !currentSession?.user_input.medical_report?.image_url) {
    return (
      <AnimatedSection>
        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-full",
                isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                <TestTube className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Medical Analyst AI</CardTitle>
                <CardDescription>
                  No medical report or image to analyze
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-500 mb-1">No Medical Report Provided</p>
                <p className="text-sm text-muted-foreground">
                  The Medical Analyst AI requires a medical report or image to analyze. Since no report or image was provided,
                  this step will be skipped and the diagnosis will proceed directly to the General Physician AI.
                </p>
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              onClick={onContinue}
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Continue to General Physician"
              )}
            </Button>
          </CardFooter>
        </Card>
      </AnimatedSection>
    );
  }

  // If we're still loading and have no parsed response, show a loading state
  if (isLoading && !parsedResponse && isActive) {
    return (
      <AnimatedSection>
        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-full">
                <TestTube className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Medical Analyst AI</CardTitle>
                <CardDescription>
                  Analyzing your medical report
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium mb-2">Analyzing Medical Report</p>
              <p className="text-muted-foreground text-center max-w-md">
                The Medical Analyst AI is carefully reviewing your medical report to identify key findings and abnormalities.
                This may take a moment...
              </p>
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>
    );
  }

  // If we have an error, show an error state
  if (error && isActive) {
    return (
      <AnimatedSection>
        <Card className="bg-destructive/5 backdrop-blur-sm border-destructive/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/20 rounded-full">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <CardTitle>Error Analyzing Medical Report</CardTitle>
                <CardDescription>
                  There was a problem processing your medical report
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm text-destructive mb-2 font-medium">Error Message:</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              onClick={onContinue}
              className="w-full"
              variant="outline"
            >
              Skip to General Physician
            </Button>
          </CardFooter>
        </Card>
      </AnimatedSection>
    );
  }

  // Main view with parsed response
  return (
    <AnimatedSection>
      <Card className={cn(
        "backdrop-blur-sm border transition-all",
        isActive ? "bg-primary/5 border-primary/20" : "bg-card/50 border-primary/10"
      )}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-full",
                isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                <TestTube className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Medical Analyst AI</CardTitle>
                <CardDescription>
                  {isStreaming && isActive ? "Analyzing your medical report..." : "Analysis of your medical report"}
                </CardDescription>
              </div>
            </div>

            {isStreaming && isActive && (
              <div className="flex items-center gap-2 text-primary text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Report Type */}
          {parsedResponse?.report_type_analyzed && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Report Type: <span className="font-medium text-foreground">{parsedResponse.report_type_analyzed}</span>
              </span>
            </div>
          )}

          {/* Tabs for different sections */}
          <Tabs defaultValue="findings" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="findings">Key Findings</TabsTrigger>
              <TabsTrigger value="abnormalities">Abnormalities</TabsTrigger>
              <TabsTrigger value="correlation">Clinical Correlation</TabsTrigger>
            </TabsList>

            <TabsContent value="findings" className="space-y-4 pt-4">
              {parsedResponse?.key_findings_from_report?.length ? (
                <ul className="space-y-2">
                  {parsedResponse.key_findings_from_report.map((finding, index) => (
                    <li key={index} className="bg-background/50 p-3 rounded-md border border-border/50">
                      {finding}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {isStreaming && isActive ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <p>Identifying key findings...</p>
                    </div>
                  ) : (
                    <p>No key findings identified</p>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="abnormalities" className="space-y-4 pt-4">
              {parsedResponse?.abnormalities_highlighted?.length ? (
                <ul className="space-y-2">
                  {parsedResponse.abnormalities_highlighted.map((abnormality, index) => (
                    <li key={index} className="bg-background/50 p-3 rounded-md border border-border/50 text-amber-500">
                      {abnormality}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {isStreaming && isActive ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <p>Identifying abnormalities...</p>
                    </div>
                  ) : (
                    <p>No abnormalities identified</p>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="correlation" className="space-y-4 pt-4">
              {parsedResponse?.clinical_correlation_points_for_gp?.length ? (
                <ul className="space-y-2">
                  {parsedResponse.clinical_correlation_points_for_gp.map((point, index) => (
                    <li key={index} className="bg-background/50 p-3 rounded-md border border-border/50">
                      {point}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {isStreaming && isActive ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <p>Generating clinical correlation points...</p>
                    </div>
                  ) : (
                    <p>No clinical correlation points available</p>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Raw JSON toggle */}
          <div className="pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowRawJson(!showRawJson)}
            >
              {showRawJson ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Hide Raw JSON
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show Raw JSON
                </>
              )}
            </Button>

            {showRawJson && (
              <div className="mt-2 bg-background/50 p-3 rounded-md border border-border/50 overflow-x-auto">
                <pre className="text-xs text-muted-foreground">
                  {JSON.stringify(parsedResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Disclaimer */}
          {parsedResponse?.disclaimer && (
            <div className="bg-background/50 p-3 rounded-md border border-border/50 text-xs text-muted-foreground">
              <p className="font-medium mb-1">Disclaimer:</p>
              <p>{parsedResponse.disclaimer}</p>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button
            onClick={onContinue}
            className="w-full bg-primary hover:bg-primary/90"
            disabled={isLoading || (isActive && isStreaming)}
          >
            {isLoading || (isActive && isStreaming) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Continue to General Physician"
            )}
          </Button>
        </CardFooter>
      </Card>
    </AnimatedSection>
  );
}
