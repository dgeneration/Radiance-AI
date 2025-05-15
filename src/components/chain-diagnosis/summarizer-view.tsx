"use client";

import React, { useState, useEffect } from 'react';
import { useChainDiagnosis } from '@/contexts/chain-diagnosis-context';
// Define the response type based on the provided JSON
interface NewRadianceAISummarizerResponse {
  age: number;
  gender: string;
  disclaimer: string;
  patient_id: string;
  patient_name: string;
  date_of_report: string;
  follow_up_plan: {
    timeline: string;
    specialist_referral: string;
    documentation_needed: string;
  };
  primary_concerns: string[];
  recommended_tests: string[];
  medication_guidance: {
    current_medications: string[];
    medications_to_avoid: string[];
    potential_medications: string[];
  };
  potential_diagnoses: string[];
  summary_of_condition: string;
  urgent_care_indicators: string[];
  dietary_recommendations: {
    foods_to_avoid: string[];
    foods_to_include: string[];
  };
  lifestyle_recommendations: string[];
}
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, AlertCircle, CheckCircle,
  Activity, FileText,
  ChevronDown, ChevronUp, Brain, User,
  Download, Share2, TestTube,
  Pill, Utensils, Calendar, ShieldAlert,
  Stethoscope, AlertTriangle
} from 'lucide-react';
import { AnimatedSection, AnimatedIcon } from '@/components/animations';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SummarizerViewProps {
  isActive: boolean;
  onContinue?: () => void;
  isLastRole?: boolean;
}

