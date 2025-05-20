"use client";

import React, { useState, useEffect } from 'react';
import { useChainDiagnosis } from '@/contexts/diagnosis-context';
// Define the response type based on the updated system prompt JSON structure
interface NewPharmacistResponse {
  role_name: string;
  patient_medication_profile_review: {
    allergies: string;
    current_medications: string;
    current_conditions_relevant_to_meds: string;
  };
  medication_classes_potentially_relevant: {
    medication_class: string;
    context: string;
    alternative_examples_due_to_allergy?: string[];
    general_administration_notes: string;
    common_class_side_effects: string[];
    types?: {
      name: string;
      notes: string;
    }[];
  }[];
  key_pharmacological_considerations: string[];
  reference_data_for_next_role: {
    pharmacist_summary: string;
    allergy_alert: string;
  };
  disclaimer: string;
}
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, AlertCircle, CheckCircle,
  ChevronDown, ChevronUp, Pill, ShieldAlert,
  ClipboardList
} from 'lucide-react';
import { AnimatedSection, AnimatedIcon } from '@/components/animations';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PharmacistViewProps {
  isActive: boolean;
  onContinue: () => void;
  isLastRole?: boolean;
}

export function PharmacistView({ isActive, onContinue, isLastRole = false }: PharmacistViewProps) {
  const {
    currentSession,
    streamingContent,
    isStreaming,
    isLoading,
    error
  } = useChainDiagnosis();

  const [parsedResponse, setParsedResponse] = useState<NewPharmacistResponse | null>(null);
  const [activeTab, setActiveTab] = useState('medications');
  const [isExpanded, setIsExpanded] = useState(isLastRole);

  // Helper function to adapt old response format to new format
  const adaptResponseFormat = (response: unknown): NewPharmacistResponse => {
    // Type guard to check if it's already in the new format
    if (typeof response === 'object' && response !== null &&
        'role_name' in response &&
        'patient_medication_profile_review' in response &&
        'medication_classes_potentially_relevant' in response &&
        'key_pharmacological_considerations' in response) {
      return response as NewPharmacistResponse;
    }

    // Cast to a generic object for safety
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const oldResponse = response as Record<string, any>;

    // Create default values for required fields
    const medicationClasses: NewPharmacistResponse['medication_classes_potentially_relevant'] = [];
    const keyConsiderations: string[] = [];

    // Try to extract data from old format if available
    // Convert old potential_medications to new medication_classes_potentially_relevant
    if (Array.isArray(oldResponse.potential_medications)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      oldResponse.potential_medications.forEach((med: Record<string, any>) => {
        medicationClasses.push({
          medication_class: typeof med.class === 'string' ? med.class : "Not specified",
          context: typeof med.indication === 'string' ? med.indication : "Not specified",
          general_administration_notes: typeof med.notes === 'string' ? med.notes : "Take as directed by your healthcare provider.",
          common_class_side_effects: ["Common side effects may include nausea, dizziness, or headache."],
        });
      });
    }

    // Convert old medications_to_avoid to key_pharmacological_considerations
    if (Array.isArray(oldResponse.medications_to_avoid)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      oldResponse.medications_to_avoid.forEach((med: Record<string, any>) => {
        if (typeof med.name === 'string' && typeof med.reason === 'string') {
          keyConsiderations.push(`Avoid ${med.name}: ${med.reason}`);
        }
      });
    }

    // Convert old allergy_considerations to patient_medication_profile_review.allergies
    let allergiesText = "None reported";
    if (Array.isArray(oldResponse.allergy_considerations) && oldResponse.allergy_considerations.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allergens = oldResponse.allergy_considerations.map((allergy: Record<string, any>) =>
        typeof allergy.allergen === 'string' ? allergy.allergen : "Unknown allergen"
      );
      allergiesText = allergens.join(", ");
    }

    // Convert old general_advice to key_pharmacological_considerations
    if (Array.isArray(oldResponse.general_advice)) {
      oldResponse.general_advice.forEach((advice: string) => {
        if (typeof advice === 'string') {
          keyConsiderations.push(advice);
        }
      });
    }

    // Return the adapted format
    return {
      role_name: "Pharmacist AI (Radiance AI)",
      patient_medication_profile_review: {
        allergies: allergiesText,
        current_medications: "None reported in old format",
        current_conditions_relevant_to_meds: "Not specified in old format"
      },
      medication_classes_potentially_relevant: medicationClasses,
      key_pharmacological_considerations: keyConsiderations,
      reference_data_for_next_role: {
        pharmacist_summary: "Medication information adapted from old format",
        allergy_alert: allergiesText
      },
      disclaimer: typeof oldResponse.disclaimer === 'string'
        ? oldResponse.disclaimer
        : "This information is for guidance only and does not replace professional medical advice. Always consult your doctor or pharmacist for specific medication guidance, dosages, and to discuss your full medical history and allergies. Radiance AI."
    };
  };

  // Parse the response from the session or streaming content
  useEffect(() => {
    try {
      // First priority: use the stored response if available
      if (currentSession?.pharmacist_response) {
        // Check if the response is already a parsed object
        if (typeof currentSession.pharmacist_response === 'object' &&
            currentSession.pharmacist_response !== null) {
          setParsedResponse(adaptResponseFormat(currentSession.pharmacist_response));
          return;
        }
      }

      // Second priority: try to parse streaming content if available
      if (streamingContent.pharmacist) {
        try {
          // Try to extract JSON from the content
          const jsonMatch = streamingContent.pharmacist.match(/```json\s*([\s\S]*?)\s*```/);

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
            const parsed = JSON.parse(streamingContent.pharmacist);
            setParsedResponse(adaptResponseFormat(parsed));
            return;
          } catch {
            // Failed to parse entire content as JSON
          }

          // If we get here, try to extract any JSON-like structure
          const jsonLikeMatch = streamingContent.pharmacist.match(/(\{[\s\S]*\})/);
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
      // Error in pharmacist response parsing
    }
  }, [streamingContent.pharmacist, currentSession?.pharmacist_response]);

  // If we're still loading and have no parsed response, show a loading state
  if (isLoading && !parsedResponse && isActive) {
    return (
      <AnimatedSection>
        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-full">
                <Pill className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Pharmacist AI</CardTitle>
                <CardDescription>
                  Analyzing medication options and considerations
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium mb-2">Analyzing Medication Options</p>
              <p className="text-muted-foreground text-center max-w-md">
                The Pharmacist AI is carefully reviewing potential medications related to your condition and considering your allergies and medical history.
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
                  There was an error processing the Pharmacist analysis
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
                    icon={<Pill className="h-5 w-5" />}
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
                        Pharmacist AI
                      </CardTitle>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full ml-2">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                    <CardDescription className="text-sm">
                      {isStreaming && isActive
                        ? "Analyzing medication options and considerations..."
                        : "Medication information and guidance"}
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
              {/* Patient Medication Profile */}
              {parsedResponse?.patient_medication_profile_review && (
                <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldAlert className="h-4 w-4 text-amber-500" />
                    <h3 className="text-sm font-medium">Patient Medication Profile</h3>
                  </div>

                  <div className="space-y-3 text-sm">
                    {/* Allergies */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Allergies:</span>
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                          {parsedResponse.patient_medication_profile_review.allergies || "None reported"}
                        </Badge>
                      </div>
                    </div>

                    {/* Current Medications */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-start gap-2">
                        <span className="text-muted-foreground">Current Medications:</span>
                        <span className="flex-1">{parsedResponse.patient_medication_profile_review.current_medications || "None reported"}</span>
                      </div>
                    </div>

                    {/* Current Conditions */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-start gap-2">
                        <span className="text-muted-foreground">Current Conditions:</span>
                        <span className="flex-1">{parsedResponse.patient_medication_profile_review.current_conditions_relevant_to_meds || "None specified"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabs for different sections */}
              <Tabs defaultValue="medications" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-1 sm:grid-cols-3 p-1 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50">
                  <TabsTrigger value="medications" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <Pill className="h-3.5 w-3.5 mr-1.5" />
                    Medication Classes
                  </TabsTrigger>
                  <TabsTrigger value="considerations" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
                    Key Considerations
                  </TabsTrigger>
                  <TabsTrigger value="reference" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                    Reference Data
                  </TabsTrigger>
                </TabsList>

                {/* Medication Classes Tab */}
                <TabsContent value="medications" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
                  {parsedResponse?.medication_classes_potentially_relevant && parsedResponse.medication_classes_potentially_relevant.length > 0 ? (
                    <div className="space-y-4">
                      {parsedResponse.medication_classes_potentially_relevant.map((medicationClass, index) => (
                        <motion.div
                          key={index}
                          className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <Pill className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-medium">{medicationClass.medication_class}</h3>
                          </div>

                          <div className="space-y-3 text-sm">
                            {/* Context */}
                            <div className="pl-4 border-l-2 border-primary/20">
                              <p className="text-muted-foreground mb-1">Context:</p>
                              <p>{medicationClass.context}</p>
                            </div>

                            {/* Alternative Examples (if available) */}
                            {medicationClass.alternative_examples_due_to_allergy && medicationClass.alternative_examples_due_to_allergy.length > 0 && (
                              <div className="pl-4 border-l-2 border-amber-500/20">
                                <p className="text-muted-foreground mb-1">Alternative Examples (Due to Allergy):</p>
                                <ul className="list-disc pl-5 space-y-1">
                                  {medicationClass.alternative_examples_due_to_allergy.map((alt, altIndex) => (
                                    <li key={altIndex}>{alt}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Types (if available) */}
                            {medicationClass.types && medicationClass.types.length > 0 && (
                              <div className="pl-4 border-l-2 border-primary/20">
                                <p className="text-muted-foreground mb-1">Types:</p>
                                <div className="space-y-2">
                                  {medicationClass.types.map((type, typeIndex) => (
                                    <div key={typeIndex} className="bg-card/50 p-2 rounded border border-border/30">
                                      <p className="font-medium">{type.name}</p>
                                      <p className="text-sm text-muted-foreground">{type.notes}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Administration Notes */}
                            <div className="pl-4 border-l-2 border-primary/20">
                              <p className="text-muted-foreground mb-1">Administration Notes:</p>
                              <p>{medicationClass.general_administration_notes}</p>
                            </div>

                            {/* Side Effects */}
                            <div className="pl-4 border-l-2 border-amber-500/20">
                              <p className="text-muted-foreground mb-1">Common Side Effects:</p>
                              <ul className="list-disc pl-5 space-y-1">
                                {medicationClass.common_class_side_effects.map((effect, effectIndex) => (
                                  <li key={effectIndex}>{effect}</li>
                                ))}
                              </ul>
                            </div>
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
                            <p className="font-medium text-primary">Analyzing medication classes...</p>
                            <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Pill className="h-6 w-6 text-muted-foreground/70" />
                          <p>No medication classes available</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Key Considerations Tab */}
                <TabsContent value="considerations" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
                  {parsedResponse?.key_pharmacological_considerations && parsedResponse.key_pharmacological_considerations.length > 0 ? (
                    <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <ShieldAlert className="h-4 w-4 text-amber-500" />
                        <h3 className="text-sm font-medium">Key Pharmacological Considerations</h3>
                      </div>

                      <ul className="space-y-3">
                        {parsedResponse.key_pharmacological_considerations.map((consideration, index) => (
                          <motion.li
                            key={index}
                            className="flex items-start gap-2 text-sm"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                          >
                            <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                              {index + 1}
                            </div>
                            <span>{consideration}</span>
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
                            <p className="font-medium text-primary">Analyzing key considerations...</p>
                            <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <ShieldAlert className="h-6 w-6 text-muted-foreground/70" />
                          <p>No key considerations available</p>
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
                        <ClipboardList className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-medium">Reference Data for Next Role</h3>
                      </div>

                      <div className="space-y-4">
                        {/* Pharmacist Summary */}
                        <div className="pl-4 border-l-2 border-primary/20">
                          <p className="text-muted-foreground mb-1">Pharmacist Summary:</p>
                          <p className="text-sm">{parsedResponse.reference_data_for_next_role.pharmacist_summary}</p>
                        </div>

                        {/* Allergy Alert */}
                        <div className="pl-4 border-l-2 border-amber-500/20">
                          <p className="text-muted-foreground mb-1">Allergy Alert:</p>
                          <p className="text-sm text-amber-600">{parsedResponse.reference_data_for_next_role.allergy_alert}</p>
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
                            <p className="font-medium text-primary">Generating reference data...</p>
                            <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <ClipboardList className="h-6 w-6 text-muted-foreground/70" />
                          <p>No reference data available</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Disclaimer (for backward compatibility) */}
              {parsedResponse?.disclaimer && (
                <div className="bg-card/80 p-4 rounded-lg border border-border/50 text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Disclaimer:</p>
                  <p>{parsedResponse.disclaimer}</p>
                </div>
              )}
            </CardContent>
          </motion.div>
          {!currentSession?.follow_up_specialist_response && (
          <CardFooter>
            {/* Only show the continue button if there's a Pharmacist response and no Follow-up Specialist response yet */}
            {currentSession?.pharmacist_response && !currentSession?.follow_up_specialist_response ? (
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
                  "Continue to Follow-up Specialist"
                )}
              </Button>
            ) : (
              <div className="w-full p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-center">
                <p className="text-sm text-amber-500">
                  {isLoading || isStreaming ? "Processing pharmacist assessment..." : "Waiting for Pharmacist response..."}
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
