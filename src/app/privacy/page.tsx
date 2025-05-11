import { Metadata } from "next";
import Link from "next/link";
import { FaArrowLeft, FaShieldAlt } from "react-icons/fa";
import { MdOutlinePrivacyTip } from "react-icons/md";
import { AnimatedSection, FloatingElement, AnimatedIcon } from "@/components/animations";
import { GradientHeading } from "@/components/ui/gradient-heading";
import { ProfessionalButton } from "@/components/ui/professional-button";
import { BackToTopButton } from "@/components/back-to-top-button";

export const metadata: Metadata = {
  title: "Privacy Policy | Radiance AI",
  description: "Learn how Radiance AI protects your privacy and handles your data",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background/80 z-0 pointer-events-none"></div>

      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5 z-0 bg-[url('/patterns/dot-pattern.svg')] pointer-events-none"></div>

      <div className="container mx-auto py-16 px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <AnimatedSection direction="up" delay={0.1} className="mb-8">
            <ProfessionalButton
              asChild
              variant="outline"
              size="sm"
              icon={<FaArrowLeft className="h-4 w-4" />}
              iconPosition="left"
            >
              <Link href="/">Back to Home</Link>
            </ProfessionalButton>
          </AnimatedSection>

          {/* Header Section */}
          <AnimatedSection direction="up" delay={0.2} className="mb-12">
            <div className="relative overflow-hidden bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg">
              <FloatingElement
                className="absolute top-0 right-0 w-60 h-60 bg-primary/10 rounded-full blur-3xl opacity-30"
                duration={10}
                xOffset={15}
                yOffset={20}
              />

              <div className="relative z-10">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shadow-lg">
                    <AnimatedIcon
                      icon={<MdOutlinePrivacyTip className="w-10 h-10 text-primary" />}
                      delay={0.3}
                      pulseEffect={true}
                    />
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <GradientHeading level={1} size="lg" className="mb-4">
                      Privacy Policy
                    </GradientHeading>
                    <p className="text-muted-foreground mb-2">
                      Last Updated: May 11, 2024
                    </p>
                    <p className="text-muted-foreground max-w-2xl">
                      At Radiance AI, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Policy Content */}
          <div className="space-y-8">
            <AnimatedSection direction="up" delay={0.3}>
              <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <AnimatedIcon
                    icon={<FaShieldAlt className="w-6 h-6 text-primary" />}
                    className="p-2 bg-primary/10 rounded-full"
                    delay={0.4}
                  />
                  <GradientHeading level={2} size="sm">
                    Information We Collect
                  </GradientHeading>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    We collect several types of information from and about users of our platform, including:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong className="text-foreground">Personal Information:</strong> Name, email address, date of birth, gender, and other demographic information you provide during registration.</li>
                    <li><strong className="text-foreground">Health Information:</strong> Symptoms, medical history, and other health-related information you provide when using our diagnostic services.</li>
                    <li><strong className="text-foreground">Usage Data:</strong> Information about how you interact with our platform, including diagnosis history, features used, and time spent on the platform.</li>
                    <li><strong className="text-foreground">Device Information:</strong> Information about your device, IP address, browser type, and operating system.</li>
                  </ul>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="up" delay={0.4}>
              <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <AnimatedIcon
                    icon={<FaShieldAlt className="w-6 h-6 text-primary" />}
                    className="p-2 bg-primary/10 rounded-full"
                    delay={0.5}
                  />
                  <GradientHeading level={2} size="sm">
                    How We Use Your Information
                  </GradientHeading>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    We use the information we collect for various purposes, including:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Providing and improving our health diagnostic services</li>
                    <li>Personalizing your experience on our platform</li>
                    <li>Communicating with you about your account and our services</li>
                    <li>Analyzing usage patterns to improve our platform</li>
                    <li>Ensuring the security and integrity of our platform</li>
                    <li>Complying with legal obligations</li>
                  </ul>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="up" delay={0.5}>
              <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <AnimatedIcon
                    icon={<FaShieldAlt className="w-6 h-6 text-primary" />}
                    className="p-2 bg-primary/10 rounded-full"
                    delay={0.6}
                  />
                  <GradientHeading level={2} size="sm">
                    Data Security
                  </GradientHeading>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    We implement appropriate technical and organizational measures to protect your personal information from unauthorized access, disclosure, alteration, and destruction. These measures include:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Encryption of sensitive data both in transit and at rest</li>
                    <li>Regular security assessments and audits</li>
                    <li>Access controls and authentication mechanisms</li>
                    <li>Employee training on data protection and privacy</li>
                  </ul>
                  <p>
                    However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
                  </p>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="up" delay={0.6}>
              <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <AnimatedIcon
                    icon={<FaShieldAlt className="w-6 h-6 text-primary" />}
                    className="p-2 bg-primary/10 rounded-full"
                    delay={0.7}
                  />
                  <GradientHeading level={2} size="sm">
                    Your Rights
                  </GradientHeading>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Depending on your location, you may have certain rights regarding your personal information, including:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>The right to access your personal information</li>
                    <li>The right to correct inaccurate or incomplete information</li>
                    <li>The right to delete your personal information</li>
                    <li>The right to restrict or object to processing</li>
                    <li>The right to data portability</li>
                    <li>The right to withdraw consent</li>
                  </ul>
                  <p>
                    To exercise these rights, please contact us using the information provided in the &quot;Contact Us&quot; section.
                  </p>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="up" delay={0.7}>
              <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <AnimatedIcon
                    icon={<FaShieldAlt className="w-6 h-6 text-primary" />}
                    className="p-2 bg-primary/10 rounded-full"
                    delay={0.8}
                  />
                  <GradientHeading level={2} size="sm">
                    Contact Us
                  </GradientHeading>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:
                  </p>
                  <p>
                    <strong className="text-foreground">Email:</strong> privacy@radianceai.health<br />
                    <strong className="text-foreground">Address:</strong> 123 Innovation Drive, Health Valley, CA 94103<br />
                    <strong className="text-foreground">Phone:</strong> +1 (800) 123-4567
                  </p>
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Back to top button */}
          <AnimatedSection direction="up" delay={0.8} className="mt-12 text-center">
            <BackToTopButton />
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}
