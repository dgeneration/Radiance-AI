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
  as?: string; // Add support for the 'as' prop
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
  as,
  size = "lg",
  animate = false, // Default to false to prevent animation delay
  staggerChildren = 0.005, // Faster stagger for quicker animation
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

  // Create the heading element based on the level or 'as' prop
  const HeadingTag = (as || `h${level}`) as keyof JSX.IntrinsicElements;

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
      initial={{ opacity: 0, y: 10 }} // Reduced distance
      animate={{ opacity: 1, y: 0 }} // Use animate instead of whileInView for immediate display
      transition={{ duration: 0.3, delay }} // Faster animation
    >
      <HeadingTag className={headingClasses}>{children}</HeadingTag>
    </motion.div>
  );
}
