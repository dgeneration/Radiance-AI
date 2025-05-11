"use client";

import { motion } from "framer-motion";
import { GradientHeading } from "@/components/ui/gradient-heading";
import { FloatingElement } from "@/components/animations";

interface SubNavbarProps {
  title: string;
}

export function SubNavbar({ title }: SubNavbarProps) {
  return (
    <div className="relative overflow-hidden border-b border-primary/10 py-8 bg-card/5 select-none">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 z-0"></div>

      {/* Decorative elements */}
      <FloatingElement
        className="absolute -top-20 left-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl opacity-30"
        duration={10}
        xOffset={15}
        yOffset={20}
      />
      <FloatingElement
        className="absolute -bottom-40 right-20 w-60 h-60 bg-accent/10 rounded-full blur-3xl opacity-30"
        duration={12}
        xOffset={-15}
        yOffset={-20}
        delay={0.5}
      />

      <div className="container relative z-10 mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <GradientHeading level={1} size="lg" className="text-center md:text-left">
              {title}
            </GradientHeading>
          </motion.div>

          <motion.div
            className="flex flex-wrap justify-center md:justify-end items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* No buttons in sub-navbar anymore - moved to profile dropdown */}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
