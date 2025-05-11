"use client";

import { useSearchParams } from "next/navigation";
import { LoginForm } from "./login-form";
import { AuthCheck } from "./auth-check";
import { FloatingElement } from "@/components/animations/floating-element";

export function LoginPageClient() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get("redirectUrl") || "/dashboard";
  const error = searchParams?.get("error") || "";
  const message = searchParams?.get("message") || "";

  return (
    <AuthCheck redirectUrl={redirectUrl}>
      <div className="relative flex min-h-screen items-center justify-center px-4 py-12 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background/80 z-0 pointer-events-none"></div>
        <div className="absolute inset-0 opacity-5 z-0 bg-[url('/patterns/dot-pattern.svg')] pointer-events-none"></div>

        {/* Floating elements */}
        <FloatingElement
          className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10"
          duration={8}
          xOffset={10}
          yOffset={15}
        />
        <FloatingElement
          className="absolute bottom-20 right-10 w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-10"
          duration={10}
          xOffset={-10}
          yOffset={-15}
          delay={1}
        />

        {/* Login Form */}
        <div className="relative z-10">
          <LoginForm
            redirectUrl={redirectUrl}
            error={error}
            message={message}
          />
        </div>
      </div>
    </AuthCheck>
  );
}