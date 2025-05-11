"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { FaQuoteLeft } from "react-icons/fa";
import { cn } from "@/lib/utils";

interface TestimonialCardProps {
  quote: string;
  author: string;
  role?: string;
  avatarSrc?: string;
  className?: string;
  isAccent?: boolean;
}

export function TestimonialCard({
  quote,
  author,
  role,
  avatarSrc,
  className,
  isAccent = false,
}: TestimonialCardProps) {
  return (
    <motion.div
      className={cn(
        "bg-card/80 backdrop-blur-sm p-8 rounded-2xl border shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col",
        isAccent ? "border-accent/10 hover:border-accent/30" : "border-primary/10 hover:border-primary/30",
        className
      )}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center mb-6",
        isAccent ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
      )}>
        <FaQuoteLeft size={16} />
      </div>

      <p className="text-muted-foreground mb-6 flex-grow italic">&quot;{quote}&quot;</p>

      <div className="flex items-center mt-auto">
        {avatarSrc ? (
          <div className="w-12 h-12 rounded-full overflow-hidden mr-4 border-2 border-primary/20">
            <Image src={avatarSrc} alt={author} width={48} height={48} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className={cn(
            "w-12 h-12 rounded-full mr-4 flex items-center justify-center text-xl font-bold",
            isAccent ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"
          )}>
            {author.charAt(0)}
          </div>
        )}
        <div>
          <p className="font-medium text-foreground">{author}</p>
          {role && <p className="text-sm text-muted-foreground">{role}</p>}
        </div>
      </div>
    </motion.div>
  );
}
