"use client";

import React, { useState, useEffect } from 'react';
import { useChainDiagnosis } from '@/contexts/chain-diagnosis-context';

// Define the response type based on the system prompt JSON structure
interface NewPathologistResponse {
  role_name: string;
  context_from_specialist: {
    specialist_type_consulted: string;
    potential_conditions_under_review: string[];
    suggested_investigations_by_specialist: string[];
  };
  pathological_insights_for_potential_conditions: {
    condition_hypothesis: string;
    relevant_lab_tests_and_expected_findings: {
      test_name: string;
      potential_findings_explained: string;
    }[];
  }[];
  notes_on_test_interpretation: string[];
  reference_data_for_next_role: {
    pathology_summary: string;
    critical_markers_highlighted: string[];
  };
  disclaimer: string;
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
        'role_name' in response &&
        'context_from_specialist' in response &&
        'pathological_insights_for_potential_conditions' in response) {
      return response as NewPathologistResponse;
    }

    // Cast to a generic object for safety
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const oldResponse = response as Record<string, any>;

    // Create default values for required fields
    const contextFromSpecialist = {
      specialist_type_consulted: "Unknown Specialist",
      potential_conditions_under_review: ["Not specified"],
      suggested_investigations_by_specialist: ["Not specified"]
    };

    const pathologicalInsights: NewPathologistResponse['pathological_insights_for_potential_conditions'] = [];
    const notesOnTestInterpretation: string[] = [];

    // Try to extract data from old format if available
    // Convert old lab_tests_relevance to pathological_insights
    if (oldResponse.lab_tests_relevance && typeof oldResponse.lab_tests_relevance === 'object') {
      const labTests: {test_name: string; potential_findings_explained: string}[] = [];

      Object.entries(oldResponse.lab_tests_relevance).forEach(([testName, relevance]) => {
        if (typeof relevance === 'string') {
          labTests.push({
            test_name: testName,
            potential_findings_explained: relevance
          });
        }
      });

      if (labTests.length > 0) {
        pathologicalInsights.push({
          condition_hypothesis: "Condition from old format",
          relevant_lab_tests_and_expected_findings: labTests
        });
      }
    }

    // Convert old findings_interpretation to notes_on_test_interpretation
    if (oldResponse.findings_interpretation && typeof oldResponse.findings_interpretation === 'object') {
      Object.entries(oldResponse.findings_interpretation).forEach(([finding, interpretation]) => {
        if (typeof interpretation === 'string') {
          notesOnTestInterpretation.push(`${finding}: ${interpretation}`);
        }
      });
    }

    // Convert old pathologist_recommendations to additional notes
    if (oldResponse.pathologist_recommendations && typeof oldResponse.pathologist_recommendations === 'object') {
      Object.entries(oldResponse.pathologist_recommendations).forEach(([title, recommendation]) => {
        if (typeof recommendation === 'string') {
          notesOnTestInterpretation.push(`Recommendation - ${title}: ${recommendation}`);
        }
      });
    }

    // Return the adapted format
    return {
      role_name: "Pathologist AI (Radiance AI)",
      context_from_specialist: contextFromSpecialist,
      pathological_insights_for_potential_conditions: pathologicalInsights,
      notes_on_test_interpretation: notesOnTestInterpretation,
      reference_data_for_next_role: {
        pathology_summary: "Pathology information adapted from old format",
        critical_markers_highlighted: ["None specified in old format"]
      },
      disclaimer: typeof oldResponse.disclaimer === 'string'
        ? oldResponse.disclaimer
        : "This information explains potential pathological findings and is for educational purposes. It does not interpret specific results for this patient without actual test data. All diagnostic testing should be ordered and interpreted by qualified healthcare professionals. Radiance AI."
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
              {/* Context from Specialist */}
              {parsedResponse?.context_from_specialist && (
                <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Microscope className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-medium">Context from {parsedResponse.context_from_specialist.specialist_type_consulted}</h3>
                  </div>

                  <div className="space-y-3 text-sm">
                    {/* Potential Conditions */}
                    <div>
                      <p className="text-muted-foreground mb-1">Potential Conditions Under Review:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {parsedResponse.context_from_specialist.potential_conditions_under_review.map((condition, index) => (
                          <li key={index}>{condition}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Suggested Investigations */}
                    <div>
                      <p className="text-muted-foreground mb-1">Suggested Investigations:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {parsedResponse.context_from_specialist.suggested_investigations_by_specialist.map((investigation, index) => (
                          <li key={index}>{investigation}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <Tabs defaultValue="insights" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 p-1 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50">
                  <TabsTrigger value="insights" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <TestTube className="h-3.5 w-3.5 mr-1.5" />
                    Pathological Insights
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <Microscope className="h-3.5 w-3.5 mr-1.5" />
                    Test Interpretation
                  </TabsTrigger>
                  <TabsTrigger value="reference" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <Beaker className="h-3.5 w-3.5 mr-1.5" />
                    Reference Data
                  </TabsTrigger>
                </TabsList>

                {/* Pathological Insights Tab */}
                <TabsContent value="insights" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
                  {parsedResponse?.pathological_insights_for_potential_conditions && parsedResponse.pathological_insights_for_potential_conditions.length > 0 ? (
                    <div className="space-y-6">
                      {parsedResponse.pathological_insights_for_potential_conditions.map((condition, index) => (
                        <motion.div
                          key={index}
                          className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <TestTube className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-medium">{condition.condition_hypothesis}</h3>
                          </div>

                          <div className="space-y-4">
                            {condition.relevant_lab_tests_and_expected_findings.map((test, testIndex) => (
                              <div key={testIndex} className="pl-4 border-l-2 border-primary/20">
                                <p className="text-sm font-medium mb-1">{test.test_name}</p>
                                <p className="text-sm text-muted-foreground">{test.potential_findings_explained}</p>
                              </div>
                            ))}
                          </div>
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
                            <p className="font-medium text-primary">Analyzing pathological insights...</p>
                            <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <TestTube className="h-6 w-6 text-muted-foreground/70" />
                          <p>No pathological insights available</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Test Interpretation Notes Tab */}
                <TabsContent value="notes" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
                  {parsedResponse?.notes_on_test_interpretation && parsedResponse.notes_on_test_interpretation.length > 0 ? (
                    <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <Microscope className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-medium">Notes on Test Interpretation</h3>
                      </div>

                      <ul className="space-y-3">
                        {parsedResponse.notes_on_test_interpretation.map((note, index) => (
                          <motion.li
                            key={index}
                            className="flex items-start gap-2 text-sm"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                          >
                            <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                              {index + 1}
                            </div>
                            <span>{note}</span>
                          </motion.li>
                        ))}
                      </ul>
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
                            <p className="font-medium text-primary">Preparing test interpretation notes...</p>
                            <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <AlertCircle className="h-6 w-6 text-muted-foreground/70" />
                          <p>No test interpretation notes available</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Reference Data Tab */}
                <TabsContent value="reference" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
                  {parsedResponse?.reference_data_for_next_role ? (
                    <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <FlaskRound className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-medium">Reference Data for Next Role</h3>
                      </div>

                      <div className="space-y-4">
                        {/* Pathology Summary */}
                        <div className="pl-4 border-l-2 border-primary/20">
                          <p className="text-muted-foreground mb-1">Pathology Summary:</p>
                          <p className="text-sm">{parsedResponse.reference_data_for_next_role.pathology_summary}</p>
                        </div>

                        {/* Critical Markers */}
                        <div className="pl-4 border-l-2 border-primary/20">
                          <p className="text-muted-foreground mb-1">Critical Markers Highlighted:</p>
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            {parsedResponse.reference_data_for_next_role.critical_markers_highlighted.map((marker, index) => (
                              <li key={index}>{marker}</li>
                            ))}
                          </ul>
                        </div>
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
                            <p className="font-medium text-primary">Preparing reference data...</p>
                            <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <FlaskRound className="h-6 w-6 text-muted-foreground/70" />
                          <p>No reference data available</p>
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
          {!currentSession?.nutritionist_response && (
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
            ) : (
              <div className="w-full p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-center">
                <p className="text-sm text-amber-500">
                  {isLoading || isStreaming ? "Processing pathologist assessment..." : "Waiting for Pathologist response..."}
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
