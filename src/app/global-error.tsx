"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="flex min-h-screen items-center justify-center px-4 py-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background/80 z-0 pointer-events-none"></div>
          <div className="absolute inset-0 opacity-5 z-0 bg-[url('/patterns/dot-pattern.svg')] pointer-events-none"></div>

          <div className="w-full max-w-md z-10">
            <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-destructive/10 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-destructive/10 text-destructive rounded-full">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  500
                </div>
              </div>
              
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Critical Error
              </h2>
              
              <p className="text-muted-foreground mb-6">
                A critical error has occurred in the application
              </p>
              
              <div className="bg-destructive/10 text-destructive p-4 rounded-xl border border-destructive/20 mb-6">
                {error.message || "We're having trouble loading the application right now."}
              </div>
              
              <div className="space-y-2 mb-6">
                <p className="text-muted-foreground">
                  You might want to:
                </p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Refresh the page to try again</li>
                  <li>Clear your browser cache and cookies</li>
                  <li>Try again later as the issue might be temporary</li>
                  <li>If the problem persists, please contact support</li>
                </ul>
              </div>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={reset}
                  className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground py-2.5 px-4 rounded-xl font-medium shadow-sm hover:shadow-md hover:opacity-90 transition-all"
                >
                  Try Again
                </button>
                
                <button
                  onClick={() => window.location.href = "/"}
                  className="w-full bg-transparent border border-primary/20 text-foreground py-2.5 px-4 rounded-xl font-medium hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  Go to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
