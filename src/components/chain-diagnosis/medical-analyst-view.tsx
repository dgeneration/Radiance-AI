"use client";

import React, { useState, useEffect } from 'react';
import { useChainDiagnosis } from '@/contexts/chain-diagnosis-context';
import { MedicalAnalystResponse } from '@/types/chain-diagnosis';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, TestTube, FileText, AlertCircle, Microscope, CheckCircle, AlertTriangle, Beaker, ChevronDown, ChevronUp } from 'lucide-react';
import { AnimatedSection, AnimatedIcon } from '@/components/animations';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MedicalAnalystViewProps {
  isActive: boolean;
  onContinue: () => void;
  isLastRole?: boolean;
}

export function MedicalAnalystView({ isActive, onContinue, isLastRole = false }: MedicalAnalystViewProps) {
  const {
    currentSession,
    streamingContent,
    isStreaming,
    isLoading,
    error
  } = useChainDiagnosis();

  const [parsedResponse, setParsedResponse] = useState<MedicalAnalystResponse | null>(null);
  const [activeTab, setActiveTab] = useState('findings');
  const [isExpanded, setIsExpanded] = useState(isLastRole);

  // Parse the streaming content or use the stored response
  useEffect(() => {
    try {
      // First priority: use the stored response from the session if available
      if (currentSession?.medical_analyst_response) {
        // Check if the response is already a parsed object
        if (typeof currentSession.medical_analyst_response === 'object' &&
            currentSession.medical_analyst_response !== null) {
          setParsedResponse(currentSession.medical_analyst_response);
          return;
        }
      }

      // Second priority: try to parse streaming content if available
      if (streamingContent.medicalAnalyst) {
        try {
          // Try to extract JSON from the content
          const jsonMatch = streamingContent.medicalAnalyst.match(/```json\s*([\s\S]*?)\s*```/);

          if (jsonMatch && jsonMatch[1]) {
            try {
              const parsed = JSON.parse(jsonMatch[1]);
              setParsedResponse(parsed);
              return;
            } catch {
              // Failed to parse JSON from code block
            }
          }

          // Try to parse the entire content as JSON
          try {
            const parsed = JSON.parse(streamingContent.medicalAnalyst);
            setParsedResponse(parsed);
            return;
          } catch {
            // Failed to parse entire content as JSON
          }

          // If we get here, try to extract any JSON-like structure
          const jsonLikeMatch = streamingContent.medicalAnalyst.match(/(\{[\s\S]*\})/);
          if (jsonLikeMatch && jsonLikeMatch[1]) {
            try {
              // Try to fix common JSON issues
              let jsonStr = jsonLikeMatch[1];
              // Replace unquoted property names
              jsonStr = jsonStr.replace(/(\w+):/g, '"$1":');
              // Add missing quotes around string values
              jsonStr = jsonStr.replace(/: *([^",\{\[\]\}\d][^",\{\[\]\}]*?)([,\}\]])/g, ': "$1"$2');

              const parsed = JSON.parse(jsonStr);
              setParsedResponse(parsed);
              return;
            } catch {
              // Failed to parse JSON-like structure
            }
          }
        } catch {
          // Error in streaming content parsing
        }
      }
    } catch {
      // Error in medical analyst response parsing
    }
  }, [streamingContent.medicalAnalyst, currentSession?.medical_analyst_response]);

  // Create a ref to track if we've already triggered the continue action
  const hasContinuedRef = React.useRef(false);

  // Auto-continue to General Physician after a short delay if no medical report or image is present
  useEffect(() => {
    if (isActive && !isLoading && !hasContinuedRef.current &&
        !currentSession?.user_input.medical_report?.text &&
        !currentSession?.user_input.medical_report?.image_url) {
      hasContinuedRef.current = true; // Mark as continued to prevent multiple triggers

      const timer = setTimeout(() => {
        onContinue();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isActive, isLoading, onContinue, currentSession?.user_input.medical_report?.text, currentSession?.user_input.medical_report?.image_url]);

  // If no medical report or image is present, show a message and auto-continue
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
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Continuing to General Physician...
                </>
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
      <motion.div
        initial={{ opacity: 0.9, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className={cn(
          "backdrop-blur-sm border transition-all shadow-sm",
          isActive ? "bg-primary/5 border-primary/20" : "bg-card/50 border-primary/10"
        )}>
          <CardHeader
            className={cn("pb-4 cursor-pointer", !isExpanded && "pb-2")}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <AnimatedIcon
                  icon={<Microscope className="h-5 w-5" />}
                  className={cn(
                    "p-3 rounded-full",
                    isActive ? "bg-primary/20 text-primary" : "bg-muted/30 text-muted-foreground"
                  )}
                  containerClassName="flex-shrink-0"
                  pulseEffect={isActive && isStreaming}
                  hoverScale={1.05}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">Medical Analyst AI</CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full ml-2">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                  <CardDescription className="text-sm">
                    {isStreaming && isActive ? "Analyzing your medical report..." : "Analysis of your medical report"}
                  </CardDescription>

                  {isStreaming && isActive && (
                    <Badge
                      variant="outline"
                      className="mt-1 bg-primary/10 text-primary border-primary/20 px-2 py-0 text-xs font-normal"
                    >
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Thinking...
                    </Badge>
                  )}
                </div>
              </div>

              {parsedResponse && !isStreaming && (
                <Badge
                  variant="outline"
                  className="bg-green-500/10 text-green-500 border-green-500/20 px-2 py-0.5 text-xs font-normal"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Analysis Complete
                </Badge>
              )}
            </div>
          </CardHeader>

          <motion.div
            initial={{ height: "auto", opacity: 1 }}
            animate={{
              height: isExpanded ? "auto" : 0,
              opacity: isExpanded ? 1 : 0
            }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <CardContent className={cn("space-y-5", !isExpanded && "hidden")}>
            {/* Report Type */}
            {parsedResponse?.report_type_analyzed && (
              <div className="flex items-center gap-2 bg-card/80 p-3 rounded-lg border border-border/50">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm">
                  Report Type: <span className="font-medium">{parsedResponse.report_type_analyzed}</span>
                </span>
              </div>
            )}

            {/* Tabs for different sections */}
            <Tabs defaultValue="findings" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 p-1 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50">
                <TabsTrigger value="findings" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                  Key Findings
                </TabsTrigger>
                <TabsTrigger value="abnormalities" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                  Abnormalities
                </TabsTrigger>
                <TabsTrigger value="correlation" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <Beaker className="h-3.5 w-3.5 mr-1.5" />
                  Clinical Correlation
                </TabsTrigger>
              </TabsList>

              <TabsContent value="findings" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
                {parsedResponse?.key_findings_from_report?.length ? (
                  <ul className="space-y-3">
                    {parsedResponse.key_findings_from_report.map((finding, index) => (
                      <motion.li
                        key={index}
                        className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <div className="flex gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{finding}</span>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    {isStreaming && isActive ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping opacity-75"></div>
                          <Loader2 className="h-8 w-8 animate-spin text-primary relative" />
                        </div>
                        <div>
                          <p className="font-medium text-primary">Identifying key findings...</p>
                          <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-6 w-6 text-muted-foreground/70" />
                        <p>No key findings identified</p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="abnormalities" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
                {parsedResponse?.abnormalities_highlighted?.length ? (
                  <ul className="space-y-3">
                    {parsedResponse.abnormalities_highlighted.map((abnormality, index) => (
                      <motion.li
                        key={index}
                        className="bg-amber-500/5 p-4 rounded-lg border border-amber-500/20 shadow-sm"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <div className="flex gap-3">
                          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span className="text-amber-600">{abnormality}</span>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    {isStreaming && isActive ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping opacity-75"></div>
                          <Loader2 className="h-8 w-8 animate-spin text-primary relative" />
                        </div>
                        <div>
                          <p className="font-medium text-primary">Identifying abnormalities...</p>
                          <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle className="h-6 w-6 text-green-500/70" />
                        <p>No abnormalities identified</p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="correlation" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
                {parsedResponse?.clinical_correlation_points_for_gp?.length ? (
                  <ul className="space-y-3">
                    {parsedResponse.clinical_correlation_points_for_gp.map((point, index) => (
                      <motion.li
                        key={index}
                        className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <div className="flex gap-3">
                          <Beaker className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    {isStreaming && isActive ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping opacity-75"></div>
                          <Loader2 className="h-8 w-8 animate-spin text-primary relative" />
                        </div>
                        <div>
                          <p className="font-medium text-primary">Generating clinical correlation points...</p>
                          <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-6 w-6 text-muted-foreground/70" />
                        <p>No clinical correlation points available</p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Disclaimer */}
            {parsedResponse?.disclaimer && (
              <div className="bg-card/80 p-4 rounded-lg border border-border/50 text-xs text-muted-foreground">
                <p className="font-medium mb-1">Disclaimer:</p>
                <p>{parsedResponse.disclaimer}</p>
              </div>
            )}
          </CardContent>
          </motion.div>
          
        {!currentSession?.general_physician_response && (
          <CardFooter>
          {/* Only show the continue button if there's a Medical Analyst response and no General Physician response yet */}
          {currentSession?.medical_analyst_response && !currentSession?.general_physician_response && (
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
          )} 
          {!currentSession?.general_physician_response && !currentSession?.medical_analyst_response && (
            <div className="w-full p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-center">
              <p className="text-sm text-amber-500">
                {isLoading || isStreaming ? "Processing medical report..." : "Waiting for Medical Analyst response..."}
              </p>
            </div>
          )}
          </CardFooter>
        )}
      </Card>
      </motion.div>
    </AnimatedSection>
  );
}
