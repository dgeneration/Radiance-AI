"use client";

import { useEffect } from "react";
import { ErrorPage } from "@/components/error-page";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <ErrorPage
      statusCode={500}
      title="Something Went Wrong"
      description="An unexpected error occurred"
      message={error.message || "We're having trouble processing your request right now."}
      suggestions={[
        "Try refreshing the page",
        "Clear your browser cache and cookies",
        "Try again later as the issue might be temporary",
        "If the problem persists, please contact support"
      ]}
      primaryAction={{ label: "Try Again", href: "#", onClick: reset }}
      tertiaryAction={{ label: "Go to Home", href: "/" }}
      icon={<AlertTriangle className="w-10 h-10" />}
      isDestructive={true}
    />
  );
}
