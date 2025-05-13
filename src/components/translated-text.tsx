"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "@/contexts/translation-context";
import type { JSX } from "react";

interface TranslatedTextProps {
  text: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function TranslatedText({
  text,
  className,
  as: Component = "span"
}: TranslatedTextProps) {
  const { language, translate, translateAsync } = useTranslation();
  const [translatedText, setTranslatedText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Use cached translation immediately if available
    const cachedText = translate(text);
    if (cachedText !== text) {
      setTranslatedText(cachedText);
      return;
    }

    // Otherwise, fetch translation asynchronously
    if (language !== 'en') {
      setIsLoading(true);
      translateAsync(text)
        .then(result => {
          setTranslatedText(result);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setTranslatedText(text);
    }
  }, [text, language, translate, translateAsync]);

  // Listen for language change events
  useEffect(() => {
    const handleLanguageChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const newLanguage = customEvent.detail;

      // Skip if it's the same language we already processed
      if (newLanguage === language) return;

      // Use cached translation immediately if available
      const cachedText = translate(text);
      if (cachedText !== text) {
        setTranslatedText(cachedText);
        return;
      }

      // Otherwise, fetch translation asynchronously
      if (newLanguage !== 'en') {
        setIsLoading(true);
        translateAsync(text)
          .then(result => {
            setTranslatedText(result);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        setTranslatedText(text);
      }
    };

    window.addEventListener('languagechange', handleLanguageChange);

    return () => {
      window.removeEventListener('languagechange', handleLanguageChange);
    };
  }, [text, language, translate, translateAsync]);

  return (
    <Component className={className}>
      {isLoading ? (
        <>
          <span className="opacity-70">{translatedText}</span>
          <span className="ml-1 inline-block animate-pulse">...</span>
        </>
      ) : (
        translatedText
      )}
    </Component>
  );
}
