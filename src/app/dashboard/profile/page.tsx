import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SubNavbar } from "@/components/sub-navbar";
import ProfileView from "./components/profile-view";

export const metadata: Metadata = {
  title: "User Profile | Radiance AI",
  description: "View and manage your profile information",
};

export default async function ProfilePage() {
  // Check if user is logged in
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login?redirectUrl=/dashboard/profile");
  }

  // Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError) {
    console.error("Error fetching user profile:", profileError);
    // We'll handle this in the client component
  }

  return (
    <>
      <SubNavbar title="User Profile" />
      <div className="relative overflow-hidden py-10 px-4">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-background to-accent/5 z-0"></div>

        <div className="container relative z-10 mx-auto max-w-5xl">
          {profile ? (
            <ProfileView profile={profile} userId={data.user.id} />
          ) : (
            <div className="flex items-center justify-center py-16 bg-card/30 backdrop-blur-sm rounded-xl border border-primary/10 shadow-lg">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <span className="ml-4 text-muted-foreground font-medium">Loading your profile...</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}