"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Tag, AlertCircle, CheckCircle2 } from "lucide-react";

interface HealthInfoAccordionProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  content: string | null;
  delay?: number;
}

export function HealthInfoAccordion({
  title,
  subtitle,
  icon,
  content
}: HealthInfoAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl shadow-md overflow-hidden">
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-primary/5 transition-colors"
        onClick={toggleOpen}
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium bg-gradient-to-r from-primary/90 to-accent/90 bg-clip-text text-transparent">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-primary/70"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </motion.div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-card/30 border-t border-primary/10">
              <p className="text-muted-foreground whitespace-pre-line">
                {content || `No ${title.toLowerCase()} provided.`}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function HealthHistoryAccordion({ content, delay }: { content: string | null, delay?: number }) {
  return (
    <HealthInfoAccordion
      title="Health History"
      subtitle="Past medical events and surgeries"
      icon={<Calendar className="h-5 w-5 text-primary" />}
      content={content}
      delay={delay}
    />
  );
}

export function MedicalConditionsAccordion({ content, delay }: { content: string | null, delay?: number }) {
  return (
    <HealthInfoAccordion
      title="Current Medical Conditions"
      subtitle="Ongoing health conditions and diagnoses"
      icon={<Tag className="h-5 w-5 text-primary" />}
      content={content}
      delay={delay}
    />
  );
}

export function AllergiesAccordion({ content, delay }: { content: string | null, delay?: number }) {
  return (
    <HealthInfoAccordion
      title="Allergies"
      subtitle="Known allergic reactions to medications, foods, or substances"
      icon={<AlertCircle className="h-5 w-5 text-primary" />}
      content={content}
      delay={delay}
    />
  );
}

export function MedicationsAccordion({ content, delay }: { content: string | null, delay?: number }) {
  return (
    <HealthInfoAccordion
      title="Current Medications"
      subtitle="Prescription medications, supplements, and over-the-counter drugs"
      icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
      content={content}
      delay={delay}
    />
  );
}
