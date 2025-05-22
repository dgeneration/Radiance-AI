"use client";

import React from "react";
import { motion } from "framer-motion";
import { Stethoscope } from "lucide-react";

interface DisclaimerSectionProps {
  title: string;
  description: string;
}

export function DisclaimerSection({ title, description }: DisclaimerSectionProps) {
  return (
    <motion.div
      className="p-5 bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Stethoscope className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h4 className="font-medium text-primary mb-1">{title}</h4>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
