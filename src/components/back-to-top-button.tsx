"use client";

import { ProfessionalButton } from "@/components/ui/professional-button";

export function BackToTopButton() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ProfessionalButton
      variant="outline"
      size="sm"
      onClick={scrollToTop}
    >
      Back to Top
    </ProfessionalButton>
  );
}
