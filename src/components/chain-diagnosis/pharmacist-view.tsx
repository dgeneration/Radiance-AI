"use client";

import React, { useState, useEffect } from 'react';
import { useChainDiagnosis } from '@/contexts/chain-diagnosis-context';
import { PharmacistResponse } from '@/types/chain-diagnosis';

// Define the new response type based on the provided JSON
interface NewPharmacistResponse {
  potential_medications: {
    name: string;
    class: string;
    indication: string;
    notes: string;
  }[];
  medications_to_avoid: {
    name: string;
    reason: string;
  }[];
  allergy_considerations: {
    allergen: string;
    relevance: string;
  }[];
  general_advice: string[];
  disclaimer?: string; // Keep this for backward compatibility
}
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, AlertCircle, CheckCircle,
  Activity, FileText, ClipboardList, AlertTriangle,
  ChevronDown, ChevronUp, Pill, Stethoscope,
  Tablets, ShieldAlert
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

  // Parse the response from the session or streaming content
  useEffect(() => {
    try {
      // First priority: use the stored response if available
      if (currentSession?.pharmacist_response) {
        // Check if the response is already a parsed object
        if (typeof currentSession.pharmacist_response === 'object' &&
            currentSession.pharmacist_response !== null) {
          setParsedResponse(currentSession.pharmacist_response);
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
              setParsedResponse(parsed);
              return;
            } catch (e) {
              // Failed to parse JSON from code block
            }
          }

          // Try to parse the entire content as JSON
          try {
            const parsed = JSON.parse(streamingContent.pharmacist);
            setParsedResponse(parsed);
            return;
          } catch (e) {
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
              {/* Allergy Considerations */}
              {parsedResponse?.allergy_considerations && parsedResponse.allergy_considerations.length > 0 && (
                <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldAlert className="h-4 w-4 text-amber-500" />
                    <h3 className="text-sm font-medium">Allergy Considerations</h3>
                  </div>

                  <div className="space-y-3 text-sm">
                    {parsedResponse.allergy_considerations.map((allergy, index) => (
                      <div key={index} className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Allergen:</span>
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                            {allergy.allergen}
                          </Badge>
                        </div>
                        <div className="pl-4 border-l-2 border-amber-500/20 mt-1">
                          <p className="text-sm">{allergy.relevance}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabs for different sections */}
              <Tabs defaultValue="medications" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 p-1 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50">
                  <TabsTrigger value="medications" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <Pill className="h-3.5 w-3.5 mr-1.5" />
                    Potential Medications
                  </TabsTrigger>
                  <TabsTrigger value="avoid" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
                    Medications to Avoid
                  </TabsTrigger>
                  <TabsTrigger value="advice" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                    General Advice
                  </TabsTrigger>
                </TabsList>

                {/* Potential Medications Tab */}
                <TabsContent value="medications" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
                  {parsedResponse?.potential_medications && parsedResponse.potential_medications.length > 0 ? (
                    <div className="space-y-4">
                      {parsedResponse.potential_medications.map((medication, index) => (
                        <motion.div
                          key={index}
                          className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <Pill className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-medium">{medication.name}</h3>
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 ml-auto">
                              {medication.class}
                            </Badge>
                          </div>

                          <div className="space-y-3 text-sm">
                            {/* Indication */}
                            <div className="pl-4 border-l-2 border-primary/20">
                              <p className="text-muted-foreground mb-1">Indication:</p>
                              <p>{medication.indication}</p>
                            </div>

                            {/* Notes */}
                            <div className="pl-4 border-l-2 border-primary/20">
                              <p className="text-muted-foreground mb-1">Notes:</p>
                              <p>{medication.notes}</p>
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
                            <p className="font-medium text-primary">Analyzing medication options...</p>
                            <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Pill className="h-6 w-6 text-muted-foreground/70" />
                          <p>No potential medications available</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Medications to Avoid Tab */}
                <TabsContent value="avoid" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
                  {parsedResponse?.medications_to_avoid && parsedResponse.medications_to_avoid.length > 0 ? (
                    <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <ShieldAlert className="h-4 w-4 text-red-500" />
                        <h3 className="text-sm font-medium">Medications to Avoid</h3>
                      </div>

                      <div className="space-y-4">
                        {parsedResponse.medications_to_avoid.map((medication, index) => (
                          <motion.div
                            key={index}
                            className="pl-4 border-l-2 border-red-500/20"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-red-500">{medication.name}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{medication.reason}</p>
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
                            <p className="font-medium text-primary">Analyzing medications to avoid...</p>
                            <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <ShieldAlert className="h-6 w-6 text-muted-foreground/70" />
                          <p>No medications to avoid available</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* General Advice Tab */}
                <TabsContent value="advice" className="space-y-4 pt-4 animate-in fade-in-50 duration-300">
                  {parsedResponse?.general_advice && parsedResponse.general_advice.length > 0 ? (
                    <div className="bg-card/80 p-4 rounded-lg border border-border/50 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <ClipboardList className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-medium">General Advice</h3>
                      </div>

                      <ul className="space-y-3">
                        {parsedResponse.general_advice.map((advice, index) => (
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
                            <p className="font-medium text-primary">Preparing general advice...</p>
                            <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <ClipboardList className="h-6 w-6 text-muted-foreground/70" />
                          <p>No general advice available</p>
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
            ) : currentSession?.follow_up_specialist_response ? (
              <div className="w-full p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                <p className="text-sm text-green-500">
                  Follow-up Specialist analysis is complete
                </p>
              </div>
            ) : (
              <div className="w-full p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-center">
                <p className="text-sm text-amber-500">
                  {isLoading || isStreaming ? "Processing pharmacist assessment..." : "Waiting for Pharmacist response..."}
                </p>
              </div>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </AnimatedSection>
  );
}
