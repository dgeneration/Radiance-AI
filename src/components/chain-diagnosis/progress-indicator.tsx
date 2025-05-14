"use client";

import React from 'react';
import { useChainDiagnosis } from '@/contexts/chain-diagnosis-context';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepProps {
  step: number;
  title: string;
  description: string;
  currentStep: number;
  error: string | null;
  isLoading: boolean;
  isStreaming: boolean;
}

function Step({ step, title, description, currentStep, error, isLoading, isStreaming }: StepProps) {
  // For display purposes, we need to show the step number starting from 1
  const displayStepNumber = step + 1;

  // If currentStep is the same as step, this step is active
  // This allows the parent component to explicitly mark a step as active
  const isActive = step === currentStep;
  const isCompleted = step < currentStep;
  const hasError = isActive && error;

  // Show loading animation if this step is active and either isLoading or isStreaming is true
  const showLoading = isActive && (isLoading || isStreaming);

  return (
    <div className={cn(
      "flex items-start gap-4 p-4 rounded-lg transition-all",
      isActive && "bg-primary/10 border border-primary/20",
      isCompleted && "opacity-80"
    )}>
      <div className="flex-shrink-0">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
          isCompleted ? "bg-green-500 text-white" :
          isActive ? "bg-primary text-white" :
          "bg-muted text-muted-foreground"
        )}>
          {isCompleted ? (
            <Check className="h-5 w-5" />
          ) : showLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            displayStepNumber
          )}
        </div>
      </div>

      <div className="flex-1 space-y-1">
        <h3 className={cn(
          "font-medium",
          isActive && "text-primary",
          isCompleted && "text-green-500"
        )}>
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>

        {hasError && (
          <div className="mt-2 p-2 bg-destructive/10 text-destructive rounded flex items-start gap-2 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ChainDiagnosisProgressIndicator() {
  const { currentStep, isLoading, isStreaming, error, currentSession } = useChainDiagnosis();

  // Check if there's a medical report
  const hasMedicalReport = !!currentSession?.user_input.medical_report?.text ||
                          !!currentSession?.user_input.medical_report?.image_url;

  // Define all possible steps
  const allSteps = [
    {
      title: "Medical Analyst",
      description: "Analyzing medical reports and test results"
    },
    {
      title: "General Physician",
      description: "Initial assessment of symptoms and medical history"
    },
    {
      title: "Specialist Doctor",
      description: "Detailed analysis from a specialist perspective"
    },
    {
      title: "Pathologist",
      description: "Insights on lab tests and pathological findings"
    },
    {
      title: "Nutritionist",
      description: "Dietary and nutritional recommendations"
    },
    {
      title: "Pharmacist",
      description: "Medication information and considerations"
    },
    {
      title: "Follow-up Specialist",
      description: "Monitoring guidelines and follow-up recommendations"
    },
    {
      title: "Radiance AI Summarizer",
      description: "Comprehensive summary of all insights"
    }
  ];

  // If no medical report, skip the Medical Analyst step
  const steps = hasMedicalReport ? allSteps : allSteps.slice(1);

  return (
    <div className="space-y-4 p-4 bg-card/50 backdrop-blur-sm rounded-xl border border-border">
      <h2 className="text-xl font-semibold mb-4">Diagnosis Progress</h2>

      <div className="space-y-2">
        {steps.map((step, index) => {
          // Calculate the actual step number in the full process
          const actualStepNumber = hasMedicalReport ? index : index + 1;

          // Determine if this step is active
          // If no medical report and this is the first step (General Physician),
          // it should be active when currentStep is 0 or 1
          const isStepActive = hasMedicalReport
            ? actualStepNumber === currentStep
            : (index === 0 && (currentStep === 0 || currentStep === 1)) || actualStepNumber === currentStep;

          return (
            <Step
              key={index}
              step={actualStepNumber}
              title={step.title}
              description={step.description}
              currentStep={isStepActive ? actualStepNumber : currentStep}
              error={error}
              isLoading={isLoading}
              isStreaming={isStreaming}
            />
          );
        })}
      </div>
    </div>
  );
}
