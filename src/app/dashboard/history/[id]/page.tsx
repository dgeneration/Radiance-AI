import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { ExternalLink, ArrowLeft, FileText, AlertCircle, BookOpen, Database, User } from "lucide-react";
import { SubNavbar } from "@/components/sub-navbar";
import { FloatingElement, AnimatedIcon } from "@/components/animations";
import { GradientHeading } from "@/components/ui/gradient-heading";
import { ProfessionalButton } from "@/components/ui/professional-button";
import { AnimatedDashboardSection, DashboardFloatingElement, AnimatedCard } from "@/components/dashboard";

export const metadata: Metadata = {
  title: "Diagnosis Details | Radiance AI",
  description: "View your diagnosis details",
};

export default async function DiagnosisDetailPage({ params }: any) {
  const diagnosisId = params.id;
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    redirect("/auth/login?redirectUrl=/dashboard/history");
  }

  try {
    const { data: diagnosis, error: diagnosisError } = await supabase
      .from("diagnoses")
      .select("id, created_at, user_id, symptoms, age, gender, duration, medical_history, diagnosis, reasoning, icd_code, citations, api_response")
      .eq("id", diagnosisId)
      .eq("user_id", userData.user.id)
      .single();

    if (diagnosisError || !diagnosis) {
      redirect("/dashboard/history?error=Diagnosis not found");
    }

    return (
      <>
        <SubNavbar title="Diagnosis Details" />
        <div className="container mx-auto py-10 px-6 relative">
          {/* Background decorative elements */}
          <DashboardFloatingElement
            className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10"
            duration={8}
            xOffset={10}
            yOffset={15}
            opacity={0.5}
          />
          <DashboardFloatingElement
            className="absolute bottom-20 right-10 w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-10"
            duration={10}
            xOffset={-10}
            yOffset={-15}
            delay={1}
            opacity={0.5}
          />

          <div className="max-w-4xl mx-auto">
            <AnimatedDashboardSection delay={0.1}>
              <div className="flex items-center gap-2 mb-6">
                <ProfessionalButton
                  asChild
                  variant="outline"
                  size="sm"
                  icon={<ArrowLeft className="h-4 w-4" />}
                  iconPosition="left"
                >
                  <Link href="/dashboard/history">
                    Back to History
                  </Link>
                </ProfessionalButton>
              </div>

              <div className="relative overflow-hidden bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg mb-8">
                <FloatingElement
                  className="absolute top-0 right-0 w-60 h-60 bg-primary/10 rounded-full blur-3xl opacity-30"
                  duration={10}
                  xOffset={15}
                  yOffset={20}
                />

                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shadow-lg">
                      <AnimatedIcon
                        icon={<FileText className="w-10 h-10 text-primary" />}
                        delay={0.2}
                        pulseEffect={true}
                      />
                    </div>

                    <div className="flex-1 text-center md:text-left">
                      <GradientHeading level={1} size="lg" className="mb-2">
                        Diagnosis Details
                      </GradientHeading>
                      <p className="text-muted-foreground mb-2">
                        Diagnosis from {new Date(diagnosis.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedDashboardSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <AnimatedDashboardSection delay={0.2} direction="left" className="md:col-span-2">
                <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-primary/10 shadow-lg overflow-hidden">
                  <div className="bg-primary/5 border-b border-primary/10 p-6">
                    <div className="flex items-center gap-4 mb-2">
                      <AnimatedIcon
                        icon={<AlertCircle className="w-6 h-6 text-primary" />}
                        className="p-2 bg-primary/10 rounded-full"
                        delay={0.3}
                      />
                      <GradientHeading level={3} size="sm">
                        Primary Diagnosis
                      </GradientHeading>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Based on your symptoms and medical information
                    </p>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-primary/90 to-accent/90 bg-clip-text text-transparent">
                      {diagnosis.diagnosis}
                    </h3>
                    <div className="bg-card/50 p-4 rounded-xl border border-primary/10 mt-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <span className="text-primary">ICD-10 Code:</span> {diagnosis.icd_code}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        International Classification of Diseases, 10th Revision
                      </p>
                    </div>
                  </div>
                </div>
              </AnimatedDashboardSection>

              <AnimatedDashboardSection delay={0.3} direction="right">
                <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-primary/10 shadow-lg overflow-hidden">
                  <div className="bg-primary/5 border-b border-primary/10 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-medium">Patient Information</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-primary/5">
                        <span className="text-muted-foreground">Age:</span>
                        <span className="font-medium">{diagnosis.age}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-primary/5">
                        <span className="text-muted-foreground">Gender:</span>
                        <span className="font-medium capitalize">{diagnosis.gender}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-medium">{diagnosis.duration}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedDashboardSection>
            </div>

            <div className="space-y-6">
              <AnimatedDashboardSection delay={0.4} direction="up">
                <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-primary/10 shadow-lg overflow-hidden">
                  <div className="bg-primary/5 border-b border-primary/10 p-6">
                    <div className="flex items-center gap-4 mb-2">
                      <AnimatedIcon
                        icon={<FileText className="w-6 h-6 text-primary" />}
                        className="p-2 bg-primary/10 rounded-full"
                        delay={0.5}
                      />
                      <GradientHeading level={3} size="sm">
                        Symptoms
                      </GradientHeading>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Reported symptoms and medical history
                    </p>
                  </div>
                  <div className="p-6">
                    <p className="mb-4">{diagnosis.symptoms}</p>
                    {diagnosis.medical_history && (
                      <div className="mt-6 p-4 bg-card/50 rounded-xl border border-primary/10">
                        <h4 className="font-medium mb-2 text-primary">Medical History</h4>
                        <p className="text-muted-foreground">
                          {diagnosis.medical_history}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </AnimatedDashboardSection>

              <AnimatedDashboardSection delay={0.5} direction="up">
                <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-primary/10 shadow-lg overflow-hidden">
                  <div className="bg-primary/5 border-b border-primary/10 p-6">
                    <div className="flex items-center gap-4 mb-2">
                      <AnimatedIcon
                        icon={<BookOpen className="w-6 h-6 text-accent" />}
                        className="p-2 bg-accent/10 rounded-full"
                        delay={0.6}
                      />
                      <GradientHeading level={3} size="sm" fromColor="from-accent" toColor="to-primary">
                        Diagnostic Reasoning
                      </GradientHeading>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      How the AI reached this conclusion
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="whitespace-pre-wrap">
                      {diagnosis.reasoning.split('\n').map((paragraph: string, index: number) => (
                        <p key={index} className={index < diagnosis.reasoning.split('\n').length - 1 ? "mb-4" : ""}>
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </AnimatedDashboardSection>

              <AnimatedDashboardSection delay={0.6} direction="up">
                <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-primary/10 shadow-lg overflow-hidden">
                  <div className="bg-primary/5 border-b border-primary/10 p-6">
                    <div className="flex items-center gap-4 mb-2">
                      <AnimatedIcon
                        icon={<BookOpen className="w-6 h-6 text-primary" />}
                        className="p-2 bg-primary/10 rounded-full"
                        delay={0.7}
                      />
                      <GradientHeading level={3} size="sm">
                        Medical Citations
                      </GradientHeading>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Research supporting this diagnosis
                    </p>
                  </div>
                  <div className="p-6 space-y-4">
                    {Array.isArray(diagnosis.citations) &&
                    diagnosis.citations.length > 0 ? (
                      diagnosis.citations.map((citation: { title: string; url: string }, index: number) => (
                        <AnimatedCard key={index} delay={0.7 + (index * 0.05)} hoverEffect={false}>
                          <div className="p-4 bg-card/50 rounded-xl border border-primary/10 hover:border-primary/20 transition-all duration-300">
                            <h4 className="font-medium flex items-center gap-2 mb-1">
                              {citation.title}
                              <a
                                href={citation.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 inline-flex items-center"
                              >
                                <ExternalLink className="h-4 w-4" />
                                <span className="sr-only">Open in new tab</span>
                              </a>
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              <a
                                href={citation.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline text-muted-foreground/80"
                              >
                                {citation.url.length > 60
                                  ? `${citation.url.substring(0, 60)}...`
                                  : citation.url}
                              </a>
                            </p>
                          </div>
                        </AnimatedCard>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground p-4 bg-card/50 rounded-xl border border-primary/10">
                        No citations available.
                      </p>
                    )}
                  </div>
                </div>
              </AnimatedDashboardSection>

              {diagnosis.api_response && (
                <AnimatedDashboardSection delay={0.7} direction="up">
                  <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-primary/10 shadow-lg overflow-hidden">
                    <div className="bg-primary/5 border-b border-primary/10 p-6">
                      <div className="flex items-center gap-4 mb-2">
                        <AnimatedIcon
                          icon={<Database className="w-6 h-6 text-accent" />}
                          className="p-2 bg-accent/10 rounded-full"
                          delay={0.8}
                        />
                        <GradientHeading level={3} size="sm" fromColor="from-accent" toColor="to-primary">
                          API Details
                        </GradientHeading>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Technical information about the AI response
                      </p>
                    </div>
                    <div className="p-6">
                      <div className="space-y-6">
                        {diagnosis.api_response.model && (
                          <div className="p-4 bg-card/50 rounded-xl border border-primary/10">
                            <h4 className="font-medium mb-2 text-primary">AI Model</h4>
                            <p className="text-sm">
                              {diagnosis.api_response.model}
                            </p>
                          </div>
                        )}

                        {diagnosis.api_response.usage && (
                          <div className="p-4 bg-card/50 rounded-xl border border-primary/10">
                            <h4 className="font-medium mb-3 text-primary">Usage Statistics</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {diagnosis.api_response.usage.prompt_tokens && (
                                <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                    <span className="text-xs font-bold text-primary">PT</span>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Prompt Tokens</p>
                                    <p className="font-medium">{diagnosis.api_response.usage.prompt_tokens}</p>
                                  </div>
                                </div>
                              )}
                              {diagnosis.api_response.usage.completion_tokens && (
                                <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                    <span className="text-xs font-bold text-primary">CT</span>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Completion Tokens</p>
                                    <p className="font-medium">{diagnosis.api_response.usage.completion_tokens}</p>
                                  </div>
                                </div>
                              )}
                              {diagnosis.api_response.usage.total_tokens && (
                                <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                    <span className="text-xs font-bold text-primary">TT</span>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Total Tokens</p>
                                    <p className="font-medium">{diagnosis.api_response.usage.total_tokens}</p>
                                  </div>
                                </div>
                              )}
                              {diagnosis.api_response.usage.num_search_queries && (
                                <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                    <span className="text-xs font-bold text-primary">SQ</span>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Search Queries</p>
                                    <p className="font-medium">{diagnosis.api_response.usage.num_search_queries}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {diagnosis.api_response.citations && diagnosis.api_response.citations.length > 0 && (
                          <div className="p-4 bg-card/50 rounded-xl border border-primary/10">
                            <h4 className="font-medium mb-2 text-primary">Raw Citations</h4>
                            <div className="max-h-40 overflow-y-auto bg-card/50 p-3 rounded-lg border border-primary/5 text-xs">
                              <ul className="list-disc pl-5 space-y-1">
                                {diagnosis.api_response.citations.map((url: string, index: number) => (
                                  <li key={index}>
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline"
                                    >
                                      {url}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </AnimatedDashboardSection>
              )}
            </div>

            <AnimatedDashboardSection delay={0.8} direction="up" className="mt-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <ProfessionalButton
                  asChild
                  variant="primary"
                  icon={<FileText className="h-4 w-4" />}
                  iconPosition="left"
                  className="flex-1"
                >
                  <Link href="/diagnosis">New Diagnosis</Link>
                </ProfessionalButton>
                <ProfessionalButton
                  asChild
                  variant="outline"
                  icon={<ArrowLeft className="h-4 w-4" />}
                  iconPosition="left"
                  className="flex-1"
                >
                  <Link href="/dashboard/history">Back to History</Link>
                </ProfessionalButton>
              </div>
            </AnimatedDashboardSection>

            <AnimatedDashboardSection delay={0.9} direction="up" className="mt-6">
              <div className="p-5 bg-card/30 backdrop-blur-sm border border-primary/10 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-medium text-primary">Medical Disclaimer</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  This AI-generated diagnosis is for informational purposes only and should not replace professional
                  medical advice. Always consult with a qualified healthcare provider for proper diagnosis and treatment of medical conditions.
                </p>
              </div>
            </AnimatedDashboardSection>
          </div>
        </div>
      </>
    );
  } catch (error) {
    console.error("Error fetching diagnosis:", error);
    redirect("/dashboard/history?error=Error fetching diagnosis");
  }

  return null; // Required by TS, even if redirect runs
}
