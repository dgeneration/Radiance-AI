"use client";

import * as React from "react";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

export function PasswordInput({
  className,
  containerClassName,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [hasInitialPulse, setHasInitialPulse] = useState(false);

  // Add initial pulse effect after a short delay
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setHasInitialPulse(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={cn("relative", containerClassName)}>
      <Input
        type={showPassword ? "text" : "password"}
        className={cn("pr-10", className)}
        {...props}
      />
      <motion.button
        type="button"
        onClick={togglePasswordVisibility}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
        aria-label={showPassword ? "Hide password" : "Show password"}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        animate={hasInitialPulse ? {
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7]
        } : {}}
        transition={{
          duration: 0.2,
          scale: { duration: 0.8, repeat: hasInitialPulse ? 2 : 0, repeatType: "reverse" },
          opacity: { duration: 0.8, repeat: hasInitialPulse ? 2 : 0, repeatType: "reverse" }
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {showPassword ? (
            <motion.div
              key="hide"
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="flex items-center justify-center"
            >
              <EyeOff className="h-4 w-4" />
            </motion.div>
          ) : (
            <motion.div
              key="show"
              initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="flex items-center justify-center"
            >
              <Eye className="h-4 w-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
