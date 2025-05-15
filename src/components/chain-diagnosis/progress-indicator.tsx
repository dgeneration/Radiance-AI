"use client";

import React from 'react';
import { useChainDiagnosis } from '@/contexts/chain-diagnosis-context';
import {
  Check, Loader2, AlertCircle, Activity, Sparkles, Brain, Stethoscope,
  TestTube, Apple, Pill, Calendar, Microscope, HeartPulse, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChainDiagnosisSession } from '@/types/chain-diagnosis';



// Helper function to get the appropriate icon for each step
function getStepIcon(title: string | undefined, size: number = 24) {
  // Safety check for undefined or empty title
  if (!title) {
    return <Activity size={size} />;
  }

  switch (title) {
    case "Medical Analyst":
      return <Microscope size={size} />;
    case "General Physician":
      return <Stethoscope size={size} />;
    case "Specialist Doctor":
      return <HeartPulse size={size} />;
    case "Pathologist":
      return <TestTube size={size} />;
    case "Nutritionist":
      return <Apple size={size} />;
    case "Pharmacist":
      return <Pill size={size} />;
    case "Follow-up Specialist":
      return <Calendar size={size} />;
    case "Radiance AI Summarizer":
      return <Brain size={size} />;
    default:
      return <Activity size={size} />;
  }
}

