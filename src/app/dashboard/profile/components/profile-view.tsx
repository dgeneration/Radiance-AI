"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Edit, User, MapPin, AlertCircle, CheckCircle2, FolderOpen } from "lucide-react";
import { FaNotesMedical } from "react-icons/fa";
import { ProfessionalButton } from "@/components/ui/professional-button";

import { AnimatedDashboardSection, DashboardFloatingElement, AnimatedCard } from "@/components/dashboard";
import ProfileEditForm from "./profile-edit-form";
import {
  HealthHistoryAccordion,
  MedicalConditionsAccordion,
  AllergiesAccordion,
  MedicationsAccordion
} from "./health-info-accordion";

// Define the user profile type
type UserProfile = {
  id: string;
  first_name: string;
  last_name: string;
  country: string;
  state: string;
  city: string;
  zip_code: string;
  gender: string;
  birth_year: number;
  health_history?: string | null;
  medical_conditions?: string | null;
  allergies?: string | null;
  medications?: string | null;
  height?: number | null;
  weight?: number | null;
  dietary_preference?: string | null;
  has_edited_health_info?: boolean | null;
  first_name_edit_count?: number | null;
  last_name_edit_count?: number | null;
  country_edit_count?: number | null;
  state_edit_count?: number | null;
  city_edit_count?: number | null;
  zip_code_edit_count?: number | null;
  gender_edit_count?: number | null;
  birth_year_edit_count?: number | null;
  height_edit_count?: number | null;
  weight_edit_count?: number | null;
  dietary_preference_edit_count?: number | null;
};

interface ProfileViewProps {
  profile: UserProfile;
  userId: string;
}

