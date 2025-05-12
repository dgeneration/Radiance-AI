import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SubNavbar } from "@/components/sub-navbar";
import { ChainDiagnosisProvider } from "@/contexts/chain-diagnosis-context";
import { ChainDiagnosisHistory } from "@/components/chain-diagnosis/diagnosis-history";

export const metadata: Metadata = {
  title: "Chain Diagnosis History | Radiance AI",
  description: "View your past chain diagnosis sessions",
};

export default async function ChainDiagnosisHistoryPage() {
  // Check if user is logged in
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  // Redirect non-logged in users to the login page
  if (!userData.user) {
    redirect("/auth/login?redirectUrl=/dashboard/chain-diagnosis/history");
  }

  // Get user's chain diagnosis sessions
  const { data: sessionsData } = await supabase
    .from("chain_diagnosis_sessions")
    .select("*")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });

  const sessions = sessionsData || [];

  return (
    <ChainDiagnosisProvider>
      <SubNavbar title="Chain Diagnosis History" showProfileNav={true} />
      <div className="relative overflow-hidden py-10 px-4">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-background to-accent/5 z-0"></div>

        <div className="container relative z-10 mx-auto max-w-5xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
              Your Diagnosis History
            </h1>
            <p className="text-muted-foreground">
              View and manage your past chain diagnosis sessions
            </p>
          </div>

          <ChainDiagnosisHistory initialSessions={sessions} userId={userData.user.id} />
        </div>
      </div>
    </ChainDiagnosisProvider>
  );
}
