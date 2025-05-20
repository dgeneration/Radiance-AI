"use client";

import { useRef, useState, useEffect } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import type { TurnstileInstance } from "@marsidev/react-turnstile";

interface TurnstileCaptchaProps {
  onVerify?: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
  className?: string;
}

export function TurnstileCaptcha({
  onVerify,
  onError,
  onExpire,
  className,
}: TurnstileCaptchaProps) {
  const captchaRef = useRef<TurnstileInstance | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // This is the correct site key format for Cloudflare Turnstile
  const siteKey = "0x4AAAAAABd4LHcFX8_dNsR1";

  useEffect(() => {
    // Set a timeout to check if the CAPTCHA has loaded
    const timer = setTimeout(() => {
      if (!isLoaded) {
        setErrorMessage("CAPTCHA failed to load. Please check your internet connection or try refreshing the page.");
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [isLoaded]);

  const handleSuccess = (token: string) => {
    setIsLoaded(true);
    setErrorMessage(null);
    if (onVerify) {
      onVerify(token);
    }
  };

  const handleError = (error: string) => {
    setErrorMessage(`Error loading CAPTCHA: ${error}`);
    console.error("Turnstile error:", error);
    if (onError) {
      onError(error);
    }
  };

  const handleExpire = () => {
    if (onExpire) {
      onExpire();
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
    setErrorMessage(null);
  };

  return (
    <div className={className}>
      {errorMessage && (
        <div className="text-destructive text-sm mb-2 p-2 bg-destructive/10 rounded-md">
          {errorMessage}
        </div>
      )}
      <Turnstile
        ref={captchaRef}
        siteKey={siteKey}
        onSuccess={handleSuccess}
        onError={handleError}
        onExpire={handleExpire}
        onLoad={handleLoad}
        options={{
          theme: "dark",
          size: "normal",
          appearance: "always"
        }}
        className="flex justify-center"
        scriptOptions={{
          appendTo: "head",
          defer: true,
        }}
      />
    </div>
  );
}
