import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import SymptomForm from "@/components/symptom-form";
import { SubNavbar } from "@/components/sub-navbar";
import { AnimatedSection, FloatingElement, AnimatedIcon } from "@/components/animations";
import { GradientHeading } from "@/components/ui/gradient-heading";
import { FaStethoscope } from "react-icons/fa";
import { MdHealthAndSafety } from "react-icons/md";

export const metadata: Metadata = {
  title: "Symptom Diagnosis | Radiance AI",
  description: "Enter your symptoms for an AI-powered diagnosis",
};

export default async function DiagnosisPage() {
  // Check if user is logged in
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  // Redirect non-logged in users to the login page
  if (!data.user) {
    redirect("/auth/login?redirectUrl=/diagnosis");
  }

  return (
    <>
      <SubNavbar title="Symptom Diagnosis" />
      <div className="relative overflow-hidden">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background/80 z-0 pointer-events-none"></div>

        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5 z-0 bg-[url('/patterns/dot-pattern.svg')] pointer-events-none"></div>

        {/* Content */}
        <div className="relative z-10">
          <div className="container mx-auto py-10 px-6">
            <div className="max-w-5xl mx-auto">
          {/* Welcome Section */}
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
                      icon={<FaStethoscope className="w-10 h-10 text-primary" />}
                      delay={0.2}
                      pulseEffect={true}
                    />
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <GradientHeading level={2} size="md" className="mb-2">
                      AI-Powered Health Diagnosis
                    </GradientHeading>
                    <p className="text-muted-foreground mb-6 max-w-2xl">
                      Enter your symptoms and relevant information below for a comprehensive AI-powered diagnosis.
                      Our system uses advanced medical knowledge and research to provide insights about your condition.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Main Content */}
          <AnimatedSection direction="up" delay={0.2}>
            <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <AnimatedIcon
                  icon={<MdHealthAndSafety className="w-6 h-6 text-accent" />}
                  className="p-2 bg-accent/10 rounded-full"
                  delay={0.3}
                />
                <GradientHeading level={3} size="sm" fromColor="from-accent" toColor="to-primary">
                  Symptom Analysis
                </GradientHeading>
              </div>

              <SymptomForm />
            </div>
          </AnimatedSection>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
