"use client";

import { motion } from "framer-motion";
import { GradientHeading } from "@/components/ui/gradient-heading";
import { FloatingElement } from "@/components/animations";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, FolderOpen } from "lucide-react";

interface SubNavbarProps {
  title: string;
  showProfileNav?: boolean;
}

export function SubNavbar({ title, showProfileNav = false }: SubNavbarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  // Check if we're on a chain diagnosis page
  const isChainDiagnosisPage = pathname.includes('/dashboard/chain-diagnosis');

  return (
    <div className="relative overflow-hidden border-b border-primary/10 py-8 bg-card/5 select-none">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 z-0"></div>

      {/* Decorative elements */}
      <FloatingElement
        className="absolute -top-20 left-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl opacity-30"
        duration={10}
        xOffset={15}
        yOffset={20}
      />
      <FloatingElement
        className="absolute -bottom-40 right-20 w-60 h-60 bg-accent/10 rounded-full blur-3xl opacity-30"
        duration={12}
        xOffset={-15}
        yOffset={-20}
        delay={0.5}
      />

      <div className="container relative z-10 mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <GradientHeading level={1} size="lg" className="text-center md:text-left">
              {title}
            </GradientHeading>
          </motion.div>

          <motion.div
            className="flex flex-wrap justify-center md:justify-end items-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {showProfileNav && !isChainDiagnosisPage && (
              <>
                <Link
                  href="/dashboard/profile"
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
                    isActive("/dashboard/profile")
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
                <Link
                  href="/dashboard/profile/files"
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
                    isActive("/dashboard/profile/files")
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                  }`}
                >
                  <FolderOpen className="h-4 w-4" />
                  <span>Files</span>
                </Link>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
