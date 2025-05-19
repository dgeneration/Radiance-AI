"use client";

import { useState } from "react";
import Link from "next/link";
import { updatePassword } from "../actions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { ProfessionalButton } from "@/components/ui/professional-button";
import { GradientHeading } from "@/components/ui/gradient-heading";
import { AnimatedSection } from "@/components/animations/animated-section";
import { AnimatedIcon } from "@/components/animations/animated-icon";
import { KeyRound, LogIn, AlertCircle, CheckCircle } from "lucide-react";

export function UpdatePasswordForm({
  redirectUrl,
  error: initialError,
  message: initialMessage,
}: {
  redirectUrl: string;
  error?: string;
  message?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState(initialError || "");
  const [formMessage, setFormMessage] = useState(initialMessage || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError("");
    setFormMessage("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("password", password);
      formData.append("redirectUrl", redirectUrl);

      const result = await updatePassword(formData);
      if (result?.error) {
        setFormError(result.error);
      } else if (result?.success) {
        setFormMessage(result.success);
        // Clear the form
        setPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      setFormError("An unexpected error occurred. Please try again.");
      console.error("Update password error:", error);
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
              icon={<KeyRound className="h-8 w-8 text-primary" />}
              className="p-3 bg-primary/10 rounded-full"
              delay={0.3}
              pulseEffect={true}
            />
          </div>

          <GradientHeading level={2} size="md" className="text-center">
            Update Password
          </GradientHeading>

          <CardDescription className="text-center text-base">
            Enter your new password
          </CardDescription>

          {formError && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-xl border border-destructive/20 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">Error</p>
                <p className="text-sm">{formError}</p>
              </div>
            </div>
          )}

          {formMessage && (
            <div className="bg-primary/10 text-primary p-4 rounded-xl border border-primary/20 flex items-start gap-3">
              <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">Success</p>
                <p className="text-sm">{formMessage}</p>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={handleUpdatePassword} className="grid gap-5">
            <div className="grid gap-3">
              <Label htmlFor="password" className="text-foreground/80 font-medium">New Password</Label>
              <PasswordInput
                id="password"
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

            <div className="grid gap-3">
              <Label htmlFor="confirm-password" className="text-foreground/80 font-medium">Confirm Password</Label>
              <PasswordInput
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
                className="bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20"
              />
            </div>

            <div className="flex flex-col gap-3 mt-3">
              <ProfessionalButton
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={isLoading || !password || !confirmPassword}
                icon={<KeyRound className="h-4 w-4" />}
                iconPosition="right"
              >
                {isLoading ? "Updating..." : "Update Password"}
              </ProfessionalButton>

              {formMessage && (
                <Link href="/auth/login" className="w-full">
                  <ProfessionalButton
                    type="button"
                    variant="outline"
                    size="lg"
                    fullWidth
                    icon={<LogIn className="h-4 w-4" />}
                    iconPosition="right"
                  >
                    Go to Login
                  </ProfessionalButton>
                </Link>
              )}
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col items-center gap-2 border-t border-primary/10 p-6">
          <div className="text-sm text-muted-foreground text-center">
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
