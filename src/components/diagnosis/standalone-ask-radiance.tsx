"use client";

import React, { useState, useEffect, useRef } from 'react';
import { FileMetadata } from '@/utils/supabase/file-storage';
import { prepareMedicalReportData } from '@/utils/diagnosis-file-utils';
import { FileSelector } from '@/components/file-upload/file-selector';
import {
  Card,
  CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { GradientHeading } from '@/components/ui/gradient-heading';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Loader2,
  Send,
  Brain,
  User,
  MessageSquare,
  Sparkles,
  Paperclip,
  Trash2,
  Mic
} from 'lucide-react';
import {
  AnimatedSection,
  AnimatedText,
  AnimatedIcon,
  FloatingElement
} from '@/components/animations';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';
import {
  getActiveStandaloneRadianceChatSession,
  getStandaloneRadianceChatMessages,
  processStandaloneRadianceAIMessage,
  clearStandaloneRadianceChatMessages,
  StandaloneRadianceChatMessage,
  StandaloneRadianceChatSession
} from '@/lib/standalone-radiance-api';

// Utility function to extract file information from message content
const extractFileInfo = (content: string): { text: string, fileName: string | null, isImage: boolean } => {
  // Default values
  let text = content;
  let fileName = null;
  let isImage = false;

  // Check if the message contains an attached file
  const attachedMatch = content.match(/\[Attached: (.*?)\]/);
  if (attachedMatch && attachedMatch[1]) {
    // Extract the file name
    fileName = attachedMatch[1];

    // Check if it's an image file
    isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(fileName);

    // Remove the attachment text from the content
    text = content.replace(/\n\n\[Attached: .*?\]/, '');
  }

  return { text, fileName, isImage };
};

interface StandaloneAskRadianceProps {
  userId: string;
}

// Import types for ReactMarkdown components
import type { Components } from 'react-markdown';

// Import speech recognition types
import { SpeechRecognition, SpeechRecognitionEvent } from '@/types/speech-recognition';

// Define custom components for ReactMarkdown
const markdownComponents: Components = {
  // Style links
  a: ({ ...props }) => (
    <a
      {...props}
      className="text-primary hover:text-primary/80 underline transition-colors"
      target="_blank"
      rel="noopener noreferrer"
    />
  ),
  // Style paragraphs
  p: ({ ...props }) => <p {...props} className="mb-4 last:mb-0" />,
  // Style headings
  h1: ({ ...props }) => (
    <h1 {...props} className="text-xl font-bold mb-4 text-foreground" />
  ),
  h2: ({ ...props }) => (
    <h2 {...props} className="text-lg font-bold mb-3 text-foreground" />
  ),
  h3: ({ ...props }) => (
    <h3 {...props} className="text-md font-bold mb-3 text-foreground" />
  ),
  // Style lists
  ul: ({ ...props }) => <ul {...props} className="list-disc pl-6 mb-4" />,
  ol: ({ ...props }) => (
    <ol {...props} className="list-decimal pl-6 mb-4" />
  ),
  // Style list items
  li: ({ ...props }) => <li {...props} className="mb-1" />,
  // Style code blocks
  code: (props: any) => {
    const { inline, ...rest } = props;
    return inline ? (
      <code
        {...rest}
        className="bg-primary/10 text-primary px-1 py-0.5 rounded text-sm font-mono"
      />
    ) : (
      <code
        {...rest}
        className="block bg-card p-3 rounded-md text-sm font-mono overflow-x-auto mb-4"
      />
    );
  },
  // Style blockquotes
  blockquote: ({ ...props }) => (
    <blockquote
      {...props}
      className="border-l-4 border-primary/30 pl-4 italic mb-4"
    />
  ),
  // Style tables
  table: ({ ...props }) => (
    <div className="overflow-x-auto mb-4">
      <table
        {...props}
        className="min-w-full divide-y divide-border/30 border border-border/30 rounded-md"
      />
    </div>
  ),
  thead: ({ ...props }) => (
    <thead {...props} className="bg-card/50" />
  ),
  tbody: ({ ...props }) => (
    <tbody
      {...props}
      className="divide-y divide-border/30 bg-transparent"
    />
  ),
  tr: ({ ...props }) => (
    <tr
      {...props}
      className="transition-colors hover:bg-card/70"
    />
  ),
  th: ({ ...props }) => (
    <th
      {...props}
      className="px-4 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider"
    />
  ),
  td: ({ ...props }) => (
    <td {...props} className="px-4 py-3 text-sm" />
  ),
};

