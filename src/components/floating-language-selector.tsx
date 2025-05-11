"use client";

import { useState, useEffect, useRef } from "react";
import { FaGlobe, FaChevronUp } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation, languages } from "@/contexts/translation-context";
import Flag from "react-world-flags";

// Map language codes to ISO country codes for flags
const languageToCountry: Record<string, string> = {
  "en": "US",
  "es": "ES",
  "fr": "FR",
  "de": "DE",
  "it": "IT",
  "pt": "PT",
  "ru": "RU",
  "ja": "JP",
  "zh-CN": "CN",
  "ar": "SA",
  "hi": "IN",
  "ko": "KR",
  "nl": "NL",
  "sv": "SE",
  "tr": "TR",
};

export default function FloatingLanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { language, selectedLanguage } = useTranslation();
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
      // Store the new language in localStorage
      localStorage.setItem('preferredLanguage', lang.code);

      // Force reload the page
      window.location.reload();
    }
    setIsOpen(false);
  };

  // Get country code for the flag
  const getCountryCode = (langCode: string) => {
    return languageToCountry[langCode] || "US";
  };

  return (
    <div className="fixed bottom-4 left-4 z-50" ref={dropdownRef}>
      {/* Language selector button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors duration-200 bg-background border border-primary/20 shadow-md hover:shadow-lg hover:border-primary/40 text-foreground"
        aria-label="Select language"
      >
        <FaGlobe className="text-primary" />
        <span className="hidden md:inline">
          <Flag
            code={getCountryCode(selectedLanguage.code)}
            className="w-4 h-3 mr-2 inline-block"
          />
          <span className={selectedLanguage.className}>{selectedLanguage.name}</span>
        </span>
        <span className="md:hidden">
          <Flag
            code={getCountryCode(selectedLanguage.code)}
            className="w-4 h-3"
          />
        </span>
        <FaChevronUp
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
            className="absolute bottom-full left-0 mb-2 w-48 rounded-md shadow-lg bg-background border border-primary/10 backdrop-blur-md"
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
                  <Flag
                    code={getCountryCode(lang.code)}
                    className="w-5 h-4"
                  />
                  <span className={lang.className}>{lang.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
