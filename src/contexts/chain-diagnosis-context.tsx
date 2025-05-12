"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  ChainDiagnosisSession,
  ChainDiagnosisUserInput,
  MedicalAnalystResponse,
  GeneralPhysicianResponse,
  SpecialistDoctorResponse,
  PathologistResponse,
  NutritionistResponse,
  PharmacistResponse,
  FollowUpSpecialistResponse,
  RadianceAISummarizerResponse
} from '@/types/chain-diagnosis';
import {
  initializeChainDiagnosisSession,
  processMedicalAnalyst,
  processGeneralPhysician,
  processSpecialistDoctor,
  processPathologist,
  processNutritionist,
  processPharmacist,
  processFollowUpSpecialist,
  processRadianceAISummarizer,
  getChainDiagnosisSession,
  getUserChainDiagnosisSessions
} from '@/lib/chain-diagnosis-api';
import { FileMetadata } from '@/utils/supabase/file-storage';
import { convertToChainDiagnosisInput } from '@/utils/chain-diagnosis-file-utils';

// Define the context type
interface ChainDiagnosisContextType {
  // Session state
  currentSession: ChainDiagnosisSession | null;
  userSessions: ChainDiagnosisSession[];
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
  loadUserSessions: (userId: string) => Promise<boolean>;

  processNextStep: () => Promise<boolean>;
  resetSession: () => void;
}

// Create the context
const ChainDiagnosisContext = createContext<ChainDiagnosisContextType | undefined>(undefined);

