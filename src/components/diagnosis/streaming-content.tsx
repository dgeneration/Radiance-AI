"use client";

import React, { useState, useEffect } from 'react';
import { useChainDiagnosis } from '@/contexts/diagnosis-context';
import {
  Loader2, ChevronDown, ChevronUp, Brain, Stethoscope, TestTube,
  Apple, Pill, Calendar, Microscope, HeartPulse, Activity,
  Sparkles, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatedSection, AnimatedIcon } from '@/components/animations';
import { motion } from 'framer-motion';
import { isDeveloperModeEnabled } from '@/lib/developer-mode';

interface RoleContentProps {
  title: string;
  icon: React.ReactNode;
  content: string;
  isStreaming: boolean;
  isActive: boolean;
  forceStreaming?: boolean;
}

function RoleContent({ title, icon, content, isStreaming, isActive, forceStreaming = false }: RoleContentProps) {
  const [isExpanded, setIsExpanded] = useState(false);



  // Auto-expand when content is being streamed or when the role is active
  useEffect(() => {
    // Auto-expand when streaming starts for any role or when forceStreaming is true
    if (isStreaming || forceStreaming) {
      setIsExpanded(true);
    }

    // Also auto-expand when this role becomes active, even if not streaming
    if (isActive) {
      setIsExpanded(true);
    }
  }, [isStreaming, isActive, forceStreaming]);

  return (
    <motion.div
      className={cn(
        "border rounded-xl overflow-hidden transition-all",
        isActive ? "border-primary/30 bg-primary/5" : "border-border",
        isExpanded ? "shadow-lg" : "shadow-sm"
      )}
      initial={{ opacity: 0.9, y: 5 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isActive ? 1 : 0.99,
        borderColor: isActive ? "rgba(0, 198, 215, 0.3)" : "rgba(255, 255, 255, 0.1)"
      }}
      transition={{ duration: 0.3 }}
      whileHover={{
        scale: 1.005,
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)"
      }}
    >
      <div
        className={cn(
          "flex items-center justify-between p-5 cursor-pointer",
          isActive ? "bg-primary/10" : "bg-card/50"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <AnimatedIcon
            icon={icon}
            className={cn(
              "p-3 rounded-full",
              isActive ? "bg-primary/20 text-primary" : "bg-muted/30 text-muted-foreground"
            )}
            containerClassName="flex-shrink-0"
            pulseEffect={isActive && isStreaming}
            hoverScale={1.05}
          />
          <div>
            <h3 className={cn(
              "font-medium text-base",
              isActive && "text-primary"
            )}>{title}</h3>

            {isActive && isStreaming && (
              <Badge
                variant="outline"
                className="mt-1 bg-primary/10 text-primary border-primary/20 px-2 py-0 text-xs font-normal"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Thinking...
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isStreaming && isActive && (
            <div className="flex items-center gap-2 text-xs text-primary mr-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Processing</span>
            </div>
          )}
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{
          height: isExpanded ? "auto" : 0,
          opacity: isExpanded ? 1 : 0
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="p-5 bg-card/30 backdrop-blur-sm border-t border-border/50">
          {content ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {/* Content status indicator */}
              {isActive && isStreaming && (
                <div className="mb-3 flex items-center justify-end">
                  <div className="flex items-center gap-2 text-xs text-primary bg-primary/5 px-3 py-1 rounded-full">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Receiving data...</span>
                  </div>
                </div>
              )}

              {/* Always show the content, with special handling for JSON */}
              <pre className="whitespace-pre-wrap font-mono text-xs bg-card/50 p-5 rounded-xl border border-border/50 overflow-x-auto">
                {(() => {
                  // First, clean up the content by removing XML-like tags
                  const cleanedContent = content.replace(/<[^>]*>.*?<\/[^>]*>/gs, '').replace(/<[^>]*>/g, '');



                  // For all roles, show raw content during streaming or when forceStreaming is true
                  // This is the key change - we're no longer checking isActive
                  if (isStreaming || forceStreaming) {
                    return cleanedContent || "Waiting for content...";
                  }

                  // If we're not streaming, try to extract and format JSON if possible
                  if (cleanedContent.includes('{') && cleanedContent.includes('}')) {
                    try {
                      const jsonMatch = cleanedContent.match(/(\{[\s\S]*\})/);
                      if (jsonMatch && jsonMatch[1]) {
                        const parsed = JSON.parse(jsonMatch[1]);
                        return JSON.stringify(parsed, null, 2);
                      }
                    } catch {
                      // If JSON parsing fails, return the cleaned content
                    }
                  }

                  // If we couldn't parse JSON or there was no JSON, return the cleaned content
                  return cleanedContent || "No content available";
                })()}
                {(isStreaming || forceStreaming) && (
                  <span className="inline-block ml-1 animate-pulse">▌</span>
                )}
              </pre>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              {isActive && isStreaming ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping opacity-75"></div>
                    <Loader2 className="h-8 w-8 animate-spin text-primary relative" />
                  </div>
                  <div>
                    <p className="font-medium text-primary">Generating response...</p>
                    <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-muted-foreground/70" />
                  <p>No content available yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
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

  // Define all role components with improved icons
  const allRoleComponents = [
    {
      key: 'medicalAnalyst',
      title: 'Medical Analyst',
      icon: <Microscope className="h-5 w-5" />,
      content: streamingContent.medicalAnalyst ||
              (currentSession?.medical_analyst_response ?
                JSON.stringify(currentSession.medical_analyst_response, null, 2) : ''),
      step: 0,
      // Force streaming to true for Medical Analyst if there's content
      forceStreaming: !!streamingContent.medicalAnalyst
    },
    {
      key: 'generalPhysician',
      title: 'General Physician',
      icon: <Stethoscope className="h-5 w-5" />,
      content: streamingContent.generalPhysician ||
              (currentSession?.general_physician_response ?
                JSON.stringify(currentSession.general_physician_response, null, 2) : ''),
      step: 1,
      forceStreaming: !!streamingContent.generalPhysician
    },
    {
      key: 'specialistDoctor',
      title: 'Specialist Doctor',
      icon: <HeartPulse className="h-5 w-5" />,
      content: streamingContent.specialistDoctor ||
              (currentSession?.specialist_doctor_response ?
                JSON.stringify(currentSession.specialist_doctor_response, null, 2) : ''),
      step: 2,
      forceStreaming: !!streamingContent.specialistDoctor
    },
    {
      key: 'pathologist',
      title: 'Pathologist',
      icon: <TestTube className="h-5 w-5" />,
      content: streamingContent.pathologist ||
              (currentSession?.pathologist_response ?
                JSON.stringify(currentSession.pathologist_response, null, 2) : ''),
      step: 3,
      forceStreaming: !!streamingContent.pathologist
    },
    {
      key: 'nutritionist',
      title: 'Nutritionist',
      icon: <Apple className="h-5 w-5" />,
      content: streamingContent.nutritionist ||
              (currentSession?.nutritionist_response ?
                JSON.stringify(currentSession.nutritionist_response, null, 2) : ''),
      step: 4,
      forceStreaming: !!streamingContent.nutritionist
    },
    {
      key: 'pharmacist',
      title: 'Pharmacist',
      icon: <Pill className="h-5 w-5" />,
      content: streamingContent.pharmacist ||
              (currentSession?.pharmacist_response ?
                JSON.stringify(currentSession.pharmacist_response, null, 2) : ''),
      step: 5,
      forceStreaming: !!streamingContent.pharmacist
    },
    {
      key: 'followUpSpecialist',
      title: 'Follow-up Specialist',
      icon: <Calendar className="h-5 w-5" />,
      content: streamingContent.followUpSpecialist ||
              (currentSession?.follow_up_specialist_response ?
                JSON.stringify(currentSession.follow_up_specialist_response, null, 2) : ''),
      step: 6,
      forceStreaming: !!streamingContent.followUpSpecialist
    },
    {
      key: 'summarizer',
      title: 'Radiance AI Summarizer',
      icon: <Brain className="h-5 w-5" />,
      content: streamingContent.summarizer ||
              (currentSession?.summarizer_response ?
                JSON.stringify(currentSession.summarizer_response, null, 2) : ''),
      step: 7,
      forceStreaming: !!streamingContent.summarizer
    }
  ];

  // Filter out the Medical Analyst step if no medical report is provided
  const roleComponents = hasMedicalReport ? allRoleComponents : allRoleComponents.slice(1);

  // Simple refresh key for component updates if needed
  const [refreshKey] = useState(0);

  // Check if developer mode is enabled
  const [developerMode, setDeveloperMode] = useState(false);
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

  return (
    developerMode ? (
      <AnimatedSection className="space-y-6" key={refreshKey}>
        <div className="flex items-center justify-between mb-6 bg-card/50 p-5 rounded-xl border border-border/50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AI Diagnosis Chain
              </h2>
              <p className="text-sm text-muted-foreground">
                Multi-agent analysis of your health data
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isStreaming && (
              <div className="flex items-center gap-2 text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-full">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing step {currentStep + 1}...</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          {roleComponents.map((role) => {
            // Calculate if this role is active based on the current step
            // If no medical report, adjust the step comparison
            let isActive = false;

            if (hasMedicalReport) {
              // With medical report, use standard step comparison
              isActive = currentStep === role.step;
            } else {
              // Without medical report, General Physician is active when currentStep is 0 or 1
              if (role.key === 'generalPhysician') {
                isActive = currentStep === 1 || currentStep === 0;
              } else {
                isActive = currentStep === role.step;
              }
            }

            // Determine if this role should be streaming
            const shouldStream = isStreaming && (
              isActive ||
              (role.key === 'generalPhysician' && (currentStep === 0 || currentStep === 1))
            );

            return (
              <RoleContent
                key={role.key}
                title={role.title}
                icon={role.icon}
                content={role.content}
                isStreaming={shouldStream}
                isActive={isActive}
                forceStreaming={role.forceStreaming}
              />
            );
          })}
        </div>
      </AnimatedSection>
    ) : null
  );
}
