"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { createContext, useContext, useEffect, useState, useRef } from "react";

interface NavigationEventsContextType {
  isNavigating: boolean;
}

const NavigationEventsContext = createContext<NavigationEventsContextType>({
  isNavigating: false,
});

export function useNavigationEvents() {
  return useContext(NavigationEventsContext);
}

export function NavigationEventsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialRenderRef = useRef(true);

  useEffect(() => {
    // Skip the effect on initial render to prevent unnecessary loading state
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }

    // Clean up any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Set navigating to true briefly
    setIsNavigating(true);

    // After a short delay, set navigating to false
    timeoutRef.current = setTimeout(() => {
      setIsNavigating(false);
    }, 800); // Adjust this time based on your app's typical loading time

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [pathname, searchParams]);

  return (
    <NavigationEventsContext.Provider value={{ isNavigating }}>
      {children}
    </NavigationEventsContext.Provider>
  );
}
