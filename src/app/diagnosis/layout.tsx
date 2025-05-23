"use client";

import { MobileMenu } from "@/components/mobile-menu";
import { useEffect, useState } from "react";

export default function DiagnosisLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Use state to handle client-side rendering
  const [mounted, setMounted] = useState(false);

  // Only render mobile menu on the client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <div className="relative overflow-hidden">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background/80 z-0 pointer-events-none"></div>

        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5 z-0 bg-[url('/patterns/dot-pattern.svg')] pointer-events-none"></div>

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>

      {/* Mobile Navigation - Only render on client */}
      {mounted && <MobileMenu />}
    </>
  );
}
