"use client";

import React, { useState, useEffect } from 'react';
import { useChainDiagnosis } from '@/contexts/diagnosis-context';
import { SpecialistDoctorResponse } from '@/types/diagnosis';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, AlertCircle, CheckCircle,
  Activity, FileText, ClipboardList, AlertTriangle,
  ChevronDown, ChevronUp, UserCog, Microscope,
  Pill, Clipboard, Brain
} from 'lucide-react';
import { AnimatedSection, AnimatedIcon } from '@/components/animations';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SpecialistDoctorViewProps {
  isActive: boolean;
  onContinue: () => void;
  isLastRole?: boolean;
}

export function SpecialistDoctorView({ isActive, onContinue, isLastRole = false }: SpecialistDoctorViewProps) {
  const {
    currentSession,
    streamingContent,
    isStreaming,
    isLoading,
    error
  } = useChainDiagnosis();

  const [parsedResponse, setParsedResponse] = useState<SpecialistDoctorResponse | null>(null);
  const [activeTab, setActiveTab] = useState('assessment');
  const [isExpanded, setIsExpanded] = useState(isLastRole);

  // Parse the response from the session or streaming content
  useEffect(() => {
    try {
      // First priority: use the stored response if available
      if (currentSession?.specialist_doctor_response) {
        // Check if the response is already a parsed object
        if (typeof currentSession.specialist_doctor_response === 'object' &&
            currentSession.specialist_doctor_response !== null) {
          setParsedResponse(currentSession.specialist_doctor_response);
          return;
        }
      }

      // Second priority: try to parse streaming content if available
      if (streamingContent.specialistDoctor) {
        try {
          // Try to extract JSON from the content
          const jsonMatch = streamingContent.specialistDoctor.match(/```json\s*([\s\S]*?)\s*```/);

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
            const parsed = JSON.parse(streamingContent.specialistDoctor);
            setParsedResponse(parsed);
            return;
          } catch {
            // Failed to parse entire content as JSON
          }

          // If we get here, try to extract any JSON-like structure
          const jsonLikeMatch = streamingContent.specialistDoctor.match(/(\{[\s\S]*\})/);
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
      // Error in specialist doctor response parsing
    }
  }, [streamingContent.specialistDoctor, currentSession?.specialist_doctor_response]);

  // If we're still loading and have no parsed response, show a loading state
  if (isLoading && !parsedResponse && isActive) {
    return (
      <AnimatedSection>
        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-full">
                <UserCog className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Specialist Doctor AI</CardTitle>
                <CardDescription>
                  Analyzing your case from a specialist perspective
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium mb-2">Specialist Analysis in Progress</p>
              <p className="text-muted-foreground text-center max-w-md">
                The Specialist Doctor AI is carefully reviewing your case to provide a specialized assessment.
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
                  There was an error processing the Specialist Doctor analysis
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
                  icon={<UserCog className="h-5 w-5" />}
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
                      {parsedResponse?.role_name || "Specialist Doctor AI"}
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full ml-2">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                  <CardDescription className="text-sm">
                    {isStreaming && isActive
                      ? "Analyzing your case from a specialist perspective..."
                      : "Specialized assessment of your condition"}
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

          {isExpanded && (
            <CardContent>
              {/* Tabs for different sections */}
              <Tabs defaultValue="assessment" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 p-1 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50">
                  <TabsTrigger value="assessment" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <Activity className="h-3.5 w-3.5 mr-1.5" />
                    Case Assessment
                  </TabsTrigger>
                  <TabsTrigger value="conditions" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                    Potential Conditions
                  </TabsTrigger>
                  <TabsTrigger value="recommendations" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                    Recommendations
                  </TabsTrigger>
                  <TabsTrigger value="takeaways" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                    Key Takeaways
                  </TabsTrigger>
                </TabsList>

                {/* Case Assessment Tab */}
                <TabsContent value="assessment" className="mt-4">
                  {parsedResponse?.patient_case_review_from_specialist_viewpoint ? (
                    <div className="space-y-4">
                      {/* GP Referral Information */}
                      <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="h-4 w-4 text-primary" />
                          <h3 className="text-sm font-medium">GP Referral Information</h3>
                        </div>
                        <p className="text-sm">
                          {parsedResponse.patient_case_review_from_specialist_viewpoint.key_information_from_gp_referral}
                        </p>
                      </div>

                      {/* Medical Analyst Data */}
                      {parsedResponse.patient_case_review_from_specialist_viewpoint.medical_analyst_data_consideration &&
                       parsedResponse.patient_case_review_from_specialist_viewpoint.medical_analyst_data_consideration !== "N/A" && (
                        <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                            <Microscope className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-medium">Medical Analyst Data</h3>
                          </div>
                          <p className="text-sm">
                            {parsedResponse.patient_case_review_from_specialist_viewpoint.medical_analyst_data_consideration}
                          </p>
                        </div>
                      )}

                      {/* Specialist Focus Points */}
                      {parsedResponse.patient_case_review_from_specialist_viewpoint.specialist_focus_points &&
                       parsedResponse.patient_case_review_from_specialist_viewpoint.specialist_focus_points.length > 0 && (
                        <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                            <Brain className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-medium">Specialist Focus Points</h3>
                          </div>
                          <ul className="space-y-2 ml-2">
                            {parsedResponse.patient_case_review_from_specialist_viewpoint.specialist_focus_points.map((point, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                  {index + 1}
                                </div>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <p className="text-muted-foreground">No assessment data available</p>
                    </div>
                  )}
                </TabsContent>

                {/* Potential Conditions Tab */}
                <TabsContent value="conditions" className="mt-4">
                  {parsedResponse?.specialized_assessment_and_potential_conditions &&
                   parsedResponse.specialized_assessment_and_potential_conditions.length > 0 ? (
                    <div className="space-y-4">
                      {parsedResponse.specialized_assessment_and_potential_conditions.map((condition, index) => (
                        <div key={index} className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                            <AlertCircle className={cn(
                              "h-4 w-4",
                              index === 0 ? "text-amber-500" : "text-muted-foreground"
                            )} />
                            <h3 className="text-sm font-medium">{condition.condition_hypothesis}</h3>
                          </div>
                          <p className="text-sm mb-3">{condition.reasoning}</p>

                          {/* Symptoms Match */}
                          {condition.symptoms_match && condition.symptoms_match.length > 0 && (
                            <div className="mt-2">
                              <h4 className="text-xs font-medium text-muted-foreground mb-2">Matching Symptoms:</h4>
                              <div className="flex flex-wrap gap-2">
                                {condition.symptoms_match.map((symptom, idx) => (
                                  <Badge key={idx} variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                    {symptom}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <p className="text-muted-foreground">No condition data available</p>
                    </div>
                  )}
                </TabsContent>

                {/* Recommendations Tab */}
                <TabsContent value="recommendations" className="mt-4">
                  {parsedResponse?.recommended_diagnostic_and_management_approach ? (
                    <div className="space-y-4">
                      {/* Further Investigations */}
                      {parsedResponse.recommended_diagnostic_and_management_approach.further_investigations_suggested &&
                       parsedResponse.recommended_diagnostic_and_management_approach.further_investigations_suggested.length > 0 && (
                        <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                            <Clipboard className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-medium">Recommended Investigations</h3>
                          </div>
                          <ul className="space-y-2 ml-2">
                            {parsedResponse.recommended_diagnostic_and_management_approach.further_investigations_suggested.map((investigation, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                  {index + 1}
                                </div>
                                <span>{investigation}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Management Principles */}
                      {parsedResponse.recommended_diagnostic_and_management_approach.general_management_principles &&
                       parsedResponse.recommended_diagnostic_and_management_approach.general_management_principles.length > 0 && (
                        <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                            <Pill className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-medium">Management Principles</h3>
                          </div>
                          <ul className="space-y-2 ml-2">
                            {parsedResponse.recommended_diagnostic_and_management_approach.general_management_principles.map((principle, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                  {index + 1}
                                </div>
                                <span>{principle}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Lifestyle and Supportive Care */}
                      {parsedResponse.recommended_diagnostic_and_management_approach.lifestyle_and_supportive_care_notes &&
                       parsedResponse.recommended_diagnostic_and_management_approach.lifestyle_and_supportive_care_notes.length > 0 && (
                        <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                            <Activity className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-medium">Lifestyle & Supportive Care</h3>
                          </div>
                          <ul className="space-y-2 ml-2">
                            {parsedResponse.recommended_diagnostic_and_management_approach.lifestyle_and_supportive_care_notes.map((note, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                  {index + 1}
                                </div>
                                <span>{note}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <p className="text-muted-foreground">No recommendation data available</p>
                    </div>
                  )}
                </TabsContent>

                {/* Key Takeaways Tab */}
                <TabsContent value="takeaways" className="mt-4">
                  {parsedResponse?.key_takeaways_for_patient &&
                   parsedResponse.key_takeaways_for_patient.length > 0 ? (
                    <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-medium">Key Takeaways for Patient</h3>
                      </div>
                      <ul className="space-y-2 ml-2">
                        {parsedResponse.key_takeaways_for_patient.map((takeaway, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                              {index + 1}
                            </div>
                            <span>{takeaway}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <p className="text-muted-foreground">No key takeaways available</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Disclaimer */}
              {parsedResponse?.disclaimer && (
                <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                  <p className="text-xs text-muted-foreground">{parsedResponse.disclaimer}</p>
                </div>
              )}
            </CardContent>
          )}
          {!currentSession?.pathologist_response && (
          <CardFooter>
            {/* Only show the continue button if there's a Specialist Doctor response and no Pathologist response yet */}
            {currentSession?.specialist_doctor_response && !currentSession?.pathologist_response ? (
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
                  "Continue to Pathologist"
                )}
              </Button>
            ) : (
              <div className="w-full p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-center">
                <p className="text-sm text-amber-500">
                  {isLoading || isStreaming ? "Processing specialist assessment..." : "Waiting for Specialist Doctor response..."}
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
