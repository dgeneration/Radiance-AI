"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaDownload, FaTimes } from "react-icons/fa";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { ProfessionalButton } from "@/components/ui/professional-button";

export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if the user has previously dismissed the prompt
    const hasDismissed = localStorage.getItem("pwa-install-dismissed");
    if (hasDismissed) {
      setDismissed(true);
    }

    // Show the prompt after a delay if the app is installable and not already installed
    if (isInstallable && !isInstalled && !dismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000); // 5 seconds delay

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, dismissed]);

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    // Remember that the user dismissed the prompt
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  const handleInstall = async () => {
    await promptInstall();
    setShowPrompt(false);
  };

  if (!isInstallable || isInstalled || !showPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:bottom-4 md:max-w-md"
        >
          <div className="bg-card/90 backdrop-blur-sm p-4 rounded-xl border border-primary/10 shadow-lg">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Install Radiance AI
              </h3>
              <button
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Dismiss"
              >
                <FaTimes />
              </button>
            </div>
            <p className="text-muted-foreground mb-4">
              Install Radiance AI on your device for a better experience and offline access.
            </p>
            <div className="flex gap-3">
              <ProfessionalButton
                variant="outline"
                size="sm"
                onClick={handleDismiss}
              >
                Not Now
              </ProfessionalButton>
              <ProfessionalButton
                variant="primary"
                size="sm"
                icon={<FaDownload className="h-4 w-4" />}
                iconPosition="left"
                onClick={handleInstall}
              >
                Install App
              </ProfessionalButton>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
