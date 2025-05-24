import { Metadata } from "next";
import Link from "next/link";
import { FaArrowLeft, FaHeartbeat, FaExclamationTriangle, FaUserMd, FaGlobe, FaInfoCircle } from "react-icons/fa";
import { AnimatedSection, FloatingElement, AnimatedIcon } from "@/components/animations";
import { GradientHeading } from "@/components/ui/gradient-heading";
import { ProfessionalButton } from "@/components/ui/professional-button";
import { BackToTopButton } from "@/components/back-to-top-button";

export const metadata: Metadata = {
  title: "Medical Disclaimer | Radiance AI",
  description: "Important medical disclaimer for Radiance AI's health diagnostic services",
};

export default function MedicalDisclaimerPage() {
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
                      icon={<FaHeartbeat className="w-10 h-10 text-primary" />}
                      delay={0.3}
                      pulseEffect={true}
                    />
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <GradientHeading level={1} size="lg" className="mb-4">
                      Medical Disclaimer
                    </GradientHeading>
                    <p className="text-muted-foreground mb-2">
                      Last Updated: May 11, 2024
                    </p>
                    <p className="text-muted-foreground max-w-2xl">
                      This medical disclaimer is important. Please read it carefully before using Radiance AI&apos;s health diagnostic services.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Disclaimer Content */}
          <div className="space-y-8">
            <AnimatedSection direction="up" delay={0.3}>
              <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <AnimatedIcon
                    icon={<FaExclamationTriangle className="w-6 h-6 text-primary" />}
                    className="p-2 bg-primary/10 rounded-full"
                    delay={0.4}
                  />
                  <GradientHeading level={2} size="sm">
                    Not a Substitute for Professional Medical Advice
                  </GradientHeading>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Radiance AI is not a substitute for professional medical advice, diagnosis, or treatment.</strong> The content provided through our platform, including all text, graphics, images, and information, is for general informational purposes only.
                  </p>
                  <p>
                    Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read on the Radiance AI platform.
                  </p>
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 mt-4">
                    <p className="font-medium text-foreground">
                      If you think you may have a medical emergency, call your doctor or emergency services immediately. Radiance AI does not recommend or endorse any specific tests, physicians, products, procedures, opinions, or other information that may be mentioned on our platform.
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="up" delay={0.4}>
              <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <AnimatedIcon
                    icon={<FaUserMd className="w-6 h-6 text-primary" />}
                    className="p-2 bg-primary/10 rounded-full"
                    delay={0.5}
                  />
                  <GradientHeading level={2} size="sm">
                    AI-Generated Content Limitations
                  </GradientHeading>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Radiance AI uses artificial intelligence to analyze symptoms and provide potential diagnoses. However, AI has inherent limitations:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>AI cannot physically examine you or perform diagnostic tests</li>
                    <li>AI may not have access to your complete medical history</li>
                    <li>AI may not recognize rare conditions or unusual presentations of common conditions</li>
                    <li>AI cannot replace the clinical judgment of a trained healthcare professional</li>
                    <li>AI may not account for all possible interactions between conditions, medications, and individual factors</li>
                  </ul>
                  <p>
                    The diagnostic suggestions provided by Radiance AI should be discussed with your healthcare provider before making any medical decisions.
                  </p>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="up" delay={0.5}>
              <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <AnimatedIcon
                    icon={<FaGlobe className="w-6 h-6 text-primary" />}
                    className="p-2 bg-primary/10 rounded-full"
                    delay={0.6}
                  />
                  <GradientHeading level={2} size="sm">
                    Regional Healthcare Differences
                  </GradientHeading>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Healthcare practices, standards, and availability vary significantly across different countries and regions. Radiance AI&apos;s information may not be applicable or appropriate for all locations.
                  </p>
                  <p>
                    Medical terminology, treatment protocols, medication availability, and healthcare systems differ worldwide. The information provided by Radiance AI is general in nature and may not reflect the specific healthcare practices or options available in your location.
                  </p>
                  <p>
                    Always consult with local healthcare providers who are familiar with the healthcare system and medical practices in your region.
                  </p>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="up" delay={0.6}>
              <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <AnimatedIcon
                    icon={<FaInfoCircle className="w-6 h-6 text-primary" />}
                    className="p-2 bg-primary/10 rounded-full"
                    delay={0.7}
                  />
                  <GradientHeading level={2} size="sm">
                    No Doctor-Patient Relationship
                  </GradientHeading>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Using Radiance AI does not create a doctor-patient relationship between you and Radiance AI, its employees, contractors, or affiliates. Our platform provides information only and does not engage in the practice of medicine.
                  </p>
                  <p>
                    The use of Radiance AI is at your own risk. By using our platform, you acknowledge and agree that Radiance AI is not responsible for any decisions made, actions taken, or consequences resulting from your use of our service.
                  </p>
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 mt-4">
                    <p className="font-medium text-foreground">
                      In case of a medical emergency, immediately call your doctor or emergency services. Do not rely on Radiance AI for emergency medical situations.
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="up" delay={0.7}>
              <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <AnimatedIcon
                    icon={<FaHeartbeat className="w-6 h-6 text-primary" />}
                    className="p-2 bg-primary/10 rounded-full"
                    delay={0.8}
                  />
                  <GradientHeading level={2} size="sm">
                    Contact Information
                  </GradientHeading>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    If you have any questions about this Medical Disclaimer, please contact us at:
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
          <AnimatedSection direction="up" delay={0.8} className="mt-12 text-center">
            <BackToTopButton />
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}
