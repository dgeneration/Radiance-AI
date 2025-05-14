"use client";

import React, { useState, useEffect } from 'react';
import { useChainDiagnosis } from '@/contexts/chain-diagnosis-context';
import { GeneralPhysicianResponse } from '@/types/chain-diagnosis';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Stethoscope, AlertCircle } from 'lucide-react';
import { AnimatedSection } from '@/components/animations';
import { cn } from '@/lib/utils';

interface GeneralPhysicianViewProps {
  isActive: boolean;
  onContinue: () => void;
}

export function GeneralPhysicianView({ isActive, onContinue }: GeneralPhysicianViewProps) {
  const {
    currentSession,
    streamingContent,
    isStreaming,
    isLoading,
    error
  } = useChainDiagnosis();

  const [parsedResponse, setParsedResponse] = useState<GeneralPhysicianResponse | null>(null);
  const [activeTab, setActiveTab] = useState('analysis');

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
      <Card className={cn(
        "backdrop-blur-sm border transition-all",
        isActive ? "bg-primary/5 border-primary/20" : "bg-card/50 border-primary/10"
      )}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-full",
                isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>General Physician AI</CardTitle>
                <CardDescription>
                  {isStreaming && isActive ? "Analyzing your symptoms..." : "Preliminary assessment of your symptoms"}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Patient Summary */}
          <div className="bg-background/50 p-4 rounded-lg border border-border/50">
            <h3 className="text-sm font-medium mb-2">Patient Summary</h3>
            {parsedResponse?.patient_summary_review ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Name: <span className="text-foreground">{parsedResponse.patient_summary_review.name}</span></p>
                  <p className="text-muted-foreground">Age: <span className="text-foreground">{parsedResponse.patient_summary_review.age}</span></p>
                </div>
                <div>
                  <p className="text-muted-foreground">Key Symptoms:</p>
                  <ul className="list-disc list-inside">
                    {parsedResponse.patient_summary_review.key_symptoms.map((symptom, index) => (
                      <li key={index} className="text-foreground">{symptom}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-2 text-muted-foreground">
                {isStreaming && isActive ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p>Loading patient summary...</p>
                  </div>
                ) : (
                  <p>No patient summary available</p>
                )}
              </div>
            )}
          </div>

          {/* Medical Analyst Findings Summary (if available) */}
          {parsedResponse?.medical_analyst_findings_summary &&
           parsedResponse.medical_analyst_findings_summary !== "N/A" && (
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
              <h3 className="text-sm font-medium mb-2">Medical Analyst Findings</h3>
              <p className="text-sm">{parsedResponse.medical_analyst_findings_summary}</p>
            </div>
          )}

          {/* Tabs for different sections */}
          <Tabs defaultValue="analysis" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="analysis">Symptom Analysis</TabsTrigger>
              <TabsTrigger value="concerns">Potential Concerns</TabsTrigger>
              <TabsTrigger value="advice">Initial Advice</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="space-y-4 pt-4">
              {parsedResponse?.preliminary_symptom_analysis?.length ? (
                <ul className="space-y-2">
                  {parsedResponse.preliminary_symptom_analysis.map((analysis, index) => (
                    <li key={index} className="bg-background/50 p-3 rounded-md border border-border/50">
                      {analysis}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {isStreaming && isActive ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <p>Analyzing symptoms...</p>
                    </div>
                  ) : (
                    <p>No symptom analysis available</p>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="concerns" className="space-y-4 pt-4">
              {parsedResponse?.potential_areas_of_concern?.length ? (
                <ul className="space-y-2">
                  {parsedResponse.potential_areas_of_concern.map((concern, index) => (
                    <li key={index} className="bg-background/50 p-3 rounded-md border border-border/50">
                      {concern}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {isStreaming && isActive ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <p>Identifying potential concerns...</p>
                    </div>
                  ) : (
                    <p>No potential concerns identified</p>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="advice" className="space-y-4 pt-4">
              {parsedResponse?.general_initial_advice?.length ? (
                <ul className="space-y-2">
                  {parsedResponse.general_initial_advice.map((advice, index) => (
                    <li key={index} className="bg-background/50 p-3 rounded-md border border-border/50">
                      {advice}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {isStreaming && isActive ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <p>Generating initial advice...</p>
                    </div>
                  ) : (
                    <p>No initial advice available</p>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Specialist Recommendation */}
          {parsedResponse?.recommended_specialist_type && (
            <div className="bg-accent/5 p-4 rounded-lg border border-accent/20">
              <h3 className="text-sm font-medium mb-2">Recommended Specialist</h3>
              <p className="text-sm font-medium text-accent">{parsedResponse.recommended_specialist_type}</p>
            </div>
          )}

          {/* Questions for Specialist */}
          {parsedResponse?.questions_for_specialist_consultation &&
           parsedResponse.questions_for_specialist_consultation.length > 0 && (
            <div className="bg-background/50 p-4 rounded-lg border border-border/50">
              <h3 className="text-sm font-medium mb-2">Questions to Ask Your Specialist</h3>
              <ul className="list-disc list-inside space-y-1">
                {parsedResponse.questions_for_specialist_consultation.map((question, index) => (
                  <li key={index} className="text-sm">{question}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Disclaimer */}
          {parsedResponse?.disclaimer && (
            <div className="bg-background/50 p-3 rounded-md border border-border/50 text-xs text-muted-foreground">
              <p className="font-medium mb-1">Disclaimer:</p>
              <p>{parsedResponse.disclaimer}</p>
            </div>
          )}
        </CardContent>

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
    </AnimatedSection>
  );
}
