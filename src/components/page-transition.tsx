"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useRef } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const isFirstRenderRef = useRef(true);
  const hasAnimatedRef = useRef(false);

  // Skip animation on first render
  useEffect(() => {
    if (!hasAnimatedRef.current) {
      // Mark as animated immediately to prevent flashing
      hasAnimatedRef.current = true;

      // Use a short timeout to ensure this happens after initial render
      const timeout = setTimeout(() => {
        isFirstRenderRef.current = false;
      }, 300); // Increased timeout to ensure components have time to render

      return () => clearTimeout(timeout);
    }
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={isFirstRenderRef.current ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          duration: 0.3,
        }}
        className="min-h-[calc(100vh-140px)]" // Account for header and footer
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
