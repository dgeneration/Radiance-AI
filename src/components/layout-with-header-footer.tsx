"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { User } from "@supabase/supabase-js";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";

interface LayoutWithHeaderFooterProps {
  children: React.ReactNode;
  user: User | null;
}

export function LayoutWithHeaderFooter({ children, user }: LayoutWithHeaderFooterProps) {
  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Sonar Overlay - Only visible on PC/larger screens */}
      <div className="hidden lg:block fixed bottom-8 right-8 z-30">
        <Link
          href="https://sonar.perplexity.ai/"
          target="_blank"
          rel="noopener noreferrer"
          title="Built with Sonar API"
          className="block"
        >
          <motion.div
            className="relative opacity-100 hover:opacity-80 transition-opacity duration-500 cursor-pointer"
            animate={{
              y: [0, -5, 0],
              rotate: [0, 1, 0, -1, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Image
              src="/images/sonoar-rounded.png"
              alt="Radiance AI Sonar - Built with Sonar API"
              width={180}
              height={180}
              className="w-28 h-28 xl:w-36 xl:h-36 2xl:w-44 2xl:h-44 object-contain filter drop-shadow-lg"
              priority={false}
            />
          </motion.div>
        </Link>
      </div>

      <Header user={user} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
