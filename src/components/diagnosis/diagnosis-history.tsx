"use client";

import React, { useEffect, useState } from 'react';
import { useChainDiagnosis } from '@/contexts/diagnosis-context';
import { ChainDiagnosisSession } from '@/types/diagnosis';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Brain,
  PlusCircle,
  FileText,
  Calendar,
  Trash2,
  X
} from 'lucide-react';
import { AnimatedSection, AnimatedIcon } from '@/components/animations';
import { motion } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChainDiagnosisHistoryProps {
  initialSessions: ChainDiagnosisSession[];
  userId: string;
}

export function ChainDiagnosisHistory({ initialSessions, userId }: ChainDiagnosisHistoryProps) {
  const { loadUserSessions, userSessions, isLoading, error, deleteSession } = useChainDiagnosis();
  const router = useRouter();

  // State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    router.push(`/dashboard/diagnosis/${sessionId}`);
  };

  // Handle starting a new session
  const handleNewSession = () => {
    router.push('/dashboard/diagnosis');
  };

  // Handle opening the delete confirmation dialog
  const handleOpenDeleteDialog = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    setSessionToDelete(sessionId);
    setIsDeleteDialogOpen(true);
  };

  // Handle closing the delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSessionToDelete(null);
  };

  // Handle deleting a session
  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;

    setIsDeleting(true);

    try {
      const success = await deleteSession(sessionToDelete, userId);
      if (success) {
        // Session was deleted successfully
        setIsDeleteDialogOpen(false);
        setSessionToDelete(null);
      }
    } finally {
      setIsDeleting(false);
    }
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
        <Card className="bg-card/50 backdrop-blur-sm border-primary/10 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-accent/5 rounded-full blur-3xl"></div>

          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <AnimatedIcon
                  icon={<FileText className="h-5 w-5 text-primary" />}
                  delay={0.1}
                />
              </div>
              <div>
                <CardTitle className="text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  No Diagnosis Sessions Found
                </CardTitle>
                <CardDescription>
                  You haven&apos;t started any diagnosis sessions yet.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="bg-card/50 backdrop-blur-sm border border-primary/5 rounded-xl p-5 mb-6">
              <p className="text-muted-foreground">
                Start a new diagnosis to get a comprehensive health analysis from our 8 specialized AI roles:
              </p>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Medical Analyst', 'General Physician', 'Specialist Doctor', 'Pathologist'].map((role, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary/60"></div>
                    <span className="text-sm">{role}</span>
                  </div>
                ))}
                {['Nutritionist', 'Pharmacist', 'Follow-up Specialist', 'Summarizer'].map((role, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent/60"></div>
                    <span className="text-sm">{role}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={handleNewSession}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-md hover:shadow-lg"
                size="lg"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Start New Diagnosis
              </Button>
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>
    );
  }



  return (
    <AnimatedSection className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl p-5 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <AnimatedIcon
              icon={<FileText className="h-5 w-5 text-primary" />}
              delay={0.1}
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Your Sessions
            </h2>
            <p className="text-sm text-muted-foreground">
              {sessions.length} {sessions.length === 1 ? 'diagnosis' : 'diagnoses'} in your history
            </p>
          </div>
        </div>

        <Button
          onClick={handleNewSession}
          className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-md hover:shadow-lg"
          size="lg"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          New Diagnosis
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border border-destructive/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this session? This will permanently remove the session and all associated chat history with Ask Radiance AI. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleCloseDeleteDialog}
              disabled={isDeleting}
              className="border-border"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSession}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
            const primarySymptoms = session.user_input?.symptoms_info?.symptoms_list?.slice(0, 3) || [];

            // Ensure session status is valid
            if (!session.status) {
              session.status = 'in_progress';
            }

            // Determine session status
            const isCompleted = session.status === 'completed';
            const isInProgress = session.status === 'in_progress';
            const hasError = session.status === 'error';

            return (
            <motion.div
              key={session.id}
              whileHover={{ y: -5, scale: 1.01 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                duration: 0.5
              }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-primary/10 hover:shadow-lg transition-all overflow-hidden relative h-full">
                {/* Background gradient blobs */}
                <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20
                  ${isCompleted ? "bg-green-500/20" : isInProgress ? "bg-amber-500/20" : "bg-destructive/20"}`}></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl opacity-20"></div>

                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md
                        ${isCompleted ? "bg-gradient-to-br from-green-500/30 to-green-600/50" :
                          isInProgress ? "bg-gradient-to-br from-amber-500/30 to-amber-600/50" :
                          "bg-gradient-to-br from-destructive/30 to-destructive/50"}`}>
                        <Brain className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                          Diagnosis
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>{createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </CardDescription>
                      </div>
                    </div>

                    <Badge
                      className={`px-3 py-1 rounded-full font-medium ${
                        isCompleted ? "bg-gradient-to-r from-green-500/20 to-green-600/30 text-green-500 border-green-500/30" :
                        isInProgress ? "bg-gradient-to-r from-amber-500/20 to-amber-600/30 text-amber-500 border-amber-500/30" :
                        "bg-gradient-to-r from-destructive/20 to-destructive/30 text-destructive border-destructive/30"
                      }`}
                    >
                      {isCompleted ? "Completed" : isInProgress ? "In Progress" : "Error"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pb-6">
                  <div className="space-y-4">
                    <div className="bg-card/50 backdrop-blur-sm border border-primary/5 rounded-lg p-3">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                        </div>
                        Symptoms
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {primarySymptoms.map((symptom, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="bg-background/50 border-primary/20 px-2 py-0.5 rounded-md"
                          >
                            {symptom}
                          </Badge>
                        ))}
                        {(session.user_input?.symptoms_info?.symptoms_list?.length || 0) > 3 && (
                          <Badge variant="outline" className="bg-background/50 border-primary/20 px-2 py-0.5 rounded-md">
                            +{(session.user_input?.symptoms_info?.symptoms_list?.length || 0) - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                          </div>
                          Progress
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {session.current_step || 0}/8 steps
                        </span>
                      </div>

                      <div className="w-full bg-muted/50 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            hasError ? "bg-gradient-to-r from-destructive/70 to-destructive" :
                            isCompleted ? "bg-gradient-to-r from-green-500/70 to-green-600" :
                            "bg-gradient-to-r from-primary/70 to-primary"
                          }`}
                          style={{ width: `${((session.current_step || 0) / 8) * 100}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between mt-1">
                        <p className="text-xs text-muted-foreground">
                          {timeAgo}
                        </p>
                        <p className="text-xs font-medium">
                          {isCompleted ? "All steps completed" :
                           hasError ? "Error occurred" :
                           `${((session.current_step || 0) / 8) * 100}% complete`}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-3 border-t border-border/20 flex flex-col gap-2">
                  <Button
                    onClick={() => handleViewSession(session.id)}
                    className={`w-full shadow-sm hover:shadow-md ${
                      isCompleted ? "bg-gradient-to-r from-green-500/20 to-green-600/30 text-green-500 border-green-500/30 hover:bg-gradient-to-r hover:from-green-500/30 hover:to-green-600/40" :
                      isInProgress ? "bg-gradient-to-r from-primary/20 to-primary/30 text-primary border-primary/30 hover:bg-gradient-to-r hover:from-primary/30 hover:to-primary/40" :
                      "bg-gradient-to-r from-destructive/20 to-destructive/30 text-destructive border-destructive/30 hover:bg-gradient-to-r hover:from-destructive/30 hover:to-destructive/40"
                    }`}
                    variant="outline"
                    size="lg"
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                        View Complete Report
                      </>
                    ) : isInProgress ? (
                      <>
                        <ArrowRight className="mr-2 h-5 w-5 text-primary" />
                        Continue Diagnosis
                      </>
                    ) : (
                      <>
                        <AlertCircle className="mr-2 h-5 w-5 text-destructive" />
                        View Details
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={(e) => handleOpenDeleteDialog(session.id, e)}
                    className="w-full bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20"
                    variant="outline"
                    size="sm"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Session
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
            );
          } catch {
            return null;
          }
        })}
      </div>
    </AnimatedSection>
  );
}
