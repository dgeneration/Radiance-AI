"use client";

import { useState, useEffect, useRef } from "react";
import { FaGlobe, FaChevronDown } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

// Language options with flags
const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "zh-CN", name: "中文", flag: "🇨🇳" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "nl", name: "Nederlands", flag: "🇳🇱" },
  { code: "sv", name: "Svenska", flag: "🇸🇪" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
];

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);

  // Detect current language from Google Translate
  useEffect(() => {
    // Function to detect the current language
    const detectCurrentLanguage = () => {
      // Check if Google Translate cookie exists
      const cookies = document.cookie.split(';');
      let googleTranslateCookie = '';

      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith('googtrans=')) {
          googleTranslateCookie = cookie.substring(10);
          break;
        }
      }

      if (googleTranslateCookie) {
        // Extract language code from cookie (format: /en/fr)
        const langCode = googleTranslateCookie.split('/')[2];

        // Find matching language in our list
        const matchedLanguage = languages.find(lang => lang.code === langCode);
        if (matchedLanguage) {
          setSelectedLanguage(matchedLanguage);
        }
      }
    };

    // Check when the component mounts
    detectCurrentLanguage();

    // Also check when the translation-ready class is added to the body
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          if (document.body.classList.contains('translation-ready')) {
            detectCurrentLanguage();
          }
        }
      });
    });

    observer.observe(document.body, { attributes: true });

    return () => {
      observer.disconnect();
    };
  }, []);
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

  // Function to change language using Google Translate
  const changeLanguage = (language: typeof languages[0]) => {
    setSelectedLanguage(language);
    setIsOpen(false);

    // Get the Google Translate element
    const googleTranslateElement = document.querySelector("#google_translate_element");

    if (googleTranslateElement) {
      // Find the Google Translate select element
      const selectElement = googleTranslateElement.querySelector(
        ".goog-te-combo"
      ) as HTMLSelectElement;

      if (selectElement) {
        // Change the value and trigger the change event
        selectElement.value = language.code;
        selectElement.dispatchEvent(new Event("change"));
      } else {
        // If the select element doesn't exist yet, try using the iframe approach
        const iframe = document.querySelector(".goog-te-menu-frame") as HTMLIFrameElement;
        if (iframe) {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            // Find all table cells in the iframe
            const cells = iframeDoc.querySelectorAll("td");
            // Find the cell with the matching language
            for (let i = 0; i < cells.length; i++) {
              if (cells[i].textContent?.includes(language.name)) {
                cells[i].click();
                break;
              }
            }
          }
        } else {
          // If all else fails, try using the Google Translate API directly
          if (window.google && window.google.translate) {
            // Try to find the translation element and trigger a click
            const translateElements = document.querySelectorAll(".goog-te-gadget-simple");
            if (translateElements.length > 0) {
              (translateElements[0] as HTMLElement).click();

              // Wait for the menu to appear
              setTimeout(() => {
                const menuFrame = document.querySelector(".goog-te-menu-frame") as HTMLIFrameElement;
                if (menuFrame) {
                  const menuDoc = menuFrame.contentDocument || menuFrame.contentWindow?.document;
                  if (menuDoc) {
                    const menuItems = menuDoc.querySelectorAll(".goog-te-menu2-item");
                    for (let i = 0; i < menuItems.length; i++) {
                      if (menuItems[i].textContent?.includes(language.name)) {
                        (menuItems[i] as HTMLElement).click();
                        break;
                      }
                    }
                  }
                }
              }, 300);
            }
          }
        }
      }
    }
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
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => changeLanguage(language)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-primary/10 flex items-center gap-2 ${
                    selectedLanguage.code === language.code
                      ? "bg-primary/5 text-primary"
                      : "text-foreground"
                  }`}
                >
                  <span className="text-lg">{language.flag}</span>
                  <span>{language.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
