import { Metadata } from "next";
import Link from "next/link";
import { FaWifi, FaArrowLeft } from "react-icons/fa";
import { AnimatedSection, FloatingElement, AnimatedIcon } from "@/components/animations";
import { GradientHeading } from "@/components/ui/gradient-heading";
import { ProfessionalButton } from "@/components/ui/professional-button";

export const metadata: Metadata = {
  title: "Offline | Radiance AI",
  description: "You are currently offline",
};

export default function OfflinePage() {
  return (
    <div className="relative overflow-hidden min-h-screen flex items-center justify-center">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background/80 z-0 pointer-events-none"></div>

      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5 z-0 bg-[url('/patterns/dot-pattern.svg')] pointer-events-none"></div>

      <div className="container mx-auto py-16 px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <AnimatedSection direction="up" delay={0.2} className="mb-12">
            <div className="relative overflow-hidden bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg">
              <FloatingElement
                className="absolute top-0 right-0 w-60 h-60 bg-primary/10 rounded-full blur-3xl opacity-30"
                duration={10}
                xOffset={15}
                yOffset={20}
              />

              <div className="flex flex-col items-center text-center">
                <AnimatedIcon
                  icon={<FaWifi className="w-16 h-16 text-primary" />}
                  className="p-4 bg-primary/10 rounded-full mb-6"
                  delay={0.3}
                />
                <GradientHeading level={1} size="lg" className="mb-4">
                  You&apos;re Offline
                </GradientHeading>
                <p className="text-muted-foreground text-lg max-w-2xl">
                  It seems you&apos;re not connected to the internet. Some features of Radiance AI may not be available while you&apos;re offline.
                </p>
              </div>
            </div>
          </AnimatedSection>

          {/* Content Section */}
          <AnimatedSection direction="up" delay={0.4}>
            <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg">
              <div className="space-y-6 text-center">
                <p className="text-muted-foreground">
                  Radiance AI has cached some pages for offline use. You can try:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 text-left max-w-md mx-auto">
                  <li>Checking your internet connection</li>
                  <li>Returning to the homepage</li>
                  <li>Accessing previously visited pages that may be cached</li>
                </ul>
                <div className="pt-6 flex justify-center">
                  <ProfessionalButton
                    asChild
                    variant="primary"
                    size="lg"
                    icon={<FaArrowLeft className="h-4 w-4" />}
                    iconPosition="left"
                  >
                    <Link href="/">Return to Homepage</Link>
                  </ProfessionalButton>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}
