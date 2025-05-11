"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeaderButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "outline";
  asChild?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  onClick?: () => void;
}

export function HeaderButton({
  children,
  className,
  variant = "primary",
  asChild = false,
  icon,
  iconPosition = "right",
  onClick,
  ...props
}: HeaderButtonProps & Omit<React.ComponentProps<typeof Button>, "variant">) {
  // Define variant classes
  const variantClasses = {
    primary: "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-sm hover:shadow-md hover:opacity-90 border-0 hover:text-primary-foreground overflow-hidden",
    outline: "bg-transparent border border-primary/20 text-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground shadow-sm hover:shadow-md overflow-hidden",
  };

  // Combine classes
  const buttonClasses = cn(
    "relative overflow-hidden transition-colors duration-200 font-medium flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-md",
    variantClasses[variant],
    className
  );

  return (
    <div className="relative">
      {asChild ? (
        <Button
          asChild
          className={buttonClasses}
          onClick={onClick}
          {...props}
        >
          {React.cloneElement(React.Children.only(children as React.ReactElement), {
            className: "flex items-center gap-2 justify-center w-full h-full",
            children: (
              <>
                {iconPosition === "left" && icon && (
                  <span className={`relative z-10 ${variant === "primary" ? "text-shadow-sm" : ""}`}>{icon}</span>
                )}
                <span className={`relative z-10 ${variant === "primary" ? "text-shadow-sm" : ""}`}>{(children as React.ReactElement).props.children}</span>
                {iconPosition === "right" && icon && (
                  <span className={`relative z-10 group-hover:translate-x-0.5 transition-transform ${variant === "primary" ? "text-shadow-sm" : ""}`}>
                    {icon}
                  </span>
                )}
                
                {/* Subtle gradient overlay for primary variant */}
                {variant === "primary" && (
                  <span className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-gradient-x opacity-0 group-hover:opacity-70 transition-opacity duration-200 z-0 pointer-events-none"></span>
                )}
              </>
            )
          })}
        </Button>
      ) : (
        <Button
          className={buttonClasses}
          onClick={onClick}
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
          
          {/* Subtle gradient overlay for primary variant */}
          {variant === "primary" && (
            <span className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-gradient-x opacity-0 group-hover:opacity-70 transition-opacity duration-200 z-0 pointer-events-none"></span>
          )}
        </Button>
      )}
    </div>
  );
}
