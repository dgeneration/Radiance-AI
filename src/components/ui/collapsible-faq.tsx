"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown } from "react-icons/fa";
import { AnimatedIcon } from "@/components/animations";

interface CollapsibleFAQProps {
  question: string;
  answer: string;
  icon: React.ReactNode;
  delay?: number;
  isAccent?: boolean;
}

export function CollapsibleFAQ({
  question,
  answer,
  icon,
  delay = 0,
  isAccent = false
}: CollapsibleFAQProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <motion.div
      className={`bg-card/80 backdrop-blur-sm p-8 rounded-2xl border ${isAccent ? 'border-accent/10 hover:border-accent/30' : 'border-primary/10 hover:border-primary/30'} shadow-lg hover:shadow-xl transition-all duration-300 group`}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="flex items-start gap-4 cursor-pointer"
        onClick={toggleOpen}
      >
        <AnimatedIcon
          icon={icon}
          className={`w-10 h-10 ${isAccent ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'} rounded-full flex items-center justify-center flex-shrink-0 mt-1`}
          delay={delay}
          hoverScale={1.1}
        />
        <div className="flex-1 mt-[10px]">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-foreground">{question}</h3>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className={`${isAccent ? 'text-accent' : 'text-primary'} ml-2`}
            >
              <FaChevronDown />
            </motion.div>
          </div>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <p className="text-muted-foreground mt-4">
                  {answer}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
