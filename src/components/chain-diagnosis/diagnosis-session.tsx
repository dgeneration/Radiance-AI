"use client";

import React, { useEffect, useState } from 'react';
import { useChainDiagnosis } from '@/contexts/chain-diagnosis-context';
import { ChainDiagnosisProgressIndicator } from './progress-indicator';
import { ChainDiagnosisStreamingContent } from './streaming-content';
import { MedicalAnalystView } from './medical-analyst-view';
import { GeneralPhysicianView } from './general-physician-view';
import { SpecialistDoctorView } from './specialist-doctor-view';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, Brain, Download, Share2, Activity, FileText } from 'lucide-react';
import { AnimatedSection } from '@/components/animations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ChainDiagnosisSessionProps {
  sessionId: string;
}

export function ChainDiagnosisSession({ sessionId }: ChainDiagnosisSessionProps) {
  const {
    loadSession,
    currentSession,
    isLoading,
    error,
    currentStep,
    processNextStep,
    isStreaming,
    isReloading
  } = useChainDiagnosis();

  // Track the active view mode - MOVED HERE FROM BELOW
  // Always start with 'progress' view to show streaming content
  const [viewMode, setViewMode] = useState<'progress' | 'detailed'>('progress');

  // State for alert visibility
  const [alertVisible, setAlertVisible] = useState(true);

  // Force progress view when streaming is active, and switch to detailed view when complete
  useEffect(() => {
    if (isStreaming) {
      setViewMode('progress');
    } else if (currentSession?.medical_analyst_response ||
               currentSession?.general_physician_response ||
               currentSession?.specialist_doctor_response) {
      // When streaming is complete and we have a response, switch to detailed view
      // Use a small timeout to ensure the UI has time to update with the latest data
      setTimeout(() => {
        setViewMode('detailed');
      }, 500);
    }
  }, [isStreaming, currentSession?.medical_analyst_response,
      currentSession?.general_physician_response,
      currentSession?.specialist_doctor_response]);

  // Additional effect to check for response changes
  useEffect(() => {
    if ((currentSession?.medical_analyst_response ||
         currentSession?.general_physician_response ||
         currentSession?.specialist_doctor_response) && !isStreaming) {
      setViewMode('detailed');
    }
  }, [currentSession?.medical_analyst_response,
      currentSession?.general_physician_response,
      currentSession?.specialist_doctor_response,
      isStreaming]);

  // Create a ref outside the useEffect to track if we've already switched to detailed view
  const hasViewSwitchedRef = React.useRef(false);

  // Create a ref for the detailed view container
  const detailedViewRef = React.useRef<HTMLDivElement>(null);

  // Create refs for each role component
  const medicalAnalystRef = React.useRef<HTMLDivElement>(null);
  const generalPhysicianRef = React.useRef<HTMLDivElement>(null);
  const specialistDoctorRef = React.useRef<HTMLDivElement>(null);

  // Determine the last completed role
  const getLastCompletedRole = () => {
    if (currentSession?.specialist_doctor_response) return 'specialist';
    if (currentSession?.general_physician_response) return 'physician';
    if (currentSession?.medical_analyst_response) return 'analyst';
    return null;
  };

  const lastCompletedRole = getLastCompletedRole();

  // Additional effect to switch to detailed view when currentStep is 1 (General Physician) or 2 (Specialist Doctor)
  // but only do this once to avoid triggering multiple API calls
  useEffect(() => {
    if ((currentStep === 1 || currentStep === 2) && !isStreaming && !hasViewSwitchedRef.current) {
      // If we're on the General Physician or Specialist Doctor step and not streaming, switch to detailed view
      setViewMode('detailed');
      hasViewSwitchedRef.current = true;
    }
  }, [currentStep, isStreaming]);

  // Auto-scroll to the detailed view when switching to it
  useEffect(() => {
    if (viewMode === 'detailed') {
      // First scroll to the detailed view section
      setTimeout(() => {
        detailedViewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Then scroll to the last completed role after a short delay
        setTimeout(() => {
          if (lastCompletedRole === 'specialist' && specialistDoctorRef.current) {
            specialistDoctorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else if (lastCompletedRole === 'physician' && generalPhysicianRef.current) {
            generalPhysicianRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else if (lastCompletedRole === 'analyst' && medicalAnalystRef.current) {
            medicalAnalystRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      }, 100);
    }
  }, [viewMode, lastCompletedRole]);

  // Handle continuing to the next step
  const handleContinue = async () => {
    await processNextStep();
  };

  // Load the session when the component mounts
  useEffect(() => {
    loadSession(sessionId);
  }, [sessionId, loadSession]);

  // Check if we should auto-continue to General Physician after reload
  useEffect(() => {
    const shouldAutoContinue = localStorage.getItem('auto_continue_to_general_physician') === 'true';
    const storedSessionId = localStorage.getItem('auto_continue_session_id');

    if (shouldAutoContinue && storedSessionId === sessionId &&
        currentSession?.medical_analyst_response && currentStep === 0 && !isLoading && !isStreaming) {
      // Clear the flags
      localStorage.removeItem('auto_continue_to_general_physician');
      localStorage.removeItem('auto_continue_session_id');

      console.log('Auto-continuing to General Physician...');

      // Wait a short delay to ensure the UI is fully loaded
      const timer = setTimeout(() => {
        // Set currentStep to 1 to indicate we're on the General Physician step
        // This will trigger the processNextStep function in the context
        processNextStep();

        // Switch to detailed view
        setViewMode('detailed');
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [currentSession, currentStep, sessionId, isLoading, isStreaming, processNextStep]);

  // Handle downloading the final report
  const handleDownloadReport = () => {
    if (!currentSession?.summarizer_response) return;

    const reportData = JSON.stringify(currentSession.summarizer_response, null, 2);
    const blob = new Blob([reportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `radiance-ai-report-${sessionId.substring(0, 8)}.json`;
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
        <AlertDescription>The diagnosis session could not be found or has been deleted.</AlertDescription>
      </Alert>
    );
  }

  const isCompleted = currentSession.status === 'completed' || currentStep >= 8;

  return (
    <div className="space-y-8 relative">
      {/* Page reload overlay */}
      {isReloading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg font-medium mb-2">Refreshing Results</p>
          <p className="text-muted-foreground text-center max-w-md">
            Your analysis is complete. The page is refreshing to show the results...
          </p>
        </div>
      )}

      <AnimatedSection>
        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-full">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Chain Diagnosis Session</CardTitle>
                <CardDescription>
                  {isCompleted
                    ? "Your comprehensive health analysis is complete"
                    : "Your health analysis is in progress"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'progress' | 'detailed')} className="w-full">
              <div className="flex justify-center mb-6">
                <TabsList className="w-full max-w-md grid grid-cols-2 p-1 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-sm h-auto">
                  <TabsTrigger value="progress" className="rounded-lg py-3 h-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm">
                    <Activity className="h-4 w-4 mr-2" />
                    Progress View
                  </TabsTrigger>
                  <TabsTrigger value="detailed" className="rounded-lg py-3 h-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Detailed Analysis
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="progress" className="mt-0 animate-in fade-in-50 duration-300">
                {/* Notification when analysis is complete - moved to the top */}
                {(currentSession?.medical_analyst_response || currentSession?.general_physician_response) && !isStreaming && alertVisible && (
                  <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3 relative">
                    <div className="p-1.5 bg-green-500/20 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-500">Analysis Complete</p>
                      <p className="text-xs text-muted-foreground">
                        {currentSession?.medical_analyst_response
                          ? "Your medical image has been analyzed."
                          : "Your symptoms have been analyzed."}
                        Click the &quot;Detailed View&quot; tab to see the results.
                      </p>
                    </div>

                    {/* Close button */}
                    <button
                      className="absolute top-2 right-2 text-green-500/70 hover:text-green-500 focus:outline-none"
                      onClick={() => setAlertVisible(false)}
                      aria-label="Close"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                )}

                <ChainDiagnosisProgressIndicator
                  onContinue={!isCompleted && currentStep < 8 ? handleContinue : undefined}
                  isProcessing={isLoading}
                />

                {isCompleted && (
                  <div className="mt-6 flex flex-wrap gap-3 justify-end">
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
              </TabsContent>

              <TabsContent value="detailed" className="mt-0 animate-in fade-in-50 duration-300">
                <div ref={detailedViewRef} className="mb-6 bg-card/50 p-5 rounded-xl border border-border/50 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Detailed Analysis
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Comprehensive breakdown of your health assessment
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Medical Analyst View - Only show if there's a medical report */}
                  {(currentSession?.user_input.medical_report?.text || currentSession?.user_input.medical_report?.image_url) && (
                    <div ref={medicalAnalystRef}>
                      <MedicalAnalystView
                        isActive={currentStep === 0}
                        onContinue={handleContinue}
                        isLastRole={lastCompletedRole === 'analyst'}
                      />
                    </div>
                  )}

                  {/* General Physician View */}
                  {(currentStep >= 1 || currentSession?.general_physician_response) && (
                    <div ref={generalPhysicianRef}>
                      <GeneralPhysicianView
                        isActive={currentStep === 1 || (!currentSession?.user_input.medical_report?.text && !currentSession?.user_input.medical_report?.image_url)}
                        onContinue={handleContinue}
                        isLastRole={lastCompletedRole === 'physician'}
                      />
                    </div>
                  )}

                  {/* Specialist Doctor View */}
                  {(currentStep >= 2 || currentSession?.specialist_doctor_response) && (
                    <div ref={specialistDoctorRef}>
                      <SpecialistDoctorView
                        isActive={currentStep === 2}
                        onContinue={handleContinue}
                        isLastRole={lastCompletedRole === 'specialist'}
                      />
                    </div>
                  )}

                  {/* Other AI role views will be added in subsequent phases */}
                  {currentStep > 2 && (
                    <div className="bg-card/50 backdrop-blur-sm p-5 rounded-xl border border-border/50 shadow-sm text-center">
                      <div className="flex flex-col items-center gap-3 py-6">
                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                          <Brain className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium mb-1">Coming Soon</h3>
                          <p className="text-muted-foreground max-w-md mx-auto">
                            Detailed views for Pathologist, Nutritionist, Pharmacist,
                            Follow-up Specialist, and Summarizer will be implemented in subsequent phases.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="flex flex-col text-xs text-muted-foreground border-t border-border/50 pt-4">
            <p>
              This analysis is provided for informational purposes only and is not a substitute for professional medical advice.
            </p>
          </CardFooter>
        </Card>
      </AnimatedSection>

      {/* Move streaming content inside the tabs structure */}
      {viewMode === 'progress' && (
        <AnimatedSection delay={0.2}>
          <ChainDiagnosisStreamingContent />

          {/* Debug information removed */}
        </AnimatedSection>
      )}
    </div>
  );
}
