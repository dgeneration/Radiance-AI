export const dynamic = "force-dynamic";

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


export default async function ChainDiagnosisSessionPage({ params }: any) {
  const { id: sessionId } = await params;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(`/auth/login?redirectUrl=/dashboard/chain-diagnosis/${sessionId}`);
  }

  const { data: sessionData, error } = await supabase
    .from("chain_diagnosis_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userData.user.id)
    .single();

  if (error || !sessionData) {
    redirect("/dashboard/chain-diagnosis");
  }

  return (
    <ChainDiagnosisProvider>
      <SubNavbar title="Chain Diagnosis Session" showProfileNav={true} />
      <div className="relative overflow-hidden py-10 px-4">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-background to-accent/5 z-0" />
        <div className="container relative z-10 mx-auto max-w-5xl">
          <ChainDiagnosisSession sessionId={sessionId} />
        </div>
      </div>
    </ChainDiagnosisProvider>
  );
}
