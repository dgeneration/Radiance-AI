"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles } from "lucide-react";

interface AnimatedCardProps {
  title: string;
  description: string;
  badgeText: string;
  icon: React.ReactNode;
  features: Array<{
    icon: React.ReactNode;
    text: string;
  }>;
  buttonText: string;
  buttonLink: string;
  isPrimary?: boolean;
  direction?: "left" | "right";
  delay?: number;
}

export function AnimatedCard({
  title,
  description,
  badgeText,
  icon,
  features,
  buttonText,
  buttonLink,
  isPrimary = true,
  direction = "left",
  delay = 0.2,
}: AnimatedCardProps) {
  const primaryColor = isPrimary ? "primary" : "accent";

  return (
    <motion.div
      className={`bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-${primaryColor}/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-${primaryColor}/30 group h-full flex flex-col`}
      initial={{ opacity: 0, x: direction === "left" ? -50 : 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -10 }}
    >
      <div className="flex items-center gap-4 mb-6">
        <div className={`w-16 h-16 bg-gradient-to-br from-${primaryColor}/20 to-${primaryColor}/10 rounded-2xl flex items-center justify-center group-hover:from-${primaryColor}/30 group-hover:to-${primaryColor}/20 transition-colors`}>
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
          <Badge
            variant="outline"
            className={`bg-${primaryColor}/10 text-${primaryColor} border-${primaryColor}/20 px-2 py-0.5 text-xs mt-1`}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            {badgeText}
          </Badge>
        </div>
      </div>

      <div className="space-y-4 mb-6 flex-grow">
        <p className="text-muted-foreground">
          {description}
        </p>

        <div className="space-y-2 mt-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className={`w-5 h-5 rounded-full bg-${primaryColor}/10 flex items-center justify-center flex-shrink-0 mt-0.5`}>
                {feature.icon}
              </div>
              <p className="text-sm text-muted-foreground">{feature.text}</p>
            </div>
          ))}
        </div>
      </div>

      <Link href={buttonLink} className="mt-auto">
        <Button className={`w-full bg-gradient-to-r from-${primaryColor} to-${primaryColor}/90 hover:from-${primaryColor}/90 hover:to-${primaryColor}/80 text-${primaryColor}-foreground shadow-md hover:shadow-lg transition-all duration-300 group`}>
          {buttonText}
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </Link>
    </motion.div>
  );
}
