"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { processDiagnosisForm } from "@/app/actions";
import { SymptomFormData } from "@/types/diagnosis";
import { createClient } from "@/utils/supabase/client";
import { FileMetadata } from "@/utils/supabase/file-storage";
import { FileSelector } from "@/components/file-upload/file-selector";
import Link from "next/link";
import {
  FaUser,
  FaMapMarkerAlt,
  FaVenusMars,
  FaBirthdayCake,
  FaStethoscope,
  FaClock,
  FaNotesMedical,
  FaArrowRight,
  FaWeight,
  FaRulerVertical,
  FaUtensils,
  FaPills,
  FaAllergies,
  FaHistory,
  FaNotesMedical as FaMedicalNotes,
  FaEdit
} from "react-icons/fa";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProfessionalButton } from "@/components/ui/professional-button";

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
};

export default function SymptomForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [apiStatus, setApiStatus] = useState<{apiKeySet: boolean, apiUrl: string} | null>(null);
  const [isCheckingApi, setIsCheckingApi] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<FileMetadata[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  // Define the form schema with Zod
  const formSchema = z.object({
    symptoms: z.string().min(5, {
      message: "Please describe your symptoms in more detail.",
    }),
    age: z.string().min(1, {
      message: "Please enter your age.",
    }),
    gender: z.string({
      required_error: "Please select your gender.",
    }),
    durationNumber: z.string().min(1, {
      message: "Please specify the number.",
    }),
    durationUnit: z.string({
      required_error: "Please select a time unit.",
    }),
  });

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      symptoms: "",
      age: "",
      gender: "",
      durationNumber: "",
      durationUnit: "days",
    },
  });

  // Check API status on component mount
  useEffect(() => {
    async function checkApiStatus() {
      try {
        setIsCheckingApi(true);
        const response = await fetch('/api/test-env');
        if (response.ok) {
          const data = await response.json();
          setApiStatus({
            apiKeySet: data.apiKeySet,
            apiUrl: data.apiUrl
          });
        } else {
          console.error('Failed to check API status');
        }
      } catch (error) {
        console.error('Error checking API status:', error);
      } finally {
        setIsCheckingApi(false);
      }
    }

    checkApiStatus();
  }, []);

  // Fetch user profile on component mount
  useEffect(() => {
    async function fetchUserProfile() {
      try {
        setIsLoadingProfile(true);
        const supabase = createClient();

        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error("Error fetching user:", userError);
          // Redirect to login if user is not logged in
          router.push("/auth/login?redirectUrl=/diagnosis");
          return;
        }

        // Set the user ID for file uploads
        setUserId(user.id);

        // Get the user's profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error("Error fetching user profile:", profileError);
          setIsLoadingProfile(false);
          return;
        }

        if (profile) {
          setUserProfile(profile);

          // Update form values with user profile data
          form.setValue('age', profile.birth_year ? (new Date().getFullYear() - profile.birth_year).toString() : '');
          form.setValue('gender', profile.gender || '');
        }
      } catch (error) {
        console.error("Error in fetchUserProfile:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    }

    fetchUserProfile();
  }, [router, form]);

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setError(null);

    try {
      // Combine duration number and unit
      const duration = `${values.durationNumber} ${values.durationUnit}`;

      // Get age and gender from user profile
      const age = userProfile?.birth_year
        ? (new Date().getFullYear() - userProfile.birth_year).toString()
        : values.age;

      const gender = userProfile?.gender || values.gender;

      // Prepare medical history from user profile
      const medicalHistoryParts = [];

      if (userProfile?.medical_conditions) {
        medicalHistoryParts.push(`Medical Conditions: ${userProfile.medical_conditions}`);
      }

      if (userProfile?.allergies) {
        medicalHistoryParts.push(`Allergies: ${userProfile.allergies}`);
      }

      if (userProfile?.medications) {
        medicalHistoryParts.push(`Current Medications: ${userProfile.medications}`);
      }

      if (userProfile?.health_history) {
        medicalHistoryParts.push(`Health History: ${userProfile.health_history}`);
      }

      const medicalHistory = medicalHistoryParts.length > 0
        ? medicalHistoryParts.join('\n\n')
        : '';

      // Prepare file URLs if files are selected
      const fileUrls = selectedFiles.map(file => file.public_url).filter(Boolean) as string[];

      // Convert form values to the expected format
      const formData: SymptomFormData = {
        symptoms: values.symptoms,
        age: age,
        gender: gender,
        duration: duration,
        medicalHistory: medicalHistory,
        fileUrls: fileUrls.length > 0 ? fileUrls : undefined
      };

      // Call the server action to process the form
      const result = await processDiagnosisForm(formData);

      if (result.success) {
        // Redirect to the results page
        router.push("/diagnosis/results");
      } else {
        // Handle error
        setError(result.error || "An error occurred while processing your diagnosis");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }



  return (
    <div>
      {isLoadingProfile ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Loading your information...</span>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {userProfile && (
            <div className="bg-card/50 backdrop-blur-sm border border-primary/10 p-6 rounded-xl shadow-md mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <FaUser className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Your Profile Information</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                We&apos;re using your profile information for diagnosis. Your age and gender will be included automatically.
              </p>
              <div className="mb-6">
                <h4 className="text-base font-medium mb-3 bg-gradient-to-r from-primary/80 to-primary/80 bg-clip-text text-transparent">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-primary/5">
                    <FaUser className="text-primary/70 w-5 h-5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{userProfile.first_name} {userProfile.last_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-primary/5">
                    <FaMapMarkerAlt className="text-primary/70 w-5 h-5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{userProfile.city}, {userProfile.state}, {userProfile.country}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-primary/5">
                    <FaVenusMars className="text-accent/70 w-5 h-5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Gender</p>
                      <p className="font-medium capitalize">{userProfile.gender || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-primary/5">
                    <FaBirthdayCake className="text-accent/70 w-5 h-5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Age</p>
                      <p className="font-medium">{userProfile.birth_year ? `${new Date().getFullYear() - userProfile.birth_year} years (${userProfile.birth_year})` : 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <h4 className="text-base font-medium mb-3 bg-gradient-to-r from-accent/80 to-accent/80 bg-clip-text text-transparent">Health Metrics</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-accent/5">
                  <FaRulerVertical className="text-accent/70 w-5 h-5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Height</p>
                    <p className="font-medium">{userProfile.height ? `${userProfile.height} cm` : 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-accent/5">
                  <FaWeight className="text-accent/70 w-5 h-5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Weight</p>
                    <p className="font-medium">{userProfile.weight ? `${userProfile.weight} kg` : 'Not specified'}</p>
                  </div>
                </div>
                {userProfile.height && userProfile.weight && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-accent/5">
                    <FaStethoscope className="text-accent/70 w-5 h-5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">BMI</p>
                      <p className="font-medium">
                        {(userProfile.weight / ((userProfile.height / 100) * (userProfile.height / 100))).toFixed(1)}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-accent/5">
                  <FaUtensils className="text-accent/70 w-5 h-5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Dietary Preference</p>
                    <p className="font-medium capitalize">{userProfile.dietary_preference || 'Not specified'}</p>
                  </div>
                </div>
              </div>


            </div>
          )}

            <div className="bg-card/50 backdrop-blur-sm border border-primary/10 p-6 rounded-xl shadow-md mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                  <FaStethoscope className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-lg font-medium bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">Symptom Details</h3>
              </div>

              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="symptoms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium flex items-center gap-2">
                        <FaNotesMedical className="text-accent/70 w-4 h-4" />
                        Symptoms
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Textarea
                            placeholder="Describe your symptoms in detail..."
                            className="resize-none min-h-[180px] bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="mt-2">
                          Be as specific as possible about what you&apos;re experiencing.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel className="text-base font-medium flex items-center gap-2">
                    <FaClock className="text-accent/70 w-4 h-4" />
                    Duration of Symptoms
                  </FormLabel>
                  <div className="flex gap-3">
                    <FormField
                      control={form.control}
                      name="durationNumber"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="Number"
                              className="bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="durationUnit"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20">
                                <SelectValue placeholder="Unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="days">Days</SelectItem>
                              <SelectItem value="weeks">Weeks</SelectItem>
                              <SelectItem value="months">Months</SelectItem>
                              <SelectItem value="years">Years</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormDescription>
                    How long have you been experiencing these symptoms?
                  </FormDescription>
                </FormItem>

                {userId && (
                  <FormItem>
                    <FormLabel className="text-base font-medium flex items-center gap-2">
                      <FaNotesMedical className="text-accent/70 w-4 h-4" />
                      Medical Files
                    </FormLabel>
                    <FileSelector
                      userId={userId}
                      selectedFiles={selectedFiles}
                      onFilesSelected={setSelectedFiles}
                      multiple={true}
                    />
                    <FormDescription>
                      Attach medical reports, test results, or images to help with diagnosis.
                    </FormDescription>
                  </FormItem>
                )}
              </div>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-primary/10 p-6 rounded-xl shadow-md mb-8">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <FaNotesMedical className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent ml-3">Additional Information</h3>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FaMedicalNotes className="text-primary/70 w-5 h-5" />
                  <h4 className="text-base font-medium">Medical Information</h4>
                </div>
                <ProfessionalButton
                  asChild
                  variant="outline"
                  size="sm"
                  icon={<FaEdit />}
                  iconPosition="left"
                >
                  <Link href="/dashboard/profile">Edit Health Info</Link>
                </ProfessionalButton>
              </div>

              {userProfile && (userProfile.allergies || userProfile.medications || userProfile.medical_conditions || userProfile.health_history) ? (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {userProfile.allergies && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-primary/5">
                        <FaAllergies className="text-primary/70 w-5 h-5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Allergies</p>
                          <p className="font-medium line-clamp-2">{userProfile.allergies}</p>
                        </div>
                      </div>
                    )}
                    {userProfile.medications && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-primary/5">
                        <FaPills className="text-primary/70 w-5 h-5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Medications</p>
                          <p className="font-medium line-clamp-2">{userProfile.medications}</p>
                        </div>
                      </div>
                    )}
                    {userProfile.medical_conditions && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-primary/5">
                        <FaMedicalNotes className="text-primary/70 w-5 h-5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Medical Conditions</p>
                          <p className="font-medium line-clamp-2">{userProfile.medical_conditions}</p>
                        </div>
                      </div>
                    )}
                    {userProfile.health_history && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-primary/5">
                        <FaHistory className="text-primary/70 w-5 h-5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Health History</p>
                          <p className="font-medium line-clamp-2">{userProfile.health_history}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                  <div className="text-center py-10 bg-card/50 backdrop-blur-sm rounded-xl border border-primary/5">
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      You haven&apos;t added any health information yet. This information helps us provide more accurate diagnoses.
                    </p>
                    <ProfessionalButton
                      asChild
                      variant="primary"
                      size="lg"
                      icon={<FaNotesMedical className="h-5 w-5" />}
                      iconPosition="left"
                    >
                      <Link href="/dashboard/profile">
                        Add Health Information
                      </Link>
                    </ProfessionalButton>
                  </div>
              )}
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl text-sm shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center">
                    <span className="text-destructive font-bold text-xs">!</span>
                  </div>
                  <span className="font-medium">Error</span>
                </div>
                <p className="mt-2 ml-7">{error}</p>
              </div>
            )}

            <div className="bg-card/50 backdrop-blur-sm border border-primary/10 p-6 rounded-xl shadow-md mb-8">
              {isCheckingApi ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="text-primary font-medium">Checking API status...</span>
                </div>
              ) : apiStatus?.apiKeySet ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-green-800 dark:text-green-300">Active: Perplexity Sonar Deep Research</h4>
                    <p className="text-sm text-green-700 dark:text-green-400">
                      Your symptoms will be analyzed using advanced AI and evidence-based medical research.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-amber-800 dark:text-amber-300">Demo Mode</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      The diagnosis will be generated based on pattern matching rather than a real AI model.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-10 flex justify-center items-center">
              <ProfessionalButton
                type="submit"
                variant="primary"
                size="lg"
                icon={<FaArrowRight className="w-5 h-5" />}
                iconPosition="right"
                disabled={isSubmitting}
                className="h-16 px-10 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 mx-auto"
              >
                {isSubmitting ? "Processing..." : "Get AI Diagnosis"}
              </ProfessionalButton>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
