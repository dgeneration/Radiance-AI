"use client";

import { ReactNode, useRef, useState, useEffect } from "react";
import { motion, Variants, useScroll, useMotionValueEvent } from "framer-motion";

interface AnimatedDashboardSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  once?: boolean;
  threshold?: number;
}

export function AnimatedDashboardSection({
  children,
  className = "",
  delay = 0,
  direction = "up",
  once = true, // Default to true for dashboard pages to avoid re-animation on every scroll
  threshold = 0.1,
}: AnimatedDashboardSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("down");
  const { scrollY } = useScroll();
  const [prevScrollY, setPrevScrollY] = useState(0);

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
      { threshold }
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
  }, [threshold]);

  const getDirectionVariants = (): Variants => {
    const distance = 30; // Smaller distance for dashboard pages

    // Determine animation based on scroll direction and configured animation direction
    const animationDirection = scrollDirection === "up" && !once ?
      (direction === "up" ? "down" :
       direction === "down" ? "up" :
       direction === "left" ? "right" : "left") :
      direction;

    switch (animationDirection) {
      case "down":
        return {
          hidden: { y: -distance, opacity: 0, scale: 0.98 },
          visible: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 25,
            }
          },
        };
      case "left":
        return {
          hidden: { x: distance, opacity: 0, scale: 0.98 },
          visible: {
            x: 0,
            opacity: 1,
            scale: 1,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 25,
            }
          },
        };
      case "right":
        return {
          hidden: { x: -distance, opacity: 0, scale: 0.98 },
          visible: {
            x: 0,
            opacity: 1,
            scale: 1,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 25,
            }
          },
        };
      case "up":
      default:
        return {
          hidden: { y: distance, opacity: 0, scale: 0.98 },
          visible: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 25,
            }
          },
        };
    }
  };

  const variants = getDirectionVariants();

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView || once ? "visible" : "hidden"}
      variants={variants}
      transition={{ delay: inView ? delay : 0 }}
    >
      {children}
    </motion.div>
  );
}
