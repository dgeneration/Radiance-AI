import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SubNavbar } from "@/components/sub-navbar";
import { ChainDiagnosisForm } from "@/components/chain-diagnosis/diagnosis-form";
import { ChainDiagnosisProvider } from "@/contexts/chain-diagnosis-context";

export const metadata: Metadata = {
  title: "Chain Diagnosis | Radiance AI",
  description: "Get a comprehensive health analysis from 8 specialized AI roles",
};

export default async function ChainDiagnosisPage() {
  // Check if user is logged in
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  // Redirect non-logged in users to the login page
  if (!userData.user) {
    redirect("/auth/login?redirectUrl=/dashboard/chain-diagnosis");
  }

  // Get user profile data
  const { data: profileData } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userData.user.id)
    .single();

  const userProfile = profileData || {};

  return (
    <ChainDiagnosisProvider>
      <SubNavbar title="Multi-Agent Chain Diagnosis" showProfileNav={true} />
      <div className="relative overflow-hidden py-10 px-4">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-background to-accent/5 z-0"></div>

        <div className="container relative z-10 mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
              Multi-Agent Chain Diagnosis System
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our advanced system uses 8 specialized AI roles to provide a comprehensive health analysis, 
              from initial assessment to follow-up recommendations.
            </p>
          </div>

          <ChainDiagnosisForm userId={userData.user.id} userProfile={userProfile} />
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Medical Analyst",
                description: "Analyzes medical reports and test results"
              },
              {
                title: "General Physician",
                description: "Provides initial assessment and specialist referral"
              },
              {
                title: "Specialist Doctor",
                description: "Offers specialized insights based on your symptoms"
              },
              {
                title: "Pathologist",
                description: "Explains relevant lab tests and findings"
              },
              {
                title: "Nutritionist",
                description: "Provides dietary recommendations"
              },
              {
                title: "Pharmacist",
                description: "Offers medication information and considerations"
              },
              {
                title: "Follow-up Specialist",
                description: "Provides monitoring and follow-up guidance"
              },
              {
                title: "Radiance AI Summarizer",
                description: "Creates a comprehensive final report"
              }
            ].map((role, index) => (
              <div 
                key={index}
                className="bg-card/30 backdrop-blur-sm border border-primary/10 rounded-lg p-4 hover:shadow-md transition-all"
              >
                <h3 className="font-medium text-primary">{role.title}</h3>
                <p className="text-sm text-muted-foreground">{role.description}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-card/30 border border-border/40 rounded-md">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> This system is for informational purposes only and is not a substitute for professional medical advice.
              Always consult with a qualified healthcare provider for diagnosis and treatment.
            </p>
          </div>
        </div>
      </div>
    </ChainDiagnosisProvider>
  );
}
