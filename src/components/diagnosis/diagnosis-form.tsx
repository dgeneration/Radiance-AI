"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useChainDiagnosis } from '@/contexts/diagnosis-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
// Removed unused imports
import { motion, AnimatePresence } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { FileSelector } from '@/components/file-upload/file-selector';
import { FileMetadata } from '@/utils/supabase/file-storage';
// Removed unused Button import
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfessionalButton } from '@/components/ui/professional-button';
import { AnimatedSection } from '@/components/animations';
import {
  FaUser,
  FaVenusMars,
  FaBirthdayCake,
  FaStethoscope,
  FaClock,
  FaNotesMedical,
  FaArrowRight,
  FaHistory,
  FaBrain,
  FaMapMarkerAlt,
  FaWeight,
  FaRulerVertical,
  FaUtensils,
  FaPills,
  FaAllergies,
  FaNotesMedical as FaMedicalNotes,
  FaEdit,
  FaInfoCircle,
  FaMicrophone
} from 'react-icons/fa';

// Import speech recognition types
import { SpeechRecognition, SpeechRecognitionEvent } from '@/types/speech-recognition';

// Form schema
const formSchema = z.object({
  symptoms: z.string().min(5, {
    message: "Please describe your symptoms in more detail.",
  }),
  durationNumber: z.string().min(1, {
    message: "Please specify the number.",
  }),
  durationUnit: z.string({
    required_error: "Please select a time unit.",
  }),
});

interface ChainDiagnosisFormProps {
  userId: string;
}

// Define the user profile type
type UserProfile = {
  id: string;
  first_name: string;
  last_name: string;
  country: string;
  state: string;
  city: string;
  zip_code: string;
  gender: string;
  birth_year: number;
  health_history?: string | null;
  medical_conditions?: string | null;
  allergies?: string | null;
  medications?: string | null;
  height?: number | null;
  weight?: number | null;
  dietary_preference?: string | null;
};