// Single three-circle layout component
function ThreeCircleLayout({
  steps,
  currentStep,
  isLoading,
  isStreaming,
  error,
  onContinue,
  isProcessing,
}: {
  steps: { title: string; description: string }[];
  currentStep: number;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  onContinue?: () => void;
  isProcessing?: boolean;
}) {
  // Get current step info with safety check
  // If currentStep is beyond the array length, use the last step but mark as completed
  const currentStepInfo = currentStep < steps.length
    ? steps[currentStep]
    : steps.length > 0
      ? { ...steps[steps.length - 1], description: "Completed" }
      : { title: "Unknown", description: "Completed" };

  // Get previous step info (if exists)
  const prevStepIndex = currentStep > 0 ? currentStep - 1 : null;
  const prevStepInfo = prevStepIndex !== null && prevStepIndex < steps.length ? steps[prevStepIndex] : null;

  // Get next step info (if exists)
  const nextStepIndex = currentStep < steps.length - 1 ? currentStep + 1 : null;
  const nextStepInfo = nextStepIndex !== null && nextStepIndex < steps.length ? steps[nextStepIndex] : null;

  // Show loading animation if streaming or loading
  const showLoading = isLoading || isStreaming;

  // Handle responsive icon sizes
  const [iconSize, setIconSize] = React.useState(40);

  React.useEffect(() => {
    // Set initial size
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth < 640) {
          setIconSize(32);
        } else if (window.innerWidth < 768) {
          setIconSize(36);
        } else {
          setIconSize(40);
        }
      }
    };

    // Set initial size
    handleResize();

    // Add event listener
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
    }

    // Cleanup
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  // Get icon with responsive size and safety check
  const currentIcon = currentStepInfo && currentStepInfo.title ? getStepIcon(currentStepInfo.title, iconSize) : <Activity size={iconSize} />;

  return (
    <div className="relative py-8">
      {/* Main three-circle container */}
      <div className="flex flex-col items-center">
        {/* Circles container - vertical for mobile, horizontal for desktop */}
        <motion.div
          className="flex flex-col md:flex-row items-center justify-center gap-16 md:gap-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Previous step circle (left) - only show if there's a previous step */}
          {prevStepInfo ? (
            <div className="relative">
              <motion.div
                className={cn(
                  "w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-md z-10 relative",
                  "bg-gradient-to-br from-green-500 to-primary text-white"
                )}
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  boxShadow: "0 0 15px rgba(34, 197, 94, 0.3)"
                }}
                transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
              >
                <Check className="h-10 w-10" />
              </motion.div>

              {/* Step number badge */}
              <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 z-20">
                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shadow-sm bg-green-500 text-white">
                  {prevStepIndex !== null ? prevStepIndex + 1 : 0}
                </div>
              </div>

              {/* Connector line from previous to current - desktop */}
              <motion.div
                className="absolute top-1/2 -right-8 w-8 h-2 -translate-y-1/2
                           bg-gradient-to-r from-green-500 to-primary
                           hidden md:block"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />

              {/* Connector line from previous to current - mobile (vertical) */}
              <div className="absolute -bottom-12 right-1/2 translate-x-1/2 z-0 md:hidden" style={{ height: '55px' }}>
                <motion.div
                  className="absolute top-0 left-0 right-0 mx-auto w-2 h-full
                             bg-gradient-to-b from-green-500 to-primary"
                  initial={{ scaleY: 0, originY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  style={{ boxShadow: '0 0 8px rgba(34, 197, 94, 0.3)' }}
                />
              </div>

              {/* Previous step title - responsive position */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-24 text-center hidden md:block">
                <p className="text-xs font-medium text-green-500 truncate">{prevStepInfo.title}</p>
              </div>
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-26 text-center md:hidden">
                <p className="text-xs font-medium text-green-500 truncate">{prevStepInfo.title}</p>
              </div>
            </div>
          ) : null}

          {/* Current step circle (center, larger) */}
          <div className="relative">
            {/* Enhanced cosmic nebula effect background */}
            <div className="absolute inset-0 rounded-full overflow-hidden" style={{ padding: '16px' }}>
              {/* Dark space background */}
              <div className="absolute inset-0 rounded-full bg-black/80"></div>

              {/* Base cosmic glow */}
              <motion.div
                className="absolute inset-0 rounded-full"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  background: "radial-gradient(circle, rgba(88, 24, 69, 0.5) 0%, rgba(13, 17, 23, 0.8) 70%)"
                }}
                transition={{ duration: 0.5 }}
              />

              {/* Primary nebula cloud - magenta/purple */}
              <motion.div
                className="absolute inset-0 rounded-full opacity-80 mix-blend-screen"
                style={{
                  background: "radial-gradient(ellipse at 40% 40%, rgba(255, 0, 255, 0.4), transparent 70%), radial-gradient(ellipse at 60% 60%, rgba(138, 43, 226, 0.4), transparent 70%)"
                }}
                animate={{
                  filter: ["blur(10px)", "blur(12px)", "blur(10px)"],
                  background: [
                    "radial-gradient(ellipse at 40% 40%, rgba(255, 0, 255, 0.4), transparent 70%), radial-gradient(ellipse at 60% 60%, rgba(138, 43, 226, 0.4), transparent 70%)",
                    "radial-gradient(ellipse at 45% 45%, rgba(255, 0, 255, 0.4), transparent 70%), radial-gradient(ellipse at 55% 55%, rgba(138, 43, 226, 0.4), transparent 70%)",
                    "radial-gradient(ellipse at 50% 50%, rgba(255, 0, 255, 0.4), transparent 70%), radial-gradient(ellipse at 50% 50%, rgba(138, 43, 226, 0.4), transparent 70%)",
                    "radial-gradient(ellipse at 55% 55%, rgba(255, 0, 255, 0.4), transparent 70%), radial-gradient(ellipse at 45% 45%, rgba(138, 43, 226, 0.4), transparent 70%)",
                    "radial-gradient(ellipse at 60% 60%, rgba(255, 0, 255, 0.4), transparent 70%), radial-gradient(ellipse at 40% 40%, rgba(138, 43, 226, 0.4), transparent 70%)"
                  ]
                }}
                transition={{
                  duration: 25,
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
              />

              {/* Secondary nebula cloud - blue/cyan */}
              <motion.div
                className="absolute inset-0 rounded-full opacity-70 mix-blend-screen"
                style={{
                  background: "radial-gradient(ellipse at 30% 60%, rgba(0, 191, 255, 0.5), transparent 70%), radial-gradient(ellipse at 70% 40%, rgba(64, 224, 208, 0.5), transparent 70%)"
                }}
                animate={{
                  filter: ["blur(8px)", "blur(10px)", "blur(8px)"],
                  background: [
                    "radial-gradient(ellipse at 30% 60%, rgba(0, 191, 255, 0.5), transparent 70%), radial-gradient(ellipse at 70% 40%, rgba(64, 224, 208, 0.5), transparent 70%)",
                    "radial-gradient(ellipse at 35% 55%, rgba(0, 191, 255, 0.5), transparent 70%), radial-gradient(ellipse at 65% 45%, rgba(64, 224, 208, 0.5), transparent 70%)",
                    "radial-gradient(ellipse at 40% 50%, rgba(0, 191, 255, 0.5), transparent 70%), radial-gradient(ellipse at 60% 50%, rgba(64, 224, 208, 0.5), transparent 70%)",
                    "radial-gradient(ellipse at 45% 45%, rgba(0, 191, 255, 0.5), transparent 70%), radial-gradient(ellipse at 55% 55%, rgba(64, 224, 208, 0.5), transparent 70%)",
                    "radial-gradient(ellipse at 50% 40%, rgba(0, 191, 255, 0.5), transparent 70%), radial-gradient(ellipse at 50% 60%, rgba(64, 224, 208, 0.5), transparent 70%)"
                  ]
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
              />

              {/* Tertiary nebula cloud - orange/red */}
              <motion.div
                className="absolute inset-0 rounded-full opacity-60 mix-blend-screen"
                style={{
                  background: "radial-gradient(ellipse at 60% 30%, rgba(255, 69, 0, 0.4), transparent 70%), radial-gradient(ellipse at 40% 70%, rgba(255, 140, 0, 0.4), transparent 70%)"
                }}
                animate={{
                  filter: ["blur(12px)", "blur(15px)", "blur(12px)"],
                  background: [
                    "radial-gradient(ellipse at 60% 30%, rgba(255, 69, 0, 0.4), transparent 70%), radial-gradient(ellipse at 40% 70%, rgba(255, 140, 0, 0.4), transparent 70%)",
                    "radial-gradient(ellipse at 55% 35%, rgba(255, 69, 0, 0.4), transparent 70%), radial-gradient(ellipse at 45% 65%, rgba(255, 140, 0, 0.4), transparent 70%)",
                    "radial-gradient(ellipse at 50% 40%, rgba(255, 69, 0, 0.4), transparent 70%), radial-gradient(ellipse at 50% 60%, rgba(255, 140, 0, 0.4), transparent 70%)",
                    "radial-gradient(ellipse at 45% 45%, rgba(255, 69, 0, 0.4), transparent 70%), radial-gradient(ellipse at 55% 55%, rgba(255, 140, 0, 0.4), transparent 70%)",
                    "radial-gradient(ellipse at 40% 50%, rgba(255, 69, 0, 0.4), transparent 70%), radial-gradient(ellipse at 60% 50%, rgba(255, 140, 0, 0.4), transparent 70%)"
                  ]
                }}
                transition={{
                  duration: 30,
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
              />

              {/* Swirling cosmic dust */}
              <motion.div
                className="absolute inset-0 rounded-full opacity-30"
                style={{
                  backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPgogIDxmaWx0ZXIgaWQ9Im5vaXNlIj4KICAgIDxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIwLjA1IiBudW1PY3RhdmVzPSIyIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+CiAgICA8ZmVDb2xvck1hdHJpeCB0eXBlPSJzYXR1cmF0ZSIgdmFsdWVzPSIwIi8+CiAgPC9maWx0ZXI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMC4wNSIvPgo8L3N2Zz4=')"
                }}
                animate={{
                  rotate: [0, 360]
                }}
                transition={{
                  duration: 100,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />

              {/* Enhanced star field with varying sizes */}
              <div className="absolute inset-0 rounded-full overflow-hidden">
                {/* Bright stars */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div
                    key={`bright-${i}`}
                    className="absolute bg-white rounded-full shadow-glow"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      width: `${2 + Math.random() * 2}px`,
                      height: `${2 + Math.random() * 2}px`,
                      boxShadow: "0 0 4px 1px rgba(255, 255, 255, 0.8)"
                    }}
                    animate={{
                      opacity: [0.7, 1, 0.7],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 3,
                      repeat: Infinity,
                      repeatType: "mirror"
                    }}
                  />
                ))}

                {/* Medium stars */}
                {Array.from({ length: 15 }).map((_, i) => (
                  <motion.div
                    key={`medium-${i}`}
                    className="absolute bg-white rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      width: `${1 + Math.random() * 1}px`,
                      height: `${1 + Math.random() * 1}px`,
                      boxShadow: "0 0 2px rgba(255, 255, 255, 0.6)"
                    }}
                    animate={{
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1 + Math.random() * 3,
                      repeat: Infinity,
                      repeatType: "mirror",
                      delay: Math.random() * 2
                    }}
                  />
                ))}

                {/* Small stars/dust */}
                {Array.from({ length: 30 }).map((_, i) => (
                  <motion.div
                    key={`small-${i}`}
                    className="absolute bg-white rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      width: `${0.5 + Math.random() * 0.5}px`,
                      height: `${0.5 + Math.random() * 0.5}px`,
                    }}
                    animate={{
                      opacity: [0, 0.7, 0],
                    }}
                    transition={{
                      duration: 1 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 3
                    }}
                  />
                ))}
              </div>

              {/* Cosmic rays/light streaks */}
              {Array.from({ length: 5 }).map((_, i) => {
                const angle = Math.random() * 360;
                const length = 10 + Math.random() * 20;
                return (
                  <motion.div
                    key={`ray-${i}`}
                    className="absolute bg-white/30 blur-sm"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      width: `${length}px`,
                      height: '1px',
                      transform: `rotate(${angle}deg)`,
                    }}
                    animate={{
                      opacity: [0, 0.5, 0],
                      scale: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 4,
                      repeat: Infinity,
                      delay: Math.random() * 5
                    }}
                  />
                );
              })}
            </div>

            {/* Pulsing animation */}
            {showLoading && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary/10"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 0.2, 0.7]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "loop"
                  }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full bg-accent/10"
                  animate={{
                    scale: [1.1, 1.3, 1.1],
                    opacity: [0.5, 0.1, 0.5]
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    repeatType: "loop",
                    delay: 0.5
                  }}
                />
              </>
            )}

            {/* Flying particles around the center circle */}
            <div className="absolute inset-0 w-full h-full" style={{ padding: '0px' }}>
              {/* Small flying particles with improved distribution */}
              {Array.from({ length: 20 }).map((_, i) => {
                // Distribute particles evenly around the circle
                const sectionAngle = 360 / 20; // Divide the circle into 20 sections
                const baseAngle = i * sectionAngle; // Base angle for this particle

                // Add some randomness but keep within section to ensure distribution
                const startAngle = baseAngle + (Math.random() * sectionAngle * 0.6 - sectionAngle * 0.3);

                // Vary orbit shapes - some circular, some elliptical
                const orbitSizeX = 180 + Math.random() * 40; // X-axis diameter
                const orbitSizeY = 180 + Math.random() * 40; // Y-axis diameter
                const isElliptical = i % 5 === 0; // Every 5th particle has elliptical orbit

                // Vary speeds based on position to prevent clustering
                const speedFactor = 0.8 + (i % 4) * 0.15; // Creates 4 speed groups
                const speed = (10 + Math.random() * 10) * speedFactor;

                // Stagger delays based on position
                const delay = (i % 5) * 1.2; // 5 different delay groups

                // Size variation
                const size = 0.5 + Math.random() * 1.5;

                // Direction of orbit - some clockwise, some counter-clockwise
                const direction = i % 2 === 0 ? 1 : -1;

                // Color based on position to ensure even distribution
                // Use purple colors when loading/streaming
                const colorGroup = i % 3;
                const color = showLoading
                  ? colorGroup === 0
                    ? 'rgba(147, 51, 234, 0.9)' // Purple (purple-600)
                    : colorGroup === 1
                      ? 'rgba(168, 85, 247, 0.9)' // Light purple (purple-500)
                      : 'rgba(192, 132, 252, 0.9)' // Very light purple (purple-400)
                  : colorGroup === 0
                    ? 'rgba(0, 198, 215, 0.9)' // Default cyan
                    : colorGroup === 1
                      ? 'rgba(29, 233, 182, 0.9)' // Default teal
                      : 'rgba(255, 255, 255, 0.9)'; // Default white

                const glow = showLoading
                  ? colorGroup === 0
                    ? 'rgba(147, 51, 234, 0.8)' // Purple glow
                    : colorGroup === 1
                      ? 'rgba(168, 85, 247, 0.8)' // Light purple glow
                      : 'rgba(192, 132, 252, 0.8)' // Very light purple glow
                  : colorGroup === 0
                    ? 'rgba(0, 198, 215, 0.8)' // Default cyan glow
                    : colorGroup === 1
                      ? 'rgba(29, 233, 182, 0.8)' // Default teal glow
                      : 'rgba(255, 255, 255, 0.8)'; // Default white glow

                return (
                  <motion.div
                    key={`particle-${i}`}
                    className="absolute rounded-full"
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      top: '50%',
                      left: '50%',
                      backgroundColor: color,
                      boxShadow: `0 0 ${size + 1}px ${size/2}px ${glow}`,
                      marginTop: `-${size/2}px`,
                      marginLeft: `-${size/2}px`,
                    }}
                    animate={{
                      x: Array.from({ length: 36 }).map((_, j) => {
                        const angle = (startAngle + j * 10 * direction) * (Math.PI / 180);
                        // For elliptical orbits, modify the radius based on angle
                        const xRadius = isElliptical
                          ? orbitSizeX/2 * (0.8 + 0.2 * Math.sin(angle * 2))
                          : orbitSizeX/2;
                        return Math.cos(angle) * xRadius;
                      }),
                      y: Array.from({ length: 36 }).map((_, j) => {
                        const angle = (startAngle + j * 10 * direction) * (Math.PI / 180);
                        // For elliptical orbits, modify the radius based on angle
                        const yRadius = isElliptical
                          ? orbitSizeY/2 * (0.8 + 0.2 * Math.cos(angle * 2))
                          : orbitSizeY/2;
                        return Math.sin(angle) * yRadius;
                      }),
                      opacity: Array.from({ length: 36 }).map((_, j) => {
                        // Create a smooth fade in/out at the beginning/end of the animation
                        const normalizedPos = j / 35;
                        if (normalizedPos < 0.1) {
                          return normalizedPos * 10 * 0.8; // Fade in from 0 to 0.8
                        } else if (normalizedPos > 0.9) {
                          return (1 - (normalizedPos - 0.9) * 10) * 0.8; // Fade out from 0.8 to 0
                        } else {
                          return 0.8; // Full opacity in the middle
                        }
                      }),
                      scale: [0.8, 1.2, 0.8],
                    }}
                    transition={{
                      duration: speed,
                      repeat: Infinity,
                      delay,
                      ease: "linear",
                      times: Array.from({ length: 36 }).map((_, j) => j / 35)
                    }}
                  />
                );
              })}

              {/* Dotted particles that move randomly with improved distribution */}
              {Array.from({ length: 15 }).map((_, i) => {
                // Distribute initial positions in different quadrants
                const quadrant = i % 4; // 0: top-right, 1: bottom-right, 2: bottom-left, 3: top-left
                const quadrantX = quadrant === 0 || quadrant === 1 ? 1 : -1;
                const quadrantY = quadrant === 0 || quadrant === 3 ? -1 : 1;

                // Size variation
                const size = 0.5 + Math.random() * 1;

                // Color based on position to ensure even distribution
                // Use purple colors when loading/streaming
                const colorGroup = i % 3;
                const color = showLoading
                  ? colorGroup === 0
                    ? 'rgba(147, 51, 234, 0.8)' // Purple (purple-600)
                    : colorGroup === 1
                      ? 'rgba(168, 85, 247, 0.8)' // Light purple (purple-500)
                      : 'rgba(192, 132, 252, 0.8)' // Very light purple (purple-400)
                  : colorGroup === 0
                    ? 'rgba(0, 198, 215, 0.8)' // Default cyan
                    : colorGroup === 1
                      ? 'rgba(29, 233, 182, 0.8)' // Default teal
                      : 'rgba(255, 255, 255, 0.8)'; // Default white

                const glow = showLoading
                  ? colorGroup === 0
                    ? '0 0 3px rgba(147, 51, 234, 0.6)' // Purple glow
                    : colorGroup === 1
                      ? '0 0 3px rgba(168, 85, 247, 0.6)' // Light purple glow
                      : '0 0 3px rgba(192, 132, 252, 0.6)' // Very light purple glow
                  : colorGroup === 0
                    ? '0 0 3px rgba(0, 198, 215, 0.6)' // Default cyan glow
                    : colorGroup === 1
                      ? '0 0 3px rgba(29, 233, 182, 0.6)' // Default teal glow
                      : '0 0 3px rgba(255, 255, 255, 0.6)'; // Default white glow

                // Generate waypoints that stay mostly in the assigned quadrant
                const generateWaypoint = () => {
                  const baseX = quadrantX * (50 + Math.random() * 100);
                  const baseY = quadrantY * (50 + Math.random() * 100);
                  // Allow some wandering outside the quadrant (20% chance)
                  return Math.random() > 0.2
                    ? { x: baseX, y: baseY }
                    : {
                        x: (Math.random() - 0.5) * 200,
                        y: (Math.random() - 0.5) * 200
                      };
                };

                // Generate 5 waypoints for more complex paths
                const waypoints = Array.from({ length: 5 }).map(() => generateWaypoint());

                // Staggered delays based on quadrant
                const delay = (i % 5) * 1.5;

                // Varied durations to prevent synchronization
                const duration = 8 + (i % 3) * 4 + Math.random() * 5;

                return (
                  <motion.div
                    key={`dot-${i}`}
                    className="absolute rounded-full"
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      top: '50%',
                      left: '50%',
                      backgroundColor: color,
                      boxShadow: glow,
                    }}
                    initial={{
                      x: quadrantX * (50 + Math.random() * 50),
                      y: quadrantY * (50 + Math.random() * 50),
                      opacity: 0,
                      scale: 0
                    }}
                    animate={{
                      x: waypoints.map(wp => wp.x),
                      y: waypoints.map(wp => wp.y),
                      opacity: [0, 0.7, 0.8, 0.7, 0],
                      scale: [0, 1, 1.2, 1, 0],
                    }}
                    transition={{
                      duration,
                      repeat: Infinity,
                      delay,
                      ease: "easeInOut",
                      times: [0, 0.2, 0.5, 0.8, 1] // More complex opacity/scale pattern
                    }}
                  />
                );
              })}
            </div>

            {/* Main circle with icon - now with a pumping animation */}
            <motion.div
              className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center shadow-lg z-20 bg-gradient-to-br from-primary/60 to-accent/60 text-white backdrop-blur-sm border border-white/20"
              animate={{
                scale: [1, 1.05, 1.08, 1.05, 1], // Pumping animation
                boxShadow: [
                  "0 0 20px rgba(0, 198, 215, 0.4)",
                  "0 0 30px rgba(0, 198, 215, 0.5)",
                  "0 0 40px rgba(0, 198, 215, 0.6)",
                  "0 0 30px rgba(0, 198, 215, 0.5)",
                  "0 0 20px rgba(0, 198, 215, 0.4)"
                ]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              whileHover={{ scale: 1.1 }}
            >
              {/* Outer glow ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-white/30"
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                  boxShadow: [
                    "0 0 10px 2px rgba(255, 255, 255, 0.2)",
                    "0 0 15px 3px rgba(255, 255, 255, 0.3)",
                    "0 0 10px 2px rgba(255, 255, 255, 0.2)"
                  ]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
              />

              {/* Glow effect behind icon */}
              <div className="absolute inset-0 rounded-full flex items-center justify-center">
                <motion.div
                  className="w-24 h-24 rounded-full bg-white/20 blur-md"
                  animate={{
                    opacity: [0.3, 0.7, 0.3],
                    scale: [0.8, 1, 0.8]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                />
              </div>

              {showLoading ? (
                <div className="relative">
                  <Loader2 className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 animate-spin text-white drop-shadow-glow" />
                  <motion.div
                    className="absolute inset-0 rounded-full border-3 border-white/70"
                    animate={{
                      rotate: 360,
                      boxShadow: [
                        "0 0 5px rgba(255, 255, 255, 0.5) inset",
                        "0 0 10px rgba(255, 255, 255, 0.7) inset",
                        "0 0 5px rgba(255, 255, 255, 0.5) inset"
                      ]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                </div>
              ) : (
                <div className="relative z-20 drop-shadow-glow">
                  <motion.div
                    animate={{
                      filter: [
                        "drop-shadow(0 0 3px rgba(255, 255, 255, 0.7))",
                        "drop-shadow(0 0 5px rgba(255, 255, 255, 0.9))",
                        "drop-shadow(0 0 3px rgba(255, 255, 255, 0.7))"
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "mirror"
                    }}
                  >
                    {/* Show the current role icon, even when completed */}
                    {currentIcon}
                  </motion.div>
                </div>
              )}
            </motion.div>

            {/* Step number badge */}
            <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 z-20">
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold shadow-sm bg-primary text-white">
                {currentStep + 1}
              </div>
            </div>
          </div>

          {/* Next step circle (right) - only show if there's a next step */}
          {nextStepInfo ? (
            <div className="relative">
              {/* Connector line from current to next - desktop */}
              <motion.div
                className="absolute top-1/2 -left-8 w-8 h-2 -translate-y-1/2
                           bg-border/40
                           hidden md:block"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />

              {/* Connector line from current to next - mobile (vertical) */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-0 md:hidden" style={{ height: '55px' }}>
                <motion.div
                  className="absolute top-0 left-0 right-0 mx-auto w-2 h-full
                             bg-gradient-to-t from-border/40 to-border/40"
                  initial={{ scaleY: 0, originY: 1 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  style={{ boxShadow: '0 0 8px rgba(0, 198, 215, 0.2)' }}
                />
              </div>

              <motion.div
                className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-md bg-card border border-border text-muted-foreground z-10 relative"
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)"
                }}
                transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
              >
                {getStepIcon(nextStepInfo.title, 24)}
              </motion.div>

              {/* Step number badge */}
              <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 z-20">
                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shadow-sm bg-card border border-border text-muted-foreground">
                  {nextStepIndex !== null ? nextStepIndex + 1 : 0}
                </div>
              </div>

              {/* Next step title - responsive position */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-24 text-center hidden md:block">
                <p className="text-xs font-medium text-muted-foreground truncate">{nextStepInfo.title}</p>
              </div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-26 text-center md:hidden">
                <p className="text-xs font-medium text-muted-foreground truncate">{nextStepInfo.title}</p>
              </div>
            </div>
          ) : null}
        </motion.div>



        {/* Current step title and description */}
        <div className="text-center mt-4 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            key={currentStepInfo.title} // Key helps with animation when title changes
          >
            <h2 className="text-xl font-semibold text-primary mb-2">
              {currentStepInfo.title}
              {currentStep >= steps.length && (
                <span className="ml-2 text-green-500">(Completed)</span>
              )}
            </h2>

            <p className="text-muted-foreground mb-4">
              {currentStep >= steps.length
                ? "All steps have been completed successfully"
                : currentStepInfo.description}
            </p>

            {(showLoading) && (
              <Badge
                variant="outline"
                className="bg-purple-600/10 text-purple-500 border-purple-500/20 px-3 py-1 text-sm font-normal"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Thinking...
              </Badge>
            )}
          </motion.div>

          {/* Continue button - positioned under the current role text */}
          {onContinue && !isLoading && !isStreaming && !error && (
            <div className="mt-4">
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={onContinue}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Continue to Next Step
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg flex items-start gap-3 text-sm border border-destructive/20 max-w-md mx-auto">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Landscape flow visualization component
function LandscapeFlow({ steps, currentStep, isLoading, isStreaming, hasMedicalReport, currentSession }: {
  steps: { title: string; description: string }[];
  currentStep: number;
  isLoading: boolean;
  isStreaming: boolean;
  hasMedicalReport: boolean;
  currentSession: ChainDiagnosisSession | null;
}) {
  return (
    <div className="w-full overflow-x-auto pb-4 mt-6">
      <div className="flex items-center min-w-max px-4 py-2">
        {steps.map((step, index) => {
          // Calculate the actual step number in the full process
          const actualStepNumber = index;

          // Determine if this step is active
          // If currentStep is beyond the array length, mark the last step as active
          const isStepActive = currentStep >= steps.length
            ? actualStepNumber === steps.length - 1
            : actualStepNumber === currentStep;

          // Determine if this step is completed based on the presence of a response
          const isCompleted =
            // For Medical Analyst (index 0 when hasMedicalReport is true)
            (hasMedicalReport && index === 0 && currentSession?.medical_analyst_response) ||
            // For General Physician (index 0 when no medical report, or index 1 when hasMedicalReport is true)
            ((hasMedicalReport ? index === 1 : index === 0) && currentSession?.general_physician_response) ||
            // For Specialist Doctor
            ((hasMedicalReport ? index === 2 : index === 1) && currentSession?.specialist_doctor_response) ||
            // For Pathologist
            ((hasMedicalReport ? index === 3 : index === 2) && currentSession?.pathologist_response) ||
            // For Nutritionist
            ((hasMedicalReport ? index === 4 : index === 3) && currentSession?.nutritionist_response) ||
            // For Pharmacist
            ((hasMedicalReport ? index === 5 : index === 4) && currentSession?.pharmacist_response) ||
            // For Follow-up Specialist
            ((hasMedicalReport ? index === 6 : index === 5) && currentSession?.follow_up_specialist_response) ||
            // For Summarizer
            ((hasMedicalReport ? index === 7 : index === 6) && currentSession?.summarizer_response);


          // Show loading indicator when the step is active and API is in progress
          const showLoading = isLoading || isStreaming;

          return (
            <React.Fragment key={index}>
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <motion.div
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center shadow-md",
                      isCompleted ? "bg-gradient-to-br from-green-500 to-primary text-white" :
                      isStepActive ? "bg-gradient-to-br from-primary to-accent text-white" :
                      "bg-card border border-border text-muted-foreground"
                    )}
                    animate={{
                      scale: isStepActive ? 1.1 : 1,
                      boxShadow: isStepActive
                        ? "0 0 20px rgba(0, 198, 215, 0.5)"
                        : isCompleted
                          ? "0 0 10px rgba(34, 197, 94, 0.3)"
                          : "0 4px 6px rgba(0, 0, 0, 0.1)"
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {isCompleted ? (
                      <Check className="h-7 w-7" />
                    ) : showLoading && isStepActive ? (
                      <Loader2 className="h-7 w-7 animate-spin" />
                    ) : (
                      getStepIcon(step?.title, isStepActive ? 24 : 20)
                    )}
                  </motion.div>

                  {/* Step number */}
                  <div className="absolute -top-2 -right-2">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm",
                      isCompleted ? "bg-green-500 text-white" :
                      isStepActive ? "bg-primary text-white" :
                      "bg-card border border-border text-muted-foreground"
                    )}>
                      {actualStepNumber + 1}
                    </div>
                  </div>
                </div>

                <div className="text-center mt-2 w-24">
                  <p className={cn(
                    "text-xs font-medium truncate",
                    isStepActive && "text-primary",
                    isCompleted && "text-green-500"
                  )}>
                    {step?.title || "Unknown"}
                  </p>

                  {!isCompleted && showLoading && isStepActive && (
                    <Badge
                      variant="outline"
                      className="mt-1 bg-purple-600/10 text-purple-500 border-purple-500/20 px-1 py-0 text-[10px] font-normal"
                    >
                      <Sparkles className="h-2 w-2 mr-0.5" />
                      Thinking...
                    </Badge>
                  )}

                  {/* Show "Completed" badge for the last step when all steps are done */}
                  {currentStep >= steps.length && index === steps.length - 1 && (
                    <Badge
                      variant="outline"
                      className="mt-1 bg-green-500/10 text-green-500 border-green-500/20 px-1 py-0 text-[10px] font-normal"
                    >
                      <Check className="h-2 w-2 mr-0.5" />
                      Completed
                    </Badge>
                  )}
                </div>
              </div>

              {/* Connector line (except for the last step) */}
              {index < steps.length - 1 && (
                <motion.div
                  className={cn(
                    "h-1 w-10 mx-1",
                    isCompleted ? "bg-gradient-to-r from-green-500 to-primary" : "bg-border/30"
                  )}
                  initial={{ scaleX: 0 }}
                  animate={{
                    scaleX: 1,
                    background: isCompleted
                      ? "linear-gradient(to right, rgb(34, 197, 94), rgb(0, 198, 215))"
                      : "rgba(39, 39, 42, 0.3)"
                  }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// We'll use ThreeCircleStep and LandscapeFlow directly

export function ChainDiagnosisProgressIndicator({
  onContinue,
  isProcessing
}: {
  onContinue?: () => void;
  isProcessing?: boolean;
}) {
  const { currentStep, isLoading, isStreaming, error, currentSession } = useChainDiagnosis();

  // Check if there's a medical report
  const hasMedicalReport = !!currentSession?.user_input.medical_report?.text ||
                          !!currentSession?.user_input.medical_report?.image_url;

  // Define all possible steps
  const allSteps = [
    {
      title: "Medical Analyst",
      description: "Analyzing medical reports and test results"
    },
    {
      title: "General Physician",
      description: "Initial assessment of symptoms and medical history"
    },
    {
      title: "Specialist Doctor",
      description: "Detailed analysis from a specialist perspective"
    },
    {
      title: "Pathologist",
      description: "Insights on lab tests and pathological findings"
    },
    {
      title: "Nutritionist",
      description: "Dietary and nutritional recommendations"
    },
    {
      title: "Pharmacist",
      description: "Medication information and considerations"
    },
    {
      title: "Follow-up Specialist",
      description: "Monitoring guidelines and follow-up recommendations"
    },
    {
      title: "Radiance AI Summarizer",
      description: "Comprehensive summary of all insights"
    }
  ];

  // If no medical report, skip the Medical Analyst step
  const steps = hasMedicalReport ? allSteps : allSteps.slice(1);

  // Calculate the actual current step based on responses in the session
  // This ensures the ThreeCircleLayout shows the correct current role
  let adjustedCurrentStep = currentStep;

  // Safety check to ensure adjustedCurrentStep is within bounds
  if (adjustedCurrentStep >= steps.length) {
    adjustedCurrentStep = steps.length - 1;
  }

  // If we have a session, determine the current step based on responses
  if (currentSession) {
    if (!hasMedicalReport) {
      // When no medical report, start with General Physician (step 0 in the adjusted steps array)
      if (currentSession.general_physician_response && !currentSession.specialist_doctor_response) {
        adjustedCurrentStep = 1; // Specialist Doctor is next
      } else if (currentSession.specialist_doctor_response && !currentSession.pathologist_response) {
        adjustedCurrentStep = 2; // Pathologist is next
      } else if (currentSession.pathologist_response && !currentSession.nutritionist_response) {
        adjustedCurrentStep = 3; // Nutritionist is next
      } else if (currentSession.nutritionist_response && !currentSession.pharmacist_response) {
        adjustedCurrentStep = 4; // Pharmacist is next
      } else if (currentSession.pharmacist_response && !currentSession.follow_up_specialist_response) {
        adjustedCurrentStep = 5; // Follow-up Specialist is next
      } else if (currentSession.follow_up_specialist_response && !currentSession.summarizer_response) {
        adjustedCurrentStep = 6; // Summarizer is next
      } else if (currentSession.summarizer_response) {
        adjustedCurrentStep = 7; // All steps completed
      }
    } else {
      // When medical report is present, start with Medical Analyst (step 0)
      if (currentSession.medical_analyst_response && !currentSession.general_physician_response) {
        adjustedCurrentStep = 1; // General Physician is next
      } else if (currentSession.general_physician_response && !currentSession.specialist_doctor_response) {
        adjustedCurrentStep = 2; // Specialist Doctor is next
      } else if (currentSession.specialist_doctor_response && !currentSession.pathologist_response) {
        adjustedCurrentStep = 3; // Pathologist is next
      } else if (currentSession.pathologist_response && !currentSession.nutritionist_response) {
        adjustedCurrentStep = 4; // Nutritionist is next
      } else if (currentSession.nutritionist_response && !currentSession.pharmacist_response) {
        adjustedCurrentStep = 5; // Pharmacist is next
      } else if (currentSession.pharmacist_response && !currentSession.follow_up_specialist_response) {
        adjustedCurrentStep = 6; // Follow-up Specialist is next
      } else if (currentSession.follow_up_specialist_response && !currentSession.summarizer_response) {
        adjustedCurrentStep = 7; // Summarizer is next
      } else if (currentSession.summarizer_response) {
        adjustedCurrentStep = 8; // All steps completed
      }
    }
  } else {
    // If no session, use the currentStep from context
    adjustedCurrentStep = hasMedicalReport
      ? currentStep
      : (currentStep === 0 ? 0 : currentStep);
  }

  return (
    <motion.div
      className="p-6 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 shadow-sm"
      initial={{ opacity: 0.9, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-full bg-primary/10 text-primary">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Diagnosis Progress
          </h2>
          <p className="text-sm text-muted-foreground">
            Step {adjustedCurrentStep + 1} of {steps.length}
          </p>
        </div>
      </div>



      {/* Single three-circle layout */}
      <ThreeCircleLayout
        steps={steps}
        currentStep={adjustedCurrentStep}
        isLoading={isLoading}
        isStreaming={isStreaming}
        error={error}
        onContinue={onContinue}
        isProcessing={isProcessing}
      />



      {/* Landscape flow visualization */}
      <div className="mt-10 pt-6 border-t border-border/30">
        <h3 className="text-sm font-medium text-muted-foreground mb-4 px-2">
          <span className="md:inline hidden">Full Progress Flow</span>
          <span className="md:hidden">Progress Timeline</span>
        </h3>
        <LandscapeFlow
          steps={steps}
          currentStep={adjustedCurrentStep}
          isLoading={isLoading}
          isStreaming={isStreaming}
          hasMedicalReport={hasMedicalReport}
          currentSession={currentSession}
        />
      </div>
    </motion.div>
  );
}
