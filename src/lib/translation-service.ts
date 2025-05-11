// Translation service using Google Translate API

// Cache for storing translations to avoid redundant API calls
const translationCache: Record<string, Record<string, string>> = {};

// Batch translation queue to reduce API calls
interface TranslationRequest {
  text: string;
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
}

const translationQueue: Record<string, TranslationRequest[]> = {};
const translationTimer: Record<string, NodeJS.Timeout> = {};
const BATCH_DELAY = 100; // ms to wait before sending batch request

/**
 * Translates text to the target language using Google Translate API
 * @param text The text to translate
 * @param targetLang The language to translate to
 * @param sourceLang The source language (optional, auto-detected if not provided)
 * @returns Promise with the translated text
 */
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang: string = 'auto'
): Promise<string> {
  // If text is empty, return empty string
  if (!text || text.trim() === '') {
    return text;
  }

  // If target language is English or the same as source, return original text
  if (targetLang === 'en' || (sourceLang !== 'auto' && targetLang === sourceLang)) {
    return text;
  }

  // Check cache first
  if (translationCache[targetLang]?.[text]) {
    return translationCache[targetLang][text];
  }

  // Return a promise that will be resolved when the translation is complete
  return new Promise((resolve, reject) => {
    // Add to queue
    if (!translationQueue[targetLang]) {
      translationQueue[targetLang] = [];
    }

    translationQueue[targetLang].push({ text, resolve, reject });

    // Clear existing timer
    if (translationTimer[targetLang]) {
      clearTimeout(translationTimer[targetLang]);
    }

    // Set new timer to process queue
    translationTimer[targetLang] = setTimeout(() => {
      processBatchTranslation(targetLang, sourceLang);
    }, BATCH_DELAY);
  });
}

/**
 * Process a batch of translation requests
 * @param targetLang The target language
 * @param sourceLang The source language
 */
async function processBatchTranslation(targetLang: string, sourceLang: string = 'auto'): Promise<void> {
  const queue = translationQueue[targetLang] || [];
  if (queue.length === 0) return;

  // Clear queue
  translationQueue[targetLang] = [];

  // Prepare texts for batch translation
  const texts = queue.map(req => req.text);
  const uniqueTexts = [...new Set(texts)];

  try {
    // For single text, use single translation
    if (uniqueTexts.length === 1) {
      const translatedText = await translateSingleText(uniqueTexts[0], targetLang, sourceLang);

      // Resolve all promises with the translated text
      queue.forEach(req => {
        req.resolve(translatedText);
      });

      return;
    }

    // For multiple texts, use batch translation
    const translatedTexts = await translateBatchTexts(uniqueTexts, targetLang, sourceLang);

    // Create a map of original text to translated text
    const translationMap: Record<string, string> = {};
    uniqueTexts.forEach((text, index) => {
      translationMap[text] = translatedTexts[index] || text;
    });

    // Resolve all promises with their respective translated texts
    queue.forEach(req => {
      req.resolve(translationMap[req.text] || req.text);
    });
  } catch (error) {
    console.error('Batch translation error:', error);

    // Reject all promises with the error
    queue.forEach(req => {
      req.reject(error);
    });
  }
}

/**
 * Translate a single text
 * @param text The text to translate
 * @param targetLang The target language
 * @param sourceLang The source language
 * @returns Promise with the translated text
 */
async function translateSingleText(
  text: string,
  targetLang: string,
  sourceLang: string = 'auto'
): Promise<string> {
  try {
    // Use the Google Translate API
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Translation failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Extract the translated text from the response
    let translatedText = '';
    if (data && data[0]) {
      for (let i = 0; i < data[0].length; i++) {
        if (data[0][i][0]) {
          translatedText += data[0][i][0];
        }
      }
    }

    // Cache the result
    if (!translationCache[targetLang]) {
      translationCache[targetLang] = {};
    }
    translationCache[targetLang][text] = translatedText;

    return translatedText || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text on error
  }
}

/**
 * Translate a batch of texts
 * @param texts The texts to translate
 * @param targetLang The target language
 * @param sourceLang The source language
 * @returns Promise with the translated texts
 */
