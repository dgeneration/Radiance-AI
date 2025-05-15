"use client";

import React, { useEffect } from 'react';
import { useChainDiagnosis } from '@/contexts/chain-diagnosis-context';
import { ChainDiagnosisSession } from '@/types/chain-diagnosis';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, ArrowRight, AlertCircle, CheckCircle, Clock, Brain } from 'lucide-react';
import { AnimatedSection } from '@/components/animations';

interface ChainDiagnosisHistoryProps {
  initialSessions: ChainDiagnosisSession[];
  userId: string;
}

export function ChainDiagnosisHistory({ initialSessions, userId }: ChainDiagnosisHistoryProps) {
  const { loadUserSessions, userSessions, isLoading, error } = useChainDiagnosis();
  const router = useRouter();

  // Load user sessions when the component mounts
  useEffect(() => {
    loadUserSessions(userId).catch(() => {
      // Error is handled by the context
    });
  }, [userId, loadUserSessions]);

  // Use the sessions from context if available, otherwise use the initial sessions
  // Make sure we have valid arrays
  const validUserSessions = Array.isArray(userSessions) ? userSessions : [];
  const validInitialSessions = Array.isArray(initialSessions) ? initialSessions : [];
  const sessions = validUserSessions.length > 0 ? validUserSessions : validInitialSessions;



  // Handle viewing a session
  const handleViewSession = (sessionId: string) => {
    router.push(`/dashboard/chain-diagnosis/${sessionId}`);
  };

  // Handle starting a new session
  const handleNewSession = () => {
    router.push('/dashboard/chain-diagnosis');
  };

  if (isLoading && sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your diagnosis history...</p>
      </div>
    );
  }

  if (error && sessions.length === 0) {
    return (
      <Card className="bg-destructive/10 border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Error Loading History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => loadUserSessions(userId)}>
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <AnimatedSection>
        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardHeader>
            <CardTitle>No Diagnosis Sessions Found</CardTitle>
            <CardDescription>
              You haven&apos;t started any chain diagnosis sessions yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Start a new chain diagnosis to get a comprehensive health analysis from 8 specialized AI roles.
            </p>
            <Button onClick={handleNewSession} className="bg-primary hover:bg-primary/90">
              Start New Chain Diagnosis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </AnimatedSection>
    );
  }



  return (
    <AnimatedSection className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Sessions ({sessions.length})</h2>
        <Button onClick={handleNewSession} className="bg-primary hover:bg-primary/90">
          New Diagnosis
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.isArray(sessions) && sessions.map(session => {
          try {
            if (!session || !session.id) {
              return null;
            }

            const createdAt = new Date(session.created_at || new Date().toISOString());
            const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true });

            // Create a fallback symptoms_info if it's missing
            if (!session.user_input) {
              session.user_input = {
                user_details: { id: session.user_id, first_name: '', last_name: '', gender: '', birth_year: 0, age: 0 },
                symptoms_info: { symptoms_list: ['No symptoms data'], duration: '' }
              };
            } else if (!session.user_input.symptoms_info) {
              session.user_input.symptoms_info = { symptoms_list: ['No symptoms data'], duration: '' };
            } else if (!session.user_input.symptoms_info.symptoms_list) {
              session.user_input.symptoms_info.symptoms_list = ['No symptoms data'];
            } else if (!Array.isArray(session.user_input.symptoms_info.symptoms_list)) {
              session.user_input.symptoms_info.symptoms_list = ['No symptoms data'];
            }

            // Get the primary symptoms with fallback for missing data
            const primarySymptoms = session.user_input.symptoms_info.symptoms_list.slice(0, 3);

            // Ensure session status is valid
            if (!session.status) {
              session.status = 'in_progress';
            }

            // Determine session status
            const isCompleted = session.status === 'completed';
            const isInProgress = session.status === 'in_progress';
            const hasError = session.status === 'error';

            return (
            <Card
              key={session.id}
              className="bg-card/50 backdrop-blur-sm border-primary/10 hover:shadow-md transition-all"
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/20 rounded-full">
                      <Brain className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Chain Diagnosis</CardTitle>
                  </div>

                  <Badge
                    className={
                      isCompleted ? "bg-green-500/20 text-green-500 hover:bg-green-500/30" :
                      isInProgress ? "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30" :
                      "bg-destructive/20 text-destructive hover:bg-destructive/30"
                    }
                  >
                    {isCompleted ? "Completed" : isInProgress ? "In Progress" : "Error"}
                  </Badge>
                </div>

                <CardDescription className="flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3" />
                  <span>{createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })}</span>
                  <span className="mx-1">•</span>
                  <Clock className="h-3 w-3" />
                  <span>{timeAgo}</span>
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Symptoms</h4>
                    <div className="flex flex-wrap gap-1">
                      {primarySymptoms.map((symptom, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="bg-background/50"
                        >
                          {symptom}
                        </Badge>
                      ))}
                      {session.user_input.symptoms_info.symptoms_list.length > 3 && (
                        <Badge variant="outline" className="bg-background/50">
                          +{session.user_input.symptoms_info.symptoms_list.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-1">Progress</h4>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          hasError ? "bg-destructive" : "bg-primary"
                        }`}
                        style={{ width: `${((session.current_step || 0) / 8) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Step {session.current_step || 0} of 8 completed
                    </p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2 border-t border-border/30">
                <Button
                  onClick={() => handleViewSession(session.id)}
                  className="w-full"
                  variant="outline"
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      View Complete Report
                    </>
                  ) : isInProgress ? (
                    <>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Continue Diagnosis
                    </>
                  ) : (
                    <>
                      <AlertCircle className="mr-2 h-4 w-4 text-destructive" />
                      View Details
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
            );
          } catch {
            return null;
          }
        })}
      </div>
    </AnimatedSection>
  );
}