export default function ProfileView({ profile, userId }: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingHealthInfo, setIsEditingHealthInfo] = useState(false);
  const [error] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();



  const handleEditComplete = () => {
    setIsEditing(false);
    setIsEditingHealthInfo(false);
    setSuccess("Profile updated successfully");
    router.refresh();
  };

  if (isEditing) {
    return (
      <ProfileEditForm
        initialProfile={profile}
        userId={userId}
        onCancel={() => setIsEditing(false)}
        onComplete={handleEditComplete}
        isEditingHealthInfo={isEditingHealthInfo}
      />
    );
  }

  const age = profile.birth_year ? new Date().getFullYear() - profile.birth_year : null;

  return (
    <div className="space-y-8 relative">
      {/* Background decorative elements */}
      <DashboardFloatingElement
        className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10"
        duration={8}
        xOffset={10}
        yOffset={15}
        opacity={0.5}
      />
      <DashboardFloatingElement
        className="absolute bottom-20 right-10 w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-10"
        duration={10}
        xOffset={-10}
        yOffset={-15}
        delay={1}
        opacity={0.5}
      />
      {error && (
        <AnimatedDashboardSection direction="down" delay={0.1}>
          <Alert variant="destructive" className="animate-fadeIn">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </AnimatedDashboardSection>
      )}

      {success && (
        <AnimatedDashboardSection direction="down" delay={0.1}>
          <Alert variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        </AnimatedDashboardSection>
      )}

      <AnimatedDashboardSection delay={0.2}>
        <div className="bg-card/30 backdrop-blur-sm border border-primary/10 p-6 rounded-xl shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-primary/10">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-1">
                Personal Information
              </h2>
              <p className="text-muted-foreground">Your basic profile details</p>
            </div>
            <div className="flex flex-col md:flex-row gap-3 mt-4 md:mt-0">
              <Link href="/dashboard/profile/files">
                <ProfessionalButton
                  variant="outline"
                  size="default"
                  icon={<FolderOpen className="h-4 w-4" />}
                  iconPosition="left"
                >
                  File Manager
                </ProfessionalButton>
              </Link>
              <ProfessionalButton
                variant="primary"
                size="default"
                icon={<Edit className="h-4 w-4" />}
                iconPosition="left"
                onClick={() => {
                  setIsEditing(true);
                  setIsEditingHealthInfo(false);
                }}
              >
                Edit Profile
              </ProfessionalButton>
            </div>
          </div>



          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatedCard delay={0.3}>
              <div className="bg-card/50 backdrop-blur-sm border border-primary/10 p-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium bg-gradient-to-r from-primary/90 to-accent/90 bg-clip-text text-transparent">Personal Details</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-1.5 border-b border-primary/5">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{profile.first_name} {profile.last_name}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-primary/5">
                    <span className="text-muted-foreground">Gender:</span>
                    <span className="capitalize">{profile.gender}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-primary/5">
                    <span className="text-muted-foreground">Age:</span>
                    <span>{age ? `${age} years` : 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-muted-foreground">Birth Year:</span>
                    <span>{profile.birth_year || 'Not specified'}</span>
                  </div>
                </div>
              </div>
            </AnimatedCard>

            <AnimatedCard delay={0.4}>
              <div className="bg-card/50 backdrop-blur-sm border border-primary/10 p-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium bg-gradient-to-r from-primary/90 to-accent/90 bg-clip-text text-transparent">Location</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-1.5 border-b border-primary/5">
                    <span className="text-muted-foreground">Country:</span>
                    <span>{profile.country}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-primary/5">
                    <span className="text-muted-foreground">State:</span>
                    <span className="truncate max-w-[160px] text-right overflow-hidden whitespace-nowrap">
                      {profile.state}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-primary/5">
                    <span className="text-muted-foreground">City:</span>
                    <span className="truncate max-w-[160px] text-right overflow-hidden whitespace-nowrap">
                      {profile.city}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-muted-foreground">Zip Code:</span>
                    <span>{profile.zip_code}</span>
                  </div>
                </div>
              </div>
            </AnimatedCard>

            <AnimatedCard delay={0.5}>
              <div className="bg-card/50 backdrop-blur-sm border border-primary/10 p-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium bg-gradient-to-r from-primary/90 to-accent/90 bg-clip-text text-transparent">Health Metrics</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-1.5 border-b border-primary/5">
                    <span className="text-muted-foreground">Height:</span>
                    <span>{profile.height ? `${profile.height} cm` : 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-primary/5">
                    <span className="text-muted-foreground">Weight:</span>
                    <span>{profile.weight ? `${profile.weight} kg` : 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-primary/5">
                    <span className="text-muted-foreground">Diet:</span>
                    <span className="capitalize">{profile.dietary_preference || 'Not specified'}</span>
                  </div>
                  {profile.height && profile.weight && (
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-muted-foreground">BMI:</span>
                      <span>
                        {(profile.weight / ((profile.height / 100) * (profile.height / 100))).toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </AnimatedCard>
          </div>
        </div>
      </AnimatedDashboardSection>

      <AnimatedDashboardSection delay={0.3}>
        <div className="bg-card/30 backdrop-blur-sm border border-primary/10 p-6 rounded-xl shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-primary/10">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-1">
                Health Information
              </h2>
              <p className="text-muted-foreground">Your medical history and conditions</p>
            </div>
            <ProfessionalButton
              variant="primary"
              size="default"
              icon={<Edit className="h-4 w-4" />}
              iconPosition="left"
              className="mt-4 md:mt-0"
              onClick={() => {
                setIsEditing(true);
                setIsEditingHealthInfo(true);
              }}
            >
              Edit Health Info
            </ProfessionalButton>
          </div>

        {profile.health_history || profile.medical_conditions || profile.allergies || profile.medications ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <AnimatedCard delay={0.4}>
                <HealthHistoryAccordion content={profile.health_history || null} />
              </AnimatedCard>

              <AnimatedCard delay={0.5}>
                <MedicalConditionsAccordion content={profile.medical_conditions || null} />
              </AnimatedCard>

              <AnimatedCard delay={0.6}>
                <AllergiesAccordion content={profile.allergies || null} />
              </AnimatedCard>

              <AnimatedCard delay={0.7}>
                <MedicationsAccordion content={profile.medications || null} />
              </AnimatedCard>
            </div>
          </div>
        ) : (
          <AnimatedDashboardSection delay={0.4} direction="up">
            <div className="text-center py-10 bg-card/50 backdrop-blur-sm rounded-xl border border-primary/5">
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                You haven&apos;t added any health information yet. This information helps us provide more accurate diagnoses.
              </p>
              <ProfessionalButton
                variant="primary"
                size="lg"
                icon={<FaNotesMedical className="h-5 w-5" />}
                iconPosition="left"
                onClick={() => {
                  setIsEditing(true);
                  setIsEditingHealthInfo(true);
                }}
              >
                Add Health Information
              </ProfessionalButton>
            </div>
          </AnimatedDashboardSection>
        )}
        </div>
      </AnimatedDashboardSection>
    </div>
  );
}