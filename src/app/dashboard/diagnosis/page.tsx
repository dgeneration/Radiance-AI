import React from "react";
import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SubNavbar } from "@/components/sub-navbar";
import { ChainDiagnosisForm } from "@/components/chain-diagnosis/diagnosis-form";
import { ChainDiagnosisProvider } from "@/contexts/chain-diagnosis-context";
import { AnimatedSection, FloatingElement, AnimatedIcon } from "@/components/animations";
import { GradientHeading } from "@/components/ui/gradient-heading";
import { FaBrain, FaFlask, FaUserMd, FaStethoscope, FaVial, FaAppleAlt, FaPills, FaCalendarCheck, FaFileAlt } from "react-icons/fa";

export const metadata: Metadata = {
  title: "Diagnosis | Radiance AI",
  description: "Get a comprehensive health analysis from 8 specialized AI roles",
};

export default async function DiagnosisPage() {
  // Check if user is logged in
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  // Redirect non-logged in users to the login page
  if (!userData.user) {
    redirect("/auth/login?redirectUrl=/dashboard/diagnosis");
  }

  // We'll let the client component fetch the user profile
  // This matches how the diagnosis symptom form works

  return (
    <ChainDiagnosisProvider>
      <SubNavbar title="Diagnosis" showProfileNav={true} />
      <div className="relative overflow-hidden py-10 px-4">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-background to-accent/5 z-0"></div>

        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5 z-0 bg-[url('/patterns/dot-pattern.svg')] pointer-events-none"></div>

        <div className="container relative z-10 mx-auto max-w-4xl">
          {/* AI-Powered Health Diagnosis Section */}
          <AnimatedSection direction="up" delay={0.1} className="mb-10">
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
                      icon={<FaBrain className="w-10 h-10 text-primary" />}
                      delay={0.2}
                      pulseEffect={true}
                    />
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <GradientHeading level={2} size="md" className="mb-2">
                      AI-Powered Health Diagnosis
                    </GradientHeading>
                    <p className="text-muted-foreground mb-6 max-w-2xl">
                      Experience our advanced multi-agent diagnosis system that analyzes your symptoms through 8 specialized AI roles.
                      From initial assessment to specialized insights, our system provides a comprehensive health analysis with personalized recommendations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          <ChainDiagnosisForm userId={userData.user.id} />

          <AnimatedSection direction="up" delay={0.3} className="mt-10">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shadow-md">
                  <AnimatedIcon
                    icon={<FaStethoscope className="w-6 h-6 text-primary" />}
                    delay={0.2}
                  />
                </div>
              </div>
              <GradientHeading level={3} size="sm" className="mb-2">
                Our Specialized AI Roles
              </GradientHeading>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Each role in our diagnosis system provides unique expertise for a comprehensive health analysis
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  title: "Medical Analyst",
                  description: "Analyzes medical reports and test results with precision",
                  icon: <FaFlask className="w-5 h-5" />,
                  color: "from-primary/70 to-primary"
                },
                {
                  title: "General Physician",
                  description: "Provides initial assessment and specialist referral",
                  icon: <FaUserMd className="w-5 h-5" />,
                  color: "from-primary/60 to-primary/90"
                },
                {
                  title: "Specialist Doctor",
                  description: "Offers specialized insights based on your symptoms",
                  icon: <FaStethoscope className="w-5 h-5" />,
                  color: "from-primary/50 to-primary/80"
                },
                {
                  title: "Pathologist",
                  description: "Explains relevant lab tests and findings",
                  icon: <FaVial className="w-5 h-5" />,
                  color: "from-accent/60 to-accent/90"
                },
                {
                  title: "Nutritionist",
                  description: "Provides dietary recommendations for your condition",
                  icon: <FaAppleAlt className="w-5 h-5" />,
                  color: "from-accent/50 to-accent/80"
                },
                {
                  title: "Pharmacist",
                  description: "Offers medication information and considerations",
                  icon: <FaPills className="w-5 h-5" />,
                  color: "from-primary/60 to-accent/60"
                },
                {
                  title: "Follow-up Specialist",
                  description: "Provides monitoring and follow-up guidance",
                  icon: <FaCalendarCheck className="w-5 h-5" />,
                  color: "from-accent/70 to-primary/70"
                },
                {
                  title: "Radiance AI Summarizer",
                  description: "Creates a comprehensive final health report",
                  icon: <FaFileAlt className="w-5 h-5" />,
                  color: "from-primary/80 to-accent/80"
                }
              ].map((role, index) => (
                <div
                  key={index}
                  className="group bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl p-6 hover:shadow-xl transition-all duration-300 hover:border-primary/30 hover:translate-y-[-5px] hover:scale-[1.02]"
                >
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${role.color} flex items-center justify-center shadow-lg border border-white/10 transform transition-all duration-300 group-hover:scale-110`}>
                      {React.cloneElement(role.icon, { className: "w-7 h-7 text-white" })}
                    </div>
                    <div>
                      <h3 className="font-medium text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-1">{role.title}</h3>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AnimatedSection>

          <div className="mt-8 p-5 bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <FaStethoscope className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-primary mb-1">Medical Disclaimer</h4>
                <p className="text-sm text-muted-foreground">
                  This system is for informational purposes only and is not a substitute for professional medical advice.
                  Always consult with a qualified healthcare provider for diagnosis and treatment of medical conditions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ChainDiagnosisProvider>
  );
}
