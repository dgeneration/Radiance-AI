"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { setCurrentLanguage, getCurrentLanguage } from '@/lib/translation-service';

// Language options with flags
// These names should not be translated, so we add a className property
export const languages = [
  { code: "en", name: "English", flag: "🇺🇸", className: "translate-none" },
  { code: "es", name: "Español", flag: "🇪🇸", className: "translate-none" },
  { code: "fr", name: "Français", flag: "🇫🇷", className: "translate-none" },
  { code: "de", name: "Deutsch", flag: "🇩🇪", className: "translate-none" },
  { code: "it", name: "Italiano", flag: "🇮🇹", className: "translate-none" },
  { code: "pt", name: "Português", flag: "🇵🇹", className: "translate-none" },
  { code: "ru", name: "Русский", flag: "🇷🇺", className: "translate-none" },
  { code: "ja", name: "日本語", flag: "🇯🇵", className: "translate-none" },
  { code: "zh-CN", name: "中文", flag: "🇨🇳", className: "translate-none" },
  { code: "ar", name: "العربية", flag: "🇸🇦", className: "translate-none" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳", className: "translate-none" },
  { code: "ko", name: "한국어", flag: "🇰🇷", className: "translate-none" },
  { code: "nl", name: "Nederlands", flag: "🇳🇱", className: "translate-none" },
  { code: "sv", name: "Svenska", flag: "🇸🇪", className: "translate-none" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷", className: "translate-none" },
];

interface TranslationContextType {
  language: string;
  setLanguage: (lang: string) => void;
  translate: (text: string) => string;
  translateAsync: (text: string) => Promise<string>;
  selectedLanguage: typeof languages[0];
}

const TranslationContext = createContext<TranslationContextType>({
  language: 'en',
  setLanguage: () => {},
  translate: (text) => text,
  translateAsync: async (text) => text,
  selectedLanguage: languages[0],
});

export const useTranslation = () => useContext(TranslationContext);

interface TranslationProviderProps {
  children: ReactNode;
}

export function TranslationProvider({ children }: TranslationProviderProps) {
  const [language, setLanguageState] = useState<string>('en');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);

  // Define setLanguage with useCallback to avoid dependency issues
  const setLanguage = useCallback((lang: string) => {
    // Skip if it's the same language or not on client side
    if (lang === language || typeof window === 'undefined') return;

    // Store the language in localStorage
    localStorage.setItem('preferredLanguage', lang);

    // Update state
    setLanguageState(lang);
    setCurrentLanguage(lang);

    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'fixed top-0 left-0 w-full h-1 bg-primary/20 z-50';
    loadingIndicator.innerHTML = '<div class="h-full w-1/3 bg-primary animate-pulse"></div>';
    document.body.appendChild(loadingIndicator);

    // We'll let the FloatingLanguageSelector handle the page reload
    // This function will still be useful for programmatic language changes

    // Remove loading indicator after translation is complete (or after timeout)
    setTimeout(() => {
      if (document.body.contains(loadingIndicator)) {
        document.body.removeChild(loadingIndicator);
      }
    }, 3000);
  }, [language]);

  // Initialize language from localStorage or browser preference
  useEffect(() => {
    const storedLang = getCurrentLanguage();
    if (storedLang && storedLang !== 'en') {
      setLanguage(storedLang);
    } else {
      // Try to detect browser language
      const browserLang = navigator.language.split('-')[0];
      const supportedLang = languages.find(lang => lang.code === browserLang);
      if (supportedLang && browserLang !== 'en') {
        setLanguage(browserLang);
      }
    }
  }, [setLanguage]);

  // Update selected language object when language changes
  useEffect(() => {
    // Only run on the client side
    if (typeof window === 'undefined') return;

    const langObj = languages.find(lang => lang.code === language) || languages[0];
    setSelectedLanguage(langObj);

    // Force re-render of all components when language changes
    // Update HTML lang attribute
    document.documentElement.lang = language;

    // Add a class to the body to indicate the current language
    document.body.className = document.body.className
      .replace(/lang-\w+/g, '')
      .trim();
    document.body.classList.add(`lang-${language}`);

    // Force re-render by triggering a custom event
    window.dispatchEvent(new CustomEvent('languagechange', { detail: language }));
  }, [language]);

  // Synchronous translation (from cache)
  const translate = (text: string): string => {
    if (language === 'en') return text;
    return translations[text] || text;
  };

  // Asynchronous translation (fetches if needed)
  const translateAsync = async (text: string): Promise<string> => {
    if (language === 'en') return text;

    // If already in cache, return it
    if (translations[text]) {
      return translations[text];
    }

    try {
      // Import dynamically to avoid server-side issues
      const { translateText } = await import('@/lib/translation-service');
      const translated = await translateText(text, language);

      // Update cache
      setTranslations(prev => ({
        ...prev,
        [text]: translated
      }));

      return translated;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  };

  const value = {
    language,
    setLanguage,
    translate,
    translateAsync,
    selectedLanguage,
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}
