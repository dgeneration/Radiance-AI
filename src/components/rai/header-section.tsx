"use client";

import React from "react";
import { motion } from "framer-motion";
import { GradientHeading } from "@/components/ui/gradient-heading";
import { AnimatedIcon, FloatingElement } from "@/components/animations";
import { Brain } from "lucide-react";

interface HeaderSectionProps {
  title: string;
  description: string;
}

export function HeaderSection({ title, description }: HeaderSectionProps) {
  return (
    <motion.div
      className="relative overflow-hidden bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 shadow-lg"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <FloatingElement
        className="absolute top-0 right-0 w-60 h-60 bg-primary/10 rounded-full blur-3xl opacity-30"
        duration={10}
        xOffset={15}
        yOffset={20}
      />
      <FloatingElement
        className="absolute bottom-0 left-0 w-60 h-60 bg-accent/10 rounded-full blur-3xl opacity-30"
        duration={12}
        xOffset={-15}
        yOffset={-20}
        delay={0.5}
      />

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shadow-lg">
            <AnimatedIcon
              icon={<Brain className="w-10 h-10 text-primary" />}
              delay={0.2}
              pulseEffect={true}
            />
          </div>

          <div className="flex-1 text-center md:text-left">
            <GradientHeading level={2} size="md" className="mb-2">
              {title}
            </GradientHeading>
            <p className="text-muted-foreground mb-6 max-w-2xl">
              {description}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
