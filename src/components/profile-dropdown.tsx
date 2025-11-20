"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaSignOutAlt } from "react-icons/fa";
import { signout } from "@/app/auth/login/actions";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

interface ProfileDropdownProps {
  user: User;
}

export function ProfileDropdown({ user }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [profileImage] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch user profile data
  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const supabase = createClient();
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .maybeSingle();

        if (!error && profile) {
          setFirstName(profile.first_name);
        } else {
          // Fallback to email username
          const emailName = user.email?.split('@')[0] || null;
          setFirstName(emailName);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    }

    fetchUserProfile();
  }, [user]);

  // Handle mouse enter/leave for dropdown
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 300); // Small delay to make interaction smoother
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Get initials for avatar
  const getInitials = () => {
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    return user.email?.charAt(0).toUpperCase() || "U";
  };

  return (
    <div
      className="relative select-none"
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 hover:from-primary/30 hover:to-accent/30 transition-all duration-300 border border-primary/10 hover:border-primary/20 shadow-sm hover:shadow-md cursor-pointer"
        aria-label="Profile menu"
      >
        {profileImage ? (
          <Image
            src={profileImage}
            alt="Profile"
            width={40}
            height={40}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span className="text-lg font-medium text-primary translate-none">{getInitials()}</span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-56 rounded-xl overflow-hidden bg-card/90 backdrop-blur-sm border border-primary/10 shadow-lg z-50"
          >
            <div className="p-4 border-b border-primary/10">
              <p className="text-sm font-medium text-foreground">
                Signed in as
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
            <div className="py-2">
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-primary/10 transition-colors duration-200"
              >
                <FaUser className="text-primary/70" />
                <span>My Profile</span>
              </Link>
              <form action={signout}>
                <button
                  type="submit"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-primary/10 transition-colors duration-200 w-full text-left cursor-pointer"
                >
                  <FaSignOutAlt className="text-primary/70" />
                  <span>Sign Out</span>
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
