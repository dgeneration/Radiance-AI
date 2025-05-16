"use client";

import React, { useState, useEffect } from 'react';
import { useChainDiagnosis } from '@/contexts/chain-diagnosis-context';
// Define the response type based on the provided JSON
interface NewNutritionistResponse {
  patient_id: string;
  name: string;
  age: number;
  gender: string;
  location: {
    city: string;
    state: string;
    country: string;
    zip_code: string;
  };
  medical_conditions: string[];
  current_symptoms: string[];
  current_medications: string[];
  dietary_preference: string;
  specialist_direction: string;
  potential_diagnoses: string[];
  nutrition_recommendations: string[];
  foods_to_include: string[];
  foods_to_avoid: string[];
  lifestyle_tips: string[];
  notes: string;
  disclaimer?: string; // Keep this for backward compatibility
}
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, AlertCircle, CheckCircle,
  Activity, ClipboardList, AlertTriangle,
  ChevronDown, ChevronUp, Apple, Utensils,
  Salad, User, Stethoscope
} from 'lucide-react';
import { AnimatedSection, AnimatedIcon } from '@/components/animations';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NutritionistViewProps {
  isActive: boolean;
  onContinue: () => void;
  isLastRole?: boolean;
}

export function NutritionistView({ isActive, onContinue, isLastRole = false }: NutritionistViewProps) {
  const {
    currentSession,
    streamingContent,
    isStreaming,
    isLoading,
    error
  } = useChainDiagnosis();

  const [parsedResponse, setParsedResponse] = useState<NewNutritionistResponse | null>(null);
  const [activeTab, setActiveTab] = useState('recommendations');
  const [isExpanded, setIsExpanded] = useState(isLastRole);

  // Helper function to adapt old response format to new format
  const adaptResponseFormat = (response: unknown): NewNutritionistResponse => {
    // Type guard to check if it's already in the new format
    if (typeof response === 'object' && response !== null &&
        'patient_id' in response && 'name' in response) {
      return response as NewNutritionistResponse;
    }

    // Cast to a generic object for safety
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const oldResponse = response as Record<string, any>;

    // Extract arrays safely
    const medicalConditions = Array.isArray(oldResponse.medical_conditions)
      ? oldResponse.medical_conditions
      : [];

    const currentSymptoms = Array.isArray(oldResponse.current_symptoms)
      ? oldResponse.current_symptoms
      : [];

    const currentMedications = Array.isArray(oldResponse.current_medications)
      ? oldResponse.current_medications
      : [];

    const potentialDiagnoses = Array.isArray(oldResponse.potential_diagnoses)
      ? oldResponse.potential_diagnoses
      : [];

    const nutritionRecommendations = Array.isArray(oldResponse.nutrition_recommendations)
      ? oldResponse.nutrition_recommendations
      : [];

    const foodsToInclude = Array.isArray(oldResponse.foods_to_include)
      ? oldResponse.foods_to_include
      : [];

    const foodsToAvoid = Array.isArray(oldResponse.foods_to_avoid)
      ? oldResponse.foods_to_avoid
      : [];

    const lifestyleTips = Array.isArray(oldResponse.lifestyle_tips)
      ? oldResponse.lifestyle_tips
      : [];

    // Return the adapted format with default values for required fields
    return {
      patient_id: oldResponse.patient_id || "unknown",
      name: oldResponse.name || "Patient",
      age: typeof oldResponse.age === 'number' ? oldResponse.age : 0,
      gender: oldResponse.gender || "Not specified",
      location: {
        city: oldResponse.location?.city || "Unknown",
        state: oldResponse.location?.state || "Unknown",
        country: oldResponse.location?.country || "Unknown",
        zip_code: oldResponse.location?.zip_code || "Unknown"
      },
      medical_conditions: medicalConditions,
      current_symptoms: currentSymptoms,
      current_medications: currentMedications,
      dietary_preference: oldResponse.dietary_preference || "Not specified",
      specialist_direction: oldResponse.specialist_direction || "",
      potential_diagnoses: potentialDiagnoses,
      nutrition_recommendations: nutritionRecommendations,
      foods_to_include: foodsToInclude,
      foods_to_avoid: foodsToAvoid,
      lifestyle_tips: lifestyleTips,
      notes: oldResponse.notes || "",
      disclaimer: oldResponse.disclaimer || "This information is for guidance only and does not replace professional medical advice."
    };
  };

  // Parse the response from the session or streaming content
  useEffect(() => {
    try {
      // First priority: use the stored response if available
      if (currentSession?.nutritionist_response) {
        // Check if the response is already a parsed object
        if (typeof currentSession.nutritionist_response === 'object' &&
            currentSession.nutritionist_response !== null) {
          setParsedResponse(adaptResponseFormat(currentSession.nutritionist_response));
          return;
        }
      }

      // Second priority: try to parse streaming content if available
      if (streamingContent.nutritionist) {
        try {
          // Try to extract JSON from the content
          const jsonMatch = streamingContent.nutritionist.match(/```json\s*([\s\S]*?)\s*```/);

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
            const parsed = JSON.parse(streamingContent.nutritionist);
            setParsedResponse(adaptResponseFormat(parsed));
            return;
          } catch {
            // Failed to parse entire content as JSON
          }

          // If we get here, try to extract any JSON-like structure
          const jsonLikeMatch = streamingContent.nutritionist.match(/(\{[\s\S]*\})/);
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
      // Error in nutritionist response parsing
    }
  }, [streamingContent.nutritionist, currentSession?.nutritionist_response]);

  // If we're still loading and have no parsed response, show a loading state
  if (isLoading && !parsedResponse && isActive) {
    return (
      <AnimatedSection>
        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-full">
                <Apple className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Nutritionist AI</CardTitle>
                <CardDescription>
                  Analyzing dietary and nutritional needs
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium mb-2">Analyzing Nutritional Needs</p>
              <p className="text-muted-foreground text-center max-w-md">
                The Nutritionist AI is carefully reviewing your health metrics and medical context to provide dietary recommendations.
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
                  There was an error processing the Nutritionist analysis
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
                  icon={<Apple className="h-5 w-5" />}
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
                      Nutritionist AI
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full ml-2">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                  <CardDescription className="text-sm">
                    {isStreaming && isActive
                      ? "Analyzing dietary and nutritional needs..."
                      : "Dietary recommendations for your condition"}
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
              {/* Patient Overview */}
              <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium">Patient Overview</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    {parsedResponse?.name && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{parsedResponse.name}</span>
                      </div>
                    )}
                    {parsedResponse?.age && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Age:</span>
                        <span>{parsedResponse.age} years</span>
                      </div>
                    )}
                    {parsedResponse?.gender && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gender:</span>
                        <span>{parsedResponse.gender}</span>
                      </div>
                    )}
                    {parsedResponse?.location && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span>{parsedResponse.location.city}, {parsedResponse.location.state}</span>
                      </div>
                    )}
                    {parsedResponse?.dietary_preference && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dietary Preference:</span>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          {parsedResponse.dietary_preference}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {parsedResponse?.medical_conditions && parsedResponse.medical_conditions.length > 0 && (
                      <div>
                        <p className="text-muted-foreground mb-1">Medical Conditions:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          {parsedResponse.medical_conditions.map((condition, index) => (
                            <li key={index} className="text-sm">{condition}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {parsedResponse?.current_medications && parsedResponse.current_medications.length > 0 && (
                      <div>
                        <p className="text-muted-foreground mb-1">Current Medications:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          {parsedResponse.current_medications.map((medication, index) => (
                            <li key={index} className="text-sm">{medication}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Potential Diagnoses */}
              {parsedResponse?.potential_diagnoses && parsedResponse.potential_diagnoses.length > 0 && (
                <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Stethoscope className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-medium">Potential Diagnoses</h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {parsedResponse.potential_diagnoses.map((diagnosis, index) => (
                      <Badge key={index} variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                        {diagnosis}
                      </Badge>
                    ))}
                  </div>

                  {parsedResponse?.specialist_direction && (
                    <div className="mt-3 text-sm text-muted-foreground">
                      <p className="italic">{parsedResponse.specialist_direction}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tabs for different sections */}
              <Tabs defaultValue="recommendations" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 p-1 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50">
                  <TabsTrigger value="recommendations" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                    Recommendations
                  </TabsTrigger>
                  <TabsTrigger value="foods" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <Utensils className="h-3.5 w-3.5 mr-1.5" />
                    Foods
                  </TabsTrigger>
                  <TabsTrigger value="lifestyle" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <Activity className="h-3.5 w-3.5 mr-1.5" />
                    Lifestyle
                  </TabsTrigger>
                </TabsList>

                {/* Nutrition Recommendations Tab */}
                <TabsContent value="recommendations" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
                  {parsedResponse?.nutrition_recommendations && parsedResponse.nutrition_recommendations.length > 0 ? (
                    <div className="space-y-3">
                      {parsedResponse.nutrition_recommendations.map((recommendation, index) => {
                        // Split the recommendation into title and description
                        const parts = recommendation.split(': ');
                        const title = parts[0];
                        const description = parts.length > 1 ? parts.slice(1).join(': ') : '';

                        return (
                          <motion.div
                            key={index}
                            className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                          >
                            <div className="flex gap-3">
                              <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium">{title}</p>
                                {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
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
                            <p className="font-medium text-primary">Preparing nutrition recommendations...</p>
                            <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <ClipboardList className="h-6 w-6 text-muted-foreground/70" />
                          <p>No nutrition recommendations available</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Foods Tab */}
                <TabsContent value="foods" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Foods to Include */}
                    {parsedResponse?.foods_to_include && parsedResponse.foods_to_include.length > 0 ? (
                      <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <Salad className="h-4 w-4 text-green-500" />
                          <h3 className="text-sm font-medium text-green-500">Foods to Include</h3>
                        </div>

                        <ul className="list-disc pl-5 space-y-1">
                          {parsedResponse.foods_to_include.map((food, index) => (
                            <motion.li
                              key={index}
                              className="text-sm"
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                              {food}
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm flex flex-col items-center justify-center py-6">
                        <Salad className="h-6 w-6 text-muted-foreground/70 mb-2" />
                        <p className="text-sm text-muted-foreground">No foods to include available</p>
                      </div>
                    )}

                    {/* Foods to Avoid */}
                    {parsedResponse?.foods_to_avoid && parsedResponse.foods_to_avoid.length > 0 ? (
                      <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <h3 className="text-sm font-medium text-amber-500">Foods to Avoid</h3>
                        </div>

                        <ul className="list-disc pl-5 space-y-1">
                          {parsedResponse.foods_to_avoid.map((food, index) => (
                            <motion.li
                              key={index}
                              className="text-sm"
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                              {food}
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm flex flex-col items-center justify-center py-6">
                        <AlertTriangle className="h-6 w-6 text-muted-foreground/70 mb-2" />
                        <p className="text-sm text-muted-foreground">No foods to avoid available</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Lifestyle Tips Tab */}
                <TabsContent value="lifestyle" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
                  {parsedResponse?.lifestyle_tips && parsedResponse.lifestyle_tips.length > 0 ? (
                    <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <Activity className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-medium">Lifestyle Tips</h3>
                      </div>

                      <ul className="space-y-3">
                        {parsedResponse.lifestyle_tips.map((tip, index) => (
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
                            <span>{tip}</span>
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
                            <p className="font-medium text-primary">Preparing lifestyle tips...</p>
                            <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Activity className="h-6 w-6 text-muted-foreground/70" />
                          <p>No lifestyle tips available</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Notes */}
              {parsedResponse?.notes && (
                <div className="bg-card/80 p-4 rounded-lg border border-border/50 text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Important Notes:</p>
                  <p>{parsedResponse.notes}</p>
                </div>
              )}

              {/* Disclaimer (for backward compatibility) */}
              {parsedResponse?.disclaimer && (
                <div className="bg-card/80 p-4 rounded-lg border border-border/50 text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Disclaimer:</p>
                  <p>{parsedResponse.disclaimer}</p>
                </div>
              )}
            </CardContent>
          </motion.div>
          
          {!currentSession?.pharmacist_response && (
          <CardFooter>
            {/* Only show the continue button if there's a Nutritionist response and no Pharmacist response yet */}
            {currentSession?.nutritionist_response && !currentSession?.pharmacist_response ? (
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
                  "Continue to Pharmacist"
                )}
              </Button>
            ) : (
              <div className="w-full p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-center">
                <p className="text-sm text-amber-500">
                  {isLoading || isStreaming ? "Processing nutritionist assessment..." : "Waiting for Nutritionist response..."}
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
