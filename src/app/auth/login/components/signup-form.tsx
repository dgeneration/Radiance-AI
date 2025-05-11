"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signup } from "../../signup/actions";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { ProfessionalButton } from "@/components/ui/professional-button";
import { GradientHeading } from "@/components/ui/gradient-heading";
import { AnimatedSection } from "@/components/animations/animated-section";
import { AnimatedIcon } from "@/components/animations/animated-icon";
import { UserPlus, MapPin, Heart, ArrowRight, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { Country, State, City } from "country-state-city";
import ReactCountryFlag from "react-country-flag";

// Generate years from 1920 to current year
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear; year >= 1920; year--) {
    years.push(year);
  }
  return years;
};

export function SignupForm({
  redirectUrl,
}: {
  redirectUrl: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [cityCode, setCityCode] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [gender, setGender] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [dietaryPreference, setDietaryPreference] = useState("");

  // Form step (1 = Account, 2 = Personal, 3 = Location, 4 = Health Details)
  const [formStep, setFormStep] = useState(1);

  // Get all countries, states, and cities
  const countries = Country.getAllCountries();
  const states = countryCode ? State.getStatesOfCountry(countryCode) : [];
  // If country has no states, get cities directly from country
  const hasStates = states.length > 0;

  // Get cities based on country/state
  let cities = [];
  if (stateCode) {
    cities = City.getCitiesOfState(countryCode, stateCode);
  } else if (countryCode && !hasStates) {
    cities = City.getCitiesOfCountry(countryCode);
  }

  // Check if there are cities available
  const hasCities = cities.length > 0;

  // Reset state and city when country changes
  useEffect(() => {
    // If country has states, reset state code
    // If country doesn't have states, set state code to "N/A"
    if (countryCode) {
      const countryStates = State.getStatesOfCountry(countryCode);
      if (countryStates.length === 0) {
        setStateCode("N/A");
      } else {
        setStateCode("");
      }
    } else {
      setStateCode("");
    }
    setCityCode("");
  }, [countryCode]);

  // Reset city when state changes
  useEffect(() => {
    setCityCode("");
  }, [stateCode]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      // Get the country, state, and city names from their codes
      const selectedCountry = countries.find(c => c.isoCode === countryCode);
      const selectedState = hasStates ? states.find(s => s.isoCode === stateCode) : null;

      // Handle city differently based on whether we're using a dropdown or manual input
      let cityValue = cityCode;
      if (hasCities) {
        const selectedCity = cities.find(c => c.name === cityCode);
        cityValue = selectedCity?.name || cityCode;
      }

      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("country", selectedCountry?.name || "");
      // If country has no states, use "N/A" as state value
      formData.append("state", hasStates ? (selectedState?.name || "") : "N/A");
      formData.append("city", cityValue);
      formData.append("zipCode", zipCode);
      formData.append("gender", gender);
      formData.append("birthYear", birthYear);
      formData.append("height", height);
      formData.append("weight", weight);
      formData.append("dietaryPreference", dietaryPreference);
      formData.append("redirectUrl", redirectUrl);

      const result = await signup(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setMessage(result.success);
        // Reset form fields
        setEmail("");
        setPassword("");
        setFirstName("");
        setLastName("");
        setCountryCode("");
        setStateCode("");
        setCityCode("");
        setZipCode("");
        setGender("");
        setBirthYear("");
        setHeight("");
        setWeight("");
        setDietaryPreference("");
        setFormStep(1);
      }
    } catch (error) {
      setError("An error occurred during signup. Please try again.");
      console.error("Signup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatedSection delay={0.2} direction="up">
      <Card className="w-full bg-card/80 backdrop-blur-sm border border-primary/10 shadow-lg">
        <CardHeader className="space-y-4 pb-6">
          <div className="flex justify-center mb-2">
            <AnimatedIcon
              icon={<UserPlus className="h-8 w-8 text-primary" />}
              className="p-3 bg-primary/10 rounded-full"
              delay={0.3}
              pulseEffect={true}
            />
          </div>

          <GradientHeading level={2} size="md" className="text-center">
            Create Your Account
          </GradientHeading>

          <CardDescription className="text-center text-base">
            Join Radiance AI for personalized health insights
          </CardDescription>

          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-xl border border-destructive/20 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">Registration Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {message && (
            <div className="bg-primary/10 text-primary p-4 rounded-xl border border-primary/20 flex items-start gap-3">
              <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">Success</p>
                <p className="text-sm">{message}</p>
              </div>
            </div>
          )}
        </CardHeader>
      <CardContent>
        <form onSubmit={handleSignup} className="space-y-6">
          {/* Step indicator */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-3">
              {/* Step 1: Account */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                    formStep === 1
                      ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg'
                      : formStep > 1
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {formStep > 1 ? <CheckCircle className="h-4 w-4" /> : 1}
                </div>
                <span className={`text-xs font-medium ${formStep === 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                  Account
                </span>
              </div>

              {/* Line between Step 1 and 2 */}
              <div className="w-12 h-1 bg-muted rounded-full mt-[-10px]">
                <div
                  className={`h-full bg-gradient-to-r from-primary to-accent rounded-full ${
                    formStep >= 2 ? 'w-full' : 'w-0'
                  } transition-all duration-500`}
                ></div>
              </div>

              {/* Step 2: Personal */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                    formStep === 2
                      ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg'
                      : formStep > 2
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {formStep > 2 ? <CheckCircle className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                </div>
                <span className={`text-xs font-medium ${formStep === 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                  Personal
                </span>
              </div>

              {/* Line between Step 2 and 3 */}
              <div className="w-12 h-1 bg-muted rounded-full mt-[-10px]">
                <div
                  className={`h-full bg-gradient-to-r from-primary to-accent rounded-full ${
                    formStep >= 3 ? 'w-full' : 'w-0'
                  } transition-all duration-500`}
                ></div>
              </div>

              {/* Step 3: Location */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                    formStep === 3
                      ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg'
                      : formStep > 3
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {formStep > 3 ? <CheckCircle className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                </div>
                <span className={`text-xs font-medium ${formStep === 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                  Location
                </span>
              </div>

              {/* Line between Step 3 and 4 */}
              <div className="w-12 h-1 bg-muted rounded-full mt-[-10px]">
                <div
                  className={`h-full bg-gradient-to-r from-primary to-accent rounded-full ${
                    formStep >= 4 ? 'w-full' : 'w-0'
                  } transition-all duration-500`}
                ></div>
              </div>

              {/* Step 4: Health */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                    formStep === 4
                      ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Heart className="h-4 w-4" />
                </div>
                <span className={`text-xs font-medium ${formStep === 4 ? 'text-primary' : 'text-muted-foreground'}`}>
                  Health
                </span>
              </div>
            </div>
          </div>

          {/* Step 1: Account Information */}
          {formStep === 1 && (
            <AnimatedSection direction="up" delay={0.1}>
              <div className="space-y-6">
                {/* Account Information */}
                <div className="space-y-5 bg-card/50 backdrop-blur-sm border border-primary/10 p-5 rounded-xl shadow-md">
                  <h3 className="text-lg font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Account Information
                  </h3>

                  <div className="grid gap-3">
                    <Label htmlFor="signup-email" className="text-foreground/80 font-medium">Email Address</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      disabled={isLoading}
                      className="bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20"
                    />
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="signup-password" className="text-foreground/80 font-medium">Password</Label>
                    <PasswordInput
                      id="signup-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                      className="bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20"
                    />
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 6 characters long
                    </p>
                  </div>
                </div>

                <ProfessionalButton
                  type="button"
                  variant="primary"
                  size="default"
                  fullWidth
                  disabled={isLoading || !email || !password}
                  onClick={() => setFormStep(2)}
                  icon={<ArrowRight className="h-4 w-4" />}
                  iconPosition="right"
                  className="signup-form-button"
                >
                  Continue
                </ProfessionalButton>
              </div>
            </AnimatedSection>
          )}

          {/* Step 2: Personal Information */}
          {formStep === 2 && (
            <AnimatedSection direction="up" delay={0.1}>
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-5 bg-card/50 backdrop-blur-sm border border-primary/10 p-5 rounded-xl shadow-md">
                  <h3 className="text-lg font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Personal Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-3">
                      <Label htmlFor="signup-first-name" className="text-foreground/80 font-medium">First Name</Label>
                      <Input
                        id="signup-first-name"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        required
                        disabled={isLoading}
                        className="bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20"
                      />
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="signup-last-name" className="text-foreground/80 font-medium">Last Name</Label>
                      <Input
                        id="signup-last-name"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        required
                        disabled={isLoading}
                        className="bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-3">
                      <Label htmlFor="signup-gender" className="text-foreground/80 font-medium">Gender</Label>
                      <Select
                        value={gender}
                        onValueChange={setGender}
                        disabled={isLoading}
                        required
                      >
                        <SelectTrigger id="signup-gender" className="w-full bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="signup-birth-year" className="text-foreground/80 font-medium">Birth Year</Label>
                      <Select
                        value={birthYear}
                        onValueChange={setBirthYear}
                        disabled={isLoading}
                        required
                      >
                        <SelectTrigger id="signup-birth-year" className="w-full bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20">
                          <SelectValue placeholder="Select birth year" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {generateYears().map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <ProfessionalButton
                    type="button"
                    variant="outline"
                    size="default"
                    className="flex-1 signup-form-button"
                    onClick={() => setFormStep(1)}
                    disabled={isLoading}
                    icon={<ArrowLeft className="h-4 w-4" />}
                    iconPosition="left"
                  >
                    Back
                  </ProfessionalButton>

                  <ProfessionalButton
                    type="button"
                    variant="primary"
                    size="default"
                    className="flex-1 signup-form-button"
                    disabled={isLoading || !firstName || !lastName || !gender || !birthYear}
                    onClick={() => setFormStep(3)}
                    icon={<ArrowRight className="h-4 w-4" />}
                    iconPosition="right"
                  >
                    Continue
                  </ProfessionalButton>
                </div>
              </div>
            </AnimatedSection>
          )}

          {/* Step 3: Location Information */}
          {formStep === 3 && (
            <AnimatedSection direction="up" delay={0.1}>
              <div className="space-y-6">
                <div className="space-y-5 bg-card/50 backdrop-blur-sm border border-primary/10 p-5 rounded-xl shadow-md">
                  <h3 className="text-lg font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Location Information
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Please provide your location details for better regional health recommendations.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Country */}
                    <div className="grid gap-3">
                      <Label htmlFor="signup-country" className="text-foreground/80 font-medium">Country</Label>
                      <Select
                        value={countryCode}
                        onValueChange={setCountryCode}
                        disabled={isLoading}
                        required
                      >
                        <SelectTrigger id="signup-country" className="w-full bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {countries.map((country) => (
                            <SelectItem key={country.isoCode} value={country.isoCode}>
                              <div className="flex items-center gap-2">
                                <ReactCountryFlag
                                  countryCode={country.isoCode}
                                  svg
                                  style={{ width: '1.2em', height: '1.2em' }}
                                />
                                {country.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* State/Province - Only show if country has states */}
                    {hasStates ? (
                      <div className="grid gap-3">
                        <Label htmlFor="signup-state" className="text-foreground/80 font-medium">State/Province</Label>
                        <Select
                          value={stateCode}
                          onValueChange={setStateCode}
                          disabled={isLoading || !countryCode}
                          required
                        >
                          <SelectTrigger id="signup-state" className="w-full bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20">
                            <SelectValue placeholder={countryCode ? "Select state" : "Select country first"} />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {states.map((state) => (
                              <SelectItem key={state.isoCode} value={state.isoCode}>
                                {state.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="hidden">
                        {/* Hidden input for countries without states */}
                        <input
                          type="hidden"
                          name="stateCode"
                          value="N/A"
                          onChange={() => {}}
                        />
                        {/* Ensure stateCode is set to N/A when there are no states */}
                        {countryCode && !hasStates && stateCode !== "N/A" && setStateCode("N/A")}
                      </div>
                    )}

                    {/* City */}
                    {hasCities ? (
                      <div className="grid gap-3">
                        <Label htmlFor="signup-city" className="text-foreground/80 font-medium">City</Label>
                        <Select
                          value={cityCode}
                          onValueChange={setCityCode}
                          disabled={isLoading || (hasStates && !stateCode)}
                          required
                        >
                          <SelectTrigger id="signup-city" className="w-full bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20">
                            <SelectValue
                              placeholder={
                                !countryCode
                                  ? "Select country first"
                                  : hasStates && !stateCode
                                    ? "Select state first"
                                    : "Select city"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {cities.map((city, index) => {
                              // Create a truly unique key using multiple properties and index
                              const uniqueKey = `city-${countryCode}-${stateCode}-${city.name}-${index}`;
                              return (
                                <SelectItem key={uniqueKey} value={city.name}>
                                  {city.name}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        <Label htmlFor="signup-city" className="text-foreground/80 font-medium">City</Label>
                        <Input
                          id="signup-city"
                          value={cityCode}
                          onChange={(e) => setCityCode(e.target.value)}
                          placeholder="Enter your city"
                          disabled={isLoading || !countryCode}
                          required
                          className="bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20"
                        />
                      </div>
                    )}

                    {/* Zip Code */}
                    <div className="grid gap-3">
                      <Label htmlFor="signup-zip-code" className="text-foreground/80 font-medium">Zip/Postal Code</Label>
                      <Input
                        id="signup-zip-code"
                        type="text"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="12345"
                        required
                        disabled={isLoading}
                        className="w-full bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <ProfessionalButton
                    type="button"
                    variant="outline"
                    size="default"
                    className="flex-1 signup-form-button"
                    onClick={() => setFormStep(2)}
                    disabled={isLoading}
                    icon={<ArrowLeft className="h-4 w-4" />}
                    iconPosition="left"
                  >
                    Back
                  </ProfessionalButton>

                  <ProfessionalButton
                    type="button"
                    variant="primary"
                    size="default"
                    className="flex-1 signup-form-button"
                    disabled={isLoading || !countryCode || !cityCode || !zipCode}
                    onClick={() => setFormStep(4)}
                    icon={<ArrowRight className="h-4 w-4" />}
                    iconPosition="right"
                  >
                    Continue
                  </ProfessionalButton>
                </div>
              </div>
            </AnimatedSection>
          )}

          {/* Step 4: Health Details */}
          {formStep === 4 && (
            <AnimatedSection direction="up" delay={0.1}>
              <div className="space-y-6">
                <div className="space-y-5 bg-card/50 backdrop-blur-sm border border-primary/10 p-5 rounded-xl shadow-md">
                  <h3 className="text-lg font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Health Information
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    This information helps us provide more accurate health recommendations.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="grid gap-3">
                      <Label htmlFor="signup-height" className="text-foreground/80 font-medium">Height (cm)</Label>
                      <Input
                        id="signup-height"
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="175"
                        disabled={isLoading}
                        className="bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20"
                      />
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="signup-weight" className="text-foreground/80 font-medium">Weight (kg)</Label>
                      <Input
                        id="signup-weight"
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="70"
                        disabled={isLoading}
                        className="bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="signup-dietary-preference" className="text-foreground/80 font-medium">Dietary Preference</Label>
                    <Select
                      value={dietaryPreference}
                      onValueChange={setDietaryPreference}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="signup-dietary-preference" className="w-full bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20">
                        <SelectValue placeholder="Select dietary preference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vegetarian">Vegetarian</SelectItem>
                        <SelectItem value="vegan">Vegan</SelectItem>
                        <SelectItem value="non-vegetarian">Non-Vegetarian</SelectItem>
                        <SelectItem value="pescatarian">Pescatarian</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <ProfessionalButton
                    type="button"
                    variant="outline"
                    size="default"
                    className="flex-1 signup-form-button"
                    onClick={() => setFormStep(3)}
                    disabled={isLoading}
                    icon={<ArrowLeft className="h-4 w-4" />}
                    iconPosition="left"
                  >
                    Back
                  </ProfessionalButton>

                  <ProfessionalButton
                    type="submit"
                    variant="primary"
                    size="default"
                    className="flex-1 signup-form-button"
                    disabled={isLoading}
                    icon={<UserPlus className="h-4 w-4" />}
                    iconPosition="right"
                  >
                    {isLoading ? "Creating account..." : "Create account"}
                  </ProfessionalButton>
                </div>
              </div>
            </AnimatedSection>
          )}
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center gap-2 border-t border-primary/10 p-6">
        <div className="text-sm text-muted-foreground text-center">
          Already have an account?{" "}
          <Link
            href={`/auth/login${redirectUrl ? `?redirectUrl=${encodeURIComponent(redirectUrl)}` : ""}`}
            className="text-primary hover:underline font-medium transition-colors"
          >
            Sign in
          </Link>
        </div>
        <div className="text-sm text-muted-foreground mt-2 text-center">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-4 hover:text-primary transition-colors">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-primary transition-colors">
            Privacy Policy
          </Link>
          .
        </div>
      </CardFooter>
    </Card>
    </AnimatedSection>
  );
}