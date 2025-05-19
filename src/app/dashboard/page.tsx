import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { SubNavbar } from "@/components/sub-navbar";
import { ProfessionalButton } from "@/components/ui/professional-button";
import { AnimatedSection, AnimatedIcon, FloatingElement } from "@/components/animations";
import { GradientHeading } from "@/components/ui/gradient-heading";
import { FaArrowRight, FaUser, FaHistory, FaEnvelope, FaIdCard, FaSignInAlt, FaBrain } from "react-icons/fa";
import { MdHealthAndSafety, MdOutlineVerified } from "react-icons/md";

export const metadata: Metadata = {
  title: "Dashboard | Radiance AI",
  description: "Your Radiance AI dashboard",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login?redirectUrl=/dashboard");
  }

  // Get the count of diagnoses
  let count = 0;
  try {
    const { count: diagnosesCount, error } = await supabase
      .from('diagnoses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', data.user.id);

    if (!error && diagnosesCount !== null) {
      count = diagnosesCount;
    }
  } catch (error) {
    console.error("Error fetching diagnoses count:", error);
    // Continue with count = 0
  }

  // Get user profile if available
  let profile = null;
  try {
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (!profileError && profileData) {
      profile = profileData;
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
  }

  // Format user name for display
  const fullName = profile ? `${profile.first_name} ${profile.last_name}` : data.user.email || 'User';

  return (
    <>
      <SubNavbar title="Dashboard" />
      <div className="container mx-auto py-10 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Welcome Section - Force immediate visibility with threshold={0} */}
          <AnimatedSection direction="up" delay={0.1} className="mb-10" threshold={0}>
            <div className="relative overflow-hidden bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg">
              <FloatingElement
                className="absolute top-0 right-0 w-60 h-60 bg-primary/10 rounded-full blur-3xl opacity-30"
                duration={10}
                xOffset={15}
                yOffset={20}
              />

              <div className="relative z-10">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shadow-lg">
                    <AnimatedIcon
                      icon={<FaUser className="w-10 h-10 text-primary" />}
                      delay={0.2}
                      pulseEffect={true}
                    />
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <GradientHeading level={2} size="md" className="mb-2">
                      Welcome To Dashboard
                    </GradientHeading>
                    <p className="text-muted-foreground mb-6 max-w-2xl">
                      This is your personal health dashboard where you can access your diagnosis history,
                      manage your profile, and get new health insights powered by advanced AI technology.
                    </p>

                    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                      <ProfessionalButton
                        asChild
                        variant="primary"
                        icon={<FaArrowRight />}
                        iconPosition="right"
                      >
                        <Link href="/dashboard/diagnosis">Diagnosis</Link>
                      </ProfessionalButton>

                      <ProfessionalButton
                        asChild
                        variant="outline"
                        icon={<FaUser />}
                        iconPosition="left"
                      >
                        <Link href="/dashboard/profile">My Profile</Link>
                      </ProfessionalButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Account Information Card */}
            <AnimatedSection direction="up" delay={0.2}>
              <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg h-full">
                <div className="flex items-center gap-4 mb-6">
                  <AnimatedIcon
                    icon={<FaIdCard className="w-6 h-6 text-primary" />}
                    className="p-2 bg-primary/10 rounded-full"
                    delay={0.3}
                  />
                  <GradientHeading level={3} size="sm">
                    Account Information
                  </GradientHeading>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-primary/5">
                    <FaUser className="text-primary/70 w-5 h-5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{fullName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-primary/5">
                    <FaEnvelope className="text-primary/70 w-5 h-5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{data.user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-primary/5">
                    <FaSignInAlt className="text-primary/70 w-5 h-5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Last Sign In</p>
                      <p className="font-medium">{new Date(data.user.last_sign_in_at || "").toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Diagnosis Stats Card */}
            <AnimatedSection direction="up" delay={0.3}>
              <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg h-full">
                <div className="flex items-center gap-4 mb-6">
                  <AnimatedIcon
                    icon={<MdHealthAndSafety className="w-6 h-6 text-accent" />}
                    className="p-2 bg-accent/10 rounded-full"
                    delay={0.4}
                  />
                  <GradientHeading level={3} size="sm" fromColor="from-accent" toColor="to-primary">
                    Health Insights
                  </GradientHeading>
                </div>

                <div>
                  {count > 0 ? (
                    <div className="flex flex-col items-center text-center p-6 bg-card/50 rounded-xl border border-accent/10 hover:border-accent/30 transition-all duration-300">
                      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                        <FaHistory className="w-8 h-8 text-accent" />
                      </div>
                      <p className="text-2xl font-bold mb-1">{count}</p>
                      <p className="text-muted-foreground mb-4">
                        {count === 1 ? 'Diagnosis' : 'Diagnoses'} in your history
                      </p>

                      <Link
                        href="/dashboard/diagnosis/history"
                        className="text-accent hover:text-accent/80 font-medium flex items-center gap-2 group transition-all duration-300"
                      >
                        View diagnosis history
                        <FaArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center p-6 bg-card/50 rounded-xl border border-accent/10 hover:border-accent/30 transition-all duration-300">
                      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                        <MdOutlineVerified className="w-8 h-8 text-accent" />
                      </div>
                      <p className="font-medium mb-1">No diagnoses yet</p>
                      <p className="text-muted-foreground mb-4">
                        Start by getting your first AI-powered health diagnosis
                      </p>

                      <Link
                        href="/dashboard/diagnosis"
                        className="text-accent hover:text-accent/80 font-medium flex items-center gap-2 group transition-all duration-300"
                      >
                        Try Diagnosis
                        <FaArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Quick Navigation Section */}
          <AnimatedSection direction="up" delay={0.4}>
            <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg">
              <GradientHeading level={3} size="sm" className="mb-6">
                Quick Navigation
              </GradientHeading>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

                <Link href="/dashboard/diagnosis" className="group">
                  <div className="bg-card/50 p-5 rounded-xl border border-accent/5 hover:border-accent/20 hover:bg-accent/5 transition-all duration-300 h-full flex flex-col">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <FaBrain className="w-5 h-5 text-accent" />
                      </div>
                      <h4 className="font-semibold">Diagnosis</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-auto">
                      Get a comprehensive analysis from 8 specialized AI roles
                    </p>
                    <div className="mt-4 text-accent font-medium text-sm flex items-center gap-2">
                      Start now
                      <FaArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>



                <Link href="/dashboard/profile" className="group">
                  <div className="bg-card/50 p-5 rounded-xl border border-accent/5 hover:border-accent/20 hover:bg-accent/5 transition-all duration-300 h-full flex flex-col">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <FaUser className="w-5 h-5 text-accent" />
                      </div>
                      <h4 className="font-semibold">Profile Settings</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-auto">
                      Update your personal and health information
                    </p>
                    <div className="mt-4 text-accent font-medium text-sm flex items-center gap-2">
                      Manage profile
                      <FaArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>

                {/* Test links removed */}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </>
  );
}
