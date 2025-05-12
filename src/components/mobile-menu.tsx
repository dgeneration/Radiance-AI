"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  FaHome,
  FaStethoscope,
  FaHistory,
  FaUser,
  FaBrain,
  FaListAlt
} from "react-icons/fa";

export function MobileMenu() {
  const pathname = usePathname();

  // Define menu items with proper names and icons
  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <FaHome className="h-5 w-5" />,
      activePattern: /^\/dashboard$/
    },
    {
      name: "Diagnosis",
      path: "/diagnosis",
      icon: <FaStethoscope className="h-5 w-5" />,
      activePattern: /^\/diagnosis$/
    },
    {
      name: "Chain Dx",
      path: "/dashboard/chain-diagnosis",
      icon: <FaBrain className="h-5 w-5" />,
      activePattern: /^\/dashboard\/chain-diagnosis$/
    },
    {
      name: "History",
      path: "/dashboard/history",
      icon: <FaHistory className="h-5 w-5" />,
      activePattern: /^\/dashboard\/history$/
    },
    {
      name: "Chain Hx",
      path: "/dashboard/chain-diagnosis/history",
      icon: <FaListAlt className="h-5 w-5" />,
      activePattern: /^\/dashboard\/chain-diagnosis\/history$/
    },
    {
      name: "Profile",
      path: "/dashboard/profile",
      icon: <FaUser className="h-5 w-5" />,
      activePattern: /^\/dashboard\/profile/
    }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 backdrop-blur-md bg-background/80 border-t border-primary/10 py-3 shadow-sm z-50 select-none">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 z-0"></div>
      <div className="flex justify-around items-center relative z-10">
        {menuItems.map((item) => {
          const isActive = item.activePattern.test(pathname);

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center relative ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              } transition-colors`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-3 w-1/2 h-1 bg-gradient-to-r from-primary to-accent rounded-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}

              <div className={`p-2 rounded-full ${
                isActive
                  ? "bg-primary/10"
                  : "bg-transparent hover:bg-primary/5"
              } transition-colors`}>
                {item.icon}
              </div>

              <span className="text-xs mt-1 font-medium">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
