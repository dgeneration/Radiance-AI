"use client";

import React, { useState, useEffect } from 'react';
import { useChainDiagnosis } from '@/contexts/chain-diagnosis-context';
import { Loader2, ChevronDown, ChevronUp, Brain, User, Stethoscope, TestTube, Apple, Pill, Calendar, FileText, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AnimatedSection } from '@/components/animations';

interface RoleContentProps {
  title: string;
  icon: React.ReactNode;
  content: string;
  isStreaming: boolean;
  isActive: boolean;
}

function RoleContent({ title, icon, content, isStreaming, isActive }: RoleContentProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-expand when content is being streamed or when the role is active
  useEffect(() => {
    // Auto-expand when streaming starts for this role
    if (isStreaming && isActive) {
      setIsExpanded(true);
    }

    // Also auto-expand when this role becomes active, even if not streaming
    if (isActive) {
      setIsExpanded(true);
    }
  }, [isStreaming, isActive]);

  return (
    <div className={cn(
      "border rounded-lg overflow-hidden transition-all",
      isActive ? "border-primary/30 bg-primary/5" : "border-border",
      isExpanded ? "shadow-md" : ""
    )}>
      <div
        className={cn(
          "flex items-center justify-between p-4 cursor-pointer",
          isActive ? "bg-primary/10" : "bg-card/50"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-full",
            isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {icon}
          </div>
          <h3 className="font-medium">{title}</h3>
          {isStreaming && isActive && (
            <div className="ml-2 flex items-center gap-2 text-sm text-primary">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Processing...</span>
            </div>
          )}
        </div>

        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="p-4 bg-card/30 backdrop-blur-sm">
          {content ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {/* Display raw content for debugging */}
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Content length: {content.length} characters
                </div>
                {isActive && isStreaming && (
                  <div className="flex items-center gap-2 text-xs text-primary">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Receiving data...</span>
                  </div>
                )}
              </div>

              {/* Always show the content, with special handling for JSON */}
              <pre className="whitespace-pre-wrap font-mono text-xs bg-card/50 p-4 rounded-md overflow-x-auto">
                {(() => {
                  // First, clean up the content by removing XML-like tags
                  const cleanedContent = content.replace(/<[^>]*>.*?<\/[^>]*>/gs, '').replace(/<[^>]*>/g, '');

                  // Try to extract and format JSON if possible
                  if (cleanedContent.includes('{') && cleanedContent.includes('}')) {
                    try {
                      const jsonMatch = cleanedContent.match(/(\{[\s\S]*\})/);
                      if (jsonMatch && jsonMatch[1]) {
                        const parsed = JSON.parse(jsonMatch[1]);
                        return JSON.stringify(parsed, null, 2);
                      }
                    } catch (e) {
                      // If JSON parsing fails, just return the cleaned content
                      console.log('Failed to parse JSON in content:', e);
                    }
                  }

                  // If we couldn't parse JSON or there was no JSON, return the cleaned content
                  return cleanedContent;
                })()}
                {isActive && isStreaming && (
                  <span className="inline-block ml-1 animate-pulse">▌</span>
                )}
              </pre>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {isActive && isStreaming ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p>Generating response...</p>
                </div>
              ) : (
                <p>No content available yet</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ChainDiagnosisStreamingContent() {
  const {
    streamingContent,
    isStreaming,
    currentStep,
    currentSession
  } = useChainDiagnosis();

  const roleComponents = [
    {
      key: 'medicalAnalyst',
      title: 'Medical Analyst',
      icon: <TestTube className="h-4 w-4" />,
      content: streamingContent.medicalAnalyst ||
              (currentSession?.medical_analyst_response ?
                JSON.stringify(currentSession.medical_analyst_response, null, 2) : ''),
      step: 0
    },
    {
      key: 'generalPhysician',
      title: 'General Physician',
      icon: <Stethoscope className="h-4 w-4" />,
      content: streamingContent.generalPhysician ||
              (currentSession?.general_physician_response ?
                JSON.stringify(currentSession.general_physician_response, null, 2) : ''),
      step: 1
    },
    {
      key: 'specialistDoctor',
      title: 'Specialist Doctor',
      icon: <User className="h-4 w-4" />,
      content: streamingContent.specialistDoctor ||
              (currentSession?.specialist_doctor_response ?
                JSON.stringify(currentSession.specialist_doctor_response, null, 2) : ''),
      step: 2
    },
    {
      key: 'pathologist',
      title: 'Pathologist',
      icon: <TestTube className="h-4 w-4" />,
      content: streamingContent.pathologist ||
              (currentSession?.pathologist_response ?
                JSON.stringify(currentSession.pathologist_response, null, 2) : ''),
      step: 3
    },
    {
      key: 'nutritionist',
      title: 'Nutritionist',
      icon: <Apple className="h-4 w-4" />,
      content: streamingContent.nutritionist ||
              (currentSession?.nutritionist_response ?
                JSON.stringify(currentSession.nutritionist_response, null, 2) : ''),
      step: 4
    },
    {
      key: 'pharmacist',
      title: 'Pharmacist',
      icon: <Pill className="h-4 w-4" />,
      content: streamingContent.pharmacist ||
              (currentSession?.pharmacist_response ?
                JSON.stringify(currentSession.pharmacist_response, null, 2) : ''),
      step: 5
    },
    {
      key: 'followUpSpecialist',
      title: 'Follow-up Specialist',
      icon: <Calendar className="h-4 w-4" />,
      content: streamingContent.followUpSpecialist ||
              (currentSession?.follow_up_specialist_response ?
                JSON.stringify(currentSession.follow_up_specialist_response, null, 2) : ''),
      step: 6
    },
    {
      key: 'summarizer',
      title: 'Radiance AI Summarizer',
      icon: <Brain className="h-4 w-4" />,
      content: streamingContent.summarizer ||
              (currentSession?.summarizer_response ?
                JSON.stringify(currentSession.summarizer_response, null, 2) : ''),
      step: 7
    }
  ];

  // Log streaming state for debugging
  console.log('ChainDiagnosisStreamingContent rendering:', {
    isStreaming,
    currentStep,
    medicalAnalystContent: streamingContent.medicalAnalyst ? streamingContent.medicalAnalyst.length : 0,
    hasSession: !!currentSession
  });

  // Force refresh function
  const [refreshKey, setRefreshKey] = useState(0);
  const forceRefresh = () => {
    console.log('Forcing refresh of streaming content');
    setRefreshKey(prev => prev + 1);
  };

  // Extract the medical analyst content for direct display
  const medicalAnalystContent = streamingContent.medicalAnalyst || '';
  const medicalAnalystContentPreview = medicalAnalystContent.substring(0, 500) +
    (medicalAnalystContent.length > 500 ? '...' : '');

  return (
    <AnimatedSection className="space-y-4" key={refreshKey}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">AI Responses</h2>
        <div className="flex items-center gap-3">
          {isStreaming && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing step {currentStep + 1}...</span>
            </div>
          )}

          {/* Force refresh button - only in development */}
          {process.env.NODE_ENV === 'development' && (
            <Button
              variant="outline"
              size="sm"
              onClick={forceRefresh}
              className="text-xs h-8 px-2 border-primary/20"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh UI
            </Button>
          )}
        </div>
      </div>

      {/* Direct debug output of streaming content - only in development */}
      {process.env.NODE_ENV === 'development' && medicalAnalystContent && (
        <div className="mb-6 p-4 border border-primary/20 rounded-lg bg-primary/5">
          <h3 className="text-sm font-medium text-primary mb-2">Medical Analyst Raw Content</h3>
          <div className="text-xs bg-black/20 p-3 rounded max-h-[200px] overflow-auto">
            <pre className="whitespace-pre-wrap font-mono text-[10px]">
              {medicalAnalystContentPreview}
            </pre>
          </div>
          <p className="text-xs mt-2 text-muted-foreground">
            Content length: {medicalAnalystContent.length} characters
          </p>
        </div>
      )}

      <div className="space-y-4">
        {roleComponents.map((role) => (
          <RoleContent
            key={role.key}
            title={role.title}
            icon={role.icon}
            content={role.content}
            isStreaming={isStreaming}
            isActive={currentStep === role.step}
          />
        ))}
      </div>
    </AnimatedSection>
  );
}
