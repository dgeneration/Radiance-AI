"use client";

import React, { useState, useEffect } from 'react';
import { useChainDiagnosis } from '@/contexts/chain-diagnosis-context';
import { Loader2, ChevronDown, ChevronUp, Brain, User, Stethoscope, TestTube, Apple, Pill, Calendar } from 'lucide-react';
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
              {/* Content status indicator */}
              {isActive && isStreaming && (
                <div className="mb-2 flex items-center justify-end">
                  <div className="flex items-center gap-2 text-xs text-primary">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Receiving data...</span>
                  </div>
                </div>
              )}

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
                    } catch {
                      // If JSON parsing fails, just return the cleaned content
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

  // Check if there's a medical report
  const hasMedicalReport = !!currentSession?.user_input.medical_report?.text ||
                          !!currentSession?.user_input.medical_report?.image_url;

  // Define all role components
  const allRoleComponents = [
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

  // Filter out the Medical Analyst step if no medical report is provided
  const roleComponents = hasMedicalReport ? allRoleComponents : allRoleComponents.slice(1);

  // Simple refresh key for component updates if needed
  const [refreshKey] = useState(0);

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

          {/* Development tools removed */}
        </div>
      </div>

      {/* Debug output removed */}

      <div className="space-y-4">
        {roleComponents.map((role, index) => {
          // Calculate if this role is active based on the current step
          // If no medical report, adjust the step comparison
          const isActive = hasMedicalReport
            ? currentStep === role.step
            : (currentStep === role.step) ||
              // When currentStep is 0 or 1 and this is the first role (General Physician)
              // This ensures the General Physician is highlighted when no medical report is provided
              ((currentStep === 0 || currentStep === 1) && index === 0 && role.key === 'generalPhysician');

          return (
            <RoleContent
              key={role.key}
              title={role.title}
              icon={role.icon}
              content={role.content}
              isStreaming={isStreaming}
              isActive={isActive}
            />
          );
        })}
      </div>
    </AnimatedSection>
  );
}
