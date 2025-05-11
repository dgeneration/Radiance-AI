"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

export function LandingNav() {
  const [activeSection, setActiveSection] = useState<string>("hero");

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

  return (
    <nav className="hidden md:flex items-center space-x-1">
      {navItems.map((item) => (
        <Link
          key={item.id}
          href={`#${item.id}`}
          className={cn(
            "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200",
            activeSection === item.id
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
          )}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById(item.id)?.scrollIntoView({
              behavior: "smooth",
            });
          }}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
