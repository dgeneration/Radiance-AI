"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: {
      translate: {
        TranslateElement: new (
          options: {
            pageLanguage: string;
            includedLanguages?: string;
            layout?: { [key: string]: unknown };
            autoDisplay?: boolean;
            multilanguagePage?: boolean;
          },
          elementId: string
        ) => void;
      };
    };
  }
}

export default function GoogleTranslate() {
  const translationRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      // Define the initialization function for Google Translate
      window.googleTranslateElementInit = () => {
        // Add a small delay to ensure the DOM is ready
        setTimeout(() => {
          if (
            window.google &&
            window.google.translate &&
            window.google.translate.TranslateElement &&
            translationRef.current
          ) {
            new window.google.translate.TranslateElement(
              {
                pageLanguage: "en",
                // Include popular languages - can be customized
                includedLanguages:
                  "ar,zh-CN,nl,en,fr,de,hi,it,ja,ko,pt,ru,es,sv,tr",
                layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false,
                multilanguagePage: true,
              },
              "google_translate_element"
            );
            initialized.current = true;

            // Add a class to the body to indicate translation is ready
            document.body.classList.add('translation-ready');
          }
        }, 500);
      };
    }

    // Cleanup function
    return () => {
      // Remove the initialization function when component unmounts
      if (window.googleTranslateElementInit) {
        // @ts-expect-error - We need to delete the function
        window.googleTranslateElementInit = undefined;
      }
    };
  }, []);

  return (
    <>
      {/* Google Translate Script */}
      <Script
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />

      {/* Container for Google Translate Element - Hidden but functional */}
      <div
        id="google_translate_element"
        ref={translationRef}
        className="google-translate-container"
      />

      {/* Custom styling for Google Translate widget */}
      <style jsx global>{`
        /* Hide Google Translate attribution and default widget */
        .goog-te-gadget {
          height: 0;
          overflow: hidden;
          position: absolute;
        }

        .goog-te-gadget-simple {
          background-color: transparent !important;
          border: none !important;
          padding: 0 !important;
          font-size: 14px !important;
          line-height: 1.5 !important;
          color: white !important;
          display: flex !important;
          align-items: center !important;
          height: 0 !important;
          overflow: hidden !important;
          position: absolute !important;
          top: -9999px !important;
          left: -9999px !important;
        }

        /* Hide Google Translate banner */
        .goog-te-banner-frame {
          display: none !important;
        }

        /* Fix body positioning */
        body {
          top: 0 !important;
          position: static !important;
        }

        /* Container styling */
        .google-translate-container {
          position: absolute;
          height: 0;
          width: 0;
          overflow: hidden;
          z-index: -1;
        }

        /* Dropdown styling */
        .goog-te-menu-frame {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
          border-radius: 0.5rem !important;
          max-width: 200px !important;
        }

        .goog-te-menu2 {
          border-radius: 0.5rem !important;
          overflow: hidden !important;
          padding: 0 !important;
          border: 1px solid rgba(99, 102, 241, 0.2) !important;
          background-color: #1c1c20 !important;
        }

        .goog-te-menu2-item div, .goog-te-menu2-item:link div, .goog-te-menu2-item:visited div, .goog-te-menu2-item:active div {
          color: #e0e0e0 !important;
          padding: 8px 12px !important;
          font-family: inherit !important;
          font-size: 14px !important;
        }

        .goog-te-menu2-item:hover div {
          background-color: rgba(99, 102, 241, 0.1) !important;
        }

        /* Hide the Google Translate widget that appears at the top */
        #goog-gt-tt, .goog-te-balloon-frame {
          display: none !important;
        }

        .goog-text-highlight {
          background-color: transparent !important;
          box-shadow: none !important;
        }

        /* Hide the automatic top bar */
        .skiptranslate {
          display: none !important;
        }
      `}</style>
    </>
  );
}
