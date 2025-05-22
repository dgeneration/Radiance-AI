"use client";

import { MessageSquare } from "lucide-react";
import { useState } from "react";

interface HistoryLinkProps {
  isActive: boolean;
  isMobile?: boolean;
}

export function HistoryLink({ isActive, isMobile = false }: HistoryLinkProps) {
  const [isNavigating, setIsNavigating] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // Set navigating state to show loading indicator
    setIsNavigating(true);

    // Use direct window.location for more reliable navigation
    window.location.href = "/diagnosis/history";
  };

  // For mobile menu, we just want the icon
  if (isMobile) {
    return (
      <button
        onClick={handleClick}
        className="flex items-center justify-center"
      >
        <MessageSquare className="h-5 w-5" />
      </button>
    );
  }

  // For desktop header
  return (
    <button
      onClick={handleClick}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer flex items-center ${
        isActive
          ? "text-primary bg-primary/10"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
      }`}
    >
      <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
      {isNavigating ? "History" : "History"}
    </button>
  );
}
