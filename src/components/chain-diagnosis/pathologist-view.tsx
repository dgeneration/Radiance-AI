"use client";

import React, { useState, useEffect } from 'react';
import { useChainDiagnosis } from '@/contexts/chain-diagnosis-context';

// Define the new response type based on the provided JSON
interface NewPathologistResponse {
  lab_tests_relevance: Record<string, string>;
  findings_interpretation: Record<string, string>;
  pathologist_recommendations: Record<string, string>;
  disclaimer?: string; // Keep this for backward compatibility
}
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, AlertCircle, CheckCircle,
  ChevronDown, ChevronUp, TestTube, Microscope,
  FlaskRound, Beaker
} from 'lucide-react';
import { AnimatedSection, AnimatedIcon } from '@/components/animations';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PathologistViewProps {
  isActive: boolean;
  onContinue: () => void;
  isLastRole?: boolean;
}

export function PathologistView({ isActive, onContinue, isLastRole = false }: PathologistViewProps) {
  const {
    currentSession,
    streamingContent,
    isStreaming,
    isLoading,
    error
  } = useChainDiagnosis();

  const [parsedResponse, setParsedResponse] = useState<NewPathologistResponse | null>(null);
  const [activeTab, setActiveTab] = useState('lab-tests');
  const [isExpanded, setIsExpanded] = useState(isLastRole);

  // Helper function to adapt old response format to new format
  const adaptResponseFormat = (response: unknown): NewPathologistResponse => {
    // Type guard to check if it's already in the new format
    if (typeof response === 'object' && response !== null &&
        'lab_tests_relevance' in response &&
        'findings_interpretation' in response &&
        'pathologist_recommendations' in response) {
      return response as NewPathologistResponse;
    }

    // Cast to a generic object for safety
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const oldResponse = response as Record<string, any>;

    // Create default empty objects for required fields
    const labTestsRelevance: Record<string, string> = {};
    const findingsInterpretation: Record<string, string> = {};
    const pathologistRecommendations: Record<string, string> = {};

    // Try to extract data from old format if available
    if (oldResponse.lab_tests && typeof oldResponse.lab_tests === 'object') {
      Object.entries(oldResponse.lab_tests).forEach(([key, value]) => {
        if (typeof value === 'string') {
          labTestsRelevance[key] = value;
        }
      });
    }

    if (oldResponse.findings && typeof oldResponse.findings === 'object') {
      Object.entries(oldResponse.findings).forEach(([key, value]) => {
        if (typeof value === 'string') {
          findingsInterpretation[key] = value;
        }
      });
    }

    if (oldResponse.recommendations && typeof oldResponse.recommendations === 'object') {
      Object.entries(oldResponse.recommendations).forEach(([key, value]) => {
        if (typeof value === 'string') {
          pathologistRecommendations[key] = value;
        }
      });
    }

    // Return the adapted format
    return {
      lab_tests_relevance: labTestsRelevance,
      findings_interpretation: findingsInterpretation,
      pathologist_recommendations: pathologistRecommendations,
      disclaimer: typeof oldResponse.disclaimer === 'string'
        ? oldResponse.disclaimer
        : "This information is for guidance only and does not replace professional medical advice."
    };
  };

  // Parse the response from the session or streaming content
  useEffect(() => {
    try {
      // First priority: use the stored response if available
      if (currentSession?.pathologist_response) {
        // Check if the response is already a parsed object
        if (typeof currentSession.pathologist_response === 'object' &&
            currentSession.pathologist_response !== null) {
          setParsedResponse(adaptResponseFormat(currentSession.pathologist_response));
          return;
        }
      }

      // Second priority: try to parse streaming content if available
      if (streamingContent.pathologist) {
        try {
          // Try to extract JSON from the content
          const jsonMatch = streamingContent.pathologist.match(/```json\s*([\s\S]*?)\s*```/);

          if (jsonMatch && jsonMatch[1]) {
            try {
              const parsed = JSON.parse(jsonMatch[1]);
              setParsedResponse(adaptResponseFormat(parsed));
              return;
            } catch {
              // Failed to parse JSON from code block
            }
          }

          // Try to parse the entire content as JSON
          try {
            const parsed = JSON.parse(streamingContent.pathologist);
            setParsedResponse(adaptResponseFormat(parsed));
            return;
          } catch {
            // Failed to parse entire content as JSON
          }

          // If we get here, try to extract any JSON-like structure
          const jsonLikeMatch = streamingContent.pathologist.match(/(\{[\s\S]*\})/);
          if (jsonLikeMatch && jsonLikeMatch[1]) {
            try {
              // Try to fix common JSON issues
              let jsonStr = jsonLikeMatch[1];
              // Replace unquoted property names
              jsonStr = jsonStr.replace(/(\w+):/g, '"$1":');
              // Add missing quotes around string values
              jsonStr = jsonStr.replace(/: *([^",\{\[\]\}\d][^",\{\[\]\}]*?)([,\}\]])/g, ': "$1"$2');

              const parsed = JSON.parse(jsonStr);
              setParsedResponse(adaptResponseFormat(parsed));
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
      // Error in pathologist response parsing
    }
  }, [streamingContent.pathologist, currentSession?.pathologist_response]);

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
                <CardTitle>Pathologist AI</CardTitle>
                <CardDescription>
                  Analyzing lab tests and pathological findings
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium mb-2">Analyzing Pathological Findings</p>
              <p className="text-muted-foreground text-center max-w-md">
                The Pathologist AI is carefully reviewing potential lab tests and pathological findings related to your condition.
                This may take a moment...
              </p>
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>
    );
  }

  // If there's an error, show an error message
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
                <CardTitle>Error</CardTitle>
                <CardDescription>
                  There was an error processing the Pathologist analysis
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
          <CardFooter>
            <Button
              onClick={onContinue}
              className="w-full bg-primary hover:bg-primary/90"
            >
              Try Again
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
                  icon={<TestTube className="h-5 w-5" />}
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
                    <CardTitle className="text-lg">
                      Pathologist AI
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full ml-2">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                  <CardDescription className="text-sm">
                    {isStreaming && isActive
                      ? "Analyzing lab tests and pathological findings..."
                      : "Insights on lab tests and pathological markers"}
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
              {/* Tabs for different sections */}
              <Tabs defaultValue="lab-tests" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 p-1 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50">
                  <TabsTrigger value="lab-tests" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <TestTube className="h-3.5 w-3.5 mr-1.5" />
                    Lab Tests
                  </TabsTrigger>
                  <TabsTrigger value="findings" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <Microscope className="h-3.5 w-3.5 mr-1.5" />
                    Findings
                  </TabsTrigger>
                  <TabsTrigger value="recommendations" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <Beaker className="h-3.5 w-3.5 mr-1.5" />
                    Recommendations
                  </TabsTrigger>
                </TabsList>

                {/* Lab Tests Tab */}
                <TabsContent value="lab-tests" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
                  {parsedResponse?.lab_tests_relevance && Object.keys(parsedResponse.lab_tests_relevance).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(parsedResponse.lab_tests_relevance).map(([testName, relevance], index) => (
                        <motion.div
                          key={index}
                          className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <TestTube className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-medium">{testName}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground pl-6">{relevance}</p>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      {isStreaming && isActive ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="relative">
                            <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping opacity-75"></div>
                            <Loader2 className="h-8 w-8 animate-spin text-primary relative" />
                          </div>
                          <div>
                            <p className="font-medium text-primary">Analyzing lab tests...</p>
                            <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <TestTube className="h-6 w-6 text-muted-foreground/70" />
                          <p>No lab test information available</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Findings Interpretation Tab */}
                <TabsContent value="findings" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
                  {parsedResponse?.findings_interpretation && Object.keys(parsedResponse.findings_interpretation).length > 0 ? (
                    <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <Microscope className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-medium">Findings Interpretation</h3>
                      </div>

                      <div className="space-y-4">
                        {Object.entries(parsedResponse.findings_interpretation).map(([finding, interpretation], index) => (
                          <motion.div
                            key={index}
                            className="pl-4 border-l-2 border-primary/20"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                          >
                            <p className="text-sm font-medium mb-1">{finding}</p>
                            <p className="text-sm text-muted-foreground">{interpretation}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      {isStreaming && isActive ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="relative">
                            <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping opacity-75"></div>
                            <Loader2 className="h-8 w-8 animate-spin text-primary relative" />
                          </div>
                          <div>
                            <p className="font-medium text-primary">Interpreting findings...</p>
                            <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <AlertCircle className="h-6 w-6 text-muted-foreground/70" />
                          <p>No findings interpretation available</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Recommendations Tab */}
                <TabsContent value="recommendations" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
                  {parsedResponse?.pathologist_recommendations && Object.keys(parsedResponse.pathologist_recommendations).length > 0 ? (
                    <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <FlaskRound className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-medium">Pathologist Recommendations</h3>
                      </div>

                      <div className="space-y-4">
                        {Object.entries(parsedResponse.pathologist_recommendations).map(([title, recommendation], index) => (
                          <motion.div
                            key={index}
                            className="flex items-start gap-3"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                          >
                            <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{title}</p>
                              <p className="text-sm text-muted-foreground">{recommendation}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      {isStreaming && isActive ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="relative">
                            <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping opacity-75"></div>
                            <Loader2 className="h-8 w-8 animate-spin text-primary relative" />
                          </div>
                          <div>
                            <p className="font-medium text-primary">Preparing recommendations...</p>
                            <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <AlertCircle className="h-6 w-6 text-muted-foreground/70" />
                          <p>No pathologist recommendations available</p>
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

          <CardFooter>
            {/* Only show the continue button if there's a Pathologist response and no Nutritionist response yet */}
            {currentSession?.pathologist_response && !currentSession?.nutritionist_response ? (
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
                  "Continue to Nutritionist"
                )}
              </Button>
            ) : currentSession?.nutritionist_response ? (
              <div className="w-full p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                <p className="text-sm text-green-500">
                  Nutritionist analysis is complete
                </p>
              </div>
            ) : (
              <div className="w-full p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-center">
                <p className="text-sm text-amber-500">
                  {isLoading || isStreaming ? "Processing pathologist assessment..." : "Waiting for Pathologist response..."}
                </p>
              </div>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </AnimatedSection>
  );
}
