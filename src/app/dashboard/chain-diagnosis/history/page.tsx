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
  let sessions = [];
  try {
    console.log("Fetching chain diagnosis sessions for user:", userData.user.id);
    const { data: sessionsData, error } = await supabase
      .from("chain_diagnosis_sessions")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching chain diagnosis sessions:", error);
    } else {
      sessions = Array.isArray(sessionsData) ? sessionsData : [];
      console.log(`Fetched ${sessions.length} chain diagnosis sessions for user ${userData.user.id}`);

      // Log the first session to check its structure
      if (sessions.length > 0) {
        console.log("First session:", {
          id: sessions[0].id,
          created_at: sessions[0].created_at,
          status: sessions[0].status,
          hasUserInput: !!sessions[0].user_input
        });
      }
    }
  } catch (error) {
    console.error("Exception fetching chain diagnosis sessions:", error);
  }

  // Ensure sessions is always an array
  if (!Array.isArray(sessions)) {
    console.error("Sessions is not an array, resetting to empty array");
    sessions = [];
  }

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
