import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SubNavbar } from "@/components/sub-navbar";
import { ChainDiagnosisProvider } from "@/contexts/diagnosis-context";
import { ChainDiagnosisHistory } from "@/components/diagnosis/diagnosis-history";
import { AnimatedSection, FloatingElement, AnimatedIcon } from "@/components/animations";
import { GradientHeading } from "@/components/ui/gradient-heading";
import { History } from "lucide-react";

export const metadata: Metadata = {
  title: "Diagnosis History | Radiance AI",
  description: "View your past diagnosis sessions",
};

// Add dynamic export to ensure the page is always fresh
export const dynamic = "force-dynamic";

export default async function DiagnosisHistoryPage() {
  // Check if user is logged in
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  // Redirect non-logged in users to the login page
  if (!userData.user) {
    redirect("/auth/login?redirectUrl=/diagnosis/history");
  }

  // Get user's diagnosis sessions
  let sessions = [];
  try {
    const { data: sessionsData, error } = await supabase
      .from("chain_diagnosis_sessions")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (!error) {
      sessions = Array.isArray(sessionsData) ? sessionsData : [];
    }
  } catch {
    // Continue with empty sessions array
  }

  // Ensure sessions is always an array
  if (!Array.isArray(sessions)) {
    sessions = [];
  }

  return (
    <ChainDiagnosisProvider>
      <SubNavbar title="Diagnosis History" showProfileNav={true} />
      <div className="relative overflow-hidden py-10 px-4">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-background to-accent/5 z-0"></div>

        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5 z-0 bg-[url('/patterns/dot-pattern.svg')] pointer-events-none"></div>

        <div className="container relative z-10 mx-auto max-w-5xl">
          <AnimatedSection direction="up" delay={0.1} className="mb-10">
            <div className="relative overflow-hidden bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg mb-8">
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
                      icon={<History className="w-10 h-10 text-primary" />}
                      delay={0.2}
                      pulseEffect={true}
                    />
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <GradientHeading level={2} size="md" className="mb-2">
                      Your Diagnosis History
                    </GradientHeading>
                    <p className="text-muted-foreground mb-6 max-w-2xl">
                      View and manage your past diagnosis sessions. Each session contains a comprehensive
                      health analysis from our 8 specialized AI roles.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          <ChainDiagnosisHistory initialSessions={sessions} userId={userData.user.id} />
        </div>
      </div>
    </ChainDiagnosisProvider>
  );
