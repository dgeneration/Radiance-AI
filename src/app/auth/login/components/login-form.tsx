"use client";

import { useState } from "react";
import Link from "next/link";
import { login } from "../actions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { ProfessionalButton } from "@/components/ui/professional-button";
import { GradientHeading } from "@/components/ui/gradient-heading";
import { AnimatedSection } from "@/components/animations/animated-section";
import { AnimatedIcon } from "@/components/animations/animated-icon";
import { LogIn, UserPlus, AlertCircle, CheckCircle } from "lucide-react";

export function LoginForm({
  redirectUrl,
  error: initialError,
  message,
}: {
  redirectUrl: string;
  error?: string;
  message?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState(initialError || "");
  const [formMessage, setFormMessage] = useState(message || "");

  const handleLogin = async (formData: FormData) => {
    setIsLoading(true);
    setFormError("");
    setFormMessage("");

    try {
      const result = await login(formData);
      if (result?.error) {
        setFormError(result.error);
        setIsLoading(false); // Reset loading state when there's an error
      }
      // If no error, the page will redirect so we don't need to handle that case
    } catch {
      // Handle any unexpected errors
      setIsLoading(false);
    }
  };

  return (
    <AnimatedSection delay={0.2} direction="up">
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border border-primary/10 shadow-lg">
        <CardHeader className="space-y-4 pb-6">
          <div className="flex justify-center mb-2">
            <AnimatedIcon
              icon={<LogIn className="h-8 w-8 text-primary" />}
              className="p-3 bg-primary/10 rounded-full"
              delay={0.3}
              pulseEffect={true}
            />
          </div>

          <GradientHeading level={2} size="md" className="text-center">
            Welcome Back
          </GradientHeading>

          <CardDescription className="text-center text-base">
            Enter your credentials to access your account
          </CardDescription>

          {formError && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-xl border border-destructive/20 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">Authentication Error</p>
                <p className="text-sm">{formError}</p>
                {formError.includes('JWT') || formError.includes('token') || formError.includes('auth') ? (
                  <div className="mt-2 text-xs">
                    Having trouble? Try <Link href="/auth/reset-auth" className="underline hover:text-primary font-medium">resetting your authentication state</Link>.
                  </div>
                ) : null}
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
          <form action={handleLogin} className="grid gap-5">
            <input
              type="hidden"
              name="redirectUrl"
              value={redirectUrl}
            />

            <div className="grid gap-3">
              <Label htmlFor="email" className="text-foreground/80 font-medium">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
                disabled={isLoading}
                className="bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20"
              />
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground/80 font-medium">Password</Label>
                <Link
                  href="/auth/reset-password"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                name="password"
                placeholder="••••••••"
                required
                disabled={isLoading}
                className="bg-card/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20"
              />
            </div>

            <div className="flex flex-col gap-3 mt-3">
              <ProfessionalButton
                variant="primary"
                size="lg"
                fullWidth
                disabled={isLoading}
                icon={<LogIn className="h-4 w-4" />}
                iconPosition="right"
                className="signup-form-button"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </ProfessionalButton>

              <Link
                href={`/auth/signup${redirectUrl ? `?redirectUrl=${encodeURIComponent(redirectUrl)}` : ""}`}
                className="w-full"
              >
                <ProfessionalButton
                  type="button"
                  variant="outline"
                  size="lg"
                  fullWidth
                  icon={<UserPlus className="h-4 w-4" />}
                  iconPosition="right"
                  className="signup-form-button"
                >
                  Create account
                </ProfessionalButton>
              </Link>
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