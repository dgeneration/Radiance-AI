"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";

interface AnimatedTextProps {
  text: string | React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  staggerChildren?: number;
}

export function AnimatedText({
  text,
  className = "",
  delay = 0,
  duration = 0.05,
  staggerChildren = 0.02,
}: AnimatedTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
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

  // Handle both string and React element cases
  const isReactElement = typeof text !== 'string';

  // If it's a React element, just render it directly
  if (isReactElement) {
    return (
      <motion.span
        ref={ref}
        className={`inline-block ${className}`}
        initial={{ opacity: 0, y: scrollDirection === "up" ? -20 : 20 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: scrollDirection === "up" ? -20 : 20 }}
        transition={{
          type: "spring",
          damping: 12,
          stiffness: 200,
          delay,
          duration,
        }}
      >
        {text}
      </motion.span>
    );
  }

  // For strings, split the text into words and then letters
  const words = (text as string).split(" ");

  // Variants for the container
  const container = {
    hidden: { opacity: 0 },
    visible: () => ({
      opacity: 1,
      transition: {
        staggerChildren,
        delayChildren: delay,
      },
    }),
  };

  // Variants for each letter based on scroll direction
  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 200,
        duration,
      },
    },
    hidden: {
      opacity: 0,
      y: scrollDirection === "up" ? -20 : 20,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 200,
        duration,
      },
    },
  };

  return (
    <motion.span
      ref={ref}
      className={`inline-block ${className}`}
      variants={container}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
    >
      {words.map((word, wordIndex) => (
        <motion.span key={`word-${wordIndex}`} className="inline-block whitespace-nowrap" style={{ marginRight: '0.25em' }}>
          {Array.from(word).map((letter, letterIndex) => (
            <motion.span
              key={`letter-${wordIndex}-${letterIndex}`}
              variants={child}
              className="inline-block"
            >
              {letter}
            </motion.span>
          ))}
        </motion.span>
      ))}
    </motion.span>
  );
}
