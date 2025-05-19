"use client";

import Link from "next/link";
import { ProfessionalButton } from "@/components/ui/professional-button";
import { motion } from "framer-motion";
import {
  AnimatedSection,
  AnimatedText,
  AnimatedIcon,
  FloatingElement
} from "@/components/animations";
import { CollapsibleFAQ } from "@/components/ui/collapsible-faq";
import { TestimonialCard } from "@/components/ui/testimonial-card";
import { TranslatedText } from "@/components/translated-text";
import {
  FaHeartbeat,
  FaShieldAlt,
  FaClock,
  FaCheckCircle,
  FaArrowRight
} from "react-icons/fa";
import {
  MdHealthAndSafety,
  MdOutlinePrivacyTip,
  MdOutlineVerified
} from "react-icons/md";
import {
  GiHealthNormal,
  GiMedicalDrip,
  GiMedicines
} from "react-icons/gi";
import {
  HiOutlineDocumentSearch,
  HiOutlineDocumentReport
} from "react-icons/hi";

export default function Home() {
  return (
    <main className="flex-1 select-none">
      {/* Hero Section */}
      <section id="hero" className="relative py-36 px-4 overflow-hidden min-h-[90vh] flex items-center">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background z-0"></div>

        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5 z-0 bg-[url('/patterns/dot-pattern.svg')]"></div>

        {/* Animated decorative elements */}
        <FloatingElement
          className="absolute top-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
          duration={8}
          xOffset={20}
          yOffset={30}
        />
        <FloatingElement
          className="absolute bottom-10 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
          duration={10}
          xOffset={-20}
          yOffset={-30}
          delay={1}
        />

        <div className="container relative z-10 mx-auto max-w-5xl text-center">
          <AnimatedSection direction="down" delay={0.1}>
            <motion.div
              className="inline-block mb-6 px-5 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <span className="flex items-center gap-2">
                <MdHealthAndSafety className="text-lg" />
                <TranslatedText text="AI-Powered Healthcare" />
              </span>
            </motion.div>
          </AnimatedSection>

          <AnimatedSection delay={0.3}>
            <h1 className="text-4xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight">
              <AnimatedText
                text="Your Intelligent"
                staggerChildren={0.02}
              />
              <br className="hidden md:block" />
              <AnimatedText
                text="Health Companion"
                staggerChildren={0.02}
                delay={0.5}
              />
            </h1>
          </AnimatedSection>

          <AnimatedSection delay={0.6}>
            <p className="text-xl md:text-2xl text-muted-foreground mb-14 max-w-3xl mx-auto leading-relaxed tracking-wide">
              <TranslatedText text="Fast, trusted, and research-backed diagnosis powered by AI" />
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.8}>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-16 max-w-md sm:max-w-none mx-auto">
              <ProfessionalButton
                asChild
                variant="primary"
                size="lg"
                icon={<FaArrowRight />}
                iconPosition="right"
                className="w-full sm:w-auto"
              >
                <Link href="/dashboard/diagnosis">
                  <TranslatedText text="Try Diagnosis" />
                </Link>
              </ProfessionalButton>
              <ProfessionalButton
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                <Link href="#features">
                  <TranslatedText text="Learn More" />
                </Link>
              </ProfessionalButton>
            </div>
          </AnimatedSection>

          {/* Hero feature cards */}
          <AnimatedSection delay={1.0}>
            <motion.div
              className="mb-16 relative"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl"></div>
              <div className="relative py-8 px-6 rounded-2xl border border-primary/10 bg-card/30 backdrop-blur-sm shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <motion.div
                    className="flex flex-col items-center p-4 rounded-xl bg-card/50 border border-primary/10 transition-all duration-300"
                    whileHover={{
                      y: -5,
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                      backgroundColor: "rgba(28, 28, 32, 0.7)",
                      borderColor: "rgba(0, 198, 215, 0.2)"
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <AnimatedIcon
                      icon={<FaHeartbeat size={24} className="text-primary" />}
                      className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3"
                      delay={0.1}
                      pulseEffect={true}
                    />
                    <h3 className="text-lg font-medium mb-1">Personalized Care</h3>
                    <p className="text-sm text-muted-foreground text-center">Tailored health insights based on your unique profile</p>
                  </motion.div>

                  <motion.div
                    className="flex flex-col items-center p-4 rounded-xl bg-card/50 border border-primary/10 transition-all duration-300"
                    whileHover={{
                      y: -5,
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                      backgroundColor: "rgba(28, 28, 32, 0.7)",
                      borderColor: "rgba(29, 233, 182, 0.2)"
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <AnimatedIcon
                      icon={<FaShieldAlt size={24} className="text-accent" />}
                      className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-3"
                      delay={0.2}
                      pulseEffect={true}
                    />
                    <h3 className="text-lg font-medium mb-1">Secure Platform</h3>
                    <p className="text-sm text-muted-foreground text-center">End-to-end encryption and strict privacy controls</p>
                  </motion.div>

                  <motion.div
                    className="flex flex-col items-center p-4 rounded-xl bg-card/50 border border-primary/10 transition-all duration-300"
                    whileHover={{
                      y: -5,
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                      backgroundColor: "rgba(28, 28, 32, 0.7)",
                      borderColor: "rgba(0, 198, 215, 0.2)"
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <AnimatedIcon
                      icon={<FaClock size={24} className="text-primary" />}
                      className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3"
                      delay={0.3}
                      pulseEffect={true}
                    />
                    <h3 className="text-lg font-medium mb-1">24/7 Availability</h3>
                    <p className="text-sm text-muted-foreground text-center">Access health insights whenever you need them</p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </AnimatedSection>

          {/* Trust indicators */}
          <AnimatedSection delay={1.2} direction="up">
            <div className="pt-8 border-t border-border/20 flex flex-wrap justify-center gap-10 text-sm text-muted-foreground">
              <motion.div
                className="flex items-center gap-3"
                whileHover={{ scale: 1.05, color: "#E0E0E0" }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-6 h-6 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full flex items-center justify-center shadow-sm">
                  <FaCheckCircle className="text-primary text-xs" />
                </div>
                <span>Research-backed</span>
              </motion.div>

              <motion.div
                className="flex items-center gap-3"
                whileHover={{ scale: 1.05, color: "#E0E0E0" }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-6 h-6 bg-gradient-to-br from-accent/30 to-accent/10 rounded-full flex items-center justify-center shadow-sm">
                  <MdOutlineVerified className="text-accent text-xs" />
                </div>
                <span>HIPAA Compliant</span>
              </motion.div>

              <motion.div
                className="flex items-center gap-3"
                whileHover={{ scale: 1.05, color: "#E0E0E0" }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-6 h-6 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full flex items-center justify-center shadow-sm">
                  <MdOutlinePrivacyTip className="text-primary text-xs" />
                </div>
                <span>Secure & Private</span>
              </motion.div>

              <motion.div
                className="flex items-center gap-3"
                whileHover={{ scale: 1.05, color: "#E0E0E0" }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-6 h-6 bg-gradient-to-br from-accent/30 to-accent/10 rounded-full flex items-center justify-center shadow-sm">
                  <GiHealthNormal className="text-accent text-xs" />
                </div>
                <span>Medical-Grade Accuracy</span>
              </motion.div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 relative overflow-hidden">
        {/* Background gradient effect similar to hero section */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-background to-accent/5 z-0"></div>



        <div className="container relative z-10 mx-auto max-w-6xl">
          <AnimatedSection direction="up" delay={0.1}>
            <div className="text-center mb-16">
              <motion.div
                className="inline-block mb-3 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <span className="flex items-center gap-2">
                  <GiMedicalDrip className="text-lg" />
                  Powerful Features
                </span>
              </motion.div>
              <motion.h2
                className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                <AnimatedText
                  text="Advanced Healthcare Technology"
                  staggerChildren={0.01}
                />
              </motion.h2>
              <motion.p
                className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.3 }}
              >
                Radiance AI combines cutting-edge technology with medical expertise to provide accurate and reliable health insights.
              </motion.p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <AnimatedSection direction="left" delay={0.2}>
              <motion.div
                className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/30 group h-full"
                whileHover={{ y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <AnimatedIcon
                  icon={<GiMedicines size={28} className="text-primary" />}
                  className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:from-primary/30 group-hover:to-primary/20 transition-colors"
                  delay={0.3}
                  hoverScale={1.1}
                />
                <h3 className="text-xl font-semibold mb-3 text-foreground">AI-Powered Diagnosis</h3>
                <p className="text-muted-foreground mb-4">
                  Advanced symptom analysis using state-of-the-art AI models via Perplexity Sonar API for accurate preliminary diagnoses.
                </p>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <motion.li
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <FaCheckCircle size={10} />
                    </span>
                    <span>Natural language processing for symptom description</span>
                  </motion.li>
                  <motion.li
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <FaCheckCircle size={10} />
                    </span>
                    <span>Pattern recognition across medical databases</span>
                  </motion.li>
                  <motion.li
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.6 }}
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <FaCheckCircle size={10} />
                    </span>
                    <span>Continuous learning from new medical research</span>
                  </motion.li>
                </ul>
              </motion.div>
            </AnimatedSection>

            {/* Feature 2 */}
            <AnimatedSection direction="up" delay={0.4}>
              <motion.div
                className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-accent/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-accent/30 group h-full"
                whileHover={{ y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <AnimatedIcon
                  icon={<HiOutlineDocumentSearch size={28} className="text-accent" />}
                  className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/10 rounded-2xl flex items-center justify-center mb-6 group-hover:from-accent/30 group-hover:to-accent/20 transition-colors"
                  delay={0.5}
                  hoverScale={1.1}
                />
                <h3 className="text-xl font-semibold mb-3 text-foreground">Research-Backed</h3>
                <p className="text-muted-foreground mb-4">
                  Every diagnosis is supported by medical literature and includes proper ICD code tagging for professional reference.
                </p>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <motion.li
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.6 }}
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                      <FaCheckCircle size={10} />
                    </span>
                    <span>Citations from peer-reviewed medical journals</span>
                  </motion.li>
                  <motion.li
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.7 }}
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                      <FaCheckCircle size={10} />
                    </span>
                    <span>ICD-10 and ICD-11 code mapping</span>
                  </motion.li>
                  <motion.li
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.8 }}
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                      <FaCheckCircle size={10} />
                    </span>
                    <span>Evidence-based diagnostic suggestions</span>
                  </motion.li>
                </ul>
              </motion.div>
            </AnimatedSection>

            {/* Feature 3 */}
            <AnimatedSection direction="right" delay={0.6}>
              <motion.div
                className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/30 group h-full"
                whileHover={{ y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <AnimatedIcon
                  icon={<HiOutlineDocumentReport size={28} className="text-primary" />}
                  className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:from-primary/30 group-hover:to-primary/20 transition-colors"
                  delay={0.7}
                  hoverScale={1.1}
                />
                <h3 className="text-xl font-semibold mb-3 text-foreground">Explainable AI</h3>
                <p className="text-muted-foreground mb-4">
                  Transparent reasoning paths that clearly explain how diagnoses are determined, building trust through clarity.
                </p>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <motion.li
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.8 }}
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <FaCheckCircle size={10} />
                    </span>
                    <span>Step-by-step diagnostic reasoning</span>
                  </motion.li>
                  <motion.li
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.9 }}
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <FaCheckCircle size={10} />
                    </span>
                    <span>Confidence levels for each suggestion</span>
                  </motion.li>
                  <motion.li
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 1.0 }}
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <FaCheckCircle size={10} />
                    </span>
                    <span>Alternative diagnoses with explanations</span>
                  </motion.li>
                </ul>
              </motion.div>
            </AnimatedSection>
          </div>

          <AnimatedSection delay={0.8}>
            <div className="mt-16 text-center">
              <ProfessionalButton
                asChild
                variant="primary"
                size="lg"
                icon={<FaArrowRight />}
                iconPosition="right"
                className="w-full sm:w-auto max-w-xs sm:max-w-none mx-auto"
              >
                <Link href="/dashboard/diagnosis">
                  Experience the difference
                </Link>
              </ProfessionalButton>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-4 relative overflow-hidden bg-card/10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/5 to-background z-0"></div>



        <div className="container relative z-10 mx-auto max-w-6xl">
          <AnimatedSection direction="up" delay={0.1}>
            <div className="text-center mb-16">
              <motion.div
                className="inline-block mb-3 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <span className="flex items-center gap-2">
                  <MdHealthAndSafety className="text-lg" />
                  Simple Process
                </span>
              </motion.div>
              <motion.h2
                className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                <AnimatedText
                  text="How Radiance AI Works"
                  staggerChildren={0.01}
                />
              </motion.h2>
              <motion.p
                className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.3 }}
              >
                Get accurate health insights in just three simple steps
              </motion.p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 relative">
            {/* Step 1 */}
            <AnimatedSection direction="left" delay={0.2}>
              <div className="relative">
                <motion.div
                  className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/30 h-full"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary font-bold text-xl">
                    1
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">Describe Your Symptoms</h3>
                  <p className="text-muted-foreground">
                    Enter your symptoms in detail, along with relevant health information like age, gender, and medical history.
                  </p>
                </motion.div>

                {/* Arrow - only visible on desktop */}
                <div className="hidden md:block absolute top-1/2 -right-8 transform -translate-y-1/2 z-10">
                  <svg width="60" height="16" viewBox="0 0 60 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 8H58M58 8L50 1M58 8L50 15" stroke="url(#arrow-gradient-step1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <defs>
                      <linearGradient id="arrow-gradient-step1" x1="0" y1="8" x2="58" y2="8" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#00C6D7" stopOpacity="0.3"/>
                        <stop offset="1" stopColor="#1DE9B6" stopOpacity="0.6"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </AnimatedSection>

            {/* Step 2 */}
            <AnimatedSection direction="up" delay={0.4}>
              <div className="relative">
                <motion.div
                  className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-accent/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-accent/30 h-full"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-6 text-accent font-bold text-xl">
                    2
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">AI Analysis</h3>
                  <p className="text-muted-foreground">
                    Our advanced AI processes your information using medical knowledge bases and research to generate insights.
                  </p>
                </motion.div>

                {/* Arrow - only visible on desktop */}
                <div className="hidden md:block absolute top-1/2 -right-8 transform -translate-y-1/2 z-10">
                  <svg width="60" height="16" viewBox="0 0 60 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 8H58M58 8L50 1M58 8L50 15" stroke="url(#arrow-gradient-step2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <defs>
                      <linearGradient id="arrow-gradient-step2" x1="0" y1="8" x2="58" y2="8" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#00C6D7" stopOpacity="0.3"/>
                        <stop offset="1" stopColor="#1DE9B6" stopOpacity="0.6"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </AnimatedSection>

            {/* Step 3 */}
            <AnimatedSection direction="right" delay={0.6}>
              <motion.div
                className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/30 h-full"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary font-bold text-xl">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Receive Diagnosis</h3>
                <p className="text-muted-foreground">
                  Get a detailed diagnosis with explanations, potential causes, and recommended next steps for your health.
                </p>
              </motion.div>
            </AnimatedSection>
          </div>

          <AnimatedSection delay={0.8}>
            <div className="mt-16 text-center">
              <ProfessionalButton
                asChild
                variant="primary"
                size="lg"
                icon={<FaArrowRight />}
                iconPosition="right"
                className="w-full sm:w-auto max-w-xs sm:max-w-none mx-auto"
              >
                <Link href="/dashboard/diagnosis">
                  Start Your Diagnosis
                </Link>
              </ProfessionalButton>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/5 to-background z-0"></div>



        <div className="container relative z-10 mx-auto max-w-6xl">
          <AnimatedSection direction="up" delay={0.1}>
            <div className="text-center mb-16">
              <motion.div
                className="inline-block mb-3 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <span className="flex items-center gap-2">
                  <MdOutlineVerified className="text-lg" />
                  User Testimonials
                </span>
              </motion.div>
              <motion.h2
                className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                <AnimatedText
                  text="What Our Users Say"
                  staggerChildren={0.01}
                />
              </motion.h2>
              <motion.p
                className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.3 }}
              >
                Discover how Radiance AI is transforming healthcare experiences
              </motion.p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimatedSection direction="left" delay={0.2}>
              <TestimonialCard
                quote="Radiance AI helped me understand my symptoms when I couldn't get a doctor's appointment. The diagnosis was spot-on and saved me weeks of worry."
                author="Sarah Johnson"
                role="Healthcare Professional"
              />
            </AnimatedSection>

            <AnimatedSection direction="up" delay={0.4}>
              <TestimonialCard
                quote="As someone with chronic health issues, having Radiance AI has been invaluable. It helps me track patterns in my symptoms and provides insights I can share with my doctor."
                author="Michael Chen"
                role="Software Engineer"
                isAccent={true}
              />
            </AnimatedSection>

            <AnimatedSection direction="right" delay={0.6}>
              <TestimonialCard
                quote="The detailed explanations behind each diagnosis are incredibly helpful. It's like having a medical professional explain things in terms I can actually understand."
                author="Emily Rodriguez"
                role="Teacher"
              />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-background to-accent/5 z-0"></div>



        <div className="container relative z-10 mx-auto max-w-4xl">
          <AnimatedSection direction="up" delay={0.1}>
            <div className="text-center mb-16">
              <motion.div
                className="inline-block mb-3 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <span className="flex items-center gap-2">
                  <MdOutlineVerified className="text-lg" />
                  Common Questions
                </span>
              </motion.div>
              <motion.h2
                className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                <AnimatedText
                  text="Frequently Asked Questions"
                  staggerChildren={0.01}
                />
              </motion.h2>
            </div>
          </AnimatedSection>

          <div className="space-y-6">
            {/* FAQ Item 1 */}
            <AnimatedSection direction="up" delay={0.2}>
              <CollapsibleFAQ
                question="How accurate is Radiance AI's diagnosis?"
                answer="Radiance AI provides preliminary diagnoses with high accuracy based on the latest medical research and data. However, it's designed to complement, not replace, professional medical advice. Always consult with healthcare professionals for definitive diagnoses and treatment plans."
                icon={<MdOutlineVerified size={24} />}
                delay={0.1}
              />
            </AnimatedSection>

            {/* FAQ Item 2 */}
            <AnimatedSection direction="up" delay={0.3}>
              <CollapsibleFAQ
                question="Is my health information secure?"
                answer="Yes, we take your privacy seriously. All data is encrypted end-to-end, and we comply with HIPAA regulations. Your personal health information is never shared with third parties without your explicit consent, and you can delete your data at any time."
                icon={<FaShieldAlt size={24} />}
                iconClassName="bg-accent/10"
                delay={0.2}
                isAccent={true}
              />
            </AnimatedSection>

            {/* FAQ Item 3 */}
            <AnimatedSection direction="up" delay={0.4}>
              <CollapsibleFAQ
                question="Do I need to create an account to use Radiance AI?"
                answer="Yes, a free account is required to use our diagnosis services. This allows us to securely store your health information, provide personalized insights, and maintain a history of your diagnoses that you can reference or share with healthcare providers."
                icon={<GiHealthNormal size={24} />}
                delay={0.3}
              />
            </AnimatedSection>

            {/* FAQ Item 4 */}
            <AnimatedSection direction="up" delay={0.5}>
              <CollapsibleFAQ
                question="What should I do after receiving a diagnosis?"
                answer="After receiving your diagnosis, we recommend consulting with a healthcare professional, especially for serious or persistent symptoms. You can easily share your Radiance AI diagnosis report with your doctor to provide additional context for your consultation."
                icon={<HiOutlineDocumentReport size={24} />}
                iconClassName="bg-accent/10"
                delay={0.4}
                isAccent={true}
              />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 relative overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="absolute inset-0 bg-card/5 z-0"></div>

        {/* Animated decorative elements */}
        <FloatingElement
          className="absolute top-20 left-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl opacity-40"
          duration={10}
          xOffset={15}
          yOffset={20}
        />
        <FloatingElement
          className="absolute bottom-20 right-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl opacity-40"
          duration={12}
          xOffset={-15}
          yOffset={-20}
          delay={0.5}
        />

        <div className="container relative z-10 mx-auto max-w-5xl">
          <div className="bg-card/80 backdrop-blur-sm p-12 rounded-3xl border border-primary/10 shadow-xl">
            <AnimatedSection direction="up" delay={0.1}>
              <div className="text-center mb-8">
                <motion.h2
                  className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7 }}
                >
                  <AnimatedText
                    text="Ready to Experience the Future of Healthcare?"
                    staggerChildren={0.01}
                  />
                </motion.h2>
                <motion.p
                  className="text-lg text-muted-foreground max-w-2xl mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                >
                  Join thousands of users who trust Radiance AI for accurate, research-backed health insights.
                </motion.p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center max-w-md sm:max-w-none mx-auto">
                <ProfessionalButton
                  asChild
                  variant="primary"
                  size="lg"
                  icon={<FaArrowRight />}
                  iconPosition="right"
                  className="w-full"
                >
                  <Link href="/auth/signup">
                    Create Free Account
                  </Link>
                </ProfessionalButton>
                <ProfessionalButton
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  <Link href="/dashboard/diagnosis">
                    Try Diagnosis
                  </Link>
                </ProfessionalButton>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.5}>
              <div className="mt-12 pt-8 border-t border-border/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <motion.div
                    className="flex items-center gap-4"
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AnimatedIcon
                      icon={<FaHeartbeat size={24} className="text-primary" />}
                      className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center"
                      delay={0.6}
                      pulseEffect={true}
                    />
                    <div>
                      <h3 className="font-medium">Personalized Care</h3>
                      <p className="text-sm text-muted-foreground">Tailored to your unique health profile</p>
                    </div>
                  </motion.div>

                  <motion.div
                    className="flex items-center gap-4"
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AnimatedIcon
                      icon={<MdOutlinePrivacyTip size={24} className="text-accent" />}
                      className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center"
                      delay={0.7}
                      pulseEffect={true}
                    />
                    <div>
                      <h3 className="font-medium">Privacy Focused</h3>
                      <p className="text-sm text-muted-foreground">Your data is secure and private</p>
                    </div>
                  </motion.div>

                  <motion.div
                    className="flex items-center gap-4"
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AnimatedIcon
                      icon={<GiMedicalDrip size={24} className="text-primary" />}
                      className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center"
                      delay={0.8}
                      pulseEffect={true}
                    />
                    <div>
                      <h3 className="font-medium">Medical Expertise</h3>
                      <p className="text-sm text-muted-foreground">Backed by latest research</p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </main>
  );
}