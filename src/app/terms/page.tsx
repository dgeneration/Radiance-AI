import { Metadata } from "next";
import Link from "next/link";
import { FaArrowLeft, FaFileContract, FaGavel, FaUserShield, FaExclamationTriangle, FaLock } from "react-icons/fa";
import { AnimatedSection, FloatingElement, AnimatedIcon } from "@/components/animations";
import { GradientHeading } from "@/components/ui/gradient-heading";
import { ProfessionalButton } from "@/components/ui/professional-button";
import { BackToTopButton } from "@/components/back-to-top-button";

export const metadata: Metadata = {
  title: "Terms of Service | Radiance AI",
  description: "Read the terms and conditions for using Radiance AI's health diagnostic services",
};

export default function TermsOfServicePage() {
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
                      icon={<FaFileContract className="w-10 h-10 text-primary" />}
                      delay={0.3}
                      pulseEffect={true}
                    />
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <GradientHeading level={1} size="lg" className="mb-4">
                      Terms of Service
                    </GradientHeading>
                    <p className="text-muted-foreground mb-2">
                      Last Updated: May 11, 2024
                    </p>
                    <p className="text-muted-foreground max-w-2xl">
                      Please read these Terms of Service carefully before using Radiance AI. By accessing or using our service, you agree to be bound by these terms and conditions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Terms Content */}
          <div className="space-y-8">
            <AnimatedSection direction="up" delay={0.3}>
              <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <AnimatedIcon
                    icon={<FaGavel className="w-6 h-6 text-primary" />}
                    className="p-2 bg-primary/10 rounded-full"
                    delay={0.4}
                  />
                  <GradientHeading level={2} size="sm">
                    1. Acceptance of Terms
                  </GradientHeading>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    By accessing or using Radiance AI&apos;s services, website, or applications (collectively, the &quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, you may not access or use the Service.
                  </p>
                  <p>
                    We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting to our website. Your continued use of the Service following the posting of revised Terms means that you accept and agree to the changes.
                  </p>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="up" delay={0.4}>
              <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <AnimatedIcon
                    icon={<FaUserShield className="w-6 h-6 text-primary" />}
                    className="p-2 bg-primary/10 rounded-full"
                    delay={0.5}
                  />
                  <GradientHeading level={2} size="sm">
                    2. Service Description
                  </GradientHeading>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Radiance AI provides an AI-powered health diagnostic platform that allows users to input symptoms and receive potential diagnoses and health insights. Our Service is intended for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment.
                  </p>
                  <p>
                    <strong className="text-foreground">Not Medical Advice:</strong> The information provided through our Service is not medical advice. Always consult with a qualified healthcare provider regarding any medical conditions or treatments.
                  </p>
                  <p>
                    <strong className="text-foreground">Emergency Situations:</strong> Do not use our Service for emergency medical situations. If you are experiencing a medical emergency, call your local emergency services immediately.
                  </p>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="up" delay={0.5}>
              <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <AnimatedIcon
                    icon={<FaExclamationTriangle className="w-6 h-6 text-primary" />}
                    className="p-2 bg-primary/10 rounded-full"
                    delay={0.6}
                  />
                  <GradientHeading level={2} size="sm">
                    3. User Accounts and Responsibilities
                  </GradientHeading>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    To use certain features of our Service, you may need to create an account. You are responsible for:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Providing accurate and complete information when creating your account</li>
                    <li>Maintaining the confidentiality of your account credentials</li>
                    <li>All activities that occur under your account</li>
                    <li>Notifying us immediately of any unauthorized use of your account</li>
                  </ul>
                  <p>
                    We reserve the right to terminate or suspend your account at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.
                  </p>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="up" delay={0.6}>
              <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <AnimatedIcon
                    icon={<FaLock className="w-6 h-6 text-primary" />}
                    className="p-2 bg-primary/10 rounded-full"
                    delay={0.7}
                  />
                  <GradientHeading level={2} size="sm">
                    4. Privacy and Data Protection
                  </GradientHeading>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Your privacy is important to us. Our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> explains how we collect, use, and protect your personal information. By using our Service, you consent to our collection and use of your data as described in our Privacy Policy.
                  </p>
                  <p>
                    We implement appropriate security measures to protect your personal information, but no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security of your data.
                  </p>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="up" delay={0.7}>
              <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <AnimatedIcon
                    icon={<FaGavel className="w-6 h-6 text-primary" />}
                    className="p-2 bg-primary/10 rounded-full"
                    delay={0.8}
                  />
                  <GradientHeading level={2} size="sm">
                    5. Limitation of Liability
                  </GradientHeading>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    To the maximum extent permitted by law, Radiance AI and its affiliates, officers, employees, agents, partners, and licensors shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Your access to or use of or inability to access or use the Service</li>
                    <li>Any conduct or content of any third party on the Service</li>
                    <li>Any content obtained from the Service</li>
                    <li>Unauthorized access, use, or alteration of your transmissions or content</li>
                  </ul>
                  <p>
                    In no event shall our total liability to you for all claims exceed the amount you have paid to us for use of the Service in the past twelve months.
                  </p>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="up" delay={0.8}>
              <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <AnimatedIcon
                    icon={<FaGavel className="w-6 h-6 text-primary" />}
                    className="p-2 bg-primary/10 rounded-full"
                    delay={0.9}
                  />
                  <GradientHeading level={2} size="sm">
                    6. Contact Information
                  </GradientHeading>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    If you have any questions about these Terms of Service, please contact us at:
                  </p>
                  <p>
                    <strong className="text-foreground">Email:</strong> support@dgeneration.io<br />
                    <strong className="text-foreground">Address:</strong> Developed By  Jay Patel & Shraddha Gautam<br />
                    <strong className="text-foreground">Phone:</strong> +91 95121 91655
                  </p>
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Back to top button */}
          <AnimatedSection direction="up" delay={0.9} className="mt-12 text-center">
            <BackToTopButton />
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}
