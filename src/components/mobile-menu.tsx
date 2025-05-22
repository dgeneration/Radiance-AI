"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  FaHome,
  FaUser
} from "react-icons/fa";
import { Sparkles } from "lucide-react";
import { HistoryLink } from "@/components/history-link";

export function MobileMenu() {
  const pathname = usePathname();

  // Use state to handle client-side rendering
  const [mounted, setMounted] = useState(false);

  // Only render menu items on the client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Only render on the client side to avoid hydration mismatch
  if (!mounted) {
    // Return an empty div during server-side rendering
    return <div className="md:hidden fixed bottom-0 left-0 right-0 h-16"></div>;
  }

  // Client-side only rendering
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 backdrop-blur-md bg-background/80 border-t border-primary/10 py-3 shadow-sm z-50 select-none">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 z-0"></div>
      <div className="flex justify-around items-center relative z-10">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={`flex flex-col items-center relative ${
            pathname === '/dashboard'
              ? "text-primary"
              : "text-muted-foreground hover:text-primary"
          } transition-colors`}
        >
          {pathname === '/dashboard' && (
            <motion.div
              layoutId="activeTab"
              className="absolute -top-3 w-1/2 h-1 bg-gradient-to-r from-primary to-accent rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}

          <div className={`p-2 rounded-full ${
            pathname === '/dashboard'
              ? "bg-primary/10"
              : "bg-transparent hover:bg-primary/5"
          } transition-colors`}>
            <FaHome className="h-5 w-5" />
          </div>

          <span className="text-xs mt-1 font-medium">
            Dashboard
          </span>
        </Link>

        {/* RAI */}
        <Link
          href="/rai"
          className={`flex flex-col items-center relative ${
            pathname === '/rai' || pathname.startsWith('/diagnosis') || pathname === '/ask-radiance'
              ? "text-primary"
              : "text-muted-foreground hover:text-primary"
          } transition-colors`}
        >
          {(pathname === '/rai' || pathname.startsWith('/diagnosis') || pathname === '/ask-radiance') && (
            <motion.div
              layoutId="activeTab"
              className="absolute -top-3 w-1/2 h-1 bg-gradient-to-r from-primary to-accent rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}

          <div className={`p-2 rounded-full ${
            pathname === '/rai' || pathname.startsWith('/diagnosis') || pathname === '/ask-radiance'
              ? "bg-primary/10"
              : "bg-transparent hover:bg-primary/5"
          } transition-colors`}>
            <Sparkles className="h-5 w-5" />
          </div>

          <span className="text-xs mt-1 font-medium">
            R-AI
          </span>
        </Link>

        {/* History Link - Special handling for reliable navigation */}
        <div className="flex flex-col items-center relative">
          {pathname === '/diagnosis/history' && (
            <motion.div
              layoutId="activeTab"
              className="absolute -top-3 w-1/2 h-1 bg-gradient-to-r from-primary to-accent rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}

          <div className="flex flex-col items-center">
            <div className={`p-2 rounded-full ${
              pathname === '/diagnosis/history'
                ? "bg-primary/10"
                : "bg-transparent hover:bg-primary/5"
            } transition-colors`}>
              <HistoryLink isActive={pathname === '/diagnosis/history'} isMobile={true} />
            </div>
            <span className="text-xs mt-1 font-medium">
              History
            </span>
          </div>
        </div>

        {/* Profile */}
        <Link
          href="/dashboard/profile"
          className={`flex flex-col items-center relative ${
            pathname.startsWith('/dashboard/profile')
              ? "text-primary"
              : "text-muted-foreground hover:text-primary"
          } transition-colors`}
        >
          {pathname.startsWith('/dashboard/profile') && (
            <motion.div
              layoutId="activeTab"
              className="absolute -top-3 w-1/2 h-1 bg-gradient-to-r from-primary to-accent rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}

          <div className={`p-2 rounded-full ${
            pathname.startsWith('/dashboard/profile')
              ? "bg-primary/10"
              : "bg-transparent hover:bg-primary/5"
          } transition-colors`}>
            <FaUser className="h-5 w-5" />
          </div>

          <span className="text-xs mt-1 font-medium">
            Profile
          </span>
        </Link>
      </div>
    </div>
  );
}
