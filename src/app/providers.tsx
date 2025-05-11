"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { LayoutWithHeaderFooter } from "@/components/layout-with-header-footer";
import { User } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";
import { NavigationEventsProvider, useNavigationEvents } from "@/components/navigation-events";
import { NavigationProgress } from "@/components/navigation-progress";
import { LoadingOverlay } from "@/components/loading-overlay";
import { PageTransition } from "@/components/page-transition";
import { TranslationProvider } from "@/contexts/translation-context";
import { PageTranslator } from "@/components/page-translator";
import FloatingLanguageSelector from "@/components/floating-language-selector";

interface ProvidersProps {
  children: React.ReactNode;
  user: User | null;
}

function AppContent({ children, user }: ProvidersProps) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/auth/");
  const { isNavigating } = useNavigationEvents();

  // Only show the loading overlay for non-auth pages
  // Auth pages already have their own navigation progress
  const showLoadingOverlay = isNavigating && !isAuthPage;

  return (
    <>
      {/* Add page translator to translate all content */}
      <PageTranslator />

      {/* Add floating language selector */}
      <FloatingLanguageSelector />

      {!isAuthPage && <NavigationProgress />}
      {showLoadingOverlay && <LoadingOverlay isLoading={true} />}

      {isAuthPage ? (
        // Don't wrap auth pages with the header/footer layout
        <PageTransition>{children}</PageTransition>
      ) : (
        // Wrap non-auth pages with the header/footer layout
        <LayoutWithHeaderFooter user={user}>
          <PageTransition>{children}</PageTransition>
        </LayoutWithHeaderFooter>
      )}
    </>
  );
}

export function Providers({ children, user }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <TranslationProvider>
        <NavigationEventsProvider>
          <AppContent user={user}>
            {children}
          </AppContent>
        </NavigationEventsProvider>
      </TranslationProvider>
    </ThemeProvider>
  );
}
