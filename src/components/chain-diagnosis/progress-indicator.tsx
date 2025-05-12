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
}

function Step({ step, title, description, currentStep, error, isLoading }: StepProps) {
  const isActive = step === currentStep;
  const isCompleted = step < currentStep;
  const hasError = isActive && error;
  
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
          ) : isActive && isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            step + 1
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
  const { currentStep, isLoading, error } = useChainDiagnosis();
  
  const steps = [
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
  
  return (
    <div className="space-y-4 p-4 bg-card/50 backdrop-blur-sm rounded-xl border border-border">
      <h2 className="text-xl font-semibold mb-4">Diagnosis Progress</h2>
      
      <div className="space-y-2">
        {steps.map((step, index) => (
          <Step
            key={index}
            step={index}
            title={step.title}
            description={step.description}
            currentStep={currentStep}
            error={error}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
}
