"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { 
  ChainDiagnosisUserInput,
  MedicalAnalystResponse,
  GeneralPhysicianResponse,
  SpecialistDoctorResponse,
  PathologistResponse,
  NutritionistResponse,
  PharmacistResponse,
  FollowUpSpecialistResponse,
  RadianceAISummarizerResponse,
  ChainDiagnosisSession
} from '@/types/chain-diagnosis';
import { v4 as uuidv4 } from 'uuid';
import { FileMetadata } from '@/utils/supabase/file-storage';
import { convertToChainDiagnosisInput } from '@/utils/chain-diagnosis-file-utils';

// Define the context type
interface SimplifiedChainDiagnosisContextType {
  // Session state
  currentSession: ChainDiagnosisSession | null;
  isLoading: boolean;
  error: string | null;
  
  // Streaming state
  streamingContent: {
    medicalAnalyst: string;
    generalPhysician: string;
    specialistDoctor: string;
    pathologist: string;
    nutritionist: string;
    pharmacist: string;
    followUpSpecialist: string;
    summarizer: string;
  };
  isStreaming: boolean;
  currentStep: number;
  
  // Actions
  startNewSession: (
    userId: string,
    userProfile: any,
    symptomData: any,
    selectedFiles?: FileMetadata[]
  ) => Promise<string | null>;
  
  loadSession: (sessionId: string) => Promise<boolean>;
  processNextStep: () => Promise<boolean>;
  resetSession: () => void;
}

// Create the context
const SimplifiedChainDiagnosisContext = createContext<SimplifiedChainDiagnosisContextType | undefined>(undefined);

// Provider component
export function SimplifiedChainDiagnosisProvider({ children }: { children: ReactNode }) {
  // Session state
  const [currentSession, setCurrentSession] = useState<ChainDiagnosisSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Streaming state
  const [streamingContent, setStreamingContent] = useState({
    medicalAnalyst: '',
    generalPhysician: '',
    specialistDoctor: '',
    pathologist: '',
    nutritionist: '',
    pharmacist: '',
    followUpSpecialist: '',
    summarizer: ''
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Reset the streaming content for a specific role
  const resetStreamingContent = useCallback((role: keyof typeof streamingContent) => {
    setStreamingContent(prev => ({
      ...prev,
      [role]: ''
    }));
  }, []);
  
  // Start a new Chain Diagnosis session
  const startNewSession = useCallback(async (
    userId: string,
    userProfile: any,
    symptomData: any,
    selectedFiles?: FileMetadata[]
  ): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Convert user data to Chain Diagnosis input format
      const userInput = await convertToChainDiagnosisInput(
        userId,
        userProfile,
        symptomData,
        selectedFiles
      );
      
      // Create a session ID
      const sessionId = uuidv4();
      
      // Create a session object in memory (not in the database)
      const session: ChainDiagnosisSession = {
        id: sessionId,
        user_id: userId,
        created_at: new Date().toISOString(),
        user_input: userInput,
        status: 'in_progress',
        current_step: 0
      };
      
      // Store the session in memory
      setCurrentSession(session);
      setCurrentStep(0);
      
      // Reset all streaming content
      Object.keys(streamingContent).forEach(role => {
        resetStreamingContent(role as keyof typeof streamingContent);
      });
      
      return sessionId;
    } catch (error) {
      console.error('Error starting new Chain Diagnosis session:', error);
      setError('Failed to start a new diagnosis session. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [streamingContent, resetStreamingContent]);
  
  // Load an existing session (simplified to just return the current session)
  const loadSession = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!currentSession || currentSession.id !== sessionId) {
        setError('Session not found');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error loading Chain Diagnosis session:', error);
      setError('Failed to load the diagnosis session. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentSession]);
  
  // Process the Medical Analyst step
  const processMedicalAnalyst = useCallback(async () => {
    if (!currentSession) return null;
    
    const { user_input: userInput } = currentSession;
    
    // Skip if no medical report is present
    if (!userInput.medical_report?.text) {
      console.log('No medical report provided, skipping Medical Analyst AI step');
      return null;
    }
    
    setIsStreaming(true);
    resetStreamingContent('medicalAnalyst');
    
    try {
      // Call the test-medical-analyst API
      const response = await fetch('/api/test-medical-analyst', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ medicalReport: userInput.medical_report.text }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data: MedicalAnalystResponse = await response.json();
      
      // Update the session in memory
      setCurrentSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          medical_analyst_response: data
        };
      });
      
      // Update streaming content
      setStreamingContent(prev => ({
        ...prev,
        medicalAnalyst: JSON.stringify(data, null, 2)
      }));
      
      return data;
    } catch (error) {
      console.error('Error in Medical Analyst step:', error);
      setError(error instanceof Error ? error.message : 'Unknown error in Medical Analyst step');
      return null;
    } finally {
      setIsStreaming(false);
    }
  }, [currentSession, resetStreamingContent]);
  
  // Process the next step in the Chain Diagnosis flow
  const processNextStep = useCallback(async (): Promise<boolean> => {
    if (!currentSession) {
      setError('No active session');
      return false;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Determine which step to process based on the current step
      switch (currentStep) {
        case 0: // Medical Analyst
          await processMedicalAnalyst();
          setCurrentStep(1);
          break;
          
        case 1: // General Physician
          // For now, just move to the next step
          setCurrentStep(2);
          break;
          
        case 2: // Specialist Doctor
          // For now, just move to the next step
          setCurrentStep(3);
          break;
          
        case 3: // Pathologist
          // For now, just move to the next step
          setCurrentStep(4);
          break;
          
        case 4: // Nutritionist
          // For now, just move to the next step
          setCurrentStep(5);
          break;
          
        case 5: // Pharmacist
          // For now, just move to the next step
          setCurrentStep(6);
          break;
          
        case 6: // Follow-up Specialist
          // For now, just move to the next step
          setCurrentStep(7);
          break;
          
        case 7: // Radiance AI Summarizer
          // For now, just move to the next step
          setCurrentStep(8);
          break;
          
        case 8: // Completed
          setError('Diagnosis process is already complete');
          return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error processing Chain Diagnosis step:', error);
      setError('Failed to process the diagnosis step. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentSession, currentStep, processMedicalAnalyst]);
  
  // Reset the current session
  const resetSession = useCallback(() => {
    setCurrentSession(null);
    setCurrentStep(0);
    
    // Reset all streaming content
    Object.keys(streamingContent).forEach(role => {
      resetStreamingContent(role as keyof typeof streamingContent);
    });
  }, [streamingContent, resetStreamingContent]);
  
  // Context value
  const contextValue: SimplifiedChainDiagnosisContextType = {
    currentSession,
    isLoading,
    error,
    streamingContent,
    isStreaming,
    currentStep,
    startNewSession,
    loadSession,
    processNextStep,
    resetSession
  };
  
  return (
    <SimplifiedChainDiagnosisContext.Provider value={contextValue}>
      {children}
    </SimplifiedChainDiagnosisContext.Provider>
  );
}

// Custom hook to use the Chain Diagnosis context
export function useSimplifiedChainDiagnosis() {
  const context = useContext(SimplifiedChainDiagnosisContext);
  
  if (context === undefined) {
    throw new Error('useSimplifiedChainDiagnosis must be used within a SimplifiedChainDiagnosisProvider');
  }
  
  return context;
}
