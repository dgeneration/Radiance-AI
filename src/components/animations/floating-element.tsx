"use client";

import { ReactNode, useRef, useState, useEffect } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";

interface FloatingElementProps {
  children?: ReactNode;
  className?: string;
  duration?: number;
  xOffset?: number;
  yOffset?: number;
  delay?: number;
}

export function FloatingElement({
  children,
  className = "",
  duration = 4,
  xOffset = 10,
  yOffset = 10,
  delay = 0,
}: FloatingElementProps) {
  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("down");
  const { scrollY } = useScroll();
  const [prevScrollY, setPrevScrollY] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  // Track scroll direction
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > prevScrollY) {
      setScrollDirection("down");
    } else if (latest < prevScrollY) {
      setScrollDirection("up");
    }
    setPrevScrollY(latest);
  });

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

  // Adjust animation based on scroll direction
  const adjustedXOffset = scrollDirection === "up" ? -xOffset : xOffset;
  const adjustedYOffset = scrollDirection === "up" ? -yOffset : yOffset;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0 }}
      animate={inView ? {
        opacity: 1,
        y: [0, adjustedYOffset, 0],
        x: [0, adjustedXOffset, 0],
        scale: [1, 1.02, 1],
        filter: ["blur(0px)", "blur(0.5px)", "blur(0px)"],
      } : { opacity: 0 }}
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
