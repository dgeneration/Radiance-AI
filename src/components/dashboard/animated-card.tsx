"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  hoverEffect?: boolean;
  hoverScale?: number;
  hoverY?: number;
}

export function AnimatedCard({
  children,
  className = "",
  delay = 0,
  hoverEffect = true,
  hoverScale = 1.02,
  hoverY = -5,
}: AnimatedCardProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        delay,
      }}
      whileHover={
        hoverEffect
          ? {
              y: hoverY,
              scale: hoverScale,
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
              borderColor: "rgba(0, 198, 215, 0.2)",
              transition: {
                duration: 0.3,
              }
            }
          : undefined
      }
    >
      {children}
    </motion.div>
  );
}
