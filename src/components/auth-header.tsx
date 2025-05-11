"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { HeaderButton } from "@/components/ui/header-button";
import { FaArrowRight } from "react-icons/fa";

export function AuthHeader() {
  const pathname = usePathname();

  // Determine if we're on the login or signup page
  const isLoginPage = pathname === "/auth/login";
  const isSignupPage = pathname === "/auth/signup";

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-primary/10 shadow-sm select-none">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 z-0"></div>
      <div className="container relative z-10 mx-auto px-6 py-4 grid grid-cols-3 items-center">
        {/* Left section - Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 p-1.5 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
              <Image src="/RadianceAi_Logo.svg" alt="Radiance AI Logo" width={40} height={40} className="w-full h-full" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent w-[140px]">
              Radiance AI
            </span>
          </Link>
        </div>

        {/* Center section - Empty for auth pages */}
        <div className="flex justify-center">
          {/* No navigation for auth pages */}
        </div>

        {/* Right section - Action buttons */}
        <div className="flex gap-3 items-center justify-end">
          {/* Show Sign Up button on login page, Sign In button on signup page */}
          {isLoginPage ? (
            <HeaderButton
              asChild
              variant="primary"
              icon={<FaArrowRight />}
              iconPosition="right"
            >
              <Link href="/auth/signup">
                Sign Up
              </Link>
            </HeaderButton>
          ) : isSignupPage ? (
            <HeaderButton
              asChild
              variant="primary"
              icon={<FaArrowRight />}
              iconPosition="right"
            >
              <Link href="/auth/login">
                Sign In
              </Link>
            </HeaderButton>
          ) : (
            <>
              <HeaderButton asChild variant="outline">
                <Link href="/auth/login">Sign In</Link>
              </HeaderButton>
              <HeaderButton
                asChild
                variant="primary"
                icon={<FaArrowRight />}
                iconPosition="right"
              >
                <Link href="/auth/signup">
                  Sign Up
                </Link>
              </HeaderButton>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
