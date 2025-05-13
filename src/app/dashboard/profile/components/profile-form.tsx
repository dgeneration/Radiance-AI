"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent } from "@/components/ui/card";
import { Country, State, City, ICountry, IState, ICity } from "country-state-city";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  health_history?: string;
  medical_conditions?: string;
  allergies?: string;
  medications?: string;
  has_edited_health_info?: boolean;
  first_name_edit_count?: number | null;
  last_name_edit_count?: number | null;
  country_edit_count?: number | null;
  state_edit_count?: number | null;
  city_edit_count?: number | null;
  zip_code_edit_count?: number | null;
  gender_edit_count?: number | null;
  birth_year_edit_count?: number | null;
};

interface ProfileFormProps {
  initialProfile: UserProfile | null;
  userId: string;
}

export default function ProfileForm({ initialProfile, userId }: ProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [states, setStates] = useState<IState[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [isEditingHealthInfo, setIsEditingHealthInfo] = useState(false);

  const router = useRouter();

  // Define the form schema with Zod
  const formSchema = z.object({
    first_name: z.string().min(1, { message: "First name is required" }),
    last_name: z.string().min(1, { message: "Last name is required" }),
    country: z.string().min(1, { message: "Country is required" }),
    // State can be "N/A" for countries without states or empty string when not required
    state: z.string(),
    city: z.string().min(1, { message: "City is required" }),
    zip_code: z.string().min(1, { message: "Zip/Postal code is required" }),
    gender: z.string().min(1, { message: "Gender is required" }),
    birth_year: z.coerce.number()
      .min(1900, { message: "Birth year must be 1900 or later" })
      .max(new Date().getFullYear(), { message: "Birth year cannot be in the future" }),
    health_history: z.string().optional(),
    medical_conditions: z.string().optional(),
    allergies: z.string().optional(),
    medications: z.string().optional(),
  });

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: initialProfile?.first_name || "",
      last_name: initialProfile?.last_name || "",
      country: initialProfile?.country || "",
      state: initialProfile?.state || "",
      city: initialProfile?.city || "",
      zip_code: initialProfile?.zip_code || "",
      gender: initialProfile?.gender || "",
      birth_year: initialProfile?.birth_year || new Date().getFullYear() - 30,
      health_history: initialProfile?.health_history || "",
      medical_conditions: initialProfile?.medical_conditions || "",
      allergies: initialProfile?.allergies || "",
      medications: initialProfile?.medications || "",
    },
  });

  // Set up countries, states, and cities
  useEffect(() => {
    // Get all countries
    const allCountries = Country.getAllCountries();
    setCountries(allCountries);

    if (initialProfile) {
      setSelectedCountry(initialProfile.country);
      setSelectedState(initialProfile.state);
    }
  }, [initialProfile]);

  // Update states when country changes
  useEffect(() => {
    if (selectedCountry) {
      const countryData = Country.getAllCountries().find(
        (country) => country.name === selectedCountry
      );
      if (countryData) {
        const countryStates = State.getStatesOfCountry(countryData.isoCode);
        setStates(countryStates);

        // If country has no states, clear state selection and load cities directly
        if (countryStates.length === 0) {
          setSelectedState("N/A");
          form.setValue("state", "N/A");
          const countryCities = City.getCitiesOfCountry(countryData.isoCode);
          setCities(countryCities || []);
        }
      }
    }
  }, [selectedCountry, form]);

  // Update cities when state changes
  useEffect(() => {
    if (selectedCountry && selectedState) {
      const countryData = Country.getAllCountries().find(
        (country) => country.name === selectedCountry
      );

      if (selectedState === "N/A") {
        // If state is N/A, get cities directly from country
        if (countryData) {
          const countryCities = City.getCitiesOfCountry(countryData.isoCode);
          setCities(countryCities || []);
        }
      } else {
        // Otherwise, get cities from state
        const stateData = State.getStatesOfCountry(countryData?.isoCode || "").find(
          (state) => state.name === selectedState
        );
        if (countryData && stateData) {
          const stateCities = City.getCitiesOfState(countryData.isoCode, stateData.isoCode);
          setCities(stateCities || []);
        }
      }
    }
  }, [selectedCountry, selectedState]);

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();

      // Check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("You must be logged in to update your profile");
        setIsSubmitting(false);
        return;
      }

      // Prepare update data
      const updateData: Partial<{
        first_name: string;
        last_name: string;
        country: string;
        state: string;
        city: string;
        zip_code: string;
        gender: string;
        birth_year: number;
        health_history?: string;
        medical_conditions?: string;
        allergies?: string;
        medications?: string;
      }> = {
        first_name: values.first_name,
        last_name: values.last_name,
        country: values.country,
        state: values.state,
        city: values.city,
        zip_code: values.zip_code,
        gender: values.gender,
        birth_year: values.birth_year,
      };

      // Update health info if editing health info (no restriction on editing)
      if (isEditingHealthInfo) {
        updateData.health_history = values.health_history;
        updateData.medical_conditions = values.medical_conditions;
        updateData.allergies = values.allergies;
        updateData.medications = values.medications;
      }

      // Update the profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId);

      if (updateError) {
        setError("Failed to update profile: " + updateError.message);
      } else {
        setSuccess("Profile updated successfully");
        if (isEditingHealthInfo) {
          setIsEditingHealthInfo(false);
        }
        router.refresh();
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="border-border/40">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="non-binary">Non-binary</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birth_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birth Year</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter your birth year" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedCountry(value);
                        form.setValue("state", "");
                        form.setValue("city", "");
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.isoCode} value={country.name}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {states.length > 0 ? (
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State/Province</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedState(value);
                          form.setValue("city", "");
                        }}
                        defaultValue={field.value}
                        disabled={!selectedCountry}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {states.map((state) => (
                            <SelectItem key={state.isoCode} value={state.name}>
                              {state.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="hidden">
                  {/* Hidden input for countries without states */}
                  <input
                    type="hidden"
                    name="state"
                    value="N/A"
                    onChange={() => {
                      form.setValue("state", "N/A");
                    }}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    {cities.length > 0 ? (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={states.length > 0 ? !selectedState : !selectedCountry}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                !selectedCountry
                                  ? "Select country first"
                                  : states.length > 0 && !selectedState
                                    ? "Select state first"
                                    : "Select city"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cities.map((city, index) => {
                            // Create a truly unique key using multiple properties and index
                            const uniqueKey = `city-${selectedCountry}-${selectedState}-${city.name}-${index}`;
                            return (
                              <SelectItem key={uniqueKey} value={city.name}>
                                {city.name}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder="Enter your city"
                        {...field}
                        disabled={!selectedCountry}
                      />
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zip_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zip/Postal Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your zip/postal code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="border-t border-border/40 pt-6 mt-6">
              <h2 className="text-xl font-semibold mb-4">Health Information</h2>

              {isEditingHealthInfo ? (
                <Alert className="mb-6 bg-primary/10">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>You are editing your health information</AlertTitle>
                  <AlertDescription>
                    Please provide accurate health information to help us provide better diagnoses.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="mb-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditingHealthInfo(true)}
                  >
                    Edit Health Information
                  </Button>
                </div>
              )}

              <div className={!isEditingHealthInfo ? "opacity-50 pointer-events-none" : ""}>
                <FormField
                  control={form.control}
                  name="health_history"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Health History</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe any significant past health issues or surgeries..."
                          className="resize-none min-h-[100px]"
                          disabled={!isEditingHealthInfo}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Include past surgeries, hospitalizations, or significant health events.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="medical_conditions"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Current Medical Conditions</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="List any ongoing medical conditions..."
                          className="resize-none min-h-[100px]"
                          disabled={!isEditingHealthInfo}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Include chronic conditions, ongoing treatments, or recent diagnoses.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <FormField
                    control={form.control}
                    name="allergies"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allergies</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="List any allergies you have..."
                            className="resize-none min-h-[100px]"
                            disabled={!isEditingHealthInfo}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Include allergies to medications, foods, or environmental factors.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="medications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Medications</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="List any medications you're currently taking..."
                            className="resize-none min-h-[100px]"
                            disabled={!isEditingHealthInfo}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Include prescription medications, supplements, and over-the-counter drugs.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
