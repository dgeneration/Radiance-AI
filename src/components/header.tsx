"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { HeaderButton } from "@/components/ui/header-button";
import { usePathname } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { FaArrowRight } from "react-icons/fa";
import { LandingNav } from "@/components/landing-nav";
import { LandingMobileMenu } from "@/components/landing-mobile-menu";
import { ProfileDropdown } from "@/components/profile-dropdown";

interface HeaderProps {
  user: User | null;
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();

  // Determine if we're on the home page or auth pages
  const isHomePage = pathname === "/";
  const isLoginPage = pathname === "/auth/login";
  const isSignupPage = pathname === "/auth/signup";
  const isAuthPage = pathname.startsWith("/auth/");

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
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent translate-none" style={{ width: "140px" }}>
              Radiance AI
            </span>
          </Link>
        </div>

        {/* Center section - Navigation */}
        <div className="flex justify-center">
          {isHomePage ? (
            // Navigation links for home page with active section highlighting
            <LandingNav />
          ) : !isAuthPage ? (
            // Navigation links for dashboard pages (not auth pages)
            <nav className="hidden md:flex items-center space-x-1">
              <Link
                href="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${
                  pathname === '/dashboard'
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/diagnosis"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${
                  pathname === '/diagnosis'
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
                }`}
              >
                Diagnosis
              </Link>
              <Link
                href="/dashboard/chain-diagnosis"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${
                  pathname.startsWith('/dashboard/chain-diagnosis')
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
                }`}
              >
                Chain Diagnosis
              </Link>
              <Link
                href="/dashboard/history"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${
                  pathname === '/dashboard/history'
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
                }`}
              >
                History
              </Link>
            </nav>
          ) : (
            // No navigation for auth pages
            <div></div>
          )}
        </div>

        {/* Right section - Action buttons */}
        <div className="flex gap-3 items-center justify-end">
          {/* Mobile menu button - only visible on mobile and only on home page */}
          <div className="md:hidden mr-1">
            {isHomePage && <LandingMobileMenu user={user} />}
          </div>

          {user ? (
            // User is logged in
            <>
              {/* Only show Dashboard button if on landing page */}
              {isHomePage && (
                <HeaderButton asChild variant="outline" className="hidden md:flex">
                  <Link href="/dashboard">Dashboard</Link>
                </HeaderButton>
              )}

              {/* Only show Get Diagnosis button if on landing page */}
              {isHomePage && (
                <HeaderButton
                  asChild
                  variant="primary"
                  icon={<FaArrowRight />}
                  iconPosition="right"
                  className="hidden md:flex"
                >
                  <Link href="/diagnosis">
                    Get Diagnosis
                  </Link>
                </HeaderButton>
              )}

              {/* Profile dropdown for all authenticated pages */}
              {!isHomePage && <ProfileDropdown user={user} />}
            </>
          ) : (
            // User is not logged in
            <>
              {/* Show Sign Up button on login page, Sign In button on signup page, both on other pages */}
              {isLoginPage ? (
                <HeaderButton
                  asChild
                  variant="primary"
                  icon={<FaArrowRight />}
                  iconPosition="right"
                  className="hidden md:flex"
                >
                  <Link href="/auth/signup">
                    Sign Up
                  </Link>
                </HeaderButton>
              ) : isSignupPage ? (
                <HeaderButton asChild variant="outline" className="hidden md:flex">
                  <Link href="/auth/login">Sign In</Link>
                </HeaderButton>
              ) : (
                <>
                  <HeaderButton asChild variant="outline" className="hidden md:flex">
                    <Link href="/auth/login">Sign In</Link>
                  </HeaderButton>
                  {!isAuthPage && (
                    <HeaderButton
                      asChild
                      variant="primary"
                      icon={<FaArrowRight />}
                      iconPosition="right"
                      className="hidden md:flex"
                    >
                      <Link href="/diagnosis">
                        Get Started
                      </Link>
                    </HeaderButton>
                  )}
                </>
              )}
            </>
          )}

          {/* Auth error helper - only visible when there's an auth error */}
          {pathname.includes('/auth/login') && (
            <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              <Link href="/auth/reset-auth">Fix Auth Issues</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
