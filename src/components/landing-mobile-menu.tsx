"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FaBars, FaTimes, FaArrowRight } from "react-icons/fa";
import { User } from "@supabase/supabase-js";
import { HeaderButton } from "@/components/ui/header-button";

interface NavItem {
  id: string;
  label: string;
}

const navItems: NavItem[] = [
  { id: "hero", label: "Home" },
  { id: "features", label: "Features" },
  { id: "how-it-works", label: "Working" },
  { id: "faq", label: "FAQ" },
];

interface LandingMobileMenuProps {
  user: User | null;
}

export function LandingMobileMenu({ user }: LandingMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("hero");

  // Handle scroll to update active section
  useEffect(() => {
    const handleScroll = () => {
      // Get all section elements
      const sections = navItems.map(item =>
        document.getElementById(item.id)
      ).filter(Boolean) as HTMLElement[];

      // Find the section that is currently in view
      const currentSection = sections.find(section => {
        const rect = section.getBoundingClientRect();
        // Consider a section "in view" if its top is within the top half of the viewport
        return rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2;
      });

      if (currentSection) {
        setActiveSection(currentSection.id);
      }
    };

    // Add scroll event listener
    window.addEventListener("scroll", handleScroll);

    // Initial check
    handleScroll();

    // Clean up
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if the click is outside both the menu container and the toggle button
      if (isOpen &&
          !target.closest('.mobile-menu-container') &&
          !target.closest('.mobile-menu-toggle')) {
        setIsOpen(false);
      }
    };

    // Use mousedown for better mobile support
    document.addEventListener('mousedown', handleClickOutside);

    // Also add escape key support
    const handleEscKey = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleNavClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });
    setIsOpen(false);
  };

  return (
    <>
      {/* Toggle button - positioned on the right side */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="mobile-menu-toggle p-2 rounded-md text-foreground hover:bg-primary/10 transition-colors cursor-pointer"
        aria-label="Toggle menu"
      >
        {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
      </button>

      {/* Mobile menu dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[4.5rem] left-0 right-0 bg-background/95 backdrop-blur-md z-50 border-b border-primary/10 shadow-lg"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 z-0"></div>

            <div className="container mx-auto px-6 py-6 relative z-10 mobile-menu-container">
              {/* Navigation links */}
              <nav className="flex flex-col space-y-3 mb-6">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`px-4 py-3 rounded-lg text-left text-base font-medium transition-colors duration-200 flex items-center ${
                      activeSection === item.id
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
                    }`}
                  >
                    {activeSection === item.id && (
                      <motion.div
                        layoutId="activeMobileTab"
                        className="w-1 h-5 bg-gradient-to-b from-primary to-accent rounded-full mr-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                    <span className={activeSection === item.id ? "ml-0" : "ml-4"}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </nav>

              {/* Action buttons */}
              <div className="flex flex-col space-y-3 pb-2">
                {user ? (
                  <>
                    <HeaderButton
                      asChild
                      variant="outline"
                      onClick={() => setIsOpen(false)}
                    >
                      <Link href="/dashboard">Dashboard</Link>
                    </HeaderButton>
                    <HeaderButton
                      asChild
                      variant="primary"
                      icon={<FaArrowRight />}
                      iconPosition="right"
                      onClick={() => setIsOpen(false)}
                    >
                      <Link href="/diagnosis">
                        Get Diagnosis
                      </Link>
                    </HeaderButton>
                  </>
                ) : (
                  <>
                    <HeaderButton
                      asChild
                      variant="outline"
                      onClick={() => setIsOpen(false)}
                    >
                      <Link href="/auth/login">Sign In</Link>
                    </HeaderButton>
                    <HeaderButton
                      asChild
                      variant="primary"
                      icon={<FaArrowRight />}
                      iconPosition="right"
                      onClick={() => setIsOpen(false)}
                    >
                      <Link href="/diagnosis">
                        Get Started
                      </Link>
                    </HeaderButton>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
