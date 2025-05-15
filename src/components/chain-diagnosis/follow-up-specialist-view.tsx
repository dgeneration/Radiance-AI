"use client";

import React, { useState, useEffect } from 'react';
import { useChainDiagnosis } from '@/contexts/chain-diagnosis-context';
import { FollowUpSpecialistResponse } from '@/types/chain-diagnosis';

// Define the new response type based on the provided JSON
interface NewFollowUpSpecialistResponse {
  follow_up_recommendations: {
    symptom_monitoring: {
      track_daily: string[];
      use_symptom_diary: boolean;
      photo_documentation: string;
    };
    follow_up_timeline: {
      gastroenterologist: string;
      diagnostic_procedures: string;
      follow_up_after_diagnosis: string;
    };
    medication_guidance: {
      continue: string;
      avoid: string;
      consider: string;
    };
    dietary_recommendations: {
      general_approach: string;
      avoid: string[];
      ensure: string;
    };
    urgent_care_indicators: {
      seek_immediate_care_for: string[];
    };
    next_steps: {
      priority: string;
      documentation: string;
      nutritional_support: string;
    };
  };
  disclaimer?: string; // Keep this for backward compatibility
}
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, AlertCircle, CheckCircle,
  Activity, FileText, ClipboardList, AlertTriangle,
  ChevronDown, ChevronUp, Calendar, HeartPulse,
  Bell, ArrowUpRight, ThumbsUp, Camera, Pill, Utensils
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

  // Parse the response from the session or streaming content
  useEffect(() => {
    try {
      // First priority: use the stored response if available
      if (currentSession?.follow_up_specialist_response) {
        // Check if the response is already a parsed object
        if (typeof currentSession.follow_up_specialist_response === 'object' &&
            currentSession.follow_up_specialist_response !== null) {
          setParsedResponse(currentSession.follow_up_specialist_response);
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
              setParsedResponse(parsed);
              return;
            } catch (e) {
              // Failed to parse JSON from code block
            }
          }

          // Try to parse the entire content as JSON
          try {
            const parsed = JSON.parse(streamingContent.followUpSpecialist);
            setParsedResponse(parsed);
            return;
          } catch (e) {
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
              setParsedResponse(parsed);
              return;
            } catch (e) {
              // Failed to parse JSON-like structure
            }
          }
        } catch (e) {
          // Error in streaming content parsing
        }
      }
    } catch (e) {
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
                <TabsList className="grid grid-cols-4 p-1 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50">
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
                  {parsedResponse?.follow_up_recommendations?.symptom_monitoring ? (
                    <div className="space-y-4">
                      {/* Symptoms to Track Daily */}
                      <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <HeartPulse className="h-4 w-4 text-primary" />
                          <h3 className="text-sm font-medium">Track Daily</h3>
                        </div>

                        <ul className="space-y-2">
                          {parsedResponse.follow_up_recommendations.symptom_monitoring.track_daily.map((symptom, index) => (
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
                          ))}
                        </ul>
                      </div>

                      {/* Symptom Diary */}
                      {parsedResponse.follow_up_recommendations.symptom_monitoring.use_symptom_diary && (
                        <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                            <ClipboardList className="h-4 w-4 text-green-500" />
                            <h3 className="text-sm font-medium text-green-500">Symptom Diary</h3>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                            <span>Use a symptom diary to track daily changes</span>
                          </div>
                        </div>
                      )}

                      {/* Photo Documentation */}
                      {parsedResponse.follow_up_recommendations.symptom_monitoring.photo_documentation && (
                        <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                            <Camera className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-medium">Photo Documentation</h3>
                          </div>

                          <p className="text-sm">
                            {parsedResponse.follow_up_recommendations.symptom_monitoring.photo_documentation}
                          </p>
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
                  {parsedResponse?.follow_up_recommendations?.follow_up_timeline ? (
                    <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-medium">Follow-up Timeline</h3>
                      </div>

                      <div className="space-y-4">
                        {/* Gastroenterologist */}
                        <div className="pl-4 border-l-2 border-primary/20">
                          <p className="text-sm font-medium mb-1">Gastroenterologist</p>
                          <p className="text-sm text-muted-foreground">
                            {parsedResponse.follow_up_recommendations.follow_up_timeline.gastroenterologist}
                          </p>
                        </div>

                        {/* Diagnostic Procedures */}
                        <div className="pl-4 border-l-2 border-primary/20">
                          <p className="text-sm font-medium mb-1">Diagnostic Procedures</p>
                          <p className="text-sm text-muted-foreground">
                            {parsedResponse.follow_up_recommendations.follow_up_timeline.diagnostic_procedures}
                          </p>
                        </div>

                        {/* Follow-up After Diagnosis */}
                        <div className="pl-4 border-l-2 border-primary/20">
                          <p className="text-sm font-medium mb-1">Follow-up After Diagnosis</p>
                          <p className="text-sm text-muted-foreground">
                            {parsedResponse.follow_up_recommendations.follow_up_timeline.follow_up_after_diagnosis}
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
                  {parsedResponse?.follow_up_recommendations ? (
                    <div className="space-y-4">
                      {/* Medication Guidance */}
                      <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <Pill className="h-4 w-4 text-primary" />
                          <h3 className="text-sm font-medium">Medication Guidance</h3>
                        </div>

                        <div className="space-y-3">
                          {/* Continue */}
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Continue</p>
                              <p className="text-sm text-muted-foreground">
                                {parsedResponse.follow_up_recommendations.medication_guidance.continue}
                              </p>
                            </div>
                          </div>

                          {/* Avoid */}
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Avoid</p>
                              <p className="text-sm text-muted-foreground">
                                {parsedResponse.follow_up_recommendations.medication_guidance.avoid}
                              </p>
                            </div>
                          </div>

                          {/* Consider */}
                          <div className="flex items-start gap-2">
                            <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Consider</p>
                              <p className="text-sm text-muted-foreground">
                                {parsedResponse.follow_up_recommendations.medication_guidance.consider}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Dietary Recommendations */}
                      <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <Utensils className="h-4 w-4 text-primary" />
                          <h3 className="text-sm font-medium">Dietary Recommendations</h3>
                        </div>

                        <div className="space-y-3">
                          {/* General Approach */}
                          <div className="pl-4 border-l-2 border-primary/20">
                            <p className="text-sm font-medium mb-1">General Approach</p>
                            <p className="text-sm text-muted-foreground">
                              {parsedResponse.follow_up_recommendations.dietary_recommendations.general_approach}
                            </p>
                          </div>

                          {/* Foods to Avoid */}
                          <div className="pl-4 border-l-2 border-amber-500/20">
                            <p className="text-sm font-medium mb-1 text-amber-500">Foods to Avoid</p>
                            <ul className="list-disc pl-5 space-y-1">
                              {parsedResponse.follow_up_recommendations.dietary_recommendations.avoid.map((food, index) => (
                                <li key={index} className="text-sm text-muted-foreground">{food}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Ensure */}
                          <div className="pl-4 border-l-2 border-green-500/20">
                            <p className="text-sm font-medium mb-1 text-green-500">Ensure</p>
                            <p className="text-sm text-muted-foreground">
                              {parsedResponse.follow_up_recommendations.dietary_recommendations.ensure}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Next Steps */}
                      <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <ClipboardList className="h-4 w-4 text-primary" />
                          <h3 className="text-sm font-medium">Next Steps</h3>
                        </div>

                        <div className="space-y-3">
                          {/* Priority */}
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                              1
                            </div>
                            <div>
                              <p className="text-sm font-medium">Priority</p>
                              <p className="text-sm text-muted-foreground">
                                {parsedResponse.follow_up_recommendations.next_steps.priority}
                              </p>
                            </div>
                          </div>

                          {/* Documentation */}
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                              2
                            </div>
                            <div>
                              <p className="text-sm font-medium">Documentation</p>
                              <p className="text-sm text-muted-foreground">
                                {parsedResponse.follow_up_recommendations.next_steps.documentation}
                              </p>
                            </div>
                          </div>

                          {/* Nutritional Support */}
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                              3
                            </div>
                            <div>
                              <p className="text-sm font-medium">Nutritional Support</p>
                              <p className="text-sm text-muted-foreground">
                                {parsedResponse.follow_up_recommendations.next_steps.nutritional_support}
                              </p>
                            </div>
                          </div>
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
                  {parsedResponse?.follow_up_recommendations?.urgent_care_indicators?.seek_immediate_care_for ? (
                    <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <h3 className="text-sm font-medium text-red-500">Seek Immediate Medical Care For</h3>
                      </div>

                      <ul className="space-y-2">
                        {parsedResponse.follow_up_recommendations.urgent_care_indicators.seek_immediate_care_for.map((flag, index) => (
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
            ) : currentSession?.summarizer_response ? (
              <div className="w-full p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                <p className="text-sm text-green-500">
                  Final summary is complete
                </p>
              </div>
            ) : (
              <div className="w-full p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-center">
                <p className="text-sm text-amber-500">
                  {isLoading || isStreaming ? "Processing follow-up specialist assessment..." : "Waiting for Follow-up Specialist response..."}
                </p>
              </div>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </AnimatedSection>
  );
}
