import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SubNavbar } from "@/components/sub-navbar";
import { FileManagerContainer } from "./components/file-manager-container";

export const metadata: Metadata = {
  title: "File Manager | Radiance AI",
  description: "Manage your medical files and reports",
};

export default async function FilesPage() {
  // Check if user is logged in
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  // Redirect non-logged in users to the login page
  if (!data.user) {
    redirect("/auth/login?redirectUrl=/dashboard/profile/files");
  }

  return (
    <>
      <SubNavbar title="File Manager" showProfileNav={true} />
      <div className="relative overflow-hidden py-10 px-4">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-background to-accent/5 z-0"></div>

        <div className="container relative z-10 mx-auto max-w-5xl">
          <FileManagerContainer userId={data.user.id} />
        </div>
      </div>
    </>
  );
}
