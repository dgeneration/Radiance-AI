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
    processNextStep
  } = useChainDiagnosis();

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

  // Track the active view mode
  const [viewMode, setViewMode] = useState<'progress' | 'detailed'>('progress');

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
                  <CardTitle>Chain Diagnosis Session</CardTitle>
                  <CardDescription>
                    {isCompleted
                      ? "Your comprehensive health analysis is complete"
                      : "Your health analysis is in progress"}
                  </CardDescription>
                </div>
              </div>

              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'progress' | 'detailed')}>
                <TabsList>
                  <TabsTrigger value="progress">Progress</TabsTrigger>
                  <TabsTrigger value="detailed">Detailed View</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>

          <CardContent>
            <TabsContent value="progress" className="mt-0">
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
          </CardContent>

          <CardFooter className="flex flex-col text-xs text-muted-foreground border-t border-border/50 pt-4">
            <p>
              This analysis is provided for informational purposes only and is not a substitute for professional medical advice.
            </p>
          </CardFooter>
        </Card>
      </AnimatedSection>

      {viewMode === 'progress' && <ChainDiagnosisStreamingContent />}
    </div>
  );
}
