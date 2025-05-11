"use client";

import { ReactNode, useRef, useState, useEffect } from "react";
import { motion, Variants, useScroll, useMotionValueEvent } from "framer-motion";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  threshold?: number;
}

export function AnimatedSection({
  children,
  className = "",
  delay = 0,
  direction = "up",
  threshold = 0.1,
}: AnimatedSectionProps) {
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
    const distance = 50;

    // Determine animation based on scroll direction and configured animation direction
    const animationDirection = scrollDirection === "up" ?
      (direction === "up" ? "down" :
       direction === "down" ? "up" :
       direction === "left" ? "right" : "left") :
      direction;

    switch (animationDirection) {
      case "down":
        return {
          hidden: { y: -distance, opacity: 0, scale: 0.95 },
          visible: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: {
              type: "spring",
              stiffness: 260,
              damping: 20,
            }
          },
        };
      case "left":
        return {
          hidden: { x: distance, opacity: 0, scale: 0.95 },
          visible: {
            x: 0,
            opacity: 1,
            scale: 1,
            transition: {
              type: "spring",
              stiffness: 260,
              damping: 20,
            }
          },
        };
      case "right":
        return {
          hidden: { x: -distance, opacity: 0, scale: 0.95 },
          visible: {
            x: 0,
            opacity: 1,
            scale: 1,
            transition: {
              type: "spring",
              stiffness: 260,
              damping: 20,
            }
          },
        };
      case "up":
      default:
        return {
          hidden: { y: distance, opacity: 0, scale: 0.95 },
          visible: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: {
              type: "spring",
              stiffness: 260,
              damping: 20,
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
      animate={inView ? "visible" : "hidden"}
      variants={variants}
      transition={{ delay: inView ? delay : 0 }}
    >
      {children}
    </motion.div>
  );
}
