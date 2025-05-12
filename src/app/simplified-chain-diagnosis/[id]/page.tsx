"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SimplifiedChainDiagnosisProvider, useSimplifiedChainDiagnosis } from '@/contexts/simplified-chain-diagnosis-context';
import { SubNavbar } from '@/components/sub-navbar';
import { MedicalAnalystView } from '@/components/chain-diagnosis/medical-analyst-view';
import { ChainDiagnosisProgressIndicator } from '@/components/chain-diagnosis/progress-indicator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, Brain, ArrowRight } from 'lucide-react';
import { AnimatedSection } from '@/components/animations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function SimplifiedChainDiagnosisSession({ sessionId }: { sessionId: string }) {
  const { 
    loadSession, 
    currentSession, 
    isLoading, 
    error, 
    currentStep,
    processNextStep
  } = useSimplifiedChainDiagnosis();
  const router = useRouter();
  
  // Load the session when the component mounts
  useEffect(() => {
    loadSession(sessionId);
  }, [sessionId, loadSession]);
  
  // Handle continuing to the next step
  const handleContinue = async () => {
    await processNextStep();
  };
  
  // Handle going back to the form
  const handleBackToForm = () => {
    router.push('/simplified-chain-diagnosis');
  };
  
  if (isLoading && !currentSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading diagnosis session...</p>
      </div>
    );
  }
  
  if (error && !currentSession) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  if (!currentSession) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Session Not Found</AlertTitle>
        <AlertDescription>
          The diagnosis session could not be found. Please start a new session.
          <Button onClick={handleBackToForm} variant="outline" className="mt-4">
            Back to Form
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  const isCompleted = currentStep >= 8;
  
  return (
    <div className="space-y-8">
      <AnimatedSection>
        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-full">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Simplified Chain Diagnosis</CardTitle>
                  <CardDescription>
                    {isCompleted 
                      ? "Your comprehensive health analysis is complete" 
                      : "Your health analysis is in progress"}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <ChainDiagnosisProgressIndicator />
            
            {!isCompleted && currentStep < 8 && (
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleContinue}
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Continue to Next Step
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col text-xs text-muted-foreground border-t border-border/50 pt-4">
            <p>
              This analysis is provided for informational purposes only and is not a substitute for professional medical advice.
            </p>
          </CardFooter>
        </Card>
      </AnimatedSection>
      
      <AnimatedSection>
        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardHeader>
            <CardTitle>Medical Analyst Results</CardTitle>
            <CardDescription>
              Analysis of your medical report
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <MedicalAnalystView 
              isActive={currentStep === 0} 
              onContinue={handleContinue} 
            />
          </CardContent>
        </Card>
      </AnimatedSection>
      
      {currentStep > 0 && (
        <AnimatedSection>
          <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
              <CardDescription>
                The remaining AI roles will be implemented in subsequent phases
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="bg-muted/30 p-4 rounded-lg text-center">
                <p className="text-muted-foreground">
                  This simplified version only demonstrates the Medical Analyst AI component.
                  The other AI roles (General Physician, Specialist Doctor, etc.) will be implemented in subsequent phases.
                </p>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                onClick={handleBackToForm}
                className="w-full"
                variant="outline"
              >
                Back to Form
              </Button>
            </CardFooter>
          </Card>
        </AnimatedSection>
      )}
    </div>
  );
}

export default function SimplifiedChainDiagnosisSessionPage({
  params,
}: {
  params: { id: string };
}) {
  const sessionId = params.id;

  return (
    <SimplifiedChainDiagnosisProvider>
      <SubNavbar title="Simplified Chain Diagnosis" showProfileNav={true} />
      <div className="relative overflow-hidden py-10 px-4">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-background to-accent/5 z-0"></div>

        <div className="container relative z-10 mx-auto max-w-5xl">
          <SimplifiedChainDiagnosisSession sessionId={sessionId} />
        </div>
      </div>
    </SimplifiedChainDiagnosisProvider>
  );
}
