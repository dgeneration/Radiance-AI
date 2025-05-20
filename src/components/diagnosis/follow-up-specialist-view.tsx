"use client";

import React, { useState, useEffect } from 'react';
import { useChainDiagnosis } from '@/contexts/diagnosis-context';
import { FollowUpSpecialistResponse } from '@/types/diagnosis';
// Define the response type based on the system prompt JSON structure
interface NewFollowUpSpecialistResponse {
  role_name: string;
  synthesis_of_case_progression: {
    initial_concern: string;
    key_insights_from_ais: string[];
  };
  symptom_monitoring_guidelines: {
    symptoms_to_track_closely: string[];
    improvement_indicators: string[];
  };
  recommended_follow_up_guidance: {
    initial_consultation: string;
    post_treatment_follow_up: string;
    routine_follow_up: string;
  };
  when_to_seek_urgent_medical_care_RED_FLAGS: string[];
  reinforcement_of_key_advice: string[];
  reference_data_for_next_role: {
    follow_up_summary: string;
    critical_takeaways_for_patient_journey: string;
  };
  disclaimer: string;
}
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, AlertCircle, CheckCircle,
  Activity, FileText, ClipboardList, AlertTriangle,
  ChevronDown, ChevronUp, Calendar, HeartPulse,
  ArrowUpRight
} from 'lucide-react';
import { AnimatedSection, AnimatedIcon } from '@/components/animations';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FollowUpSpecialistViewProps {
  isActive: boolean;
  onContinue: () => void;
  isLastRole?: boolean;
}

