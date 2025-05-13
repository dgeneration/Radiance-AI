import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SubNavbar } from "@/components/sub-navbar";
import { ChainDiagnosisSession } from "@/components/chain-diagnosis/diagnosis-session";
import { ChainDiagnosisProvider } from "@/contexts/chain-diagnosis-context";

export const metadata: Metadata = {
  title: "Chain Diagnosis Session | Radiance AI",
  description: "View your comprehensive health analysis from 8 specialized AI roles",
};

export default async function ChainDiagnosisSessionPage({
  params,
}: {
  params: { id: string };
}) {
  const { id: sessionId } = params;

  // Check if user is logged in
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  // Redirect non-logged in users to the login page
  if (!userData.user) {
    redirect(`/auth/login?redirectUrl=/dashboard/chain-diagnosis/${sessionId}`);
  }

  // Check if the session exists and belongs to the user
  const { data: sessionData, error } = await supabase
    .from("chain_diagnosis_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userData.user.id)
    .single();

  // If session doesn't exist or doesn't belong to the user, redirect to the main chain diagnosis page
  if (error || !sessionData) {
    redirect("/dashboard/chain-diagnosis");
  }

  return (
    <ChainDiagnosisProvider>
      <SubNavbar title="Chain Diagnosis Session" showProfileNav={true} />
      <div className="relative overflow-hidden py-10 px-4">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-background to-accent/5 z-0"></div>

        <div className="container relative z-10 mx-auto max-w-5xl">
          <ChainDiagnosisSession sessionId={sessionId} />
        </div>
      </div>
    </ChainDiagnosisProvider>
  );
}
