"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnimatedText } from "@/components/animations";
import type { JSX } from "react";

interface GradientHeadingProps {
  children: React.ReactNode;
  className?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  animate?: boolean;
  staggerChildren?: number;
  delay?: number;
  textShadow?: boolean;
  fromColor?: string;
  toColor?: string;
}

export function GradientHeading({
  children,
  className,
  level = 2,
  size = "lg",
  animate = true,
  staggerChildren = 0.01,
  delay = 0,
  textShadow = true,
  fromColor = "from-primary",
  toColor = "to-accent",
}: GradientHeadingProps) {
  // Define size classes
  const sizeClasses = {
    sm: "text-xl md:text-2xl",
    md: "text-2xl md:text-3xl",
    lg: "text-3xl md:text-5xl",
    xl: "text-4xl md:text-6xl",
    "2xl": "text-5xl md:text-7xl",
  };

  // Combine classes
  const headingClasses = cn(
    "font-bold bg-gradient-to-r bg-clip-text text-transparent",
    fromColor,
    toColor,
    sizeClasses[size],
    textShadow ? "text-shadow" : "",
    className
  );

  // Create the heading element based on the level
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;

  // If animation is enabled, wrap the content in AnimatedText
  if (animate && typeof children === "string") {
    return (
      <HeadingTag className={headingClasses}>
        <AnimatedText
          text={children}
          staggerChildren={staggerChildren}
          delay={delay}
        />
      </HeadingTag>
    );
  }

  // For non-animated or non-string children
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay }}
    >
      <HeadingTag className={headingClasses}>{children}</HeadingTag>
    </motion.div>
  );
}