export function ChainDiagnosisForm({ userId }: ChainDiagnosisFormProps) {
  const { startNewSession, isLoading, error: sessionError } = useChainDiagnosis();
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<FileMetadata[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isProfileExpanded, setIsProfileExpanded] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [userInitiatedStop, setUserInitiatedStop] = useState(false);
  const [recognitionRestartCount, setRecognitionRestartCount] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const lastStopTimeRef = useRef<number>(0);
  // Test states removed

  // Fetch user profile on component mount
  useEffect(() => {
    async function fetchUserProfile() {
      try {
        setIsLoadingProfile(true);
        const supabase = createClient();

        // Get the user's profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError) {
          setIsLoadingProfile(false);
          return;
        }

        if (profile) {
          setUserProfile(profile);
        }
      } catch {
        // Silently handle errors
      } finally {
        setIsLoadingProfile(false);
      }
    }

    fetchUserProfile();
  }, [userId]);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      symptoms: "",
      durationNumber: "",
      durationUnit: "days",
    },
  });

  // Initialize speech recognition
  useEffect(() => {
    try {
      // Check if browser supports speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setRecognitionSupported(false);
        console.warn('Speech Recognition is not supported in this browser');
        return;
      }

      // Create speech recognition instance
      const recognition = new SpeechRecognition();

      try {
        // Configure recognition with error handling
        recognition.continuous = true; // Set back to true for better user experience
        recognition.interimResults = true; // Set back to true for real-time feedback
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;
      } catch (configError) {
        console.warn('Error configuring speech recognition:', configError);
        setRecognitionSupported(false);
        return;
      }

      // Set up event handlers with error handling
      try {
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          try {
            // Track if we have a final result
            let finalTranscript = '';

            // Process all results
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;

              if (event.results[i].isFinal) {
                finalTranscript += transcript;
              }
            }

            // Only update if we have a final transcript
            if (finalTranscript) {
              // Get the current value from the form
              const currentValue = form.getValues('symptoms');

              // Prepare the new value with proper spacing
              let newValue = '';

              // If we have a current value
              if (currentValue && currentValue.trim()) {
                // Add a space only if the current value doesn't end with one
                newValue = currentValue.endsWith(' ') ? currentValue : currentValue + ' ';
              }

              // Add the transcript
              newValue += finalTranscript.trim();

              // Update the form field
              form.setValue('symptoms', newValue);
            }
          } catch (resultError) {
            console.warn('Error processing speech recognition result:', resultError);
          }
        };
      } catch (handlerError) {
        console.warn('Error setting up speech recognition result handler:', handlerError);
        setRecognitionSupported(false);
        return;
      }

      try {
        recognition.onend = () => {
          try {
            // If the user manually stopped recording, don't restart
            if (userInitiatedStop) {
              setIsRecording(false);
              setUserInitiatedStop(false);
              return;
            }

            // If we're still in recording mode, restart it
            // This ensures continuous recording until the user manually stops
            if (isRecording && recognitionRef.current) {
              // Increment restart count to track potential issues
              setRecognitionRestartCount(prevCount => {
                const newCount = prevCount + 1;

                // If we've had too many restarts in a short time, we might need a new instance
                if (newCount > 3) {
                  try {
                    // Create a new SpeechRecognition instance
                    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                    if (SpeechRecognition) {
                      // Create a new instance
                      const newRecognition = new SpeechRecognition();

                      // Configure it
                      newRecognition.continuous = true; // Set back to true for better user experience
                      newRecognition.interimResults = true; // Set back to true for real-time feedback
                      newRecognition.lang = 'en-US';

                      // Copy over the event handlers from the old instance
                      if (recognitionRef.current) {
                        newRecognition.onresult = recognitionRef.current.onresult;
                        newRecognition.onend = recognitionRef.current.onend;
                        newRecognition.onerror = recognitionRef.current.onerror;
                      }

                      // Replace the old instance
                      recognitionRef.current = newRecognition;

                      // Try to start the new instance with a delay
                      setTimeout(() => {
                        try {
                          if (isRecording && recognitionRef.current && !userInitiatedStop) {
                            recognitionRef.current.start();
                          }
                        } catch (newInstanceStartError) {
                          // If even the new instance fails, give up
                          setIsRecording(false);
                        }
                      }, 200);

                      // Reset the counter
                      return 0;
                    }
                  } catch (newInstanceError) {
                    // If creating a new instance fails, continue with the old one
                  }
                }

                // Try to restart with the current instance
                try {
                  // Use different delays based on restart count
                  const delay = newCount * 50; // Increase delay with each restart

                  setTimeout(() => {
                    try {
                      if (isRecording && recognitionRef.current && !userInitiatedStop) {
                        recognitionRef.current.start();
                      } else {
                        setIsRecording(false);
                      }
                    } catch (delayedRestartError) {
                      // If delayed restart fails, stop recording
                      setIsRecording(false);
                    }
                  }, delay);
                } catch (restartError) {
                  // If scheduling the restart fails, stop recording
                  setIsRecording(false);
                }

                return newCount;
              });
            } else {
              setIsRecording(false);
            }
          } catch (endError) {
            // Silently handle end errors
            setIsRecording(false);
          }
        };
      } catch (endHandlerError) {
        console.warn('Error setting up speech recognition end handler:', endHandlerError);
        setRecognitionSupported(false);
        return;
      }

      try {
        recognition.onerror = (event: any) => {
          try {
            // Handle specific error types
            if (event.error === 'not-allowed') {
              console.warn('Microphone access denied by user or browser settings');
            } else if (event.error === 'no-speech') {
              // This is common and not a real error, so we don't need to log it
              // console.warn('No speech detected');
            } else if (event.error === 'aborted') {
              // Aborted errors are common and usually not problematic
              // We'll completely suppress these warnings as they're expected behavior
              // in many browsers and don't affect functionality

              // Reset the flag
              setUserInitiatedStop(false);
            } else {
              console.warn('Speech recognition error:', event.error || 'unknown error');
            }

            // Stop recording state
            setIsRecording(false);
          } catch (errorHandlingError) {
            console.warn('Error in speech recognition error handler:', errorHandlingError);
            setIsRecording(false);
          }
        };
      } catch (errorHandlerError) {
        console.warn('Error setting up speech recognition error handler:', errorHandlerError);
        setRecognitionSupported(false);
        return;
      }

      // Store the recognition instance in the ref
      recognitionRef.current = recognition;

      // Clean up on unmount
      return () => {
        try {
          if (recognitionRef.current) {
            recognitionRef.current.abort();
          }
        } catch (cleanupError) {
          console.warn('Error cleaning up speech recognition:', cleanupError);
        }
      };

    } catch (initError) {
      console.warn('Error initializing speech recognition:', initError);
      setRecognitionSupported(false);
    }
  }, [isRecording, userInitiatedStop, form]);

  // Handle toggling speech recognition
  const toggleSpeechRecognition = () => {
    try {
      if (!recognitionRef.current) {
        console.warn('Speech recognition not initialized');
        return;
      }

      if (isRecording) {
        try {
          // Set flag to indicate this is a user-initiated stop
          setUserInitiatedStop(true);

          // Store the time when we stopped
          lastStopTimeRef.current = Date.now();

          // Stop the recognition
          recognitionRef.current.stop();

          // Reset restart count
          setRecognitionRestartCount(0);

          // Ensure recording state is updated
          setIsRecording(false);
        } catch (stopError) {
          // If stop fails, try abort
          try {
            recognitionRef.current.abort();
          } catch (abortError) {
            // Ignore abort errors
          } finally {
            setIsRecording(false);
            setRecognitionRestartCount(0);
          }
        }
      } else {
        try {
          // Check if we need to recreate the recognition instance
          // If it's been less than 1 second since we stopped, we might need a new instance
          const timeSinceLastStop = Date.now() - lastStopTimeRef.current;
          const needsNewInstance = timeSinceLastStop < 1000;

          // If we need a new instance or we've had restart issues
          if (needsNewInstance || recognitionRestartCount > 0) {
            // Create a new SpeechRecognition instance
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
              // Create a new instance
              const newRecognition = new SpeechRecognition();

              // Configure it
              newRecognition.continuous = true; // Set back to true for better user experience
              newRecognition.interimResults = true; // Set back to true for real-time feedback
              newRecognition.lang = 'en-US';

              // Copy over the event handlers from the old instance
              if (recognitionRef.current) {
                newRecognition.onresult = recognitionRef.current.onresult;
                newRecognition.onend = recognitionRef.current.onend;
                newRecognition.onerror = recognitionRef.current.onerror;
              }

              // Replace the old instance
              recognitionRef.current = newRecognition;
            }
          }

          // Make sure any previous instance is fully stopped
          try {
            recognitionRef.current.abort();
          } catch (abortError) {
            // Ignore abort errors
          }

          // Set recording state before starting
          setIsRecording(true);

          // Use a longer delay for a more reliable start
          setTimeout(() => {
            try {
              // Start new recognition session
              if (recognitionRef.current) {
                recognitionRef.current.start();
                // Reset restart count on successful start
                setRecognitionRestartCount(0);
              }
            } catch (delayedStartError) {
              console.warn('Error starting speech recognition after delay:', delayedStartError);

              // Increment restart count and try again with a new instance if needed
              const newCount = recognitionRestartCount + 1;
              setRecognitionRestartCount(newCount);

              if (newCount <= 2) {  // Limit retries to prevent infinite loops
                // Try again after a longer delay
                setTimeout(() => toggleSpeechRecognition(), 500);
              } else {
                setIsRecording(false);
              }
            }
          }, 100);  // Increased delay for more reliability
        } catch (startError) {
          console.warn('Error in speech recognition start process:', startError);
          setIsRecording(false);
        }
      }
    } catch (error) {
      console.warn('Error in speech recognition toggle:', error);
      setIsRecording(false);
    }
  };

  // Test functions removed

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setError(null);

      // Combine duration number and unit
      const duration = `${values.durationNumber} ${values.durationUnit}`;

      // Get age and gender from user profile
      const age = userProfile?.birth_year
        ? (new Date().getFullYear() - userProfile.birth_year).toString()
        : '';

      const gender = userProfile?.gender || '';

      // Prepare medical history from user profile
      const medicalHistoryParts = [];

      if (userProfile?.medical_conditions) {
        medicalHistoryParts.push(`Medical Conditions: ${userProfile.medical_conditions}`);
      }

      if (userProfile?.allergies) {
        medicalHistoryParts.push(`Allergies: ${userProfile.allergies}`);
      }

      if (userProfile?.medications) {
        medicalHistoryParts.push(`Current Medications: ${userProfile.medications}`);
      }

      if (userProfile?.health_history) {
        medicalHistoryParts.push(`Health History: ${userProfile.health_history}`);
      }

      // Add health metrics if available
      if (userProfile?.height && userProfile?.weight) {
        const bmi = (userProfile.weight / ((userProfile.height / 100) * (userProfile.height / 100))).toFixed(1);
        medicalHistoryParts.push(`Health Metrics: Height: ${userProfile.height} cm, Weight: ${userProfile.weight} kg, BMI: ${bmi}`);
      } else {
        if (userProfile?.height) {
          medicalHistoryParts.push(`Height: ${userProfile.height} cm`);
        }
        if (userProfile?.weight) {
          medicalHistoryParts.push(`Weight: ${userProfile.weight} kg`);
        }
      }

      if (userProfile?.dietary_preference) {
        medicalHistoryParts.push(`Dietary Preference: ${userProfile.dietary_preference}`);
      }

      const medicalHistory = medicalHistoryParts.length > 0
        ? medicalHistoryParts.join('\n\n')
        : '';

      // Create enhanced symptom data object with all profile information
      const symptomData = {
        symptoms: values.symptoms,
        age: age,
        gender: gender,
        duration: duration,
        medicalHistory: medicalHistory,
        // Include location information if available
        location: userProfile?.city && userProfile?.country
          ? `${userProfile.city}, ${userProfile.state}, ${userProfile.country}`
          : undefined,
        name: userProfile?.first_name && userProfile?.last_name
          ? `${userProfile.first_name} ${userProfile.last_name}`
          : undefined
      };

      const sessionId = await startNewSession(
        userId,
        userProfile || null,
        symptomData,
        selectedFiles
      );

      if (sessionId) {
        router.push(`/diagnosis/${sessionId}`);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <AnimatedSection>
      <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
              <FaBrain className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                Multi-Agent Chain Diagnosis
              </CardTitle>
              <CardDescription>
                Get a comprehensive analysis from 8 specialized AI roles
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoadingProfile ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">Loading your information...</span>
            </div>
          ) : userProfile && (
            <div className="bg-card/50 backdrop-blur-sm border border-primary/10 p-6 rounded-xl shadow-md mb-8">
              <div
                className="flex items-center justify-between gap-3 mb-4 cursor-pointer"
                onClick={() => setIsProfileExpanded(!isProfileExpanded)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <FaUser className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Your Profile Information</h3>
                    <p className="text-xs text-muted-foreground">
                      {isProfileExpanded ? 'Click to collapse' : 'Click to expand'}
                    </p>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isProfileExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-primary/70"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </motion.div>
              </div>

              <AnimatePresence>
                {isProfileExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="text-sm text-muted-foreground mb-5">
                      We&apos;re using your profile information for diagnosis. Your age and gender will be included automatically.
                    </p>

                    <div className="mb-6">
                      <h4 className="text-base font-medium mb-3 bg-gradient-to-r from-primary/80 to-primary/80 bg-clip-text text-transparent">Personal Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-primary/5">
                          <FaUser className="text-primary/70 w-5 h-5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Name</p>
                            <p className="font-medium">{userProfile?.first_name || ''} {userProfile?.last_name || ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-primary/5">
                          <FaMapMarkerAlt className="text-primary/70 w-5 h-5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Location</p>
                            <p className="font-medium">{userProfile?.city || 'Not specified'}{userProfile?.state ? `, ${userProfile.state}` : ''}{userProfile?.country ? `, ${userProfile.country}` : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-primary/5">
                          <FaVenusMars className="text-accent/70 w-5 h-5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Gender</p>
                            <p className="font-medium capitalize">{userProfile?.gender || 'Not specified'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-primary/5">
                          <FaBirthdayCake className="text-accent/70 w-5 h-5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Age</p>
                            <p className="font-medium">{userProfile?.birth_year ? `${new Date().getFullYear() - userProfile.birth_year} years (${userProfile.birth_year})` : 'Not specified'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <h4 className="text-base font-medium mb-3 bg-gradient-to-r from-accent/80 to-accent/80 bg-clip-text text-transparent">Health Metrics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-accent/5">
                        <FaRulerVertical className="text-accent/70 w-5 h-5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Height</p>
                          <p className="font-medium">{userProfile?.height ? `${userProfile.height} cm` : 'Not specified'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-accent/5">
                        <FaWeight className="text-accent/70 w-5 h-5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Weight</p>
                          <p className="font-medium">{userProfile?.weight ? `${userProfile.weight} kg` : 'Not specified'}</p>
                        </div>
                      </div>
                      {userProfile?.height && userProfile?.weight && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-accent/5">
                          <FaStethoscope className="text-accent/70 w-5 h-5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">BMI</p>
                            <p className="font-medium">
                              {(userProfile?.weight && userProfile?.height) ? (userProfile.weight / ((userProfile.height / 100) * (userProfile.height / 100))).toFixed(1) : 'N/A'}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-accent/5">
                        <FaUtensils className="text-accent/70 w-5 h-5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Dietary Preference</p>
                          <p className="font-medium capitalize">{userProfile?.dietary_preference || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <FaMedicalNotes className="text-primary/70 w-5 h-5" />
                        <h4 className="text-base font-medium">Medical Information</h4>
                      </div>
                      <ProfessionalButton
                        asChild
                        variant="outline"
                        size="sm"
                        icon={<FaEdit />}
                        iconPosition="left"
                      >
                        <Link href="/dashboard/profile">Edit Health Info</Link>
                      </ProfessionalButton>
                    </div>

                    {userProfile?.allergies || userProfile?.medications || userProfile?.medical_conditions || userProfile?.health_history ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {userProfile?.allergies && (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-primary/5">
                            <FaAllergies className="text-primary/70 w-5 h-5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm text-muted-foreground">Allergies</p>
                              <p className="font-medium line-clamp-2">{userProfile?.allergies}</p>
                            </div>
                          </div>
                        )}
                        {userProfile?.medications && (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-primary/5">
                            <FaPills className="text-primary/70 w-5 h-5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm text-muted-foreground">Medications</p>
                              <p className="font-medium line-clamp-2">{userProfile?.medications}</p>
                            </div>
                          </div>
                        )}
                        {userProfile?.medical_conditions && (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-primary/5">
                            <FaMedicalNotes className="text-primary/70 w-5 h-5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm text-muted-foreground">Medical Conditions</p>
                              <p className="font-medium line-clamp-2">{userProfile?.medical_conditions}</p>
                            </div>
                          </div>
                        )}
                        {userProfile?.health_history && (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-primary/5">
                            <FaHistory className="text-primary/70 w-5 h-5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm text-muted-foreground">Health History</p>
                              <p className="font-medium line-clamp-2">{userProfile?.health_history}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-card/50 backdrop-blur-sm rounded-xl border border-primary/5">
                        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                          You haven&apos;t added any health information yet. This information helps us provide more accurate diagnoses.
                        </p>
                        <ProfessionalButton
                          asChild
                          variant="primary"
                          size="default"
                          icon={<FaNotesMedical className="h-5 w-5" />}
                          iconPosition="left"
                        >
                          <Link href="/dashboard/profile">
                            Add Health Information
                          </Link>
                        </ProfessionalButton>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="bg-card/50 backdrop-blur-sm border border-primary/10 p-6 rounded-xl shadow-md mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                <FaStethoscope className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-lg font-medium bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">Symptom Details</h3>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="symptoms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium flex items-center gap-2">
                        <FaNotesMedical className="text-accent/70 w-4 h-4" />
                        Symptoms
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Textarea
                            placeholder={isRecording ? "Listening... speak clearly (pauses will complete your sentence)" : "Describe your symptoms in detail..."}
                            className={`resize-none min-h-[180px] bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20 ${
                              isRecording ? "border-primary/40 bg-primary/5 shadow-[0_0_0_1px_rgba(0,198,215,0.3)]" : ""
                            }`}
                            {...field}
                          />
                        </FormControl>

                        {/* Microphone button */}
                        <div className="absolute right-3 bottom-3">
                          <button
                            type="button"
                            onClick={toggleSpeechRecognition}
                            className={`p-2 rounded-full transition-all duration-300 ${
                              isRecording
                                ? "bg-primary/20 text-primary"
                                : "bg-card/80 text-primary/60 hover:bg-primary/10 hover:text-primary"
                            }`}
                            disabled={!recognitionSupported}
                            title={recognitionSupported ? (isRecording ? "Stop recording" : "Start voice input") : "Speech recognition not supported"}
                          >
                            {isRecording ? (
                              <div className="relative">
                                <FaMicrophone className="h-5 w-5" />
                                <div className="absolute -right-1 -top-1 flex space-x-0.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-[pulse_1s_ease-in-out_infinite]"></span>
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-[pulse_1s_ease-in-out_0.3s_infinite]"></span>
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-[pulse_1s_ease-in-out_0.6s_infinite]"></span>
                                </div>
                              </div>
                            ) : (
                              <FaMicrophone className="h-5 w-5" />
                            )}
                          </button>
                        </div>

                        <FormDescription className="mt-2">
                          Be as specific as possible about what you&apos;re experiencing.
                          {recognitionSupported && (
                            <span className="ml-1 text-primary/70">
                              Click the microphone icon to use voice input.
                            </span>
                          )}
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel className="text-base font-medium flex items-center gap-2">
                    <FaClock className="text-accent/70 w-4 h-4" />
                    Duration of Symptoms
                  </FormLabel>
                  <div className="flex gap-3">
                    <FormField
                      control={form.control}
                      name="durationNumber"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="Number"
                              className="bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="durationUnit"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20">
                                <SelectValue placeholder="Unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="days">Days</SelectItem>
                              <SelectItem value="weeks">Weeks</SelectItem>
                              <SelectItem value="months">Months</SelectItem>
                              <SelectItem value="years">Years</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormDescription>
                    How long have you been experiencing these symptoms?
                  </FormDescription>
                </FormItem>

                {/* Age, gender, and medical history are automatically included from the user profile */}
                <div className="bg-card/50 backdrop-blur-sm border border-primary/5 p-4 rounded-lg mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <FaInfoCircle className="text-accent/70 w-4 h-4" />
                    <p className="text-sm font-medium text-accent/90">Information from your profile</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your age, gender, and medical information from your profile will be automatically included in the diagnosis.
                  </p>
                </div>

                <div className="space-y-2">
                  <FormLabel className="text-base font-medium flex items-center gap-2">
                    <FaNotesMedical className="text-accent/70 w-4 h-4" />
                    Medical Report (Optional)
                  </FormLabel>
                  <FileSelector
                    userId={userId}
                    onFilesSelected={setSelectedFiles}
                    selectedFiles={selectedFiles}
                    multiple={false}
                  />
                  <FormDescription>
                    Attach a single medical report, test result, or image for more accurate analysis.
                  </FormDescription>
                </div>

                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl text-sm shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center">
                        <span className="text-destructive font-bold text-xs">!</span>
                      </div>
                      <span className="font-medium">Error</span>
                    </div>
                    <p className="mt-2 ml-7">{error}</p>
                  </div>
                )}

                {sessionError && (
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 p-4 rounded-xl text-sm shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <span className="text-amber-700 dark:text-amber-400 font-bold text-xs">!</span>
                      </div>
                      <span className="font-medium">Warning</span>
                    </div>
                    <p className="mt-2 ml-7">{sessionError}</p>
                  </div>
                )}

                {/* Test UI elements removed */}

                <div className="mt-6 flex justify-center items-center">
                  <ProfessionalButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    icon={<FaArrowRight className="w-5 h-5" />}
                    iconPosition="right"
                    disabled={isLoading}
                    className="h-16 px-10 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 mx-auto"
                  >
                    {isLoading ? "Starting Diagnosis..." : "Start Diagnosis"}
                  </ProfessionalButton>
                </div>
              </form>
            </Form>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col text-xs text-muted-foreground border-t border-border/50 pt-4">
          <p>
            The Multi-Agent Chain Diagnosis System uses 8 specialized AI roles to provide a comprehensive health analysis.
          </p>
          <p className="mt-1">
            This is not a substitute for professional medical advice. Always consult a healthcare provider.
          </p>
        </CardFooter>
      </Card>
    </AnimatedSection>
  );
}
