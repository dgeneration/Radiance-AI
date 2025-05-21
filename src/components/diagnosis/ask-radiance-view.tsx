"use client";

/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChainDiagnosis } from '@/contexts/diagnosis-context';
import { RadianceChatMessage } from '@/types/diagnosis';
import {
  getRadianceChatMessages,
  saveRadianceChatMessage,
  processRadianceAIChat
} from '@/lib/diagnosis-api';
import {
  Card,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Send,
  Brain,
  User,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { AnimatedSection } from '@/components/animations';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AskRadianceViewProps {
  sessionId: string;
}

// Import types for ReactMarkdown components
import type { Components } from 'react-markdown';

/* eslint-disable @typescript-eslint/no-explicit-any */
// Define markdown components configuration
const markdownComponents: Components = {
  p: (props: any) => <p className="text-sm mb-4" {...props} />,
  h1: (props: any) => <h1 className="text-xl font-semibold mb-4 mt-6" {...props} />,
  h2: (props: any) => <h2 className="text-lg font-semibold mb-3 mt-5" {...props} />,
  h3: (props: any) => <h3 className="text-base font-semibold mb-2 mt-4" {...props} />,
  ul: (props: any) => <ul className="list-disc pl-5 mb-4 text-sm" {...props} />,
  ol: (props: any) => <ol className="list-decimal pl-5 mb-4 text-sm" {...props} />,
  li: (props: any) => <li className="mb-1 text-sm" {...props} />,
  a: (props: any) => <a className="text-primary hover:text-primary/80 underline" {...props} />,
  blockquote: (props: any) => <blockquote className="border-l-4 border-primary/30 pl-4 italic" {...props} />,
  code: ({inline, children, ...props}: any) => {
    return inline
      ? <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>
      : <code className="block bg-muted p-4 rounded-md overflow-x-auto mb-4 text-sm font-mono" {...props}>{children}</code>;
  }
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export function AskRadianceView({ sessionId }: AskRadianceViewProps) {
  const { currentSession, isLoading } = useChainDiagnosis();
  const [messages, setMessages] = useState<RadianceChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load chat messages from the database
  const loadChatMessages = useCallback(async () => {
    try {
      const chatMessages = await getRadianceChatMessages(sessionId);
      setMessages(chatMessages);
    } catch (_error) {
      // Silently handle errors
    }
  }, [sessionId]);

  // Load chat messages when the component mounts
  useEffect(() => {
    if (sessionId) {
      loadChatMessages();
    }
  }, [sessionId, loadChatMessages]);

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

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentSession || isProcessing) return;

    try {
      setIsProcessing(true);

      // Get the current user
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.error('User not authenticated');
        return;
      }

      // First, add the user message to the local state immediately for better UX
      const tempUserMessage: RadianceChatMessage = {
        id: 'temp-' + Date.now(),
        session_id: sessionId,
        user_id: user.id,
        role: 'user',
        content: inputMessage,
        created_at: new Date().toISOString()
      };

      // Update the local messages state with the temporary message
      setMessages(prev => [...prev, tempUserMessage]);

      // Clear the input
      setInputMessage('');

      // Start streaming
      setIsStreaming(true);
      setStreamingContent('');

      // Save the user message to the database
      const userMessage: Omit<RadianceChatMessage, 'id' | 'created_at'> = {
        session_id: sessionId,
        user_id: user.id,
        role: 'user',
        content: inputMessage
      };

      const savedUserMessage = await saveRadianceChatMessage(userMessage);

      if (savedUserMessage) {
        // Replace the temporary message with the saved one
        setMessages(prev => prev.map(msg =>
          msg.id === tempUserMessage.id ? savedUserMessage : msg
        ));

        // Process the message with Radiance AI
        // Set a flag to track if we received a response
        let responseReceived = false;

        // Create a wrapper for the streaming response handler to track if we received a response
        const streamingWrapper = (content: string, isDone: boolean) => {
          // Only mark as received if we have actual content
          if (!responseReceived && content.trim().length > 0) {
            responseReceived = true;
          }

          handleStreamingResponse(content, isDone);
        };

        // Use a timeout to ensure we don't wait forever
        const timeoutPromise = new Promise<string>((resolve) => {
          setTimeout(() => {
            if (!responseReceived) {
              resolve("I'm sorry, I wasn't able to generate a response in time. Please try asking your question again.");
            }
          }, 30000); // 30 second timeout
        });

        // Race the API call against the timeout
        const aiResponse = await Promise.race([
          processRadianceAIChat(
            sessionId,
            inputMessage,
            currentSession,
            messages,
            true, // Use streaming
            streamingWrapper
          ),
          timeoutPromise
        ]);

        // Only use the complete response if we didn't receive a response through streaming
        if (!responseReceived && aiResponse) {
          // Make sure we have actual content
          if (aiResponse && aiResponse.trim().length > 0) {
            // Save the AI response to the database
            const aiMessage: Omit<RadianceChatMessage, 'id' | 'created_at'> = {
              session_id: sessionId,
              user_id: user.id,
              role: 'assistant',
              content: aiResponse
            };

            try {
              const savedAiMessage = await saveRadianceChatMessage(aiMessage);

              if (savedAiMessage) {
                // Update the local messages state
                setMessages(prev => [...prev, savedAiMessage]);
              }
            } catch (_) {
              // Add the AI response to the local state even if saving fails
              const tempAiMessage: RadianceChatMessage = {
                id: 'temp-ai-' + Date.now(),
                session_id: sessionId,
                user_id: user.id,
                role: 'assistant',
                content: aiResponse,
                created_at: new Date().toISOString()
              };
              setMessages(prev => [...prev, tempAiMessage]);
            }
          } else {
            // Add a fallback message
            const fallbackMessage: RadianceChatMessage = {
              id: 'fallback-' + Date.now(),
              session_id: sessionId,
              user_id: user.id,
              role: 'assistant',
              content: "I'm sorry, I wasn't able to generate a response. Please try asking your question again.",
              created_at: new Date().toISOString()
            };
            setMessages(prev => [...prev, fallbackMessage]);
          }
        }
      }
    } catch (_) {
      // Add an error message to the chat
      const errorMessage: RadianceChatMessage = {
        id: 'error-' + Date.now(),
        session_id: sessionId,
        user_id: 'system',
        role: 'assistant',
        content: "I'm sorry, I encountered an error while processing your message. Please try again later.",
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      setIsStreaming(false);
    }
  };

  // Handle streaming response
  const handleStreamingResponse = async (content: string, isDone: boolean) => {
    // Only update streaming content if there's actual content
    if (content.trim().length > 0) {
      setStreamingContent(content);
    }

    if (isDone) {
      setIsStreaming(false);

      // If content is empty or just whitespace, add a fallback message
      if (!content || content.trim().length === 0) {
        content = "I'm sorry, I wasn't able to generate a response. Please try asking your question again.";
      }

      // Save the AI response to the database
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          console.error('User not authenticated');
          return;
        }

        const aiMessage: Omit<RadianceChatMessage, 'id' | 'created_at'> = {
          session_id: sessionId,
          user_id: user.id,
          role: 'assistant',
          content
        };

        const savedAiMessage = await saveRadianceChatMessage(aiMessage);

        if (savedAiMessage) {
          // Update the local messages state
          setMessages(prev => [...prev, savedAiMessage]);
          // Clear streaming content
          setStreamingContent('');
        } else {
          // If saving to database fails, still show the message in the UI
          const tempAiMessage: RadianceChatMessage = {
            id: 'temp-ai-' + Date.now(),
            session_id: sessionId,
            user_id: user.id,
            role: 'assistant',
            content,
            created_at: new Date().toISOString()
          };
          setMessages(prev => [...prev, tempAiMessage]);
          setStreamingContent('');
        }
      } catch (_) {
        // If there's an exception, still show the message in the UI
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            const tempAiMessage: RadianceChatMessage = {
              id: 'temp-ai-' + Date.now(),
              session_id: sessionId,
              user_id: user.id,
              role: 'assistant',
              content,
              created_at: new Date().toISOString()
            };
            setMessages(prev => [...prev, tempAiMessage]);
          }
        } catch {
          // Last resort fallback
          const tempAiMessage: RadianceChatMessage = {
            id: 'temp-ai-' + Date.now(),
            session_id: sessionId,
            user_id: 'unknown',
            role: 'assistant',
            content,
            created_at: new Date().toISOString()
          };
          setMessages(prev => [...prev, tempAiMessage]);
        }
        setStreamingContent('');
      }
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
  };

  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <AnimatedSection className="space-y-6">
      <div className="mb-6 bg-card/50 p-5 rounded-xl border border-border/50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10 text-primary">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Ask Radiance
            </h2>
            <p className="text-sm text-muted-foreground">
              Chat with Radiance AI about your health concerns
            </p>
          </div>
        </div>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
        <CardContent className="p-6">
          <div
            ref={chatContainerRef}
            className="flex flex-col space-y-4 h-[500px] overflow-y-auto mb-4 pr-2"
          >
            {messages.length === 0 && !isStreaming && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Brain className="h-12 w-12 mb-4 text-primary/40" />
                <p className="text-lg font-medium">Ask Radiance AI about your diagnosis</p>
                <p className="text-sm max-w-md">
                  Radiance AI can answer questions about your symptoms, potential conditions,
                  and provide guidance based on your diagnosis session.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-xl p-4",
                    message.role === "user"
                      ? "bg-primary/10 text-foreground"
                      : "bg-card border border-border/50 text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {message.role === "assistant" ? (
                      <Brain className="h-4 w-4 text-primary" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    <span className="font-medium text-sm">
                      {message.role === "assistant" ? "Radiance AI" : "You"}
                    </span>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none">
                    {message.role === "assistant" ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                      >
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      <div className="whitespace-pre-wrap text-sm">
                        {message.content}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isStreaming && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-xl p-4 bg-card border border-border/50 text-foreground">
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Radiance AI</span>
                    <Loader2 className="h-3 w-3 animate-spin text-primary ml-1" />
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
                      <Badge
                        variant="outline"
                        className="bg-purple-600/10 text-purple-500 border-purple-500/20 px-3 py-1 text-sm font-normal"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Thinking...
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="flex items-center space-x-2">
            <Input
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder="Ask a question about your diagnosis..."
              className="flex-1"
              disabled={isProcessing || isLoading || !currentSession}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isProcessing || isLoading || !currentSession}
              className="bg-primary hover:bg-primary/90"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground border-t border-border/50 pt-4">
          Responses are for informational purposes only and not a substitute for professional medical advice.
        </CardFooter>
      </Card>
    </AnimatedSection>
  );
}
