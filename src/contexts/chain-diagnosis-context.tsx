"use client";

import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
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
  isReloading: boolean;
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

  // Reference to processNextStep for use in startNewSession
  const processNextStepRef = useRef<(() => Promise<boolean>) | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isReloading, setIsReloading] = useState(false);

  // Reset the streaming content for a specific role
  const resetStreamingContent = useCallback((role: keyof typeof streamingContent) => {
    setStreamingContent(prev => ({
      ...prev,
      [role]: ''
    }));
  }, []);

  // Handle streaming response updates
  const handleStreamingResponse = useCallback((role: keyof typeof streamingContent, chunk: string, isComplete: boolean) => {
    // Ensure streaming state is set to true when receiving chunks
    if (!isComplete && chunk.length > 0) {
      setIsStreaming(true);
    }

    // Update the streaming content
    setStreamingContent(prev => {
      // If this is a complete response and it's large, it might be a full response
      // In this case, replace the content instead of appending
      let updatedContent;
      if (isComplete && chunk.length > 1000 && prev[role].length < chunk.length) {
        updatedContent = chunk;
      } else {
        updatedContent = prev[role] + chunk;
      }

      // Force a re-render by creating a new object
      return {
        ...prev,
        [role]: updatedContent
      };
    });

    if (isComplete) {
      // Add a small delay before setting streaming to false to ensure UI updates
      setTimeout(() => {
        setIsStreaming(false);
      }, 500);
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

      try {
        // Try to initialize a new session in the database
        const session = await initializeChainDiagnosisSession(userInput);
        setCurrentSession(session);
        setCurrentStep(0);

        // Reset all streaming content
        Object.keys(streamingContent).forEach(role => {
          resetStreamingContent(role as keyof typeof streamingContent);
        });

        // Automatically process the first step (Medical Analyst)
        setTimeout(async () => {
          try {
            if (processNextStepRef.current) {
              await processNextStepRef.current();
            }
          } catch (error) {
            setError('Error starting diagnosis process. Please try again.');
          }
        }, 1000);

        return session.id;
      } catch (dbError) {
        // Fallback to in-memory session if database operations fail

        // Create a session ID
        const sessionId = crypto.randomUUID();

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

        // Show a warning to the user
        setError('Warning: Using temporary session. Your diagnosis will not be saved permanently.');

        // Automatically process the first step (Medical Analyst) even in fallback mode
        setTimeout(async () => {
          try {
            if (processNextStepRef.current) {
              await processNextStepRef.current();
            }
          } catch (error) {
            setError('Error starting diagnosis process. Please try again.');
          }
        }, 1000);

        return sessionId;
      }
    } catch (error) {
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
      setIsStreaming(true); // Set streaming state to true at the beginning
      setError(null);

      const { id: sessionId, user_input: userInput } = currentSession;

      // Determine which step to process based on the current step
      switch (currentStep) {
        case 0: // Medical Analyst (only if medical report is present)
          resetStreamingContent('medicalAnalyst');

          try {
            // Check if there's a medical report or image URL
            const hasMedicalReport = !!userInput.medical_report?.text || !!userInput.medical_report?.image_url;

            if (!hasMedicalReport) {
              // Skip directly to General Physician if no medical report
              setCurrentStep(1);
            } else {
              // Check if there's an image URL
              const hasImageUrl = !!userInput.medical_report?.image_url;

              // Process Medical Analyst step - disable streaming if image URL is present
              const response = await processMedicalAnalyst(
                sessionId,
                userInput,
                !hasImageUrl, // Disable streaming for image URLs
                hasImageUrl ? undefined : (chunk, isComplete) => handleStreamingResponse('medicalAnalyst', chunk, isComplete)
              );

              // If streaming is disabled, manually set the streaming content to the response
              if (hasImageUrl && response) {
                resetStreamingContent('medicalAnalyst');
                const responseContent = JSON.stringify(response, null, 2);
                handleStreamingResponse('medicalAnalyst', responseContent, true);

                // Force a UI update by updating the current session directly
                setCurrentSession(prev => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    medical_analyst_response: response
                  };
                });

                // Schedule a page reload after a short delay to ensure the data is saved
                setIsReloading(true); // Set reloading state to show loading indicator
                setTimeout(() => {
                  window.location.reload();
                }, 2000);
              }

              // Move to the next step regardless of whether we got a response
              setCurrentStep(1);
            }
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

      try {
        // Try to reload the session to get the updated data
        const success = await loadSession(sessionId);

        // If we just processed the Medical Analyst step with an image, reload the page
        if (success && currentStep === 0 && currentSession?.user_input.medical_report?.image_url) {
          setIsReloading(true); // Set reloading state to show loading indicator
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } catch (loadError) {
        // Continue with the in-memory session if database operations fail
        setError('Warning: Using in-memory session. Your diagnosis may not be saved permanently.');
      }

      return true;
    } catch (error) {
      setError('Failed to process the diagnosis step. Please try again.');
      return false;
    } finally {
      setIsLoading(false);

      // Add a small delay before setting isStreaming to false
      // This ensures that any final streaming updates are properly displayed
      setTimeout(() => {
        setIsStreaming(false);
      }, 1000);
    }
  }, [currentSession, currentStep, handleStreamingResponse, loadSession, resetStreamingContent]);

  // Store a reference to processNextStep for use in startNewSession
  processNextStepRef.current = processNextStep;

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
    isReloading,
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