async function translateBatchTexts(
  texts: string[],
  targetLang: string,
  sourceLang: string = 'auto'
): Promise<string[]> {
  // For now, we'll just translate each text individually
  // In a production app, you would use a batch translation API
  const promises = texts.map(text => translateSingleText(text, targetLang, sourceLang));
  return Promise.all(promises);
}

/**
 * Translates an entire object's string values
 * @param obj The object to translate
 * @param targetLang The language to translate to
 * @returns Promise with the translated object
 */
export async function translateObject<T>(
  obj: T,
  targetLang: string
): Promise<T> {
  if (targetLang === 'en') {
    return obj;
  }

  // Create a copy of the object that we can modify
  const result = { ...obj };

  // Iterate through all properties
  for (const key in result) {
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      if (typeof result[key as keyof T] === 'string') {
        // Cast to string since we've checked the type
        const text = result[key as keyof T] as string;
        (result as Record<keyof T, unknown>)[key as keyof T] = await translateText(text, targetLang);
      } else if (typeof result[key as keyof T] === 'object' && result[key as keyof T] !== null) {
        // Cast to object since we've checked the type
        const nestedObj = result[key as keyof T];
        (result as Record<keyof T, unknown>)[key as keyof T] = await translateObject(nestedObj as object, targetLang);
      }
    }
  }

  return result;
}

/**
 * Translates all text nodes in the DOM
 * @param targetLang The language to translate to
 */
export async function translatePage(targetLang: string): Promise<void> {
  if (targetLang === 'en' || typeof window === 'undefined') {
    return;
  }

  try {
    // First, translate all visible text nodes
    await translateVisibleTextNodes(targetLang);

    // Then set up a MutationObserver to translate new nodes
    setupMutationObserver(targetLang);

    // Also translate after any route change in Next.js
    setupRouteChangeTranslation(targetLang);

    // Translate after any dynamic content loads (approximated with a timeout)
    setTimeout(() => translateVisibleTextNodes(targetLang), 1000);
    setTimeout(() => translateVisibleTextNodes(targetLang), 2000);
  } catch (error) {
    console.error('Error in translatePage:', error);
  }
}

/**
 * Translates all visible text nodes in the DOM
 * @param targetLang The language to translate to
 */
async function translateVisibleTextNodes(targetLang: string): Promise<void> {
  if (targetLang === 'en' || typeof window === 'undefined') {
    return;
  }

  // Get all text nodes in the document
  const textNodes = getTextNodes(document.body);

  // Group text nodes by their text content to reduce API calls
  const textGroups: Record<string, Text[]> = {};

  for (const node of textNodes) {
    const text = node.nodeValue?.trim();
    if (text && text.length > 0 && !/^\s*$/.test(text) && text.length < 1000) {
      if (!textGroups[text]) {
        textGroups[text] = [];
      }
      textGroups[text].push(node);
    }
  }

  // Translate each unique text once
  const uniqueTexts = Object.keys(textGroups);

  // Process in smaller batches to avoid overwhelming the API
  const batchSize = 20;
  for (let i = 0; i < uniqueTexts.length; i += batchSize) {
    const batch = uniqueTexts.slice(i, i + batchSize);

    // Translate each text in the batch
    const translations = await Promise.all(
      batch.map(text => translateText(text, targetLang))
    );

    // Apply translations to all nodes with the same text
    batch.forEach((text, index) => {
      const translatedText = translations[index];
      if (translatedText && translatedText !== text) {
        textGroups[text].forEach(node => {
          if (node.nodeValue) {
            node.nodeValue = node.nodeValue.replace(text, translatedText);
          }
        });
      }
    });
  }
}

// Store the mutation observer so we can disconnect it when needed
let mutationObserver: MutationObserver | null = null;

/**
 * Sets up a MutationObserver to translate new nodes
 * @param targetLang The language to translate to
 */
