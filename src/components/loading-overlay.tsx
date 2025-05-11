"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";

interface LoadingOverlayProps {
  isLoading?: boolean;
  delay?: number; // Delay in ms before showing the loader
  minDisplayTime?: number; // Minimum time to display the loader once shown
}

export function LoadingOverlay({
  isLoading = false,
  delay = 300,
  minDisplayTime = 500,
}: LoadingOverlayProps) {
  const [shouldShow, setShouldShow] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const displayStartTimeRef = useRef<number | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clean up function to clear all timers
    const cleanup = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };

    // Handle showing the loader
    if (isLoading && !shouldShow) {
      cleanup(); // Clear any existing timers

      timerRef.current = setTimeout(() => {
        setShouldShow(true);
        displayStartTimeRef.current = Date.now();
      }, delay);
    }
    // Handle hiding the loader
    else if (!isLoading && shouldShow) {
      cleanup(); // Clear any existing timers

      const displayTime = displayStartTimeRef.current
        ? Date.now() - displayStartTimeRef.current
        : 0;

      if (displayTime < minDisplayTime) {
        const remainingTime = minDisplayTime - displayTime;
        hideTimerRef.current = setTimeout(() => {
          setShouldShow(false);
          displayStartTimeRef.current = null;
        }, remainingTime);
      } else {
        setShouldShow(false);
        displayStartTimeRef.current = null;
      }
    }

    return cleanup;
  }, [isLoading, shouldShow, delay, minDisplayTime]);

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-primary/20"></div>
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear",
                }}
              ></motion.div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Loading
              </h3>
              <p className="text-sm text-muted-foreground">
                Please wait while we prepare your experience...
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
