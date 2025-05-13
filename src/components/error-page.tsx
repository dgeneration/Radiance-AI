"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { ProfessionalButton } from "@/components/ui/professional-button";
import { AnimatedSection, AnimatedIcon } from "@/components/animations";
import { GradientHeading } from "@/components/ui/gradient-heading";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";

interface ErrorPageProps {
  statusCode?: number;
  title: string;
  description: string;
  message?: string;
  suggestions?: string[];
  primaryAction?: {
    label: string;
    href: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href: string;
    onClick?: () => void;
  };
  tertiaryAction?: {
    label: string;
    href: string;
    onClick?: () => void;
  };
  icon?: React.ReactNode;
  isDestructive?: boolean;
}

export function ErrorPage({
  statusCode,
  title,
  description,
  message,
  suggestions = [],
  primaryAction = { label: "Go to Home", href: "/" },
  secondaryAction,
  tertiaryAction,
  icon = <AlertCircle className="w-10 h-10" />,
  isDestructive = false,
}: ErrorPageProps) {


  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background/80 z-0 pointer-events-none"></div>
      <div className="absolute inset-0 opacity-5 z-0 bg-[url('/patterns/dot-pattern.svg')] pointer-events-none"></div>

      <AnimatedSection direction="up" delay={0.1} className="w-full max-w-md z-10">
        <Card className="bg-card/80 backdrop-blur-sm border border-primary/10 shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-3 mb-2">
              <AnimatedIcon
                icon={icon}
                className={`p-3 ${isDestructive ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'} rounded-full`}
                delay={0.3}
              />
              {statusCode && (
                <div className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {statusCode}
                </div>
              )}
            </div>
            <GradientHeading level={2} size="md" className="mb-0">
              {title}
            </GradientHeading>
            <CardDescription className="text-base">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && (
              <div className={`${isDestructive ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'} p-4 rounded-xl border ${isDestructive ? 'border-destructive/20' : 'border-primary/20'}`}>
                {message}
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  You might want to:
                </p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            {(primaryAction.href as string) === "#" && primaryAction.onClick ? (
              <ProfessionalButton
                variant="primary"
                fullWidth
                icon={(primaryAction.href as string) === "/" ? <Home className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                iconPosition="left"
                onClick={primaryAction.onClick}
              >
                {primaryAction.label}
              </ProfessionalButton>
            ) : (
              <ProfessionalButton
                asChild
                variant="primary"
                fullWidth
                icon={(primaryAction.href as string) === "/" ? <Home className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                iconPosition="left"
              >
                <Link href={primaryAction.href}>
                  {primaryAction.label}
                </Link>
              </ProfessionalButton>
            )}

            {secondaryAction && (
              (secondaryAction.href as string) === "#" && secondaryAction.onClick ? (
                <ProfessionalButton
                  variant="outline"
                  fullWidth
                  onClick={secondaryAction.onClick}
                >
                  {secondaryAction.label}
                </ProfessionalButton>
              ) : (
                <ProfessionalButton
                  asChild
                  variant="outline"
                  fullWidth
                >
                  <Link href={secondaryAction.href}>
                    {secondaryAction.label}
                  </Link>
                </ProfessionalButton>
              )
            )}

            {tertiaryAction && (
              (tertiaryAction.href as string) === "#" && tertiaryAction.onClick ? (
                <ProfessionalButton
                  variant="outline"
                  fullWidth
                  onClick={tertiaryAction.onClick}
                >
                  {tertiaryAction.label}
                </ProfessionalButton>
              ) : (
                <ProfessionalButton
                  asChild
                  variant="outline"
                  fullWidth
                >
                  <Link href={tertiaryAction.href}>
                    {tertiaryAction.label}
                  </Link>
                </ProfessionalButton>
              )
            )}
          </CardFooter>
        </Card>
      </AnimatedSection>
    </div>
  );
}