// Provider component
export function ChainDiagnosisProvider({ children }: { children: ReactNode }) {
  // Session state
  const [currentSession, setCurrentSession] = useState<ChainDiagnosisSession | null>(null);
  const [userSessions, setUserSessions] = useState<ChainDiagnosisSession[]>([]);
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

  // Handle streaming response updates
  const handleStreamingResponse = useCallback((role: keyof typeof streamingContent, chunk: string, isComplete: boolean) => {
    setStreamingContent(prev => ({
      ...prev,
      [role]: prev[role] + chunk
    }));

    if (isComplete) {
      setIsStreaming(false);
    }
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

      // Initialize a new session
      const session = await initializeChainDiagnosisSession(userInput);
      setCurrentSession(session);
      setCurrentStep(0);

      // Reset all streaming content
      Object.keys(streamingContent).forEach(role => {
        resetStreamingContent(role as keyof typeof streamingContent);
      });

      return session.id;
    } catch (error) {
      console.error('Error starting new Chain Diagnosis session:', error);
      setError('Failed to start a new diagnosis session. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [streamingContent, resetStreamingContent]);

  // Load an existing session
  const loadSession = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const session = await getChainDiagnosisSession(sessionId);

      if (!session) {
        setError('Session not found');
        return false;
      }

      setCurrentSession(session);
      setCurrentStep(session.current_step);

      return true;
    } catch (error) {
      console.error('Error loading Chain Diagnosis session:', error);
      setError('Failed to load the diagnosis session. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load all sessions for a user
  const loadUserSessions = useCallback(async (userId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const sessions = await getUserChainDiagnosisSessions(userId);
      setUserSessions(sessions);

      return true;
    } catch (error) {
      console.error('Error loading user Chain Diagnosis sessions:', error);
      setError('Failed to load your diagnosis history. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Process the next step in the Chain Diagnosis flow
  const processNextStep = useCallback(async (): Promise<boolean> => {
    if (!currentSession) {
      setError('No active session');
      return false;
    }

    try {
      setIsLoading(true);
      setIsStreaming(true);
      setError(null);

      const { id: sessionId, user_input: userInput } = currentSession;

      // Determine which step to process based on the current step
      switch (currentStep) {
        case 0: // Medical Analyst (only if medical report is present)
          resetStreamingContent('medicalAnalyst');

          try {
            // Process Medical Analyst step
            const response = await processMedicalAnalyst(
              sessionId,
              userInput,
              true,
              (chunk, isComplete) => handleStreamingResponse('medicalAnalyst', chunk, isComplete)
            );

            // If no response (no medical report), just move to the next step
            if (!response) {
              console.log('No medical report provided, skipping to General Physician');
            }

            // Move to the next step regardless of whether we got a response
            setCurrentStep(1);
          } catch (error) {
            console.error('Error in Medical Analyst step:', error);
            setError(error instanceof Error ? error.message : 'Unknown error in Medical Analyst step');
            // Still move to the next step even if there was an error
            setCurrentStep(1);
          }
          break;

        case 1: // General Physician
          resetStreamingContent('generalPhysician');
          await processGeneralPhysician(
            sessionId,
            userInput,
            currentSession.medical_analyst_response,
            true,
            (chunk, isComplete) => handleStreamingResponse('generalPhysician', chunk, isComplete)
          );
          setCurrentStep(2);
          break;

        case 2: // Specialist Doctor
          resetStreamingContent('specialistDoctor');
          if (!currentSession.general_physician_response) {
            setError('General Physician response is required before proceeding to Specialist Doctor');
            return false;
          }

          await processSpecialistDoctor(
            sessionId,
            userInput,
            currentSession.general_physician_response,
            currentSession.medical_analyst_response,
            true,
            (chunk, isComplete) => handleStreamingResponse('specialistDoctor', chunk, isComplete)
          );
          setCurrentStep(3);
          break;

        case 3: // Pathologist
          resetStreamingContent('pathologist');
          if (!currentSession.specialist_doctor_response) {
            setError('Specialist Doctor response is required before proceeding to Pathologist');
            return false;
          }

          await processPathologist(
            sessionId,
            userInput,
            currentSession.specialist_doctor_response,
            currentSession.general_physician_response,
            currentSession.medical_analyst_response,
            true,
            (chunk, isComplete) => handleStreamingResponse('pathologist', chunk, isComplete)
          );
          setCurrentStep(4);
          break;

        case 4: // Nutritionist
          resetStreamingContent('nutritionist');
          if (!currentSession.specialist_doctor_response || !currentSession.pathologist_response) {
            setError('Specialist Doctor and Pathologist responses are required before proceeding to Nutritionist');
            return false;
          }

          await processNutritionist(
            sessionId,
            userInput,
            currentSession.specialist_doctor_response,
            currentSession.pathologist_response,
            true,
            (chunk, isComplete) => handleStreamingResponse('nutritionist', chunk, isComplete)
          );
          setCurrentStep(5);
          break;

        case 5: // Pharmacist
          resetStreamingContent('pharmacist');
          if (!currentSession.specialist_doctor_response ||
              !currentSession.pathologist_response ||
              !currentSession.nutritionist_response) {
            setError('Previous responses are required before proceeding to Pharmacist');
            return false;
          }

          await processPharmacist(
            sessionId,
            userInput,
            currentSession.specialist_doctor_response,
            currentSession.pathologist_response,
            currentSession.nutritionist_response,
            true,
            (chunk, isComplete) => handleStreamingResponse('pharmacist', chunk, isComplete)
          );
          setCurrentStep(6);
          break;

        case 6: // Follow-up Specialist
          resetStreamingContent('followUpSpecialist');
          if (!currentSession.general_physician_response ||
              !currentSession.specialist_doctor_response ||
              !currentSession.pathologist_response ||
              !currentSession.nutritionist_response ||
              !currentSession.pharmacist_response) {
            setError('Previous responses are required before proceeding to Follow-up Specialist');
            return false;
          }

          await processFollowUpSpecialist(
            sessionId,
            userInput,
            {
              medicalAnalyst: currentSession.medical_analyst_response,
              generalPhysician: currentSession.general_physician_response,
              specialistDoctor: currentSession.specialist_doctor_response,
              pathologist: currentSession.pathologist_response,
              nutritionist: currentSession.nutritionist_response,
              pharmacist: currentSession.pharmacist_response
            },
            true,
            (chunk, isComplete) => handleStreamingResponse('followUpSpecialist', chunk, isComplete)
          );
          setCurrentStep(7);
          break;

        case 7: // Radiance AI Summarizer
          resetStreamingContent('summarizer');
          if (!currentSession.general_physician_response ||
              !currentSession.specialist_doctor_response ||
              !currentSession.pathologist_response ||
              !currentSession.nutritionist_response ||
              !currentSession.pharmacist_response ||
              !currentSession.follow_up_specialist_response) {
            setError('All previous responses are required before proceeding to Summarizer');
            return false;
          }

          await processRadianceAISummarizer(
            sessionId,
            userInput,
            {
              medicalAnalyst: currentSession.medical_analyst_response,
              generalPhysician: currentSession.general_physician_response,
              specialistDoctor: currentSession.specialist_doctor_response,
              pathologist: currentSession.pathologist_response,
              nutritionist: currentSession.nutritionist_response,
              pharmacist: currentSession.pharmacist_response,
              followUpSpecialist: currentSession.follow_up_specialist_response
            },
            true,
            (chunk, isComplete) => handleStreamingResponse('summarizer', chunk, isComplete)
          );
          setCurrentStep(8);
          break;

        case 8: // Completed
          setError('Diagnosis process is already complete');
          return false;
      }

      // Reload the session to get the updated data
      await loadSession(sessionId);

      return true;
    } catch (error) {
      console.error('Error processing Chain Diagnosis step:', error);
      setError('Failed to process the diagnosis step. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [currentSession, currentStep, handleStreamingResponse, loadSession, resetStreamingContent]);

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
  const contextValue: ChainDiagnosisContextType = {
    currentSession,
    userSessions,
    isLoading,
    error,
    streamingContent,
    isStreaming,
    currentStep,
    startNewSession,
    loadSession,
    loadUserSessions,
    processNextStep,
    resetSession
  };

  return (
    <ChainDiagnosisContext.Provider value={contextValue}>
      {children}
    </ChainDiagnosisContext.Provider>
  );
}

// Custom hook to use the Chain Diagnosis context
export function useChainDiagnosis() {
  const context = useContext(ChainDiagnosisContext);

  if (context === undefined) {
    throw new Error('useChainDiagnosis must be used within a ChainDiagnosisProvider');
  }

  return context;
}
