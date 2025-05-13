"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProfessionalButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "default" | "sm" | "lg" | "xl";
  asChild?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

export function ProfessionalButton({
  children,
  className,
  variant = "primary",
  size = "default",
  asChild = false,
  icon,
  iconPosition = "right",
  fullWidth = false,
  disabled = false,
  onClick,
  type,
  ...props
}: ProfessionalButtonProps & Omit<React.ComponentProps<typeof Button>, "variant" | "size">) {
  // Define size classes with responsive sizing
  const sizeClasses = {
    sm: "text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg",
    default: "text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl",
    lg: "text-base sm:text-lg px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl",
    xl: "text-lg sm:text-xl px-6 sm:px-10 py-3 sm:py-4 rounded-xl",
  };

  // Define variant classes
  const variantClasses = {
    primary: "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg hover:shadow-xl hover:opacity-90 border-0 hover:text-primary-foreground overflow-hidden",
    secondary: "bg-card/80 backdrop-blur-sm border border-primary/20 text-foreground hover:border-primary/40 hover:bg-card/90 hover:text-foreground shadow-lg hover:shadow-xl overflow-hidden",
    outline: "bg-transparent border border-primary/20 text-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground shadow-md hover:shadow-lg overflow-hidden",
  };

  // Combine classes
  const buttonClasses = cn(
    "relative overflow-hidden transition-all duration-300 font-medium flex items-center justify-center gap-2 select-text",
    sizeClasses[size],
    variantClasses[variant],
    fullWidth ? "w-full" : "",
    disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
    className
  );

  const childContent = React.Children.toArray(children);
  return (
    <motion.div
      whileHover={disabled ? {} : { scale: 1.01 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={`${fullWidth ? "w-full" : "inline-block"} group ${disabled ? "cursor-not-allowed" : ""}`}
    >
      {asChild ? (
        <Button
          asChild
          className={buttonClasses}
          onClick={onClick}
          disabled={disabled}
          type={type}
          {...props}
        >
          {React.cloneElement(
            React.Children.only(children) as React.ReactElement<unknown>,
            {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...((React.Children.only(children) as React.ReactElement<any>).props),
              className: cn(
                "flex items-center gap-2 justify-center w-full h-full",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (React.Children.only(children) as React.ReactElement<any>).props.className
              ),
              children: (
                <>
                  {iconPosition === "left" && icon && (
                    <span className={`relative z-10 ${variant === "primary" ? "text-shadow-sm" : ""}`}>{icon}</span>
                  )}
                  <span className={`relative z-10 ${variant === "primary" ? "text-shadow-sm" : ""}`}>
                    {childContent}
                  </span>
                  {iconPosition === "right" && icon && (
                    <span className={`relative z-10 group-hover:translate-x-0.5 transition-transform ${variant === "primary" ? "text-shadow-sm" : ""}`}>
                      {icon}
                    </span>
                  )}
                  {variant === "primary" && (
                    <span className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-gradient-x opacity-0 group-hover:opacity-70 transition-opacity duration-300 z-0 pointer-events-none" />
                  )}
                </>
              )
            }
          )}
        </Button>
      ) : (
        <Button
          className={buttonClasses}
          onClick={onClick}
          disabled={disabled}
          type={type}
          {...props}
        >
          {iconPosition === "left" && icon && (
            <span className={`relative z-10 ${variant === "primary" ? "text-shadow-sm" : ""}`}>{icon}</span>
          )}
          <span className={`relative z-10 ${variant === "primary" ? "text-shadow-sm" : ""}`}>{children}</span>
          {iconPosition === "right" && icon && (
            <span className={`relative z-10 group-hover:translate-x-0.5 transition-transform ${variant === "primary" ? "text-shadow-sm" : ""}`}>
              {icon}
            </span>
          )}
          {variant === "primary" && (
            <span className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-gradient-x opacity-0 group-hover:opacity-70 transition-opacity duration-300 z-0 pointer-events-none" />
          )}
        </Button>
      )}
    </motion.div>
  );
}
