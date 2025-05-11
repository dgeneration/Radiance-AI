"use client";

import { ReactNode, useRef, useState, useEffect } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";

interface AnimatedIconProps {
  icon: ReactNode;
  className?: string;
  containerClassName?: string;
  delay?: number;
  hoverScale?: number;
  pulseEffect?: boolean;
}

export function AnimatedIcon({
  icon,
  className = "",
  containerClassName = "",
  delay = 0,
  hoverScale = 1.1,
  pulseEffect = false,
}: AnimatedIconProps) {
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
      { threshold: 0.2 }
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

  // Define variants based on scroll direction
  const iconVariants = {
    visible: {
      scale: 1,
      opacity: 1,
      rotate: 0,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: inView ? delay : 0
      }
    },
    hidden: {
      scale: 0,
      opacity: 0,
      rotate: scrollDirection === "up" ? -90 : 90,
      y: scrollDirection === "up" ? -20 : 20,
      filter: "blur(2px)",
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  };

  return (
    <motion.div
      ref={ref}
      className={`relative ${containerClassName}`}
      variants={iconVariants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      whileHover={{ scale: hoverScale }}
    >
      {pulseEffect && (
        <>
          <motion.div
            className="absolute inset-0 bg-primary/10 rounded-full"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.7, 0.2, 0.7],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute inset-0 bg-accent/10 rounded-full"
            animate={{
              scale: [1.1, 1.5, 1.1],
              opacity: [0.5, 0.1, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut",
              delay: 0.5,
            }}
          />
        </>
      )}
      <div className={className}>
        {icon}
      </div>
    </motion.div>
  );
}
