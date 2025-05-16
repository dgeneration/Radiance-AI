"use client";

import React, { createContext, useContext, useState, useCallback, useRef, ReactNode, useEffect } from 'react';
import {
  ChainDiagnosisSession
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
    userProfile: Record<string, unknown> | null,
    symptomData: Record<string, unknown>,
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

  // Ensure userSessions is always an array
  useEffect(() => {
    if (!Array.isArray(userSessions)) {
      setUserSessions([]);
    }
  }, [userSessions]);

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
    userProfile: Record<string, unknown> | null,
    symptomData: Record<string, unknown>,
    selectedFiles?: FileMetadata[]
  ): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Convert user data to Chain Diagnosis input format
      const userInput = await convertToChainDiagnosisInput(
        userId,
        userProfile || {}, // Provide an empty object if userProfile is null
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

        // Set streaming state to true immediately to show "Thinking" tag
        setIsStreaming(true);

        // Automatically process the first step (Medical Analyst)
        setTimeout(async () => {
          try {
            if (processNextStepRef.current) {
              await processNextStepRef.current();
            }
          } catch {
            setError('Error starting diagnosis process. Please try again.');
            // Make sure to reset streaming state if there's an error
            setIsStreaming(false);
          }
        }, 1000);

        return session.id;
      } catch {
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

        // Set streaming state to true immediately to show "Thinking" tag
        setIsStreaming(true);

        // Automatically process the first step (Medical Analyst) even in fallback mode
        setTimeout(async () => {
          try {
            if (processNextStepRef.current) {
              await processNextStepRef.current();
            }
          } catch {
            setError('Error starting diagnosis process. Please try again.');
            // Make sure to reset streaming state if there's an error
            setIsStreaming(false);
          }
        }, 1000);

        return sessionId;
      }
    } catch {
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

      // Check if we should auto-continue based on localStorage flag
      const shouldAutoContinue = localStorage.getItem('auto_continue_to_general_physician') === 'true';
      const storedSessionId = localStorage.getItem('auto_continue_session_id');

      // If we have a Medical Analyst response but no General Physician response,
      // and either the auto-continue flag is set or we're resuming a session that was in progress,
      // automatically process the General Physician step
      if (session.medical_analyst_response && !session.general_physician_response &&
          (shouldAutoContinue && storedSessionId === sessionId)) {
        // Clear the flags
        localStorage.removeItem('auto_continue_to_general_physician');
        localStorage.removeItem('auto_continue_session_id');

        // Wait a short delay to ensure the UI is fully loaded
        setTimeout(async () => {
          try {
            // Set the current step to 1 (General Physician)
            setCurrentStep(1);

            // Set loading and streaming states
            setIsLoading(true);
            setIsStreaming(true);



            // Directly call processGeneralPhysician instead of using processNextStep
            const response = await processGeneralPhysician(
              sessionId,
              session.user_input,
              session.medical_analyst_response,
              false,  // Enable streaming to show "Thinking" tag
              (chunk, isComplete) => handleStreamingResponse('generalPhysician', chunk, isComplete)
            );

            // Force a UI update by updating the current session directly
            setCurrentSession(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                general_physician_response: response
              };
            });

            // Update the current step
            setCurrentStep(2);

            // Set loading and streaming states to false
            setIsLoading(false);
            setIsStreaming(false);

            // Reload the page to ensure everything is up to date
            setIsReloading(true);
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Unknown error in General Physician step');
            setIsLoading(false);
            setIsStreaming(false);
          }
        }, 2000);
      }

      return true;
    } catch {
      setError('Failed to load the diagnosis session. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [handleStreamingResponse]);

  // Load all sessions for a user
  const loadUserSessions = useCallback(async (userId: string): Promise<boolean> => {
    try {
      if (!userId) {
        setError('Invalid user ID. Please try again.');
        return false;
      }

      setIsLoading(true);
      setError(null);

      const sessions = await getUserChainDiagnosisSessions(userId);

      // Ensure sessions is an array
      if (!Array.isArray(sessions)) {
        setUserSessions([]);
        setError('Failed to load your diagnosis history. Please try again.');
        return false;
      }

      setUserSessions(sessions);

      return true;
    } catch {
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

              // Automatically process the General Physician step
              setTimeout(async () => {
                try {
                  // Set streaming state to true to show "Thinking" tag
                  setIsStreaming(true);

                  // Process General Physician step
                  const response = await processGeneralPhysician(
                    sessionId,
                    userInput,
                    undefined,
                    false,  // Enable streaming to show "Thinking" tag
                    (chunk, isComplete) => handleStreamingResponse('generalPhysician', chunk, isComplete)
                  );

                  // Force a UI update by updating the current session directly
                  setCurrentSession(prev => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      general_physician_response: response
                    };
                  });

                  // Update the current step
                  setCurrentStep(2);

                  // Schedule a page reload after a short delay to ensure the data is saved
                  setIsReloading(true); // Set reloading state to show loading indicator
                  setTimeout(() => {
                    window.location.reload();
                  }, 2000);
                } catch (error) {
                  setError(error instanceof Error ? error.message : 'Unknown error in General Physician step');
                }
              }, 1000);
            } else {
              // Check if there's an image URL
              const hasImageUrl = !!userInput.medical_report?.image_url;

              // Process Medical Analyst step - disable streaming if image URL is present
              const response = await processMedicalAnalyst(
                sessionId,
                userInput,
                false,
                hasImageUrl ? undefined : (chunk, isComplete) => handleStreamingResponse('medicalAnalyst', chunk, isComplete)
              );

              // If we have a response, update the session
              if (response) {
                // If streaming is disabled (for image URLs), manually set the streaming content
                if (hasImageUrl) {
                  resetStreamingContent('medicalAnalyst');
                  const responseContent = JSON.stringify(response, null, 2);
                  handleStreamingResponse('medicalAnalyst', responseContent, true);
                }

                // Force a UI update by updating the current session directly
                setCurrentSession(prev => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    medical_analyst_response: response
                  };
                });

                // For image URLs, we need to reload the page
                if (hasImageUrl) {
                  // Schedule a page reload after a short delay to ensure the data is saved
                  setIsReloading(true); // Set reloading state to show loading indicator
                  setTimeout(() => {
                    window.location.reload();
                  }, 2000);
                } else {
                  // For text reports, immediately proceed to General Physician without reload

                  // Set the current step to 1 (General Physician)
                  setCurrentStep(1);

                  // Wait a short delay to ensure the UI updates
                  setTimeout(async () => {
                    try {
                      // Process General Physician step
                      resetStreamingContent('generalPhysician');

                      // Set streaming state to true to show "Thinking" tag
                      setIsStreaming(true);

                      const gpResponse = await processGeneralPhysician(
                        sessionId,
                        userInput,
                        response,
                        false,  // Enable streaming to show "Thinking" tag
                        (chunk, isComplete) => handleStreamingResponse('generalPhysician', chunk, isComplete)
                      );

                      // Force a UI update by updating the current session directly
                      setCurrentSession(prev => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          general_physician_response: gpResponse
                        };
                      });

                      // Update the current step
                      setCurrentStep(2);
                    } catch (error) {
                      setError(error instanceof Error ? error.message : 'Unknown error in General Physician step');
                    } finally {
                      setIsLoading(false);
                      setIsStreaming(false);
                    }
                  }, 1000);
                }
              }

              // Stay on the current step (0) for now - we'll auto-continue after reload
              // setCurrentStep(1); -- Commented out to prevent automatic progression during this session
            }
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Unknown error in Medical Analyst step');
            // Stay on the current step even if there was an error
            // Let the user decide to continue manually
            // setCurrentStep(1); -- Commented out to prevent automatic progression
          }
          break;

        case 1: // General Physician
          resetStreamingContent('generalPhysician');

          // Set streaming state to true to show "Thinking" tag
          setIsStreaming(true);

          const response = await processGeneralPhysician(
            sessionId,
            userInput,
            currentSession.medical_analyst_response,
            false,  // Enable streaming to show "Thinking" tag
            (chunk, isComplete) => handleStreamingResponse('generalPhysician', chunk, isComplete)
          );

          // Force a UI update by updating the current session directly
          setCurrentSession(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              general_physician_response: response
            };
          });

          setCurrentStep(2);

          // Schedule a page reload after a short delay to ensure the data is saved
          setIsReloading(true); // Set reloading state to show loading indicator
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          break;

        case 2: // Specialist Doctor
          resetStreamingContent('specialistDoctor');
          if (!currentSession.general_physician_response) {
            setError('General Physician response is required before proceeding to Specialist Doctor');
            return false;
          }

          const specialistResponse = await processSpecialistDoctor(
            sessionId,
            userInput,
            currentSession.general_physician_response,
            currentSession.medical_analyst_response,
            false,
            (chunk, isComplete) => handleStreamingResponse('specialistDoctor', chunk, isComplete)
          );

          // Force a UI update by updating the current session directly
          setCurrentSession(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              specialist_doctor_response: specialistResponse
            };
          });

          setCurrentStep(3);

          // Schedule a page reload after a short delay to ensure the data is saved
          setIsReloading(true); // Set reloading state to show loading indicator
          setTimeout(() => {
            window.location.reload();
          }, 2000);
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
            false,
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
            false,
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
            false,
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
            false,
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
            false,
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
      } catch {
        // Continue with the in-memory session if database operations fail
        setError('Warning: Using in-memory session. Your diagnosis may not be saved permanently.');
      }

      return true;
    } catch {
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