export function StandaloneAskRadiance({ userId }: StandaloneAskRadianceProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  // We keep the session state even though it's not directly used, as it might be needed in future updates
  const [, setSession] = useState<StandaloneRadianceChatSession | null>(null);
  const [messages, setMessages] = useState<StandaloneRadianceChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileMetadata[]>([]);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [userInitiatedStop, setUserInitiatedStop] = useState(false);
  const [recognitionRestartCount, setRecognitionRestartCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const lastStopTimeRef = useRef<number>(0);

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
        recognition.maxAlternatives = 1; // Only get the most likely result
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
          let interimTranscript = '';

          // Process all results
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;

            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          // Only update if we have something to add
          if (finalTranscript || interimTranscript) {
            setInputMessage(prevMessage => {
              // Start with the previous message
              let newMessage = prevMessage || '';

              // If this is our first addition and previous message is not empty,
              // ensure there's a space
              if (newMessage && !newMessage.endsWith(' ')) {
                newMessage += ' ';
              }

              // Add the final transcript
              if (finalTranscript) {
                newMessage += finalTranscript;
              }

              return newMessage;
            });
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
                    newRecognition.continuous = true;
                    newRecognition.interimResults = true;
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
  }, [isRecording]); // Added isRecording as a dependency

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
              newRecognition.continuous = true;
              newRecognition.interimResults = true;
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

  // Get or create a standalone chat session when the component mounts
  useEffect(() => {
    async function initializeSession() {
      try {
        setIsLoading(true);

        // Get the active session or create a new one
        const activeSession = await getActiveStandaloneRadianceChatSession(userId);

        if (activeSession) {
          setSessionId(activeSession.id);
          setSession(activeSession);

          // Get the messages for this session
          const sessionMessages = await getStandaloneRadianceChatMessages(activeSession.id, userId);
          setMessages(sessionMessages);
        } else {
          // Create a fallback session in the component state
          const fallbackSessionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
          setSessionId(fallbackSessionId);
          setSession({
            id: fallbackSessionId,
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            title: 'Ask Radiance AI Session',
            is_active: true
          });
        }
      } catch (error) {
        console.error("Error initializing session:", error);

        // Create a fallback session in the component state
        const fallbackSessionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
        setSessionId(fallbackSessionId);
        setSession({
          id: fallbackSessionId,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          title: 'Ask Radiance AI Session',
          is_active: true
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (userId) {
      initializeSession();
    }
  }, [userId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  // Scroll to the bottom of the chat
  const scrollToBottom = () => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
  };

  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && inputMessage.trim()) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle file selection
  const handleFileSelect = (files: FileMetadata[]) => {
    setSelectedFiles(files);
    setShowFileSelector(false);
  };

  // Handle clearing the chat history
  const handleClearChat = async () => {
    if (!sessionId) return;

    // Stop recording if active
    if (isRecording && recognitionRef.current) {
      setUserInitiatedStop(true); // Mark as user-initiated
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    try {
      setIsProcessing(true);

      try {
        // Clear messages from the database
        await clearStandaloneRadianceChatMessages(sessionId, userId);
      } catch (error) {
        console.error("Error clearing chat messages from database:", error);
        // Continue with UI clearing even if database operation fails
      }

      // Clear all messages in the UI
      setMessages([]);
      // Clear any streaming content
      setStreamingContent('');
      // Reset streaming state
      setIsStreaming(false);
      // Clear selected files
      setSelectedFiles([]);
      // Hide file selector if open
      setShowFileSelector(false);
      // Clear input message
      setInputMessage('');
    } catch (error) {
      console.error("Error in clear chat flow:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle sending a message and saving to the database
  const handleSendMessage = async () => {
    if (!sessionId || (!inputMessage.trim() && selectedFiles.length === 0)) return;

    // Stop recording if active
    if (isRecording && recognitionRef.current) {
      setUserInitiatedStop(true); // Mark as user-initiated
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    try {
      setIsProcessing(true);

      // Get the current user
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.error("User not authenticated");
        setIsProcessing(false);
        return;
      }

      // Prepare medical report data if files are selected
      let medicalReport = undefined;
      let fileMetadata = null;
      let fileContent = '';

      if (selectedFiles.length > 0) {
        medicalReport = await prepareMedicalReportData(selectedFiles);

        // Store the file metadata for rendering
        fileMetadata = {
          fileName: selectedFiles[0].name,
          fileType: selectedFiles[0].type,
          fileUrl: selectedFiles[0].public_url || '',
          isImage: selectedFiles[0].type.startsWith('image/')
        };

        // Add file information to the message content
        const fileNames = selectedFiles.map(file => file.name).join(', ');
        fileContent = `\n\n[Attached: ${fileNames}]`;
      }

      // Create a temporary user message for immediate display
      const userMessageContent = (inputMessage.trim() ||
        (selectedFiles.length > 0 ? "I've uploaded some medical files for analysis." : "")) + fileContent;

      const tempUserMessage: StandaloneRadianceChatMessage = {
        id: 'temp-user-' + Date.now(),
        session_id: sessionId,
        user_id: user.id,
        role: 'user',
        content: userMessageContent,
        created_at: new Date().toISOString(),
        raw_api_response: fileMetadata ? { fileMetadata } : undefined
      };

      // Update the local messages state for immediate feedback
      setMessages(prev => [...prev, tempUserMessage]);

      // Clear the input and selected files
      setInputMessage('');
      setSelectedFiles([]);

      // Start streaming indicator
      setIsStreaming(true);
      setStreamingContent('');

      // Process the message with Radiance AI
      let content = '';
      let responseReceived = false;

      try {
        // Use a timeout to ensure we don't wait forever
        const timeoutPromise = new Promise<string>((resolve) => {
          setTimeout(() => {
            if (!responseReceived) {
              resolve("I&apos;m sorry, I wasn&apos;t able to generate a response in time. Please try asking your question again.");
            }
          }, 30000); // 30 second timeout
        });

        // Process the message and save to database
        const aiResponse = await Promise.race([
          processStandaloneRadianceAIMessage(sessionId, userId, userMessageContent, medicalReport),
          timeoutPromise
        ]);

        responseReceived = true;
        content = aiResponse || "I&apos;m sorry, I encountered an error while processing your request.";
      } catch (error) {
        console.error("Error processing AI chat:", error);
        content = "I&apos;m sorry, I encountered an error while processing your request. Please try again later.";
      }

      // Stop streaming indicator
      setIsStreaming(false);

      try {
        // Refresh messages from the database to get the properly saved messages
        const updatedMessages = await getStandaloneRadianceChatMessages(sessionId, userId);

        // If we got messages from the database, use them
        if (updatedMessages && updatedMessages.length > 0) {
          setMessages(updatedMessages);
        } else {
          // Otherwise, add the AI response to the local state
          const tempAiMessage: StandaloneRadianceChatMessage = {
            id: 'temp-ai-' + Date.now(),
            session_id: sessionId,
            user_id: user.id,
            role: 'assistant',
            content: content,
            created_at: new Date().toISOString()
          };

          setMessages(prev => [...prev, tempAiMessage]);
        }
      } catch (error) {
        console.error("Error refreshing messages:", error);

        // Add the AI response to the local state
        const tempAiMessage: StandaloneRadianceChatMessage = {
          id: 'temp-ai-' + Date.now(),
          session_id: sessionId,
          user_id: user.id,
          role: 'assistant',
          content: content,
          created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, tempAiMessage]);
      }

      // Clear streaming content
      setStreamingContent('');

    } catch (error) {
      console.error("Error in send message flow:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatedSection className="space-y-6">
      {/* AI-Powered Health Diagnosis Header Section */}
      <AnimatedSection direction="up" delay={0.1} className="mb-6">
        <div className="relative overflow-hidden bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg">
          <FloatingElement
            className="absolute top-0 right-0 w-60 h-60 bg-primary/10 rounded-full blur-3xl opacity-30"
            duration={10}
            xOffset={15}
            yOffset={20}
          />
          <FloatingElement
            className="absolute bottom-0 left-0 w-60 h-60 bg-accent/10 rounded-full blur-3xl opacity-30"
            duration={12}
            xOffset={-15}
            yOffset={-20}
            delay={0.5}
          />

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shadow-lg">
                <AnimatedIcon
                  icon={<MessageSquare className="w-10 h-10 text-primary" />}
                  delay={0.2}
                  pulseEffect={true}
                />
              </div>

              <div className="flex-1 text-center md:text-left">
                <GradientHeading level={2} size="md" className="mb-2">
                  Health Assistant
                </GradientHeading>
                <p className="text-muted-foreground mb-6 max-w-2xl">
                  Consult with Radiance AI's medical expert about your health questions and receive evidence-based guidance.
                  Upload medical images for analysis and get personalized health insights.
                </p>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <Card className="bg-card/50 backdrop-blur-sm border-primary/10 shadow-lg overflow-hidden relative group transition-all duration-500 hover:shadow-xl">
        {/* Subtle background animation */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
        {/* Enhanced Header with Gradient */}
        <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-accent/10 border-b border-primary/20 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AnimatedIcon
              icon={<Brain className="h-5 w-5 text-primary" />}
              pulseEffect={true}
              containerClassName="mr-2"
            />
            <AnimatedText
              text={isLoading ? "Initializing Radiance AI..." : "Ask Radiance AI"}
              className="font-medium text-sm text-primary"
              staggerChildren={0.01}
            />
          </div>
          <div className="flex items-center">
            <Badge
              variant="outline"
              className="bg-accent/10 text-accent border-accent/20 px-2 py-0.5 text-xs animate-pulse"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Health Assistant
            </Badge>
          </div>
        </div>

        <CardContent className="p-0">
          {/* Floating elements for visual interest */}
          <div className="absolute top-20 right-12 opacity-30 pointer-events-none">
            <FloatingElement yOffset={10} xOffset={5} duration={7}>
              <div className="w-24 h-24 rounded-full bg-primary/5 blur-xl"></div>
            </FloatingElement>
          </div>
          <div className="absolute bottom-20 left-12 opacity-30 pointer-events-none">
            <FloatingElement yOffset={8} xOffset={-5} duration={6} delay={0.5}>
              <div className="w-32 h-32 rounded-full bg-accent/5 blur-xl"></div>
            </FloatingElement>
          </div>

          {/* Chat container with enhanced styling */}
          <div
            ref={chatContainerRef}
            className="flex flex-col space-y-4 h-[500px] overflow-y-auto p-6 pr-4 relative pt-[130px]"
          >
            {messages.length === 0 && !isStreaming && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <AnimatedIcon
                  icon={<Brain className="h-16 w-16 text-primary/60" />}
                  pulseEffect={true}
                  containerClassName="mb-6"
                  hoverScale={1.2}
                />
                <AnimatedText
                  text="Your Health Assistant"
                  className="text-xl font-medium text-foreground mb-2"
                  delay={0.2}
                />
                <AnimatedText
                  text="I&apos;m a medical AI assistant trained to provide evidence-based health information."
                  className="text-sm max-w-md mb-6"
                  delay={0.1}
                />

                <div className="grid grid-cols-2 gap-3 mt-2 text-sm w-full max-w-lg">
                  {[
                    {
                      title: "Symptoms & Conditions",
                      description: "Understanding symptoms and possible conditions",
                      delay: 0.5,
                      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    },
                    {
                      title: "Treatment Options",
                      description: "Information about common treatments and medications",
                      delay: 0.6,
                      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    },
                    {
                      title: "Preventive Care",
                      description: "Tips for maintaining good health and prevention",
                      delay: 0.7,
                      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    },
                    {
                      title: "Medical Terminology",
                      description: "Explanations of medical terms and procedures",
                      delay: 0.8,
                      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    }
                  ].map((item, index) => (
                    <AnimatedSection
                      key={index}
                      className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-lg border border-primary/10 hover:border-primary/20 transition-all duration-300 shadow-sm"
                      delay={item.delay}
                      direction="up"
                    >
                      <div className="flex items-center text-primary mb-1">
                        {item.icon}
                        <p className="font-medium">{item.title}</p>
                      </div>
                      <p className="text-xs text-foreground/80">{item.description}</p>
                    </AnimatedSection>
                  ))}
                </div>

                <AnimatedSection
                  className="text-xs mt-6 text-muted-foreground italic max-w-md bg-accent/5 p-3 rounded-lg border border-accent/10"
                  delay={0.9}
                >
                  <div className="flex items-center justify-center mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium text-accent">Important Note</span>
                  </div>
                  <p>
                    I provide information for educational purposes only, not medical advice.
                    Always consult with healthcare professionals for diagnosis and treatment.
                  </p>
                </AnimatedSection>
              </div>
            )}

            {messages.map((message, index) => (
              <AnimatedSection
                key={message.id}
                className={cn(
                  "flex",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}
                delay={index * 0.1}
                direction={message.role === 'user' ? "left" : "right"}
                once={true}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-xl p-4 shadow-sm transition-all duration-300",
                    message.role === 'user'
                      ? "bg-gradient-to-br from-primary/15 to-primary/5 text-foreground border border-primary/10 hover:border-primary/20"
                      : "bg-gradient-to-br from-card to-card/90 border border-border/50 text-foreground hover:border-border/80"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {message.role === 'user' ? (
                      <>
                        <div className="bg-primary/10 p-1 rounded-full">
                          <User className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="font-medium text-sm">You</span>
                      </>
                    ) : (
                      <>
                        <div className="bg-accent/10 p-1 rounded-full">
                          <Brain className="h-3.5 w-3.5 text-accent" />
                        </div>
                        <span className="font-medium text-sm">Radiance AI</span>
                        <Badge
                          variant="outline"
                          className="bg-primary/5 text-primary/80 border-primary/10 px-1.5 py-0 text-[10px]"
                        >
                          Health Expert
                        </Badge>
                      </>
                    )}
                  </div>
                  {message.role === 'user' ? (
                    <div className="space-y-3">
                      {/* Display the message text */}
                      <div className="whitespace-pre-wrap text-foreground/90">
                        {extractFileInfo(message.content).text}
                      </div>

                      {/* Display attached image if present */}
                      {/* eslint-disable @typescript-eslint/no-explicit-any */}
                      {message.raw_api_response?.fileMetadata &&
                       (message.raw_api_response.fileMetadata as any).isImage && (
                        <div className="mt-2">
                          <div className="relative w-full max-w-[300px] h-[200px] rounded-md overflow-hidden border border-primary/10">
                            <Image
                              src={(message.raw_api_response.fileMetadata as any).fileUrl}
                              alt={(message.raw_api_response.fileMetadata as any).fileName || "Attached image"}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-contain"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {(message.raw_api_response.fileMetadata as any).fileName}
                          </p>
                        </div>
                      )}
                      {/* eslint-enable @typescript-eslint/no-explicit-any */}
                    </div>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </AnimatedSection>
            ))}

            {isStreaming && (
              <AnimatedSection
                className="flex justify-start"
                direction="right"
                once={true}
              >
                <div className="max-w-[80%] rounded-xl p-4 bg-gradient-to-br from-card to-card/90 border border-border/50 text-foreground shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-accent/10 p-1 rounded-full">
                      <Brain className="h-3.5 w-3.5 text-accent" />
                    </div>
                    <span className="font-medium text-sm">Radiance AI</span>
                    <Badge
                      variant="outline"
                      className="bg-primary/5 text-primary/80 border-primary/10 px-1.5 py-0 text-[10px]"
                    >
                      Health Expert
                    </Badge>
                    <div className="ml-1 flex items-center">
                      <span className="sr-only">Loading</span>
                      <div className="h-1 w-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="h-1 w-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s] mx-0.5"></div>
                      <div className="h-1 w-1 bg-primary rounded-full animate-bounce"></div>
                    </div>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none">
                    {streamingContent && streamingContent.trim().length > 0 ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                      >
                        {streamingContent}
                      </ReactMarkdown>
                    ) : (
                      <div className="flex flex-col items-start">
                        <Badge
                          variant="outline"
                          className="bg-gradient-to-r from-primary/10 to-accent/10 text-primary border-primary/20 px-3 py-1 text-sm font-normal mb-2 animate-pulse"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Analyzing your question...
                        </Badge>
                        <div className="flex space-x-2 items-center">
                          <div className="h-1 w-16 bg-primary/20 rounded-full overflow-hidden">
                            <div className="h-full bg-primary animate-[pulse_1.5s_ease-in-out_infinite] rounded-full"></div>
                          </div>
                          <span className="text-xs text-muted-foreground">Preparing response</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </AnimatedSection>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* File selector with animation */}
          {showFileSelector && (
            <AnimatedSection className="mb-4 bg-card/30 p-4 rounded-lg border border-primary/10" delay={0.1} direction="up">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Paperclip className="h-4 w-4 text-primary mr-2" />
                  <span className="text-sm font-medium">Upload Medical Files</span>
                </div>
                <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 text-xs">
                  Max 1 file
                </Badge>
              </div>
              <FileSelector
                userId={userId}
                onFilesSelected={handleFileSelect}
                selectedFiles={selectedFiles}
                multiple={false}
                maxFiles={1}
                acceptedFileTypes={[
                  'image/jpeg',
                  'image/png',
                  'image/gif',
                  'application/pdf',
                  'text/plain',
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  'application/msword'
                ]}
              />
            </AnimatedSection>
          )}

          {/* Enhanced input area with animations */}
          <div className="flex flex-col space-y-3 p-4 bg-card/30 backdrop-blur-sm rounded-lg border border-primary/10 mt-2">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-focus-within:opacity-100 rounded-md -m-0.5 transition-opacity duration-300 pointer-events-none"></div>
                <Input
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  placeholder={isRecording ? "Listening... speak clearly (pauses will complete your sentence)" : "Ask me about symptoms, conditions, treatments, or health advice..."}
                  className={`flex-1 bg-card transition-all duration-300 pl-10 ${
                    isRecording
                      ? "border-primary/40 bg-primary/5 shadow-[0_0_0_1px_rgba(0,198,215,0.3)]"
                      : "border-primary/20 focus:border-primary/40"
                  }`}
                  disabled={isProcessing || !sessionId}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  {isRecording ? (
                    <div className="relative">
                      <Mic className="h-4 w-4 text-primary animate-pulse" />
                      <div className="absolute -right-1 -top-1 flex space-x-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-[pulse_1s_ease-in-out_infinite]"></span>
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-[pulse_1s_ease-in-out_0.3s_infinite]"></span>
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-[pulse_1s_ease-in-out_0.6s_infinite]"></span>
                      </div>
                    </div>
                  ) : (
                    <MessageSquare className="h-4 w-4 text-primary/60" />
                  )}
                </div>
              </div>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={toggleSpeechRecognition}
                      variant="outline"
                      className={`bg-gradient-to-br ${isRecording
                        ? "from-primary/20 to-primary/10 border-primary/40"
                        : "from-card/80 to-card hover:from-card/90 hover:to-card/80 border-primary/20 hover:border-primary/30"
                      } transition-all duration-300`}
                      disabled={isProcessing || !sessionId || !recognitionSupported}
                    >
                      <Mic className={`h-4 w-4 ${isRecording ? "text-primary animate-pulse" : "text-primary/80"}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {recognitionSupported ? (
                      <p>{isRecording ? "Stop recording" : "Start voice input"}</p>
                    ) : (
                      <p>Speech recognition not supported in your browser</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setShowFileSelector(!showFileSelector)}
                      variant="outline"
                      className="bg-gradient-to-br from-card/80 to-card hover:from-card/90 hover:to-card/80 border-primary/20 hover:border-primary/30 transition-all duration-300"
                      disabled={isProcessing || !sessionId}
                    >
                      <Paperclip className="h-4 w-4 text-primary/80" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Attach medical files</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {messages.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleClearChat}
                        variant="outline"
                        className="bg-destructive/5 text-destructive hover:bg-destructive/10 border-destructive/20 hover:border-destructive/30 transition-all duration-300"
                        disabled={isProcessing || !sessionId}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Clear chat history</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              <Button
                onClick={handleSendMessage}
                disabled={((!inputMessage.trim() && selectedFiles.length === 0) || isProcessing || !sessionId)}
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="ml-2 hidden sm:inline">Send</span>
              </Button>
            </div>

            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1 animate-in fade-in duration-300">
                {selectedFiles.map((file) => (
                  <Badge
                    key={file.id}
                    variant="outline"
                    className="bg-gradient-to-r from-primary/10 to-primary/5 text-primary border-primary/20 px-3 py-1 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {file.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </AnimatedSection>
  );
}
