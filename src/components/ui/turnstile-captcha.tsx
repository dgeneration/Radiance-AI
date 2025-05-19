"use client";

import { useRef } from "react";
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

  const handleSuccess = (token: string) => {
    if (onVerify) {
      onVerify(token);
    }
  };

  const handleError = (error: string) => {
    if (onError) {
      onError(error);
    }
  };

  const handleExpire = () => {
    if (onExpire) {
      onExpire();
    }
  };

  // Note: This component exposes the captchaRef which can be used by parent components
  // to access methods like reset() if needed via a ref forwarding pattern

  return (
    <div className={className}>
      <Turnstile
        ref={captchaRef}
        siteKey="-0x4AAAAAABd4LHcFX8_dNsR1"
        onSuccess={handleSuccess}
        onError={handleError}
        onExpire={handleExpire}
        options={{
          theme: "dark",
          size: "normal",
          appearance: "interaction-only"
        }}
        className="flex justify-center"
      />
    </div>
  );
}