function setupMutationObserver(targetLang: string): void {
  if (typeof window === 'undefined') return;

  // Disconnect any existing observer
  if (mutationObserver) {
    mutationObserver.disconnect();
  }

  // Create a new observer
  mutationObserver = new MutationObserver((_mutations) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    // Process in a debounced way to avoid too many translations
    clearTimeout(window.translationDebounceTimer);
    window.translationDebounceTimer = setTimeout(() => {
      translateVisibleTextNodes(targetLang);
    }, 500);
  });

  // Start observing
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

/**
 * Sets up translation after route changes in Next.js
 * @param targetLang The language to translate to
 */
function setupRouteChangeTranslation(targetLang: string): void {
  if (typeof window === 'undefined') return;

  // Listen for Next.js route changes
  window.addEventListener('routeChangeComplete', () => {
    setTimeout(() => translateVisibleTextNodes(targetLang), 300);
  });

  // Also listen for popstate events (browser back/forward)
  window.addEventListener('popstate', () => {
    setTimeout(() => translateVisibleTextNodes(targetLang), 300);
  });
}

/**
 * Gets all text nodes in an element
 * @param element The element to get text nodes from
 * @returns Array of text nodes
 */
function getTextNodes(element: Node): Text[] {
  const textNodes: Text[] = [];

  // Skip elements that shouldn't be translated
  if (element.nodeType === Node.ELEMENT_NODE) {
    const el = element as HTMLElement;

    // Skip elements with no-translate class or attribute
    if (
      el.classList?.contains('no-translate') ||
      el.classList?.contains('translate-none') ||
      el.getAttribute('translate') === 'no' ||
      el.getAttribute('data-no-translate') === 'true'
    ) {
      return textNodes;
    }

    // Skip specific elements
    const nodeName = el.nodeName.toUpperCase();
    if (
      nodeName === 'SCRIPT' ||
      nodeName === 'STYLE' ||
      nodeName === 'NOSCRIPT' ||
      nodeName === 'IFRAME' ||
      nodeName === 'CODE' ||
      nodeName === 'PRE' ||
      nodeName === 'TEXTAREA' ||
      nodeName === 'INPUT' ||
      nodeName === 'SVG' ||
      nodeName === 'CANVAS' ||
      nodeName === 'VIDEO' ||
      nodeName === 'AUDIO' ||
      nodeName === 'MATH'
    ) {
      return textNodes;
    }

    // Skip elements with contenteditable attribute
    if (el.getAttribute('contenteditable') === 'true') {
      return textNodes;
    }

    // Skip elements with specific roles
    const role = el.getAttribute('role');
    if (
      role === 'textbox' ||
      role === 'searchbox' ||
      role === 'combobox'
    ) {
      return textNodes;
    }
  }

  // If this is a text node with non-empty content, add it to the list
  if (element.nodeType === Node.TEXT_NODE) {
    const text = element.nodeValue?.trim();
    if (text && text.length > 0 && !/^\s*$/.test(text)) {
      // Skip "Radiance AI" text
      if (text === "Radiance AI" || text.includes("Radiance AI")) {
        return textNodes;
      }

      textNodes.push(element as Text);
    }
  }

  // Recursively process child nodes
  for (let i = 0; i < element.childNodes.length; i++) {
    textNodes.push(...getTextNodes(element.childNodes[i]));
  }

  return textNodes;
}

// Store the current language
let currentLanguage = 'en';

/**
 * Sets the current language
 * @param lang The language code
 */
export function setCurrentLanguage(lang: string): void {
  currentLanguage = lang;
  // Store in localStorage for persistence
  if (typeof window !== 'undefined') {
    localStorage.setItem('preferredLanguage', lang);

    // Translate the page
    translatePage(lang).catch(error => {
      console.error('Error translating page:', error);
    });
  }
}

/**
 * Gets the current language
 * @returns The current language code
 */
export function getCurrentLanguage(): string {
  // Try to get from localStorage first
  if (typeof window !== 'undefined') {
    const storedLang = localStorage.getItem('preferredLanguage');
    if (storedLang) {
      currentLanguage = storedLang;
    } else {
      // Try to detect browser language
      const browserLang = navigator.language.split('-')[0];
      if (browserLang && browserLang !== 'en') {
        currentLanguage = browserLang;
      }
    }
  }
  return currentLanguage;
}
