"use client";

import { useState, useEffect, useRef } from "react";
import { FaGlobe, FaChevronDown } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation, languages } from "@/contexts/translation-context";

export default function CustomLanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage, selectedLanguage } = useTranslation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Function to change language
  const changeLanguage = (lang: typeof languages[0]) => {
    // Only change if it's a different language
    if (language !== lang.code) {
      setLanguage(lang.code);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Language selector button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 text-muted-foreground hover:text-foreground hover:bg-accent/10"
        aria-label="Select language"
      >
        <FaGlobe className="text-primary" />
        <span className="hidden md:inline">{selectedLanguage.flag} {selectedLanguage.name}</span>
        <span className="md:hidden">{selectedLanguage.flag}</span>
        <FaChevronDown
          className={`h-3 w-3 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-background border border-primary/10 backdrop-blur-md z-50"
          >
            <div className="py-1 max-h-80 overflow-y-auto">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-primary/10 flex items-center gap-2 ${
                    language === lang.code
                      ? "bg-primary/5 text-primary"
                      : "text-foreground"
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
