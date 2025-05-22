import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SubNavbar } from "@/components/sub-navbar";
import { StandaloneAskRadiance } from "@/components/diagnosis/standalone-ask-radiance";
import { AnimatedSection, FloatingElement, AnimatedIcon } from "@/components/animations";
import { GradientHeading } from "@/components/ui/gradient-heading";
import { MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Ask Radiance Health Assistant | Radiance AI",
  description: "Consult with Radiance AI's virtual health assistant about your medical questions and health concerns",
};

export default async function AskRadiancePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login?redirectUrl=/dashboard/ask-radiance");
  }

  return (
    <>
      <SubNavbar title="Ask Radiance" showProfileNav={false} />
      <div className="relative overflow-hidden py-10 px-4">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-background to-accent/5 z-0" />
        <div className="container relative z-10 mx-auto max-w-5xl">
          <AnimatedSection className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <FloatingElement>
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <MessageSquare className="h-6 w-6" />
                </div>
              </FloatingElement>
              <div>
                <GradientHeading as="h1" size="xl" className="mb-1">
                  Virtual Health Assistant
                </GradientHeading>
                <p className="text-muted-foreground">
                  Consult with Radiance AI's medical expert about your health questions and receive evidence-based guidance
                </p>
              </div>
            </div>
          </AnimatedSection>

          <StandaloneAskRadiance userId={data.user.id} />
        </div>
      </div>
    </>
  );
}
