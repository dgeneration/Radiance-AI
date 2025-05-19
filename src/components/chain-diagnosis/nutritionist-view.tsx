"use client";

import React, { useState, useEffect } from 'react';
import { useChainDiagnosis } from '@/contexts/chain-diagnosis-context';
// Define the response type based on the system prompt JSON structure
interface NewNutritionistResponse {
  role_name: string;
  nutritional_assessment_overview: {
    bmi_status: string;
    dietary_preference: string;
    key_considerations_from_medical_context: string[];
  };
  general_dietary_goals: string[];
  dietary_recommendations: {
    foods_to_emphasize: {
      category: string;
      examples: string[];
    }[];
    foods_to_consider_limiting_during_illness: string[];
    meal_frequency_and_timing_tips: string[];
  };
  addressing_weight_concerns: string[];
  reference_data_for_next_role: {
    nutrition_summary: string;
    weight_concern_highlight: string;
  };
  disclaimer: string;
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
        'role_name' in response &&
        'nutritional_assessment_overview' in response &&
        'dietary_recommendations' in response) {
      return response as NewNutritionistResponse;
    }

    // Cast to a generic object for safety
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const oldResponse = response as Record<string, any>;

    // Create default values for required fields
    const nutritionalAssessment = {
      bmi_status: "Not specified",
      dietary_preference: oldResponse.dietary_preference || "Not specified",
      key_considerations_from_medical_context: []
    };

    // Convert old medical_conditions to key_considerations
    if (Array.isArray(oldResponse.medical_conditions) && oldResponse.medical_conditions.length > 0) {
      nutritionalAssessment.key_considerations_from_medical_context.push(
        `Medical conditions: ${oldResponse.medical_conditions.join(', ')}` as never
      );
    }

    // Convert old current_symptoms to key_considerations
    if (Array.isArray(oldResponse.current_symptoms) && oldResponse.current_symptoms.length > 0) {
      nutritionalAssessment.key_considerations_from_medical_context.push(
        `Current symptoms: ${oldResponse.current_symptoms.join(', ')}` as never
      );
    }

    // If no considerations were added, add a default one
    if (nutritionalAssessment.key_considerations_from_medical_context.length === 0) {
      nutritionalAssessment.key_considerations_from_medical_context.push("No specific medical considerations noted" as never);
    }

    // Convert old nutrition_recommendations to general_dietary_goals
    const generalDietaryGoals = Array.isArray(oldResponse.nutrition_recommendations)
      ? oldResponse.nutrition_recommendations
      : ["Maintain a balanced diet", "Stay hydrated", "Consume adequate protein"];

    // Convert old foods_to_include to foods_to_emphasize
    const foodsToEmphasize = [];
    if (Array.isArray(oldResponse.foods_to_include) && oldResponse.foods_to_include.length > 0) {
      foodsToEmphasize.push({
        category: "Recommended Foods",
        examples: oldResponse.foods_to_include
      });
    } else {
      foodsToEmphasize.push({
        category: "Nutrient-Dense Foods",
        examples: ["Fruits", "Vegetables", "Lean proteins", "Whole grains"]
      });
    }

    // Convert old foods_to_avoid to foods_to_consider_limiting
    const foodsToLimit = Array.isArray(oldResponse.foods_to_avoid)
      ? oldResponse.foods_to_avoid
      : ["Highly processed foods", "Excessive sugar", "Excessive salt"];

    // Convert old lifestyle_tips to addressing_weight_concerns
    const addressingWeightConcerns = Array.isArray(oldResponse.lifestyle_tips)
      ? oldResponse.lifestyle_tips
      : ["Focus on nutrient-dense foods", "Stay physically active as appropriate", "Maintain regular meal patterns"];

    // Return the adapted format
    return {
      role_name: "Nutritionist AI (Radiance AI)",
      nutritional_assessment_overview: nutritionalAssessment,
      general_dietary_goals: generalDietaryGoals,
      dietary_recommendations: {
        foods_to_emphasize: foodsToEmphasize,
        foods_to_consider_limiting_during_illness: foodsToLimit,
        meal_frequency_and_timing_tips: ["Eat regular meals", "Consider smaller, more frequent meals if appetite is low"]
      },
      addressing_weight_concerns: addressingWeightConcerns,
      reference_data_for_next_role: {
        nutrition_summary: "Nutritional information adapted from old format",
        weight_concern_highlight: "No specific weight concerns noted in old format"
      },
      disclaimer: oldResponse.disclaimer || "These are general nutritional guidelines for informational purposes and not a personalized meal plan. Consult with a registered dietitian or healthcare provider for tailored advice, especially considering your medical condition and weight status. Radiance AI."
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
              {/* Nutritional Assessment Overview */}
              <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium">Nutritional Assessment Overview</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    {parsedResponse?.nutritional_assessment_overview?.bmi_status && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">BMI Status:</span>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          {parsedResponse.nutritional_assessment_overview.bmi_status}
                        </Badge>
                      </div>
                    )}
                    {parsedResponse?.nutritional_assessment_overview?.dietary_preference && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dietary Preference:</span>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          {parsedResponse.nutritional_assessment_overview.dietary_preference}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {parsedResponse?.nutritional_assessment_overview?.key_considerations_from_medical_context &&
                     parsedResponse.nutritional_assessment_overview.key_considerations_from_medical_context.length > 0 && (
                      <div>
                        <p className="text-muted-foreground mb-1">Key Medical Considerations:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          {parsedResponse.nutritional_assessment_overview.key_considerations_from_medical_context.map((consideration, index) => (
                            <li key={index} className="text-sm">{consideration}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* General Dietary Goals */}
              {parsedResponse?.general_dietary_goals && parsedResponse.general_dietary_goals.length > 0 && (
                <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Stethoscope className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-medium">General Dietary Goals</h3>
                  </div>

                  <ul className="space-y-2">
                    {parsedResponse.general_dietary_goals.map((goal, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <span>{goal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tabs for different sections */}
              <Tabs defaultValue="foods" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 p-1 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50">
                  <TabsTrigger value="foods" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <Utensils className="h-3.5 w-3.5 mr-1.5" />
                    Foods
                  </TabsTrigger>
                  <TabsTrigger value="weight" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <Activity className="h-3.5 w-3.5 mr-1.5" />
                    Weight Concerns
                  </TabsTrigger>
                  <TabsTrigger value="reference" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                    Reference Data
                  </TabsTrigger>
                </TabsList>

                {/* Foods Tab */}
                <TabsContent value="foods" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
                  {parsedResponse?.dietary_recommendations ? (
                    <div className="space-y-6">
                      {/* Foods to Emphasize */}
                      {parsedResponse.dietary_recommendations.foods_to_emphasize &&
                       parsedResponse.dietary_recommendations.foods_to_emphasize.length > 0 && (
                        <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                            <Salad className="h-4 w-4 text-green-500" />
                            <h3 className="text-sm font-medium">Foods to Emphasize</h3>
                          </div>

                          <div className="space-y-4">
                            {parsedResponse.dietary_recommendations.foods_to_emphasize.map((category, index) => (
                              <motion.div
                                key={index}
                                className="pl-4 border-l-2 border-green-500/20"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                              >
                                <p className="text-sm font-medium mb-1">{category.category}</p>
                                <ul className="list-disc pl-5 space-y-1">
                                  {category.examples.map((example, exIndex) => (
                                    <li key={exIndex} className="text-sm text-muted-foreground">{example}</li>
                                  ))}
                                </ul>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Foods to Limit */}
                      {parsedResponse.dietary_recommendations.foods_to_consider_limiting_during_illness &&
                       parsedResponse.dietary_recommendations.foods_to_consider_limiting_during_illness.length > 0 && (
                        <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <h3 className="text-sm font-medium">Foods to Consider Limiting</h3>
                          </div>

                          <ul className="space-y-2">
                            {parsedResponse.dietary_recommendations.foods_to_consider_limiting_during_illness.map((food, index) => (
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
                                <span>{food}</span>
                              </motion.li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Meal Frequency and Timing Tips */}
                      {parsedResponse.dietary_recommendations.meal_frequency_and_timing_tips &&
                       parsedResponse.dietary_recommendations.meal_frequency_and_timing_tips.length > 0 && (
                        <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                            <ClipboardList className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-medium">Meal Frequency & Timing Tips</h3>
                          </div>

                          <ul className="space-y-2">
                            {parsedResponse.dietary_recommendations.meal_frequency_and_timing_tips.map((tip, index) => (
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
                            <p className="font-medium text-primary">Preparing dietary recommendations...</p>
                            <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Utensils className="h-6 w-6 text-muted-foreground/70" />
                          <p>No dietary recommendations available</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Weight Concerns Tab */}
                <TabsContent value="weight" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
                  {parsedResponse?.addressing_weight_concerns && parsedResponse.addressing_weight_concerns.length > 0 ? (
                    <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <Activity className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-medium">Addressing Weight Concerns</h3>
                      </div>

                      <ul className="space-y-3">
                        {parsedResponse.addressing_weight_concerns.map((concern, index) => (
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
                            <span>{concern}</span>
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
                            <p className="font-medium text-primary">Analyzing weight concerns...</p>
                            <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Activity className="h-6 w-6 text-muted-foreground/70" />
                          <p>No weight concerns information available</p>
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
                        {/* Nutrition Summary */}
                        <div className="pl-4 border-l-2 border-primary/20">
                          <p className="text-muted-foreground mb-1">Nutrition Summary:</p>
                          <p className="text-sm">{parsedResponse.reference_data_for_next_role.nutrition_summary}</p>
                        </div>

                        {/* Weight Concern Highlight */}
                        <div className="pl-4 border-l-2 border-amber-500/20">
                          <p className="text-muted-foreground mb-1">Weight Concern Highlight:</p>
                          <p className="text-sm text-amber-600">{parsedResponse.reference_data_for_next_role.weight_concern_highlight}</p>
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
