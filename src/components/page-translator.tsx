"use client";

import { useEffect } from "react";
import { useTranslation } from "@/contexts/translation-context";
import { translatePage } from "@/lib/translation-service";

/**
 * Component that translates the entire page on mount
 * This should be included in the layout to ensure all pages are translated
 */
export function PageTranslator() {
  const { language } = useTranslation();

  // Translate the page when the component mounts or language changes
  useEffect(() => {
    // Only run on the client side
    if (typeof window === 'undefined') return;

    if (language !== 'en') {
      // Small delay to ensure the page is fully rendered and hydration is complete
      const timer = setTimeout(() => {
        translatePage(language).catch(error => {
          console.error('Error translating page:', error);
        });
      }, 500); // Increased delay to ensure hydration is complete

      return () => clearTimeout(timer);
    }
  }, [language]);

  // This component doesn't render anything
  return null;
}
