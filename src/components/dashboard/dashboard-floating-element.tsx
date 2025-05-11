"use client";

import { ReactNode, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

interface DashboardFloatingElementProps {
  children?: ReactNode;
  className?: string;
  duration?: number;
  xOffset?: number;
  yOffset?: number;
  delay?: number;
  opacity?: number;
}

export function DashboardFloatingElement({
  children,
  className = "",
  duration = 6,
  xOffset = 5,
  yOffset = 5,
  delay = 0,
  opacity = 1,
}: DashboardFloatingElementProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  // Set up intersection observer to track when element is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, filter: "blur(0px)" }}
      animate={inView ? {
        opacity,
        y: [0, yOffset, 0],
        x: [0, xOffset, 0],
        scale: [1, 1.01, 1],
        filter: ["blur(0px)", "blur(0.3px)", "blur(0px)"],
      } : {
        opacity: 0,
        filter: "blur(0px)" // Ensure we have a valid initial value
      }}
      transition={{
        opacity: { duration: 0.5 },
        scale: {
          duration: duration * 1.2,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
          delay: delay + 0.2,
        },
        filter: {
          duration: duration * 1.5,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
          delay: delay + 0.5,
        },
        y: {
          duration,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
          delay,
        },
        x: {
          duration,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
          delay,
        }
      }}
    >
      {children}
    </motion.div>
  );
}