export function FollowUpSpecialistView({ isActive, onContinue, isLastRole = false }: FollowUpSpecialistViewProps) {
  const {
    currentSession,
    streamingContent,
    isStreaming,
    isLoading,
    error
  } = useChainDiagnosis();

  const [parsedResponse, setParsedResponse] = useState<NewFollowUpSpecialistResponse | null>(null);
  const [activeTab, setActiveTab] = useState('monitoring');
  const [isExpanded, setIsExpanded] = useState(isLastRole);

  // Use the FollowUpSpecialistResponse type for type checking

  // Helper function to adapt old response format to new format
  const adaptResponseFormat = (response: unknown): NewFollowUpSpecialistResponse => {
    // Type guard to check if it's already in the new format
    if (typeof response === 'object' && response !== null &&
        'role_name' in response &&
        'symptom_monitoring_guidelines' in response &&
        'recommended_follow_up_guidance' in response) {
      return response as NewFollowUpSpecialistResponse;
    }

    // Cast to the old format type for better type checking
    const oldResponse = response as Partial<FollowUpSpecialistResponse>;

    // Extract arrays safely
    let redFlags = ["Severe pain", "Difficulty breathing", "High fever"];

    // Check if when_to_seek_urgent_medical_care_RED_FLAGS exists and is an array
    if (oldResponse.when_to_seek_urgent_medical_care_RED_FLAGS) {
      if (Array.isArray(oldResponse.when_to_seek_urgent_medical_care_RED_FLAGS)) {
        redFlags = oldResponse.when_to_seek_urgent_medical_care_RED_FLAGS;
      } else if (typeof oldResponse.when_to_seek_urgent_medical_care_RED_FLAGS === 'string') {
        // Handle case where it might be a string
        redFlags = [oldResponse.when_to_seek_urgent_medical_care_RED_FLAGS];
      }
    }

    // Default values for symptoms to track
    let symptomsToTrack = ["Pain levels", "Energy levels", "Sleep quality"];

    // Check if symptoms_to_track_closely exists and is an array
    if (oldResponse.symptom_monitoring_guidelines?.symptoms_to_track_closely) {
      if (Array.isArray(oldResponse.symptom_monitoring_guidelines.symptoms_to_track_closely)) {
        symptomsToTrack = oldResponse.symptom_monitoring_guidelines.symptoms_to_track_closely;
      } else if (typeof oldResponse.symptom_monitoring_guidelines.symptoms_to_track_closely === 'string') {
        // Handle case where it might be a string
        symptomsToTrack = [oldResponse.symptom_monitoring_guidelines.symptoms_to_track_closely];
      }
    }

    // Default values for improvement indicators
    let improvementIndicators = ["Reduced pain", "Increased energy", "Better sleep"];

    // Check if improvement_indicators exists and is an array
    if (oldResponse.symptom_monitoring_guidelines?.improvement_indicators) {
      if (Array.isArray(oldResponse.symptom_monitoring_guidelines.improvement_indicators)) {
        improvementIndicators = oldResponse.symptom_monitoring_guidelines.improvement_indicators;
      } else if (typeof oldResponse.symptom_monitoring_guidelines.improvement_indicators === 'string') {
        // Handle case where it might be a string
        improvementIndicators = [oldResponse.symptom_monitoring_guidelines.improvement_indicators];
      }
    }

    // Extract strings safely
    const initialConsultation = oldResponse.recommended_follow_up_guidance?.initial_consultation ||
      "Schedule as advised by your doctor.";

    const postTreatmentFollowUp = oldResponse.recommended_follow_up_guidance?.post_treatment_follow_up ||
      "Follow your doctor's guidance.";

    const routineFollowUp = oldResponse.recommended_follow_up_guidance?.routine_follow_up ||
      "Schedule regular check-ups as recommended.";

    const disclaimer = typeof oldResponse.disclaimer === 'string'
      ? oldResponse.disclaimer
      : "This follow-up guidance is for informational purposes. Always follow the specific instructions and timelines provided by your treating healthcare professionals. If you are experiencing severe symptoms, seek immediate medical attention. Radiance AI.";

    // Create synthesis of case progression
    const initialConcern = oldResponse.synthesis_of_case_progression?.initial_concern ||
      "Initial health concern reported by patient";

    const insights = Array.isArray(oldResponse.synthesis_of_case_progression?.key_insights_from_ais)
      ? oldResponse.synthesis_of_case_progression.key_insights_from_ais
      : ["Consult with healthcare provider for proper diagnosis"];

    // Extract reinforcement of key advice
    let keyAdvice = ["Follow medication instructions carefully", "Maintain a healthy lifestyle", "Keep all follow-up appointments"];

    // Check if reinforcement_of_key_advice exists and is an array
    if (oldResponse.reinforcement_of_key_advice) {
      if (Array.isArray(oldResponse.reinforcement_of_key_advice)) {
        keyAdvice = oldResponse.reinforcement_of_key_advice;
      } else if (typeof oldResponse.reinforcement_of_key_advice === 'string') {
        // Handle case where it might be a string
        keyAdvice = [oldResponse.reinforcement_of_key_advice];
      }
    }

    // Return the adapted format
    return {
      role_name: "Follow-up Specialist AI (Radiance AI)",
      synthesis_of_case_progression: {
        initial_concern: initialConcern,
        key_insights_from_ais: insights
      },
      symptom_monitoring_guidelines: {
        symptoms_to_track_closely: symptomsToTrack,
        improvement_indicators: improvementIndicators
      },
      recommended_follow_up_guidance: {
        initial_consultation: initialConsultation,
        post_treatment_follow_up: postTreatmentFollowUp,
        routine_follow_up: routineFollowUp
      },
      when_to_seek_urgent_medical_care_RED_FLAGS: redFlags,
      reinforcement_of_key_advice: keyAdvice,
      reference_data_for_next_role: {
        follow_up_summary: "Follow-up care and monitoring recommendations based on patient's condition",
        critical_takeaways_for_patient_journey: "Monitor symptoms closely and seek medical attention if condition worsens"
      },
      disclaimer: disclaimer
    };
  };

  // Parse the response from the session or streaming content
  useEffect(() => {
    try {
      // First priority: use the stored response if available
      if (currentSession?.follow_up_specialist_response) {
        // Check if the response is already a parsed object
        if (typeof currentSession.follow_up_specialist_response === 'object' &&
            currentSession.follow_up_specialist_response !== null) {
          setParsedResponse(adaptResponseFormat(currentSession.follow_up_specialist_response));
          return;
        }
      }

      // Second priority: try to parse streaming content if available
      if (streamingContent.followUpSpecialist) {
        try {
          // Try to extract JSON from the content
          const jsonMatch = streamingContent.followUpSpecialist.match(/```json\s*([\s\S]*?)\s*```/);

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
            const parsed = JSON.parse(streamingContent.followUpSpecialist);
            setParsedResponse(adaptResponseFormat(parsed));
            return;
          } catch {
            // Failed to parse entire content as JSON
          }

          // If we get here, try to extract any JSON-like structure
          const jsonLikeMatch = streamingContent.followUpSpecialist.match(/(\{[\s\S]*\})/);
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
      // Error in follow-up specialist response parsing
    }
  }, [streamingContent.followUpSpecialist, currentSession?.follow_up_specialist_response]);

  // If we're still loading and have no parsed response, show a loading state
  if (isLoading && !parsedResponse && isActive) {
    return (
      <AnimatedSection>
        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-full">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Follow-up Specialist AI</CardTitle>
                <CardDescription>
                  Providing guidance on monitoring and follow-up care
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium mb-2">Preparing Follow-up Guidance</p>
              <p className="text-muted-foreground text-center max-w-md">
                The Follow-up Specialist AI is synthesizing all previous analyses to provide guidance on symptom monitoring and follow-up care.
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
                  There was an error processing the Follow-up Specialist analysis
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
            <div className="flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <AnimatedIcon
                    icon={<Calendar className="h-5 w-5" />}
                    className={cn(
                      "p-3 rounded-full",
                      isActive ? "bg-primary/20 text-primary" : "bg-muted/30 text-muted-foreground"
                    )}
                    containerClassName="flex-shrink-0"
                    pulseEffect={isActive && isStreaming}
                    hoverScale={1.05}
                  />
                  <div>
                    {/* Show Analysis Complete badge on top in mobile view */}
                    {parsedResponse && !isStreaming && (
                      <Badge
                        variant="outline"
                        className="mb-1 bg-green-500/10 text-green-500 border-green-500/20 px-2 py-0.5 text-xs font-normal md:hidden"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Analysis Complete
                      </Badge>
                    )}
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">
                        Follow-up Specialist AI
                      </CardTitle>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full ml-2">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                    <CardDescription className="text-sm">
                      {isStreaming && isActive
                        ? "Preparing follow-up and monitoring guidance..."
                        : "Guidance on monitoring and follow-up care"}
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

                {/* Show Analysis Complete badge on the right in desktop view */}
                {parsedResponse && !isStreaming && (
                  <Badge
                    variant="outline"
                    className="bg-green-500/10 text-green-500 border-green-500/20 px-2 py-0.5 text-xs font-normal hidden md:flex"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Analysis Complete
                  </Badge>
                )}
              </div>
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
              {/* Case Synthesis */}
              {parsedResponse?.synthesis_of_case_progression && (
                <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-medium">Case Synthesis</h3>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground">Initial Concern:</span>
                      <span className="font-medium">{parsedResponse.synthesis_of_case_progression.initial_concern}</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground">Key Insights from AI Team:</span>
                      <ul className="list-disc pl-5 space-y-1">
                        {parsedResponse.synthesis_of_case_progression.key_insights_from_ais.map((insight, index) => (
                          <li key={index}>{insight}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabs for different sections */}
              <Tabs defaultValue="monitoring" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 p-1 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50">
                  <TabsTrigger value="monitoring" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <Activity className="h-3.5 w-3.5 mr-1.5" />
                    Monitoring
                  </TabsTrigger>
                  <TabsTrigger value="timeline" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger value="guidance" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                    Guidance
                  </TabsTrigger>
                  <TabsTrigger value="urgent" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                    Urgent Care
                  </TabsTrigger>
                </TabsList>

                {/* Symptom Monitoring Tab */}
                <TabsContent value="monitoring" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
                  {parsedResponse?.symptom_monitoring_guidelines ? (
                    <div className="space-y-4">
                      {/* Symptoms to Track Closely */}
                      <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <HeartPulse className="h-4 w-4 text-primary" />
                          <h3 className="text-sm font-medium">Symptoms to Track Closely</h3>
                        </div>

                        <ul className="space-y-2">
                          {Array.isArray(parsedResponse.symptom_monitoring_guidelines.symptoms_to_track_closely) ?
                            parsedResponse.symptom_monitoring_guidelines.symptoms_to_track_closely.map((symptom, index) => (
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
                                <span>{symptom}</span>
                              </motion.li>
                            )) :
                            <li className="flex items-start gap-2 text-sm">
                              <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                1
                              </div>
                              <span>Monitor your symptoms daily and note any changes</span>
                            </li>
                          }
                        </ul>
                      </div>

                      {/* Improvement Indicators */}
                      <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <h3 className="text-sm font-medium text-green-500">Improvement Indicators</h3>
                        </div>

                        <ul className="space-y-2">
                          {Array.isArray(parsedResponse.symptom_monitoring_guidelines.improvement_indicators) ?
                            parsedResponse.symptom_monitoring_guidelines.improvement_indicators.map((indicator, index) => (
                              <motion.li
                                key={index}
                                className="flex items-start gap-2 text-sm"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                              >
                                <div className="w-5 h-5 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  {index + 1}
                                </div>
                                <span>{indicator}</span>
                              </motion.li>
                            )) :
                            <li className="flex items-start gap-2 text-sm">
                              <div className="w-5 h-5 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                1
                              </div>
                              <span>Reduced symptoms and improved overall well-being</span>
                            </li>
                          }
                        </ul>
                      </div>

                      {/* Key Advice */}
                      <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <ClipboardList className="h-4 w-4 text-primary" />
                          <h3 className="text-sm font-medium">Key Advice</h3>
                        </div>

                        <ul className="space-y-2">
                          {parsedResponse.reinforcement_of_key_advice && Array.isArray(parsedResponse.reinforcement_of_key_advice) ?
                            parsedResponse.reinforcement_of_key_advice.map((advice, index) => (
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
                                <span>{advice}</span>
                              </motion.li>
                            )) : (
                              <>
                                <li className="flex items-start gap-2 text-sm">
                                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                    1
                                  </div>
                                  <span>Follow your healthcare provider&apos;s advice for your specific condition</span>
                                </li>
                                <li className="flex items-start gap-2 text-sm">
                                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                    2
                                  </div>
                                  <span>Maintain a healthy lifestyle with proper nutrition and regular exercise as appropriate</span>
                                </li>
                                <li className="flex items-start gap-2 text-sm">
                                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                    3
                                  </div>
                                  <span>Keep track of your symptoms and report any changes to your healthcare provider</span>
                                </li>
                              </>
                            )}
                        </ul>
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
                            <p className="font-medium text-primary">Preparing monitoring guidelines...</p>
                            <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Activity className="h-6 w-6 text-muted-foreground/70" />
                          <p>No monitoring guidelines available</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Timeline Tab */}
                <TabsContent value="timeline" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
                  {parsedResponse?.recommended_follow_up_guidance ? (
                    <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-medium">Follow-up Timeline</h3>
                      </div>

                      <div className="space-y-4">
                        {/* Initial Consultation */}
                        <div className="pl-4 border-l-2 border-primary/20">
                          <p className="text-sm font-medium mb-1">Initial Consultation</p>
                          <p className="text-sm text-muted-foreground">
                            {parsedResponse.recommended_follow_up_guidance.initial_consultation}
                          </p>
                        </div>

                        {/* Post Treatment Follow-up */}
                        <div className="pl-4 border-l-2 border-primary/20">
                          <p className="text-sm font-medium mb-1">Post Treatment Follow-up</p>
                          <p className="text-sm text-muted-foreground">
                            {parsedResponse.recommended_follow_up_guidance.post_treatment_follow_up}
                          </p>
                        </div>

                        {/* Routine Follow-up */}
                        <div className="pl-4 border-l-2 border-primary/20">
                          <p className="text-sm font-medium mb-1">Routine Follow-up</p>
                          <p className="text-sm text-muted-foreground">
                            {parsedResponse.recommended_follow_up_guidance.routine_follow_up}
                          </p>
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
                            <p className="font-medium text-primary">Preparing timeline information...</p>
                            <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Calendar className="h-6 w-6 text-muted-foreground/70" />
                          <p>No timeline information available</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Guidance Tab */}
                <TabsContent value="guidance" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
                  {parsedResponse?.reinforcement_of_key_advice ? (
                    <div className="space-y-4">
                      {/* Key Advice */}
                      <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <ClipboardList className="h-4 w-4 text-primary" />
                          <h3 className="text-sm font-medium">Key Advice</h3>
                        </div>

                        <ul className="space-y-3">
                          {Array.isArray(parsedResponse.reinforcement_of_key_advice) ?
                            parsedResponse.reinforcement_of_key_advice.map((advice, index) => (
                              <motion.li
                                key={index}
                                className="flex items-start gap-2"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                              >
                                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                  {index + 1}
                                </div>
                                <span className="text-sm">{advice}</span>
                              </motion.li>
                            )) :
                            <li className="text-sm text-muted-foreground">No specific advice available</li>
                          }
                        </ul>
                      </div>

                      {/* Reference Data */}
                      {parsedResponse.reference_data_for_next_role && (
                        <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                            <FileText className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-medium">Summary</h3>
                          </div>

                          <div className="space-y-3">
                            {/* Follow-up Summary */}
                            <div className="pl-4 border-l-2 border-primary/20">
                              <p className="text-sm font-medium mb-1">Follow-up Summary</p>
                              <p className="text-sm text-muted-foreground">
                                {parsedResponse.reference_data_for_next_role.follow_up_summary || "Follow-up care recommendations based on your condition"}
                              </p>
                            </div>

                            {/* Critical Takeaways */}
                            <div className="pl-4 border-l-2 border-primary/20">
                              <p className="text-sm font-medium mb-1">Critical Takeaways</p>
                              <p className="text-sm text-muted-foreground">
                                {parsedResponse.reference_data_for_next_role.critical_takeaways_for_patient_journey || "Monitor symptoms closely and seek medical attention if condition worsens"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
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
                            <p className="font-medium text-primary">Preparing guidance information...</p>
                            <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <ClipboardList className="h-6 w-6 text-muted-foreground/70" />
                          <p>No guidance information available</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
                {/* Urgent Care Tab */}
                <TabsContent value="urgent" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
                  {parsedResponse?.when_to_seek_urgent_medical_care_RED_FLAGS ? (
                    <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <h3 className="text-sm font-medium text-red-500">Seek Immediate Medical Care For</h3>
                      </div>

                      <ul className="space-y-2">
                        {Array.isArray(parsedResponse.when_to_seek_urgent_medical_care_RED_FLAGS) ?
                          parsedResponse.when_to_seek_urgent_medical_care_RED_FLAGS.map((flag, index) => (
                            <motion.li
                              key={index}
                              className="flex items-start gap-2 text-sm"
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                              <ArrowUpRight className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                              <span className="text-red-500">{flag}</span>
                            </motion.li>
                          )) :
                          <li className="flex items-start gap-2 text-sm">
                            <ArrowUpRight className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <span className="text-red-500">Seek immediate medical attention for severe or worsening symptoms</span>
                          </li>
                        }
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
                            <p className="font-medium text-primary">Identifying urgent care indicators...</p>
                            <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <AlertTriangle className="h-6 w-6 text-muted-foreground/70" />
                          <p>No urgent care indicators available</p>
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
          {!currentSession?.summarizer_response && (
          <CardFooter>
            {/* Only show the continue button if there's a Follow-up Specialist response and no Summarizer response yet */}
            {currentSession?.follow_up_specialist_response && !currentSession?.summarizer_response ? (
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
                  "Continue to Final Summary"
                )}
              </Button>
            ) : (
              <div className="w-full p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-center">
                <p className="text-sm text-amber-500">
                  {isLoading || isStreaming ? "Processing follow-up specialist assessment..." : "Waiting for Follow-up Specialist response..."}
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
