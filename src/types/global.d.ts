// Global type declarations

// Extend the Window interface
declare global {
  interface Window {
    // For Google Translate
    google?: {
      translate?: {
        TranslateElement?: {
          InlineLayout?: {
            SIMPLE: string;
            HORIZONTAL: string;
          };
          FloatPosition?: {
            TOP_LEFT: string;
            TOP_RIGHT: string;
            BOTTOM_LEFT: string;
            BOTTOM_RIGHT: string;
          };
        };
      };
    };
    googleTranslateElementInit?: () => void;

    // For our custom translation
    translationDebounceTimer?: NodeJS.Timeout;
  }
}

export {};
