"use client";

import { useState, useEffect } from "react";
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

import { Country, State, City, ICountry, IState, ICity } from "country-state-city";
import { AlertCircle, ArrowLeft, User, CheckCircle2, MapPin, Calendar, Tag } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

interface ProfileEditFormProps {
  initialProfile: UserProfile;
  userId: string;
  onCancel: () => void;
  onComplete: () => void;
  isEditingHealthInfo: boolean;
}

export default function ProfileEditForm({
  initialProfile,
  userId,
  onCancel,
  onComplete,
  isEditingHealthInfo
}: ProfileEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [states, setStates] = useState<IState[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);

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
    height: z.string().optional(),
    weight: z.string().optional(),
    dietary_preference: z.string().optional(),
  });

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: initialProfile.first_name || "",
      last_name: initialProfile.last_name || "",
      country: initialProfile.country || "",
      state: initialProfile.state || "",
      city: initialProfile.city || "",
      zip_code: initialProfile.zip_code || "",
      gender: initialProfile.gender || "",
      birth_year: initialProfile.birth_year || new Date().getFullYear() - 30,
      health_history: initialProfile.health_history || "",
      medical_conditions: initialProfile.medical_conditions || "",
      allergies: initialProfile.allergies || "",
      medications: initialProfile.medications || "",
      height: initialProfile.height?.toString() || "",
      weight: initialProfile.weight?.toString() || "",
      dietary_preference: initialProfile.dietary_preference || "",
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
          form.setValue("state", "N/A"); // Explicitly set the form value
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
          // Log the first city to see its structure
          if (countryCities && countryCities.length > 0) {
            console.log('City object structure:', countryCities[0]);
          }
          setCities(countryCities || []);
        }
      } else {
        // Otherwise, get cities from state
        const stateData = State.getStatesOfCountry(countryData?.isoCode || "").find(
          (state) => state.name === selectedState
        );
        if (countryData && stateData) {
          const stateCities = City.getCitiesOfState(countryData.isoCode, stateData.isoCode);
          // Log the first city to see its structure
          if (stateCities && stateCities.length > 0) {
            console.log('City object structure:', stateCities[0]);
          }
          setCities(stateCities || []);
        }
      }
    }
  }, [selectedCountry, selectedState]);

  // Helper function to check if a field has reached its edit limit
  const hasReachedEditLimit = (field: keyof UserProfile) => {
    // Check if the field has an edit count property
    const editCountField = `${field}_edit_count` as keyof UserProfile;
    const editCount = initialProfile[editCountField] as number | null | undefined;

    // If edit count is 1 or more, the field has reached its limit
    return editCount !== null && editCount !== undefined && editCount >= 1;
  };

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setError(null);

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
      const updateData: Partial<Record<keyof UserProfile, string | number | null>> = {};

      // Update personal information fields with edit limit checks
      if (!isEditingHealthInfo) {

        // Update personal details fields with edit limit checks
        const personalDetailsFields = ['first_name', 'last_name', 'gender', 'birth_year'];
        personalDetailsFields.forEach(field => {
          const typedField = field as keyof UserProfile;
          const editCountField = `${field}_edit_count` as keyof UserProfile;

          // Only update if the field has changed and hasn't reached its edit limit
          if (initialProfile[typedField] !== values[field as keyof typeof values] && !hasReachedEditLimit(typedField)) {
            updateData[typedField] = values[field as keyof typeof values];

            // Increment the edit count
            const currentCount = (initialProfile[editCountField] as number) || 0;
            updateData[editCountField] = currentCount + 1;
          }
        });

        // Update location fields (no edit limit)
        if (initialProfile.country !== values.country) {
          updateData.country = values.country;
        }

        if (initialProfile.state !== values.state) {
          updateData.state = values.state;
        }

        if (initialProfile.city !== values.city) {
          updateData.city = values.city;
        }

        if (initialProfile.zip_code !== values.zip_code) {
          updateData.zip_code = values.zip_code;
        }

        // Update health metrics (no edit limit)
        // Update height if it has changed
        const newHeight = values.height === "" ? null : values.height ? parseFloat(values.height) : null;
        if (initialProfile.height !== newHeight) {
          updateData.height = newHeight;
        }

        // Update weight if it has changed
        const newWeight = values.weight === "" ? null : values.weight ? parseFloat(values.weight) : null;
        if (initialProfile.weight !== newWeight) {
          updateData.weight = newWeight;
        }

        // Update dietary preference if it has changed
        if (initialProfile.dietary_preference !== values.dietary_preference) {
          updateData.dietary_preference = values.dietary_preference || null;
        }
      }

      // Update health info if editing health info (no restriction on editing)
      if (isEditingHealthInfo) {
        updateData.health_history = values.health_history;
        updateData.medical_conditions = values.medical_conditions;
        updateData.allergies = values.allergies;
        updateData.medications = values.medications;
      }

      // If no fields were updated, show a message
      if (Object.keys(updateData).length === 0) {
        setError("No changes were made or all fields have reached their edit limit");
        setIsSubmitting(false);
        return;
      }

      // Update the profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId);

      if (updateError) {
        setError("Failed to update profile: " + updateError.message);
      } else {
        onComplete();
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-card/30 backdrop-blur-sm border border-primary/10 p-6 rounded-xl shadow-lg">
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-primary/10">
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0 rounded-full bg-primary/5 hover:bg-primary/10 transition-colors duration-200"
          onClick={onCancel}
        >
          <ArrowLeft className="h-5 w-5 text-primary" />
          <span className="sr-only">Back</span>
        </Button>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-1">
            {isEditingHealthInfo ? "Edit Health Information" : "Edit Profile"}
          </h2>
          <p className="text-muted-foreground">
            {isEditingHealthInfo
              ? "Update your health information to get more accurate diagnoses"
              : "Update your personal information"}
          </p>
        </div>
      </div>

      {isEditingHealthInfo && (
        <Alert className="mb-6 bg-primary/10 border-primary/20">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary font-medium">Important</AlertTitle>
          <AlertDescription className="text-primary/80">
            Please provide accurate health information to help us provide better diagnoses.
          </AlertDescription>
        </Alert>
      )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {!isEditingHealthInfo && (
              <>
                {/* Show warning for fields that have reached their edit limit */}
                {(hasReachedEditLimit('first_name') ||
                  hasReachedEditLimit('last_name') ||
                  hasReachedEditLimit('country') ||
                  hasReachedEditLimit('state') ||
                  hasReachedEditLimit('city') ||
                  hasReachedEditLimit('zip_code') ||
                  hasReachedEditLimit('gender') ||
                  hasReachedEditLimit('birth_year') ||
                  hasReachedEditLimit('height') ||
                  hasReachedEditLimit('weight') ||
                  hasReachedEditLimit('dietary_preference')) && (
                  <div className="mb-6">
                    <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-500">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Edit Limit Reached</AlertTitle>
                      <AlertDescription>
                        Some personal information fields can only be edited once. The following fields have reached their edit limit:
                        <ul className="list-disc pl-5 mt-2">
                          {hasReachedEditLimit('first_name') && <li>First Name</li>}
                          {hasReachedEditLimit('last_name') && <li>Last Name</li>}
                          {hasReachedEditLimit('country') && <li>Country</li>}
                          {hasReachedEditLimit('state') && <li>State</li>}
                          {hasReachedEditLimit('city') && <li>City</li>}
                          {hasReachedEditLimit('zip_code') && <li>Zip Code</li>}
                          {hasReachedEditLimit('gender') && <li>Gender</li>}
                          {hasReachedEditLimit('birth_year') && <li>Birth Year</li>}
                          {hasReachedEditLimit('height') && <li>Height</li>}
                          {hasReachedEditLimit('weight') && <li>Weight</li>}
                          {hasReachedEditLimit('dietary_preference') && <li>Dietary Preference</li>}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                <div className="bg-card/50 backdrop-blur-sm border border-primary/10 p-5 rounded-xl shadow-md mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium bg-gradient-to-r from-primary/90 to-accent/90 bg-clip-text text-transparent">Personal Details</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => {
                        // Check if field has reached edit limit
                        const editCount = initialProfile.first_name_edit_count || 0;
                        const hasReachedLimit = editCount >= 1;

                        return (
                          <FormItem>
                            <FormLabel className="text-foreground/80 font-medium">
                              First Name {hasReachedLimit && <span className="text-amber-500 text-xs ml-1">(Edit limit reached)</span>}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your first name"
                                className={`bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20 ${hasReachedLimit ? 'opacity-70' : ''}`}
                                disabled={hasReachedLimit}
                                {...field}
                              />
                            </FormControl>

                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="last_name"
                      render={({ field }) => {
                        // Check if field has reached edit limit
                        const editCount = initialProfile.last_name_edit_count || 0;
                        const hasReachedLimit = editCount >= 1;

                        return (
                          <FormItem>
                            <FormLabel className="text-foreground/80 font-medium">
                              Last Name {hasReachedLimit && <span className="text-amber-500 text-xs ml-1">(Edit limit reached)</span>}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your last name"
                                className={`bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20 ${hasReachedLimit ? 'opacity-70' : ''}`}
                                disabled={hasReachedLimit}
                                {...field}
                              />
                            </FormControl>

                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => {
                        // Check if field has reached edit limit
                        const editCount = initialProfile.gender_edit_count || 0;
                        const hasReachedLimit = editCount >= 1;

                        return (
                          <FormItem>
                            <FormLabel className="text-foreground/80 font-medium">
                              Gender {hasReachedLimit && <span className="text-amber-500 text-xs ml-1">(Edit limit reached)</span>}
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={hasReachedLimit}
                            >
                              <FormControl>
                                <SelectTrigger className={`bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20 w-full ${hasReachedLimit ? 'opacity-70' : ''}`}>
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
                        );
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="birth_year"
                      render={({ field }) => {
                        // Check if field has reached edit limit
                        const editCount = initialProfile.birth_year_edit_count || 0;
                        const hasReachedLimit = editCount >= 1;

                        return (
                          <FormItem>
                            <FormLabel className="text-foreground/80 font-medium">
                              Birth Year {hasReachedLimit && <span className="text-amber-500 text-xs ml-1">(Edit limit reached)</span>}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter your birth year"
                                className={`bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20 ${hasReachedLimit ? 'opacity-70' : ''}`}
                                disabled={hasReachedLimit}
                                {...field}
                              />
                            </FormControl>

                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>
                </div>

                <div className="bg-card/50 backdrop-blur-sm border border-primary/10 p-5 rounded-xl shadow-md mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium bg-gradient-to-r from-primary/90 to-accent/90 bg-clip-text text-transparent">Health Metrics</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/80 font-medium">Height (cm)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter your height"
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
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/80 font-medium">Weight (kg)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter your weight"
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
                      name="dietary_preference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/80 font-medium">Dietary Preference</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20 w-full">
                                <SelectValue placeholder="Select dietary preference" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="vegetarian">Vegetarian</SelectItem>
                              <SelectItem value="vegan">Vegan</SelectItem>
                              <SelectItem value="non-vegetarian">Non-Vegetarian</SelectItem>
                              <SelectItem value="pescatarian">Pescatarian</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="bg-card/50 backdrop-blur-sm border border-primary/10 p-5 rounded-xl shadow-md mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium bg-gradient-to-r from-primary/90 to-accent/90 bg-clip-text text-transparent">Location</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/80 font-medium">Country</FormLabel>
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
                              <SelectTrigger className="bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20 w-full">
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {countries.map((country) => (
                                <SelectItem key={country.isoCode} value={country.name}>
                                  <div className="flex items-center gap-2">
                                    <span>{country.name}</span>
                                  </div>
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
                            <FormLabel className="text-foreground/80 font-medium">State/Province</FormLabel>
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
                                <SelectTrigger className="bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20 w-full">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/80 font-medium">City</FormLabel>
                          {cities.length > 0 ? (
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={states.length > 0 ? !selectedState : !selectedCountry}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20 w-full">
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
                              className="bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20"
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
                          <FormLabel className="text-foreground/80 font-medium">Zip/Postal Code</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your zip/postal code"
                              className="bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </>
            )}

            {isEditingHealthInfo && !initialProfile.has_edited_health_info && (
              <>
                <div className="bg-card/50 backdrop-blur-sm border border-primary/10 p-5 rounded-xl shadow-md mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium bg-gradient-to-r from-primary/90 to-accent/90 bg-clip-text text-transparent">Health History</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="health_history"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80 font-medium">Past Health Issues</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe any significant past health issues or surgeries..."
                            className="resize-none min-h-[120px] bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-muted-foreground/80">
                          Include past surgeries, hospitalizations, or significant health events.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-card/50 backdrop-blur-sm border border-primary/10 p-5 rounded-xl shadow-md mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <Tag className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium bg-gradient-to-r from-primary/90 to-accent/90 bg-clip-text text-transparent">Current Medical Conditions</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="medical_conditions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80 font-medium">Ongoing Conditions</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="List any ongoing medical conditions..."
                            className="resize-none min-h-[120px] bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-muted-foreground/80">
                          Include chronic conditions, ongoing treatments, or recent diagnoses.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-card/50 backdrop-blur-sm border border-primary/10 p-5 rounded-xl shadow-md">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-lg font-medium bg-gradient-to-r from-primary/90 to-accent/90 bg-clip-text text-transparent">Allergies</h3>
                    </div>

                    <FormField
                      control={form.control}
                      name="allergies"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/80 font-medium">Known Allergies</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="List any allergies you have..."
                              className="resize-none min-h-[120px] bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-muted-foreground/80">
                            Include allergies to medications, foods, or environmental factors.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="bg-card/50 backdrop-blur-sm border border-primary/10 p-5 rounded-xl shadow-md">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-lg font-medium bg-gradient-to-r from-primary/90 to-accent/90 bg-clip-text text-transparent">Medications</h3>
                    </div>

                    <FormField
                      control={form.control}
                      name="medications"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/80 font-medium">Current Medications</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="List any medications you're currently taking..."
                              className="resize-none min-h-[120px] bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-muted-foreground/80">
                            Include prescription medications, supplements, and over-the-counter drugs.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </>
            )}

            {error && (
              <Alert variant="destructive" className="mt-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between mt-8 pt-4 border-t border-primary/10">
              <ProfessionalButton
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </ProfessionalButton>
              <ProfessionalButton
                variant="primary"
                onClick={form.handleSubmit(onSubmit)}
                disabled={isSubmitting || (isEditingHealthInfo && initialProfile.has_edited_health_info === true)}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </ProfessionalButton>
            </div>
          </form>
        </Form>
      </div>
  );
}