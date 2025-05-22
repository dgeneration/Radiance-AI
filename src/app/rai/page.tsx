import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { SubNavbar } from "@/components/sub-navbar";
import { HeaderSection } from "@/components/rai/header-section";
import { AnimatedCard } from "@/components/rai/animated-card";
import { DisclaimerSection } from "@/components/rai/disclaimer-section";
import {
  MessageSquare,
  Activity,
  FileText,
  Stethoscope,
  Users,
  Beaker,
  Brain
} from "lucide-react";

export const metadata: Metadata = {
  title: "Radiance AI (RAI) | Health Diagnosis",
  description: "Choose between General Diagnosis for quick health inquiries or Deep Diagnosis for comprehensive multi-specialist analysis",
};

export default async function RadianceAIPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login?redirectUrl=/rai");
  }

  return (
    <>
      <SubNavbar title="AI Diagnosis" showProfileNav={false} />
      <div className="relative overflow-hidden py-10 px-4">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-background to-accent/5 z-0"></div>

        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5 z-0 bg-[url('/patterns/dot-pattern.svg')] pointer-events-none"></div>

        <div className="container relative z-10 mx-auto max-w-5xl">
          {/* Header Section */}
          <div className="mb-10">
            <HeaderSection
              title="Radiance AI Health Diagnosis"
              description="Choose the type of health analysis that best suits your needs. Get quick answers to health questions or experience our comprehensive multi-specialist diagnosis system for in-depth analysis."
            />
          </div>

          {/* Diagnosis Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            {/* General Diagnosis Card */}
            <AnimatedCard
              title="General Diagnosis"
              badgeText="Quick Health Assistant"
              description="Get quick answers to your health questions from our AI health assistant. Upload medical images or reports for analysis and receive personalized health insights."
              icon={<MessageSquare className="h-8 w-8 text-primary" />}
              features={[
                {
                  icon: <Activity className="w-3 h-3 text-primary" />,
                  text: "Quick health questions and concerns"
                },
                {
                  icon: <FileText className="w-3 h-3 text-primary" />,
                  text: "Upload and analyze medical reports"
                },
                {
                  icon: <Stethoscope className="w-3 h-3 text-primary" />,
                  text: "Evidence-based health information"
                }
              ]}
              buttonText="Start General Diagnosis"
              buttonLink="/ask-radiance"
              isPrimary={true}
              direction="left"
              delay={0.2}
            />

            {/* Deep Diagnosis Card */}
            <AnimatedCard
              title="Deep Diagnosis"
              badgeText="Multi-Specialist Analysis"
              description="Experience our comprehensive multi-agent diagnosis system that analyzes your symptoms through 8 specialized AI roles, providing detailed health insights and personalized recommendations."
              icon={<Brain className="h-8 w-8 text-accent" />}
              features={[
                {
                  icon: <Users className="w-3 h-3 text-accent" />,
                  text: "8 specialized AI medical roles"
                },
                {
                  icon: <Beaker className="w-3 h-3 text-accent" />,
                  text: "In-depth symptom analysis"
                },
                {
                  icon: <FileText className="w-3 h-3 text-accent" />,
                  text: "Comprehensive health report"
                }
              ]}
              buttonText="Start Deep Diagnosis"
              buttonLink="/diagnosis"
              isPrimary={false}
              direction="right"
              delay={0.3}
            />
          </div>

          {/* Medical Disclaimer */}
          <DisclaimerSection
            title="Medical Disclaimer"
            description="This system is for informational purposes only and is not a substitute for professional medical advice. Always consult with a qualified healthcare provider for diagnosis and treatment of medical conditions."
          />
        </div>
      </div>
    </>
  );
}