export function SummarizerView({ isActive, onContinue, isLastRole = true }: SummarizerViewProps) {
  const {
    currentSession,
    streamingContent,
    isStreaming,
    isLoading,
    error
  } = useChainDiagnosis();

  const [parsedResponse, setParsedResponse] = useState<NewRadianceAISummarizerResponse | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isExpanded, setIsExpanded] = useState(isLastRole);

  // Parse the response from the session or streaming content
  useEffect(() => {
    try {
      // First priority: use the stored response if available
      if (currentSession?.summarizer_response) {
        // Check if the response is already a parsed object
        if (typeof currentSession.summarizer_response === 'object' &&
            currentSession.summarizer_response !== null) {
          setParsedResponse(currentSession.summarizer_response);
          return;
        }
      }

      // Second priority: try to parse streaming content if available
      if (streamingContent.summarizer) {
        try {
          // Try to extract JSON from the content
          const jsonMatch = streamingContent.summarizer.match(/```json\s*([\s\S]*?)\s*```/);

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
            const parsed = JSON.parse(streamingContent.summarizer);
            setParsedResponse(parsed);
            return;
          } catch {
            // Failed to parse entire content as JSON
          }

          // If we get here, try to extract any JSON-like structure
          const jsonLikeMatch = streamingContent.summarizer.match(/(\{[\s\S]*\})/);
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
      // Error in summarizer response parsing
    }
  }, [streamingContent.summarizer, currentSession?.summarizer_response]);

  // Handle downloading the final report
  const handleDownloadReport = () => {
    if (!parsedResponse) return;

    const reportData = JSON.stringify(parsedResponse, null, 2);
    const blob = new Blob([reportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `radiance-ai-report-${currentSession?.id.substring(0, 8) || 'summary'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle sharing the report
  const handleShareReport = () => {
    // This would be implemented with a sharing API or a modal
    alert('Sharing functionality would be implemented here');
  };

  // If we're still loading and have no parsed response, show a loading state
  if (isLoading && !parsedResponse && isActive) {
    return (
      <AnimatedSection>
        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-full">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Radiance AI Summarizer</CardTitle>
                <CardDescription>
                  Compiling your comprehensive health report
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium mb-2">Generating Final Report</p>
              <p className="text-muted-foreground text-center max-w-md">
                The Radiance AI Summarizer is compiling all insights from the AI team into a comprehensive health report.
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
                  There was an error generating the final report
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
                  icon={<Brain className="h-5 w-5" />}
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
                      Radiance AI Health Insight Report
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full ml-2">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                  <CardDescription className="text-sm">
                    {isStreaming && isActive
                      ? "Compiling your comprehensive health report..."
                      : `Report for ${parsedResponse?.patient_name || "Patient"} - ${parsedResponse?.date_of_report || new Date().toISOString().split('T')[0]}`}
                  </CardDescription>

                  {isStreaming && isActive && (
                    <Badge
                      variant="outline"
                      className="mt-1 bg-primary/10 text-primary border-primary/20 px-2 py-0 text-xs font-normal"
                    >
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Generating...
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
                  Report Complete
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
              {/* Introduction */}
              {parsedResponse?.introduction && (
                <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                  <p className="text-sm">{parsedResponse.introduction}</p>
                </div>
              )}

              {/* Tabs for different sections */}
              {/* Summary of Condition */}
              {parsedResponse?.summary_of_condition && (
                <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-medium">Summary of Condition</h3>
                  </div>
                  <p className="text-sm">{parsedResponse.summary_of_condition}</p>
                </div>
              )}

              <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 p-1 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50">
                  <TabsTrigger value="overview" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <User className="h-3.5 w-3.5 mr-1.5" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="tests" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <TestTube className="h-3.5 w-3.5 mr-1.5" />
                    Tests
                  </TabsTrigger>
                  <TabsTrigger value="medications" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <Pill className="h-3.5 w-3.5 mr-1.5" />
                    Medications
                  </TabsTrigger>
                  <TabsTrigger value="lifestyle" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <Utensils className="h-3.5 w-3.5 mr-1.5" />
                    Lifestyle
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
                  {parsedResponse ? (
                    <div className="space-y-4">
                      {/* Patient Information */}
                      <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <User className="h-4 w-4 text-primary" />
                          <h3 className="text-sm font-medium">Patient Information</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Name:</span>
                              <span className="font-medium">{parsedResponse.patient_name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Age:</span>
                              <span>{parsedResponse.age}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Gender:</span>
                              <span>{parsedResponse.gender}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Patient ID:</span>
                              <span className="font-mono text-xs">{parsedResponse.patient_id}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Primary Concerns */}
                      <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                          <h3 className="text-sm font-medium">Primary Concerns</h3>
                        </div>

                        <div className="space-y-2">
                          {parsedResponse.primary_concerns.map((concern, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                {index + 1}
                              </div>
                              <span className="text-sm">{concern}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Potential Diagnoses */}
                      <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <Stethoscope className="h-4 w-4 text-primary" />
                          <h3 className="text-sm font-medium">Potential Diagnoses</h3>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {parsedResponse.potential_diagnoses.map((diagnosis, index) => (
                            <Badge key={index} variant="outline" className="bg-primary/10 text-primary border-primary/20">
                              {diagnosis}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Follow-up Plan */}
                      <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar className="h-4 w-4 text-primary" />
                          <h3 className="text-sm font-medium">Follow-up Plan</h3>
                        </div>

                        <div className="space-y-3 text-sm">
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground w-32">Timeline:</span>
                            <span>{parsedResponse.follow_up_plan.timeline}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground w-32">Specialist Referral:</span>
                            <span>{parsedResponse.follow_up_plan.specialist_referral}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground w-32">Documentation:</span>
                            <span>{parsedResponse.follow_up_plan.documentation_needed}</span>
                          </div>
                        </div>
                      </div>

                      {/* Urgent Care Indicators */}
                      <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <ShieldAlert className="h-4 w-4 text-red-500" />
                          <h3 className="text-sm font-medium text-red-500">Urgent Care Indicators</h3>
                        </div>

                        <div className="space-y-2">
                          {parsedResponse.urgent_care_indicators.map((indicator, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                              <span className="text-sm">{indicator}</span>
                            </div>
                          ))}
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
                            <p className="font-medium text-primary">Compiling patient information...</p>
                            <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <User className="h-6 w-6 text-muted-foreground/70" />
                          <p>No patient information available</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Tests Tab */}
                <TabsContent value="tests" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
                  {parsedResponse?.recommended_tests?.length ? (
                    <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <TestTube className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-medium">Recommended Tests</h3>
                      </div>

                      <div className="space-y-3">
                        {parsedResponse.recommended_tests.map((test, index) => (
                          <motion.div
                            key={index}
                            className="flex items-start gap-2"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                          >
                            <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                              {index + 1}
                            </div>
                            <span className="text-sm">{test}</span>
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
                            <p className="font-medium text-primary">Compiling recommended tests...</p>
                            <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <TestTube className="h-6 w-6 text-muted-foreground/70" />
                          <p>No recommended tests available</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Medications Tab */}
                <TabsContent value="medications" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
                  {parsedResponse?.medication_guidance ? (
                    <div className="space-y-4">
                      {/* Current Medications */}
                      <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <Pill className="h-4 w-4 text-primary" />
                          <h3 className="text-sm font-medium">Current Medications</h3>
                        </div>

                        {parsedResponse.medication_guidance.current_medications.length > 0 ? (
                          <ul className="list-disc pl-5 space-y-1">
                            {parsedResponse.medication_guidance.current_medications.map((medication, index) => (
                              <li key={index} className="text-sm">{medication}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No current medications reported</p>
                        )}
                      </div>

                      {/* Potential Medications */}
                      <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <Pill className="h-4 w-4 text-green-500" />
                          <h3 className="text-sm font-medium text-green-500">Potential Medications</h3>
                        </div>

                        <div className="space-y-2">
                          {parsedResponse.medication_guidance.potential_medications.map((medication, index) => (
                            <motion.div
                              key={index}
                              className="pl-4 border-l-2 border-green-500/20"
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                              <p className="text-sm font-medium">{medication}</p>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Medications to Avoid */}
                      <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <ShieldAlert className="h-4 w-4 text-red-500" />
                          <h3 className="text-sm font-medium text-red-500">Medications to Avoid</h3>
                        </div>

                        <div className="space-y-2">
                          {parsedResponse.medication_guidance.medications_to_avoid.map((medication, index) => (
                            <motion.div
                              key={index}
                              className="pl-4 border-l-2 border-red-500/20"
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                              <p className="text-sm font-medium">{medication}</p>
                            </motion.div>
                          ))}
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
                            <p className="font-medium text-primary">Compiling medication guidance...</p>
                            <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Pill className="h-6 w-6 text-muted-foreground/70" />
                          <p>No medication guidance available</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Lifestyle Tab */}
                <TabsContent value="lifestyle" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
                  {parsedResponse ? (
                    <div className="space-y-4">
                      {/* Dietary Recommendations */}
                      <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <Utensils className="h-4 w-4 text-primary" />
                          <h3 className="text-sm font-medium">Dietary Recommendations</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Foods to Include */}
                          <div>
                            <p className="text-sm font-medium text-green-500 mb-2">Foods to Include</p>
                            <ul className="list-disc pl-5 space-y-1">
                              {parsedResponse.dietary_recommendations.foods_to_include.map((food, index) => (
                                <li key={index} className="text-sm">{food}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Foods to Avoid */}
                          <div>
                            <p className="text-sm font-medium text-amber-500 mb-2">Foods to Avoid</p>
                            <ul className="list-disc pl-5 space-y-1">
                              {parsedResponse.dietary_recommendations.foods_to_avoid.map((food, index) => (
                                <li key={index} className="text-sm">{food}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Lifestyle Recommendations */}
                      <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <Activity className="h-4 w-4 text-primary" />
                          <h3 className="text-sm font-medium">Lifestyle Recommendations</h3>
                        </div>

                        <div className="space-y-2">
                          {parsedResponse.lifestyle_recommendations.map((recommendation, index) => (
                            <motion.div
                              key={index}
                              className="flex items-start gap-2"
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                              <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                {index + 1}
                              </div>
                              <span className="text-sm">{recommendation}</span>
                            </motion.div>
                          ))}
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
                            <p className="font-medium text-primary">Compiling lifestyle recommendations...</p>
                            <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Activity className="h-6 w-6 text-muted-foreground/70" />
                          <p>No lifestyle recommendations available</p>
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

              {/* Download and Share Buttons */}
              {parsedResponse && (
                <div className="flex flex-wrap gap-3 justify-end mt-4">
                  <Button
                    variant="outline"
                    onClick={handleShareReport}
                    className="border-primary/20 hover:bg-primary/5"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Report
                  </Button>

                  <Button
                    onClick={handleDownloadReport}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Report
                  </Button>
                </div>
              )}
            </CardContent>
          </motion.div>

          <CardFooter>
            <div className="w-full p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
              <p className="text-sm text-green-500">
                Your comprehensive health analysis is complete
              </p>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </AnimatedSection>
  );
}
