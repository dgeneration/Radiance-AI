"use client";

import React, { useState, useEffect } from 'react';
import { useChainDiagnosis } from '@/contexts/chain-diagnosis-context';
// Define the response type based on the system prompt JSON structure
interface NewRadianceAISummarizerResponse {
  report_title: string;
  report_generated_for: string;
  report_date: string;
  introduction: string;

  patient_information_summary: {
    name: string;
    age: string;
    gender: string;
    location: string;
    key_symptoms_reported: string[];
    symptom_duration: string;
    relevant_medical_history: string[];
    bmi_status: string;
  };

  radiance_ai_team_journey_overview: {
    role: string;
    summary_of_findings?: string;
    summary_of_assessment?: string;
    summary_of_insights?: string;
    summary_of_recommendations?: string;
    summary_of_guidance?: string;
    summary_of_advice?: string;
  }[];

  key_takeaways_and_recommendations_for_patient: string[];

  final_disclaimer_from_radiance_ai: string;
}
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, AlertCircle, CheckCircle,
  Activity, FileText,
  ChevronDown, ChevronUp, Brain, User,
  Download, Share2, TestTube,
  Pill, Utensils, ShieldAlert,
  Stethoscope, Calendar
} from 'lucide-react';
import { AnimatedSection, AnimatedIcon } from '@/components/animations';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { HealthInsightReport } from './health-insight-report';

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

  // Helper function to adapt old response format to new format
  const adaptResponseFormat = (response: unknown): NewRadianceAISummarizerResponse => {
    // Type guard to check if it's already in the new format
    if (typeof response === 'object' && response !== null &&
        'report_title' in response &&
        'patient_information_summary' in response &&
        'radiance_ai_team_journey_overview' in response) {
      return response as NewRadianceAISummarizerResponse;
    }

    // Cast to a generic object for safety
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const oldResponse = response as Record<string, any>;

    // Create default values for required fields
    const patientName = typeof oldResponse.patient_name === 'string'
      ? oldResponse.patient_name
      : (typeof oldResponse.name === 'string' ? oldResponse.name : "Patient");

    const patientAge = typeof oldResponse.age === 'number'
      ? oldResponse.age.toString()
      : (typeof oldResponse.age === 'string' ? oldResponse.age : "Not specified");

    const patientGender = typeof oldResponse.gender === 'string'
      ? oldResponse.gender
      : "Not specified";

    // Extract arrays safely
    const primaryConcerns = Array.isArray(oldResponse.primary_concerns)
      ? oldResponse.primary_concerns
      : [];

    const medicalHistory = Array.isArray(oldResponse.medical_conditions)
      ? oldResponse.medical_conditions
      : [];

    // Create team journey overview from old format
    let teamJourney = [];

    // Check if radiance_ai_team_journey_overview exists and is an array
    if (oldResponse.radiance_ai_team_journey_overview) {
      if (Array.isArray(oldResponse.radiance_ai_team_journey_overview)) {
        teamJourney = oldResponse.radiance_ai_team_journey_overview;
      } else if (typeof oldResponse.radiance_ai_team_journey_overview === 'object' &&
                oldResponse.radiance_ai_team_journey_overview !== null) {
        // Handle case where it might be a single object
        teamJourney = [oldResponse.radiance_ai_team_journey_overview];
      }
    } else {
      // Create journey from old format fields
      // Add entries for each role that might have been in the old format
      teamJourney.push({
        role: "General Physician AI (Radiance AI)",
        summary_of_assessment: "Assessment based on reported symptoms and medical history."
      });

      if (oldResponse.potential_diagnoses &&
          (Array.isArray(oldResponse.potential_diagnoses) ? oldResponse.potential_diagnoses.length > 0 : true)) {
        teamJourney.push({
          role: "Specialist Doctor AI (Radiance AI)",
          summary_of_assessment: `Considered potential diagnoses including: ${Array.isArray(oldResponse.potential_diagnoses)
            ? oldResponse.potential_diagnoses.join(', ')
            : oldResponse.potential_diagnoses}`
        });
      }

      if (oldResponse.recommended_tests &&
          (Array.isArray(oldResponse.recommended_tests) ? oldResponse.recommended_tests.length > 0 : true)) {
        teamJourney.push({
          role: "Pathologist AI (Radiance AI)",
          summary_of_insights: `Recommended tests: ${Array.isArray(oldResponse.recommended_tests)
            ? oldResponse.recommended_tests.join(', ')
            : oldResponse.recommended_tests}`
        });
      }

      // Check for dietary recommendations in various possible locations
      const hasDietaryRecommendations =
        oldResponse.dietary_recommendations ||
        (oldResponse.dietary_recommendations?.foods_to_include &&
         (Array.isArray(oldResponse.dietary_recommendations.foods_to_include) ?
          oldResponse.dietary_recommendations.foods_to_include.length > 0 : true)) ||
        (oldResponse.dietary_recommendations?.foods_to_avoid &&
         (Array.isArray(oldResponse.dietary_recommendations.foods_to_avoid) ?
          oldResponse.dietary_recommendations.foods_to_avoid.length > 0 : true)) ||
        (oldResponse.foods_to_include &&
         (Array.isArray(oldResponse.foods_to_include) ?
          oldResponse.foods_to_include.length > 0 : true)) ||
        (oldResponse.foods_to_avoid &&
         (Array.isArray(oldResponse.foods_to_avoid) ?
          oldResponse.foods_to_avoid.length > 0 : true));

      if (hasDietaryRecommendations) {
        teamJourney.push({
          role: "Nutritionist AI (Radiance AI)",
          summary_of_recommendations: "Provided dietary recommendations based on health status."
        });
      }

      // Check for medication guidance in various possible locations
      const hasMedicationGuidance =
        oldResponse.medication_guidance ||
        (oldResponse.medication_guidance?.current_medications &&
         (Array.isArray(oldResponse.medication_guidance.current_medications) ?
          oldResponse.medication_guidance.current_medications.length > 0 : true)) ||
        (oldResponse.medication_guidance?.medications_to_avoid &&
         (Array.isArray(oldResponse.medication_guidance.medications_to_avoid) ?
          oldResponse.medication_guidance.medications_to_avoid.length > 0 : true)) ||
        (oldResponse.current_medications &&
         (Array.isArray(oldResponse.current_medications) ?
          oldResponse.current_medications.length > 0 : true)) ||
        (oldResponse.medications_to_avoid &&
         (Array.isArray(oldResponse.medications_to_avoid) ?
          oldResponse.medications_to_avoid.length > 0 : true));

      if (hasMedicationGuidance) {
        teamJourney.push({
          role: "Pharmacist AI (Radiance AI)",
          summary_of_guidance: "Provided guidance on medications and potential interactions."
        });
      }

      if (oldResponse.follow_up_plan) {
        teamJourney.push({
          role: "Follow-up Specialist AI (Radiance AI)",
          summary_of_advice: "Provided guidance on follow-up care and monitoring."
        });
      }
    }

    // Create key takeaways from old format
    let keyTakeaways = [
      "Follow your healthcare provider's advice for your specific condition.",
      "Maintain a healthy lifestyle with proper nutrition and regular exercise as appropriate.",
      "Keep track of your symptoms and report any changes to your healthcare provider."
    ];

    // Check if key_takeaways_and_recommendations_for_patient exists and is an array
    if (oldResponse.key_takeaways_and_recommendations_for_patient) {
      if (Array.isArray(oldResponse.key_takeaways_and_recommendations_for_patient)) {
        keyTakeaways = oldResponse.key_takeaways_and_recommendations_for_patient;
      } else if (typeof oldResponse.key_takeaways_and_recommendations_for_patient === 'string') {
        // Handle case where it might be a string
        keyTakeaways = [oldResponse.key_takeaways_and_recommendations_for_patient];
      }
    } else {
      // Create takeaways from old format fields
      const customTakeaways = [];

      if (oldResponse.summary_of_condition) {
        customTakeaways.push(`Primary Concern: ${oldResponse.summary_of_condition}`);
      }

      if (oldResponse.follow_up_plan?.specialist_referral) {
        customTakeaways.push(`Specialist Consultation: ${oldResponse.follow_up_plan.specialist_referral}`);
      }

      // Check for medications to avoid in various possible locations
      const medicationsToAvoid = oldResponse.medication_guidance?.medications_to_avoid || oldResponse.medications_to_avoid;

      if (medicationsToAvoid && (Array.isArray(medicationsToAvoid) ? medicationsToAvoid.length > 0 : true)) {
        customTakeaways.push(`Medication Caution: Be aware of medications to avoid, including ${
          Array.isArray(medicationsToAvoid) ? medicationsToAvoid.join(', ') : medicationsToAvoid
        }`);
      }

      if (oldResponse.urgent_care_indicators && oldResponse.urgent_care_indicators.length > 0) {
        customTakeaways.push(`Urgent Care: Seek immediate medical attention for ${Array.isArray(oldResponse.urgent_care_indicators)
          ? oldResponse.urgent_care_indicators.join(', ')
          : oldResponse.urgent_care_indicators}`);
      }

      // Use custom takeaways if we have enough
      if (customTakeaways.length >= 3) {
        keyTakeaways = customTakeaways;
      }
    }

    // Return the adapted format
    return {
      report_title: "Radiance AI Health Insight Report",
      report_generated_for: patientName,
      report_date: typeof oldResponse.date_of_report === 'string'
        ? oldResponse.date_of_report
        : new Date().toISOString().split('T')[0],
      introduction: "This report summarizes the insights generated by the Radiance AI multi-specialist team based on the information you provided. It is intended for informational purposes and to support your discussions with healthcare professionals.",

      patient_information_summary: {
        name: patientName,
        age: patientAge,
        gender: patientGender,
        location: typeof oldResponse.location?.city === 'string' && typeof oldResponse.location?.state === 'string'
          ? `${oldResponse.location.city}, ${oldResponse.location.state}`
          : "Not specified",
        key_symptoms_reported: Array.isArray(oldResponse.current_symptoms)
          ? oldResponse.current_symptoms
          : ["Symptoms not specified"],
        symptom_duration: "Not specified",
        relevant_medical_history: medicalHistory,
        bmi_status: "Not specified"
      },

      radiance_ai_team_journey_overview: teamJourney,

      key_takeaways_and_recommendations_for_patient: keyTakeaways,

      final_disclaimer_from_radiance_ai: typeof oldResponse.disclaimer === 'string'
        ? oldResponse.disclaimer
        : "This comprehensive Health Insight Report by Radiance AI is for informational and educational purposes only. It DOES NOT constitute medical advice, diagnosis, or treatment. The information provided is based on the data you submitted and the automated analysis of our AI team. Always consult with a qualified human healthcare professional for any health concerns or before making any decisions related to your health or treatment. Share this report with your doctor to facilitate your discussion. Radiance AI is committed to empowering individuals with information but prioritizes patient safety and the irreplaceable role of human medical expertise."
    };
  };

  // Parse the response from the session or streaming content
  useEffect(() => {
    try {
      // First priority: use the stored response if available
      if (currentSession?.summarizer_response) {
        // Check if the response is already a parsed object
        if (typeof currentSession.summarizer_response === 'object' &&
            currentSession.summarizer_response !== null) {
          setParsedResponse(adaptResponseFormat(currentSession.summarizer_response));
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
              setParsedResponse(adaptResponseFormat(parsed));
              return;
            } catch {
              // Failed to parse JSON from code block
            }
          }

          // Try to parse the entire content as JSON
          try {
            const parsed = JSON.parse(streamingContent.summarizer);
            setParsedResponse(adaptResponseFormat(parsed));
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

              {/* Patient Information Summary */}
              {parsedResponse?.patient_information_summary && (
                <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-medium">Patient Information</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{parsedResponse.patient_information_summary.name || "Not specified"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Age:</span>
                        <span>{parsedResponse.patient_information_summary.age || "Not specified"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gender:</span>
                        <span>{parsedResponse.patient_information_summary.gender || "Not specified"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span>{parsedResponse.patient_information_summary.location || "Not specified"}</span>
                      </div>
                      {parsedResponse.patient_information_summary.bmi_status &&
                       parsedResponse.patient_information_summary.bmi_status !== "Not specified" && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">BMI Status:</span>
                          <span>{parsedResponse.patient_information_summary.bmi_status}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-muted-foreground mb-1">Key Symptoms:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          {Array.isArray(parsedResponse.patient_information_summary.key_symptoms_reported) ?
                            parsedResponse.patient_information_summary.key_symptoms_reported.map((symptom, index) => (
                              <li key={index} className="text-sm">{symptom}</li>
                            )) :
                            <li className="text-sm">Symptoms not specified</li>
                          }
                        </ul>
                      </div>

                      {parsedResponse.patient_information_summary.symptom_duration &&
                       parsedResponse.patient_information_summary.symptom_duration !== "Not specified" && (
                        <div>
                          <p className="text-muted-foreground mb-1">Symptom Duration:</p>
                          <p className="text-sm">{parsedResponse.patient_information_summary.symptom_duration}</p>
                        </div>
                      )}

                      {Array.isArray(parsedResponse.patient_information_summary.relevant_medical_history) &&
                       parsedResponse.patient_information_summary.relevant_medical_history.length > 0 && (
                        <div>
                          <p className="text-muted-foreground mb-1">Medical History:</p>
                          <ul className="list-disc pl-5 space-y-1">
                            {parsedResponse.patient_information_summary.relevant_medical_history.map((condition, index) => (
                              <li key={index} className="text-sm">{condition}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 p-1 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50">
                  <TabsTrigger value="overview" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <User className="h-3.5 w-3.5 mr-1.5" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="journey" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                    AI Team Journey
                  </TabsTrigger>
                  <TabsTrigger value="takeaways" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                    Key Takeaways
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
                  {parsedResponse ? (
                    <HealthInsightReport
                      report={{
                        report_title: parsedResponse.report_title || "Radiance AI Health Insight Report",
                        report_date: parsedResponse.report_date || new Date().toLocaleDateString(),
                        report_generated_for: parsedResponse.report_generated_for || "Patient",

                        // Patient information
                        age: parsedResponse.patient_information_summary?.age || "Not specified",
                        gender: parsedResponse.patient_information_summary?.gender || "Not specified",
                        patient_name: parsedResponse.patient_information_summary?.name || "Patient",

                        // Introduction and disclaimer
                        introduction: parsedResponse.introduction,
                        disclaimer: parsedResponse.final_disclaimer_from_radiance_ai,

                        // Primary concerns from key takeaways
                        primary_concerns: parsedResponse.key_takeaways_and_recommendations_for_patient || [],

                        // Extract recommended tests from team journey
                        recommended_tests: parsedResponse.radiance_ai_team_journey_overview
                          ?.find(role => role.role.includes("Pathologist"))?.summary_of_insights?.split(': ')[1]?.split(', ') || [],

                        // Extract medication guidance from team journey
                        medication_guidance: {
                          current_medications: [],
                          medications_to_avoid: [],
                          potential_medications: []
                        },

                        // Extract potential diagnoses from team journey
                        potential_diagnoses: parsedResponse.radiance_ai_team_journey_overview
                          ?.find(role => role.role.includes("Specialist"))?.summary_of_assessment?.split(': ')[1]?.split(', ')
                          .map(diag => ({
                            name: diag,
                            description: '',
                            confidence_level: '',
                            symptoms_matched: [],
                            symptoms_not_matched: []
                          })) || [],

                        // Summary from patient information
                        condition_summary: parsedResponse.patient_information_summary?.key_symptoms_reported?.join(', ') || '',

                        // Urgent care indicators
                        urgent_care_indicators: {
                          present: parsedResponse.key_takeaways_and_recommendations_for_patient?.some(item => item.includes("Urgent Care")) || false,
                          indicators: parsedResponse.key_takeaways_and_recommendations_for_patient
                            ?.filter(item => item.includes("Urgent Care"))
                            .map(item => item.split(': ')[1]) || []
                        },

                        // Dietary and lifestyle recommendations
                        dietary_recommendations: {
                          foods_to_include: [],
                          foods_to_avoid: []
                        },
                        lifestyle_recommendations: [],

                        // Follow-up plan
                        follow_up_plan: {
                          timeline: "As recommended by your healthcare provider",
                          specialist_referral: parsedResponse.key_takeaways_and_recommendations_for_patient
                            ?.find(item => item.includes("Specialist Consultation"))?.split(': ')[1] || "As needed",
                          documentation_needed: "Medical records"
                        }
                      }}
                    />
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

                {/* AI Team Journey Tab */}
                <TabsContent value="journey" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
                  {parsedResponse?.radiance_ai_team_journey_overview &&
                   Array.isArray(parsedResponse.radiance_ai_team_journey_overview) &&
                   parsedResponse.radiance_ai_team_journey_overview.length > 0 ? (
                    <div className="space-y-4">
                      {parsedResponse.radiance_ai_team_journey_overview.map((role, index) => (
                        <motion.div
                          key={index}
                          className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            {role.role && role.role.includes("Medical Analyst") && <FileText className="h-4 w-4 text-primary" />}
                            {role.role && role.role.includes("General Physician") && <User className="h-4 w-4 text-primary" />}
                            {role.role && role.role.includes("Specialist") && <Stethoscope className="h-4 w-4 text-primary" />}
                            {role.role && role.role.includes("Pathologist") && <TestTube className="h-4 w-4 text-primary" />}
                            {role.role && role.role.includes("Nutritionist") && <Utensils className="h-4 w-4 text-primary" />}
                            {role.role && role.role.includes("Pharmacist") && <Pill className="h-4 w-4 text-primary" />}
                            {role.role && role.role.includes("Follow-up") && <Calendar className="h-4 w-4 text-primary" />}
                            <h3 className="text-sm font-medium">{role.role || "AI Role"}</h3>
                          </div>

                          <div className="pl-4 border-l-2 border-primary/20 text-sm">
                            {role.summary_of_findings && <p>{role.summary_of_findings}</p>}
                            {role.summary_of_assessment && <p>{role.summary_of_assessment}</p>}
                            {role.summary_of_insights && <p>{role.summary_of_insights}</p>}
                            {role.summary_of_recommendations && <p>{role.summary_of_recommendations}</p>}
                            {role.summary_of_guidance && <p>{role.summary_of_guidance}</p>}
                            {role.summary_of_advice && <p>{role.summary_of_advice}</p>}
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
                            <p className="font-medium text-primary">Compiling AI team journey...</p>
                            <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-6 w-6 text-muted-foreground/70" />
                          <p>No AI team journey information available</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Key Takeaways Tab */}
                <TabsContent value="takeaways" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
                  {parsedResponse?.key_takeaways_and_recommendations_for_patient &&
                   Array.isArray(parsedResponse.key_takeaways_and_recommendations_for_patient) &&
                   parsedResponse.key_takeaways_and_recommendations_for_patient.length > 0 ? (
                    <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <h3 className="text-sm font-medium">Key Takeaways & Recommendations</h3>
                      </div>

                      <ul className="space-y-3">
                        {parsedResponse.key_takeaways_and_recommendations_for_patient.map((takeaway, index) => (
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
                            <span>{takeaway}</span>
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
                            <p className="font-medium text-primary">Compiling key takeaways...</p>
                            <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle className="h-6 w-6 text-muted-foreground/70" />
                          <p>No key takeaways available</p>
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

                        {parsedResponse.dietary_recommendations ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Foods to Include */}
                          <div>
                            <p className="text-sm font-medium text-green-500 mb-2">Foods to Include</p>
                            {Array.isArray(parsedResponse.dietary_recommendations?.foods_to_include) &&
                             parsedResponse.dietary_recommendations.foods_to_include.length > 0 ? (
                              <ul className="list-disc pl-5 space-y-1">
                                {parsedResponse.dietary_recommendations.foods_to_include.map((food, index) => (
                                  <li key={index} className="text-sm">{food}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-muted-foreground">No specific foods to include recommended</p>
                            )}
                          </div>

                          {/* Foods to Avoid */}
                          <div>
                            <p className="text-sm font-medium text-amber-500 mb-2">Foods to Avoid</p>
                            {Array.isArray(parsedResponse.dietary_recommendations?.foods_to_avoid) &&
                             parsedResponse.dietary_recommendations.foods_to_avoid.length > 0 ? (
                              <ul className="list-disc pl-5 space-y-1">
                                {parsedResponse.dietary_recommendations.foods_to_avoid.map((food, index) => (
                                  <li key={index} className="text-sm">{food}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-muted-foreground">No specific foods to avoid recommended</p>
                            )}
                          </div>
                        </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No dietary recommendations available</p>
                        )}
                      </div>

                      {/* Lifestyle Recommendations */}
                      <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <Activity className="h-4 w-4 text-primary" />
                          <h3 className="text-sm font-medium">Lifestyle Recommendations</h3>
                        </div>

                        <div className="space-y-2">
                          {Array.isArray(parsedResponse.lifestyle_recommendations) &&
                           parsedResponse.lifestyle_recommendations.length > 0 ? (
                            parsedResponse.lifestyle_recommendations.map((recommendation, index) => (
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
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No specific lifestyle recommendations available</p>
                          )}
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
              {parsedResponse?.final_disclaimer_from_radiance_ai && (
                <div className="bg-card/80 p-4 rounded-lg border border-border/50 text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Disclaimer:</p>
                  <p>{parsedResponse.final_disclaimer_from_radiance_ai}</p>
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
