"use client";

import React, { useEffect, useState } from 'react';
import { useChainDiagnosis } from '@/contexts/chain-diagnosis-context';
import { ChainDiagnosisProgressIndicator } from './progress-indicator';
import { ChainDiagnosisStreamingContent } from './streaming-content';
import { MedicalAnalystView } from './medical-analyst-view';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, Brain, ArrowRight, Download, Share2 } from 'lucide-react';
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

  // Force progress view when streaming is active, and switch to detailed view when complete
  useEffect(() => {
    if (isStreaming) {
      console.log('Forcing progress view because streaming is active');
      setViewMode('progress');
    } else if (currentSession?.medical_analyst_response) {
      // When streaming is complete and we have a medical analyst response, switch to detailed view
      console.log('Streaming complete, switching to detailed view');
      // Use a small timeout to ensure the UI has time to update with the latest data
      setTimeout(() => {
        setViewMode('detailed');
      }, 500);
    }
  }, [isStreaming, currentSession?.medical_analyst_response]);

  // Additional effect to check for medical analyst response changes
  useEffect(() => {
    if (currentSession?.medical_analyst_response && !isStreaming) {
      console.log('Medical Analyst response detected, switching to detailed view');
      setViewMode('detailed');
    }
  }, [currentSession?.medical_analyst_response, isStreaming]);

  // Force refresh function for debugging
  const forceRefresh = () => {
    console.log('Forcing refresh of session component');
    // This will trigger a re-render
    setViewMode(prev => prev === 'progress' ? 'progress' : 'progress');
  };

  // Load the session when the component mounts
  useEffect(() => {
    loadSession(sessionId);
  }, [sessionId, loadSession]);

  // Handle continuing to the next step
  const handleContinue = async () => {
    await processNextStep();
  };

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
            Your medical image has been analyzed. The page is refreshing to show the results...
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
              <div className="flex justify-end mb-4">
                <TabsList>
                  <TabsTrigger value="progress">Progress</TabsTrigger>
                  <TabsTrigger value="detailed">Detailed View</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="progress" className="mt-0">
                <ChainDiagnosisProgressIndicator />

                {/* Notification when analysis is complete */}
                {currentSession?.medical_analyst_response && !isStreaming && (
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
                    <div className="p-1.5 bg-green-500/20 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-500">Analysis Complete</p>
                      <p className="text-xs text-muted-foreground">
                        Your medical image has been analyzed. Click the "Detailed View" tab to see the results.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-auto border-green-500/20 text-green-500 hover:bg-green-500/10"
                      onClick={() => setViewMode('detailed')}
                    >
                      View Results
                    </Button>
                  </div>
                )}

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

              <TabsContent value="detailed" className="mt-0">
                <div className="space-y-6">
                  {/* Medical Analyst View */}
                  <MedicalAnalystView
                    isActive={currentStep === 0}
                    onContinue={handleContinue}
                  />

                  {/* Other AI role views will be added in subsequent phases */}
                  {currentStep > 0 && (
                    <div className="bg-muted/30 p-4 rounded-lg text-center">
                      <p className="text-muted-foreground">
                        Detailed views for other AI roles will be implemented in subsequent phases.
                      </p>
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

          {/* Debug information - only visible in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 border border-yellow-500/20 rounded-lg bg-yellow-500/5">
              <h3 className="text-sm font-medium text-yellow-500 mb-2">Debug Information</h3>
              <div className="text-xs space-y-1 text-yellow-500/70">
                <p>Current Step: {currentStep}</p>
                <p>Is Streaming: {isStreaming ? 'Yes' : 'No'}</p>
                <p>View Mode: {viewMode}</p>
                <p>Session ID: {sessionId}</p>
                <p>Session Status: {currentSession?.status || 'Unknown'}</p>

                {/* Debug buttons */}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={forceRefresh}
                    className="text-[10px] px-2 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 rounded"
                  >
                    Force Refresh
                  </button>
                  <button
                    onClick={() => setViewMode('progress')}
                    className="text-[10px] px-2 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 rounded"
                  >
                    Set Progress View
                  </button>
                  <button
                    onClick={() => setViewMode('detailed')}
                    className="text-[10px] px-2 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 rounded"
                  >
                    Set Detailed View
                  </button>
                </div>

                {/* Add direct debug output of streaming content */}
                <details className="mt-2">
                  <summary className="cursor-pointer font-medium">Raw Response Content</summary>
                  <div className="mt-2 p-2 bg-black/20 rounded text-[10px] max-h-[200px] overflow-auto">
                    {JSON.stringify(currentSession?.medical_analyst_response || {}, null, 2)}
                  </div>
                </details>
              </div>
            </div>
          )}
        </AnimatedSection>
      )}
    </div>
  );
}
