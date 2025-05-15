"use client";

import React, { useState, useEffect } from 'react';
import { useChainDiagnosis } from '@/contexts/chain-diagnosis-context';
import { GeneralPhysicianResponse } from '@/types/chain-diagnosis';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, Stethoscope, AlertCircle, CheckCircle, HeartPulse,
  Activity, FileText, ClipboardList, AlertTriangle, TestTube,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { AnimatedSection, AnimatedIcon } from '@/components/animations';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface GeneralPhysicianViewProps {
  isActive: boolean;
  onContinue: () => void;
  isLastRole?: boolean;
}

export function GeneralPhysicianView({ isActive, onContinue, isLastRole = false }: GeneralPhysicianViewProps) {
  const {
    currentSession,
    streamingContent,
    isStreaming,
    isLoading,
    error
  } = useChainDiagnosis();

  const [parsedResponse, setParsedResponse] = useState<GeneralPhysicianResponse | null>(null);
  const [activeTab, setActiveTab] = useState('analysis');
  const [isExpanded, setIsExpanded] = useState(isLastRole);

  // Parse the streaming content or use the stored response
  useEffect(() => {
    try {
      // First priority: use the stored response from the session if available
      if (currentSession?.general_physician_response) {
        setParsedResponse(currentSession.general_physician_response);
        return;
      }

      // Second priority: try to parse streaming content if available
      if (streamingContent.generalPhysician) {
        try {
          // Try to extract JSON from the content
          const jsonMatch = streamingContent.generalPhysician.match(/```json\s*([\s\S]*?)\s*```/);

          if (jsonMatch && jsonMatch[1]) {
            const parsed = JSON.parse(jsonMatch[1]);
            setParsedResponse(parsed);
            return;
          }

          // Try to parse the entire content as JSON
          const parsed = JSON.parse(streamingContent.generalPhysician);
          setParsedResponse(parsed);
        } catch {
          // Silently handle parsing errors
        }
      }
    } catch {
      // Silently handle parsing errors
    }
  }, [streamingContent.generalPhysician, currentSession?.general_physician_response]);

  // If we're still loading and have no parsed response, show a loading state
  if (isLoading && !parsedResponse && isActive) {
    return (
      <AnimatedSection>
        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-full">
                <Stethoscope className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>General Physician AI</CardTitle>
                <CardDescription>
                  Analyzing your symptoms
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium mb-2">Analyzing Your Symptoms</p>
              <p className="text-muted-foreground text-center max-w-md">
                The General Physician AI is carefully reviewing your symptoms and medical history to provide a preliminary assessment.
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
                <CardTitle>Error Processing Symptoms</CardTitle>
                <CardDescription>
                  There was a problem analyzing your symptoms
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
              className="w-full bg-primary hover:bg-primary/90"
            >
              Try to Continue Anyway
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
                  icon={<HeartPulse className="h-5 w-5" />}
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
                    <CardTitle className="text-lg">General Physician AI</CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full ml-2">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                  <CardDescription className="text-sm">
                    {isStreaming && isActive ? "Analyzing your symptoms..." : "Preliminary assessment of your symptoms"}
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
          {/* Patient Summary */}
          <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium">Patient Summary</h3>
            </div>

            {parsedResponse?.patient_summary_review ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{parsedResponse.patient_summary_review.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Age:</span>
                    <span className="font-medium">{parsedResponse.patient_summary_review.age}</span>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Key Symptoms:</p>
                  <ul className="space-y-1">
                    {parsedResponse.patient_summary_review.key_symptoms.map((symptom, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span>{symptom}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                {isStreaming && isActive ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <p>Loading patient summary...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-muted-foreground/70" />
                    <p>No patient summary available</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Medical Analyst Findings Summary (if available) */}
          {parsedResponse?.medical_analyst_findings_summary &&
           parsedResponse.medical_analyst_findings_summary !== "N/A" && (
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <TestTube className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-medium">Medical Analyst Findings</h3>
              </div>
              <p className="text-sm">{parsedResponse.medical_analyst_findings_summary}</p>
            </div>
          )}

          {/* Tabs for different sections */}
          <Tabs defaultValue="analysis" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 p-1 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50">
              <TabsTrigger value="analysis" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <Activity className="h-3.5 w-3.5 mr-1.5" />
                Symptom Analysis
              </TabsTrigger>
              <TabsTrigger value="concerns" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                Potential Concerns
              </TabsTrigger>
              <TabsTrigger value="advice" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                Initial Advice
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
              {parsedResponse?.preliminary_symptom_analysis?.length ? (
                <ul className="space-y-3">
                  {parsedResponse.preliminary_symptom_analysis.map((analysis, index) => (
                    <motion.li
                      key={index}
                      className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <div className="flex gap-3">
                        <Activity className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>{analysis}</span>
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
                        <p className="font-medium text-primary">Analyzing symptoms...</p>
                        <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-6 w-6 text-muted-foreground/70" />
                      <p>No symptom analysis available</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="concerns" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
              {parsedResponse?.potential_areas_of_concern?.length ? (
                <ul className="space-y-3">
                  {parsedResponse.potential_areas_of_concern.map((concern, index) => (
                    <motion.li
                      key={index}
                      className="bg-amber-500/5 p-4 rounded-lg border border-amber-500/20 shadow-sm"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <div className="flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="text-amber-600">{concern}</span>
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
                        <p className="font-medium text-primary">Identifying potential concerns...</p>
                        <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="h-6 w-6 text-green-500/70" />
                      <p>No potential concerns identified</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="advice" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
              {parsedResponse?.general_initial_advice?.length ? (
                <ul className="space-y-3">
                  {parsedResponse.general_initial_advice.map((advice, index) => (
                    <motion.li
                      key={index}
                      className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <div className="flex gap-3">
                        <ClipboardList className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>{advice}</span>
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
                        <p className="font-medium text-primary">Generating initial advice...</p>
                        <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="h-6 w-6 text-muted-foreground/70" />
                      <p>No initial advice available</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Specialist Recommendation */}
          {parsedResponse?.recommended_specialist_type && (
            <div className="bg-accent/5 p-4 rounded-lg border border-accent/20 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <HeartPulse className="h-4 w-4 text-accent" />
                <h3 className="text-sm font-medium">Recommended Specialist</h3>
              </div>
              <div className="flex items-center gap-2 ml-6">
                <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                  {parsedResponse.recommended_specialist_type}
                </Badge>
              </div>
            </div>
          )}

          {/* Questions for Specialist */}
          {parsedResponse?.questions_for_specialist_consultation &&
           parsedResponse.questions_for_specialist_consultation.length > 0 && (
            <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <ClipboardList className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-medium">Questions to Ask Your Specialist</h3>
              </div>
              <ul className="space-y-2 ml-2">
                {parsedResponse.questions_for_specialist_consultation.map((question, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <span>{question}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

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
          {/* Only show the continue button if there's a General Physician response and no Specialist Doctor response yet */}
          {currentSession?.general_physician_response && !currentSession?.specialist_doctor_response ? (
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
                "Continue to Specialist Doctor"
              )}
            </Button>
          ) : currentSession?.specialist_doctor_response ? (
            <div className="w-full p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
              <p className="text-sm text-green-500">
                Specialist Doctor analysis is complete
              </p>
            </div>
          ) : (
            <div className="w-full p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-center">
              <p className="text-sm text-amber-500">
                {isLoading || isStreaming ? "Processing symptoms..." : "Waiting for General Physician response..."}
              </p>
            </div>
          )}
        </CardFooter>
      </Card>
      </motion.div>
    </AnimatedSection>
  );
}
