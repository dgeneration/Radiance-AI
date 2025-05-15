import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Eye, History, FileText } from "lucide-react";
import { SubNavbar } from "@/components/sub-navbar";
import { AnimatedIcon } from "@/components/animations";
import { GradientHeading } from "@/components/ui/gradient-heading";
import { ProfessionalButton } from "@/components/ui/professional-button";
import { AnimatedDashboardSection, AnimatedCard } from "@/components/dashboard";

export const metadata: Metadata = {
  title: "Diagnosis History | Radiance AI",
  description: "View your diagnosis history",
};

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    redirect("/auth/login?redirectUrl=/dashboard/history");
  }

  // Fetch diagnoses from Supabase
  let diagnoses = [];
  try {
    const { data: diagnosesData, error } = await supabase
      .from('diagnoses')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (!error && diagnosesData) {
      diagnoses = diagnosesData;
    }
  } catch (error) {
    console.error("Error fetching diagnoses:", error);
    // Continue with empty diagnoses array
  }

  return (
    <>
      <SubNavbar title="Diagnosis History" />
      <div className="container mx-auto py-10 px-6 relative">

        <div className="max-w-5xl mx-auto">
          {/* Welcome Section */}
          <AnimatedDashboardSection direction="up" delay={0.1} className="mb-10">
            <div className="relative overflow-hidden bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg">

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
                      Diagnosis History
                    </GradientHeading>
                    <p className="text-muted-foreground mb-6 max-w-2xl">
                      View your past health diagnoses and track your health journey over time.
                      Each diagnosis includes detailed information about your symptoms,
                      potential conditions, and recommended next steps.
                    </p>

                    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                      <ProfessionalButton
                        asChild
                        variant="primary"
                        icon={<FileText className="h-4 w-4" />}
                        iconPosition="left"
                      >
                        <Link href="/diagnosis">Get New Diagnosis</Link>
                      </ProfessionalButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedDashboardSection>

          {/* Main Content */}
          <AnimatedDashboardSection direction="up" delay={0.2}>
            {diagnoses.length > 0 ? (
              <div className="bg-card/80 backdrop-blur-sm p-6 rounded-2xl border border-primary/10 shadow-lg overflow-hidden">
                <div className="flex items-center gap-4 mb-6">
                  <AnimatedIcon
                    icon={<FileText className="w-6 h-6 text-accent" />}
                    className="p-2 bg-accent/10 rounded-full"
                    delay={0.3}
                  />
                  <GradientHeading level={3} size="sm" fromColor="from-accent" toColor="to-primary">
                    Your Diagnoses
                  </GradientHeading>
                </div>

                <div className="grid grid-cols-1 gap-4 mt-6">
                  {diagnoses.map((diagnosis, index) => (
                    <AnimatedCard key={diagnosis.id} delay={0.3 + (index * 0.05)}>
                      <div className="bg-card/50 backdrop-blur-sm p-5 rounded-xl border border-primary/10 hover:border-primary/30 hover:shadow-md transition-all duration-300">
                        <div className="flex flex-col md:flex-row items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>

                          <div className="flex-1 space-y-2">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                              <h3 className="text-lg font-medium bg-gradient-to-r from-primary/90 to-accent/90 bg-clip-text text-transparent">
                                {diagnosis.diagnosis}
                              </h3>
                              <div className="text-sm text-muted-foreground">
                                {new Date(diagnosis.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })}
                                {diagnosis.icd_code && <span className="ml-2 px-2 py-0.5 bg-primary/10 rounded-full text-xs font-medium text-primary">ICD: {diagnosis.icd_code}</span>}
                              </div>
                            </div>

                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {diagnosis.symptoms}
                            </p>

                            <div className="flex justify-end pt-2">
                              <ProfessionalButton
                                asChild
                                variant="outline"
                                size="sm"
                                icon={<Eye className="h-4 w-4" />}
                                iconPosition="left"
                              >
                                <Link href={`/dashboard/history/${diagnosis.id}`}>
                                  View Details
                                </Link>
                              </ProfessionalButton>
                            </div>
                          </div>
                        </div>
                      </div>
                    </AnimatedCard>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shadow-lg mx-auto mb-6">
                  <AnimatedIcon
                    icon={<FileText className="w-10 h-10 text-primary" />}
                    delay={0.3}
                  />
                </div>
                <GradientHeading level={3} size="sm" className="mb-4">
                  No Diagnoses Yet
                </GradientHeading>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  You don&apos;t have any diagnoses yet. Start by getting your first AI-powered health diagnosis.
                </p>
                <ProfessionalButton
                  asChild
                  variant="primary"
                  icon={<FileText className="h-4 w-4" />}
                  iconPosition="left"
                >
                  <Link href="/diagnosis">Get Your First Diagnosis</Link>
                </ProfessionalButton>
              </div>
            )}
          </AnimatedDashboardSection>
        </div>
      </div>
    </>
  );
}
