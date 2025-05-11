"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialRenderRef = useRef(true);

  // Reset progress and start loading animation when route changes
  useEffect(() => {
    // Skip the effect on initial render to prevent unnecessary loading state
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }

    // Clean up function to clear all timers
    const cleanup = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };

    // Clean up existing timers
    cleanup();

    // Start loading
    setIsLoading(true);
    setProgress(0);

    // Simulate progress
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        // Gradually increase progress, slowing down as it approaches 90%
        const increment = Math.max(0.5, (100 - prev) / 20);
        const newProgress = Math.min(90, prev + increment);
        return newProgress;
      });
    }, 100);

    // Complete loading after a short delay
    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      setProgress(100);

      // Hide the progress bar after completion
      hideTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 500);

    }, 800); // Adjust this time based on your app's typical loading time

    return cleanup;
  }, [pathname, searchParams]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-50 h-1 bg-primary/20"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeInOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
