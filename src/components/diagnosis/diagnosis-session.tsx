"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useChainDiagnosis } from '@/contexts/diagnosis-context';
import { ChainDiagnosisProgressIndicator } from './progress-indicator';
import { ChainDiagnosisStreamingContent } from './streaming-content';
import { MedicalAnalystView } from './medical-analyst-view';
import { GeneralPhysicianView } from './general-physician-view';
import { SpecialistDoctorView } from './specialist-doctor-view';
import { PathologistView } from './pathologist-view';
import { NutritionistView } from './nutritionist-view';
import { PharmacistView } from './pharmacist-view';
import { FollowUpSpecialistView } from './follow-up-specialist-view';
import { SummarizerView } from './summarizer-view';
import { AskRadianceView } from './ask-radiance-view';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, Brain, Download, Share2, Activity, FileText, Code, MessageSquare } from 'lucide-react';
import { AnimatedSection } from '@/components/animations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { isDeveloperModeEnabled } from '@/lib/developer-mode';

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
  const [viewMode, setViewMode] = useState<'progress' | 'detailed' | 'ask-radiance'>('progress');

  // State for alert visibility
  const [alertVisible, setAlertVisible] = useState(true);

  // Track if user has manually selected progress view
  const [userSelectedProgressView, setUserSelectedProgressView] = useState(false);

  // Create a ref for the ask radiance container
  const askRadianceRef = React.useRef<HTMLDivElement>(null);

  // Custom function to set view mode and scroll to top when switching tabs
  const handleViewModeChange = useCallback((newMode: 'progress' | 'detailed' | 'ask-radiance') => {
    // Update the view mode first to ensure the component is rendered
    setViewMode(newMode);

    // Set user preferences based on the selected tab
    if (newMode === 'progress') {
      // User has explicitly chosen progress view
      setUserSelectedProgressView(true);
      // Scroll to top immediately
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (newMode === 'detailed') {
      // Reset the user preference when switching to detailed view
      setUserSelectedProgressView(false);
      // Scroll to top immediately
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (newMode === 'ask-radiance') {
      // Reset the user preference when switching to ask-radiance view
      setUserSelectedProgressView(false);

      // Use a small timeout to ensure the Ask Radiance component is rendered before scrolling
      setTimeout(() => {
        // Scroll to the top of the page first
        window.scrollTo({ top: 0, behavior: 'instant' });

        // Then try to scroll to the ask-radiance container using the ref
        if (askRadianceRef.current) {
          askRadianceRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
      }, 10);
    }
  }, [setUserSelectedProgressView, askRadianceRef]);

  // Check if developer mode is enabled
  const [developerMode, setDeveloperMode] = useState(false);

  // Load developer mode setting from localStorage on component mount and whenever localStorage changes
  useEffect(() => {
    // Function to check developer mode status using the utility function
    const checkDeveloperMode = () => {
      const newValue = isDeveloperModeEnabled();

      // Only update state if it's different to avoid unnecessary re-renders
      if (newValue !== developerMode) {
        console.log('Diagnosis Session: Developer mode changed:', newValue);
        setDeveloperMode(newValue);
      }
    };

    // Check initially
    checkDeveloperMode();

    // Set up event listener for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (!e || e.key === 'developer_mode') {
        checkDeveloperMode();
      }
    };

    // Set up event listener for custom developer mode change event
    const handleCustomEvent = (e: CustomEvent) => {
      console.log('Diagnosis Session: Received custom developer mode event:', e.detail);
      const enabled = e.detail?.enabled;
      if (typeof enabled === 'boolean') {
        setDeveloperMode(enabled);
      } else {
        checkDeveloperMode();
      }
    };

    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('developerModeChanged', handleCustomEvent as EventListener);

    // Force an immediate check
    checkDeveloperMode();

    // Also check periodically (every second) in case the event doesn't fire
    const interval = setInterval(checkDeveloperMode, 1000);

    // Clean up
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('developerModeChanged', handleCustomEvent as EventListener);
      clearInterval(interval);
    };
  }, [developerMode]);

  // Force progress view when streaming is active, and switch to detailed view when complete
  useEffect(() => {
    if (isStreaming) {
      // Only switch to progress view if we're not in ask-radiance view
      if (viewMode !== 'ask-radiance') {
        handleViewModeChange('progress');
      }
    } else if (!userSelectedProgressView &&
              viewMode !== 'ask-radiance' &&
              viewMode !== 'progress' && // Don't switch if user just selected progress view
              (currentSession?.medical_analyst_response ||
               currentSession?.general_physician_response ||
               currentSession?.specialist_doctor_response)) {
      // When streaming is complete and we have a response, switch to detailed view
      // ONLY if user hasn't explicitly chosen progress view and isn't in ask-radiance view
      // Use a small timeout to ensure the UI has time to update with the latest data
      setTimeout(() => {
        handleViewModeChange('detailed');
      }, 500);
    }
  }, [isStreaming, currentSession?.medical_analyst_response,
      currentSession?.general_physician_response,
      currentSession?.specialist_doctor_response,
      handleViewModeChange, userSelectedProgressView, viewMode]);

  // Additional effect to check for response changes
  useEffect(() => {
    if (!userSelectedProgressView &&
        viewMode !== 'ask-radiance' &&
        viewMode !== 'progress' && // Don't switch if user just selected progress view
        (currentSession?.medical_analyst_response ||
         currentSession?.general_physician_response ||
         currentSession?.specialist_doctor_response) && !isStreaming) {
      handleViewModeChange('detailed');
    }
  }, [currentSession?.medical_analyst_response,
      currentSession?.general_physician_response,
      currentSession?.specialist_doctor_response,
      isStreaming,
      handleViewModeChange,
      userSelectedProgressView,
      viewMode]);

  // Create a ref outside the useEffect to track if we've already switched to detailed view
  const hasViewSwitchedRef = React.useRef(false);

  // Create a ref for the detailed view container
  const detailedViewRef = React.useRef<HTMLDivElement>(null);

  // Create refs for each role component
  const medicalAnalystRef = React.useRef<HTMLDivElement>(null);
  const generalPhysicianRef = React.useRef<HTMLDivElement>(null);
  const specialistDoctorRef = React.useRef<HTMLDivElement>(null);
  const pathologistRef = React.useRef<HTMLDivElement>(null);
  const nutritionistRef = React.useRef<HTMLDivElement>(null);
  const pharmacistRef = React.useRef<HTMLDivElement>(null);
  const followUpSpecialistRef = React.useRef<HTMLDivElement>(null);
  const summarizerRef = React.useRef<HTMLDivElement>(null);

  // Determine the last completed role
  const getLastCompletedRole = () => {
    if (currentSession?.summarizer_response) return 'summarizer';
    if (currentSession?.follow_up_specialist_response) return 'followup';
    if (currentSession?.pharmacist_response) return 'pharmacist';
    if (currentSession?.nutritionist_response) return 'nutritionist';
    if (currentSession?.pathologist_response) return 'pathologist';
    if (currentSession?.specialist_doctor_response) return 'specialist';
    if (currentSession?.general_physician_response) return 'physician';
    if (currentSession?.medical_analyst_response) return 'analyst';
    return null;
  };

  const lastCompletedRole = getLastCompletedRole();

  // Additional effect to switch to detailed view when currentStep is 1 (General Physician) or 2 (Specialist Doctor)
  // but only do this once to avoid triggering multiple API calls
  useEffect(() => {
    if (!userSelectedProgressView &&
        viewMode !== 'ask-radiance' &&
        viewMode !== 'progress' && // Don't switch if user just selected progress view
        (currentStep === 1 || currentStep === 2) &&
        !isStreaming &&
        !hasViewSwitchedRef.current) {
      // If we're on the General Physician or Specialist Doctor step and not streaming, switch to detailed view
      // ONLY if user hasn't explicitly chosen progress view and isn't in ask-radiance view
      handleViewModeChange('detailed');
      hasViewSwitchedRef.current = true;
    }
  }, [currentStep, isStreaming, handleViewModeChange, userSelectedProgressView, viewMode]);

  // Auto-scroll to the detailed view when switching to it
  useEffect(() => {
    if (viewMode === 'detailed') {
      // First scroll to the detailed view section
      setTimeout(() => {
        detailedViewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Then scroll to the last completed role after a short delay
        setTimeout(() => {
          if (lastCompletedRole === 'summarizer' && summarizerRef.current) {
            summarizerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else if (lastCompletedRole === 'followup' && followUpSpecialistRef.current) {
            followUpSpecialistRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else if (lastCompletedRole === 'pharmacist' && pharmacistRef.current) {
            pharmacistRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else if (lastCompletedRole === 'nutritionist' && nutritionistRef.current) {
            nutritionistRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else if (lastCompletedRole === 'pathologist' && pathologistRef.current) {
            pathologistRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else if (lastCompletedRole === 'specialist' && specialistDoctorRef.current) {
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

  // Auto-scroll to the top when switching to Ask Radiance view
  useEffect(() => {
    if (viewMode === 'ask-radiance') {
      // Scroll to top immediately
      window.scrollTo({ top: 0, behavior: 'instant' });

      // Then try to scroll to the ask-radiance container
      setTimeout(() => {
        if (askRadianceRef.current) {
          askRadianceRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
      }, 10);
    }
  }, [viewMode]);

  // Handle continuing to the next step
  const handleContinue = async () => {
    // Scroll to top before processing next step
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Reset user preference when continuing to next step
    setUserSelectedProgressView(false);
    await processNextStep();
  };

  // Load the session when the component mounts
  useEffect(() => {
    loadSession(sessionId);
  }, [sessionId, loadSession]);


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

      <AnimatedSection once={true}>
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
            <Tabs value={viewMode} onValueChange={(value) => handleViewModeChange(value as 'progress' | 'detailed' | 'ask-radiance')} className="w-full">
              <div className="flex justify-center mb-6">
                <TabsList className="w-full max-w-md grid grid-cols-3 p-1 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-sm h-auto">
                  <TabsTrigger value="progress" className="rounded-lg py-3 h-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm">
                    <Activity className="h-4 w-4 mr-2" />
                    Progress View
                  </TabsTrigger>
                  <TabsTrigger value="detailed" className="rounded-lg py-3 h-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Detailed Analysis
                  </TabsTrigger>
                  <TabsTrigger value="ask-radiance" className="rounded-lg py-3 h-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Ask Radiance
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

                  {/* Pathologist View */}
                  {(currentStep >= 3 || currentSession?.pathologist_response) && (
                    <div ref={pathologistRef}>
                      <PathologistView
                        isActive={currentStep === 3}
                        onContinue={handleContinue}
                        isLastRole={lastCompletedRole === 'pathologist'}
                      />
                    </div>
                  )}

                  {/* Nutritionist View */}
                  {(currentStep >= 4 || currentSession?.nutritionist_response) && (
                    <div ref={nutritionistRef}>
                      <NutritionistView
                        isActive={currentStep === 4}
                        onContinue={handleContinue}
                        isLastRole={lastCompletedRole === 'nutritionist'}
                      />
                    </div>
                  )}

                  {/* Pharmacist View */}
                  {(currentStep >= 5 || currentSession?.pharmacist_response) && (
                    <div ref={pharmacistRef}>
                      <PharmacistView
                        isActive={currentStep === 5}
                        onContinue={handleContinue}
                        isLastRole={lastCompletedRole === 'pharmacist'}
                      />
                    </div>
                  )}

                  {/* Follow-up Specialist View */}
                  {(currentStep >= 6 || currentSession?.follow_up_specialist_response) && (
                    <div ref={followUpSpecialistRef}>
                      <FollowUpSpecialistView
                        isActive={currentStep === 6}
                        onContinue={handleContinue}
                        isLastRole={lastCompletedRole === 'followup'}
                      />
                    </div>
                  )}

                  {/* Summarizer View */}
                  {(currentStep >= 7 || currentSession?.summarizer_response) && (
                    <div ref={summarizerRef}>
                      <SummarizerView
                        isActive={currentStep === 7}
                        onContinue={handleContinue}
                        isLastRole={lastCompletedRole === 'summarizer'}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="ask-radiance" className="mt-0 animate-in fade-in-50 duration-300">
                <div id="ask-radiance-container" ref={askRadianceRef}>
                  <AskRadianceView sessionId={sessionId} />
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
        <AnimatedSection delay={0.2} once={true}>
          <ChainDiagnosisStreamingContent />

          {/* Debug information removed */}
        </AnimatedSection>
      )}

      {/* Developer Mode: AI Diagnosis Chain Section */}
      {developerMode && (
        <AnimatedSection delay={0.3} once={true}>
          <Card className="bg-card/50 backdrop-blur-sm border-primary/10 mt-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-full">
                    <Code className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>AI Diagnosis Chain</CardTitle>
                    <CardDescription>
                      Developer view of the diagnosis chain process
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-primary animate-pulse">Developer Mode Active</span>
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-card/80 p-4 rounded-lg border border-border/50">
                  <h3 className="text-sm font-medium mb-2">Session Information</h3>
                  <pre className="text-xs overflow-auto p-2 bg-black/50 rounded-md max-h-40">
                    {JSON.stringify({
                      sessionId,
                      currentStep,
                      isLoading,
                      isStreaming,
                      isReloading,
                      status: currentSession?.status,
                    }, null, 2)}
                  </pre>
                </div>

                <div className="bg-card/80 p-4 rounded-lg border border-border/50">
                  <h3 className="text-sm font-medium mb-2">User Input</h3>
                  <pre className="text-xs overflow-auto p-2 bg-black/50 rounded-md max-h-40">
                    {JSON.stringify(currentSession?.user_input, null, 2)}
                  </pre>
                </div>

                <div className="bg-card/80 p-4 rounded-lg border border-border/50">
                  <h3 className="text-sm font-medium mb-2">AI Role Responses</h3>
                  <div className="space-y-2">
                    {currentSession?.medical_analyst_response && (
                      <div>
                        <h4 className="text-xs font-medium text-primary">Medical Analyst</h4>
                        <pre className="text-xs overflow-auto p-2 bg-black/50 rounded-md max-h-40">
                          {JSON.stringify(currentSession.medical_analyst_response, null, 2)}
                        </pre>
                      </div>
                    )}
                    {currentSession?.general_physician_response && (
                      <div>
                        <h4 className="text-xs font-medium text-primary">General Physician</h4>
                        <pre className="text-xs overflow-auto p-2 bg-black/50 rounded-md max-h-40">
                          {JSON.stringify(currentSession.general_physician_response, null, 2)}
                        </pre>
                      </div>
                    )}
                    {currentSession?.specialist_doctor_response && (
                      <div>
                        <h4 className="text-xs font-medium text-primary">Specialist Doctor</h4>
                        <pre className="text-xs overflow-auto p-2 bg-black/50 rounded-md max-h-40">
                          {JSON.stringify(currentSession.specialist_doctor_response, null, 2)}
                        </pre>
                      </div>
                    )}
                    {currentSession?.pathologist_response && (
                      <div>
                        <h4 className="text-xs font-medium text-primary">Pathologist</h4>
                        <pre className="text-xs overflow-auto p-2 bg-black/50 rounded-md max-h-40">
                          {JSON.stringify(currentSession.pathologist_response, null, 2)}
                        </pre>
                      </div>
                    )}
                    {currentSession?.nutritionist_response && (
                      <div>
                        <h4 className="text-xs font-medium text-primary">Nutritionist</h4>
                        <pre className="text-xs overflow-auto p-2 bg-black/50 rounded-md max-h-40">
                          {JSON.stringify(currentSession.nutritionist_response, null, 2)}
                        </pre>
                      </div>
                    )}
                    {currentSession?.pharmacist_response && (
                      <div>
                        <h4 className="text-xs font-medium text-primary">Pharmacist</h4>
                        <pre className="text-xs overflow-auto p-2 bg-black/50 rounded-md max-h-40">
                          {JSON.stringify(currentSession.pharmacist_response, null, 2)}
                        </pre>
                      </div>
                    )}
                    {currentSession?.follow_up_specialist_response && (
                      <div>
                        <h4 className="text-xs font-medium text-primary">Follow-up Specialist</h4>
                        <pre className="text-xs overflow-auto p-2 bg-black/50 rounded-md max-h-40">
                          {JSON.stringify(currentSession.follow_up_specialist_response, null, 2)}
                        </pre>
                      </div>
                    )}
                    {currentSession?.summarizer_response && (
                      <div>
                        <h4 className="text-xs font-medium text-primary">Summarizer</h4>
                        <pre className="text-xs overflow-auto p-2 bg-black/50 rounded-md max-h-40">
                          {JSON.stringify(currentSession.summarizer_response, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>
      )}
    </div>
  );
}
