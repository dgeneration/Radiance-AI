"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaArrowRight, FaEnvelope, FaMapMarkerAlt, FaPhone } from "react-icons/fa";
import { motion } from "framer-motion";
import { ProfessionalButton } from "@/components/ui/professional-button";

export function Footer() {
  const currentYear = new Date().getFullYear();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    },
    exit: {
      opacity: 0,
      y: 20,
      transition: { duration: 0.3 }
    }
  };

  const socialVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3 }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.2 }
    }
  };

  // Custom hook for scroll direction
  const useScrollDirection = () => {
    const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
      const updateScrollDirection = () => {
        const scrollY = window.scrollY;
        const direction = scrollY > lastScrollY ? 'down' : 'up';

        // Only update if the difference is significant
        if (Math.abs(scrollY - lastScrollY) > 10) {
          setScrollDirection(direction);
          setLastScrollY(scrollY);
        }
      };

      window.addEventListener('scroll', updateScrollDirection);

      return () => {
        window.removeEventListener('scroll', updateScrollDirection);
      };
    }, [lastScrollY]);

    return scrollDirection;
  };

  const scrollDirection = useScrollDirection();

  return (
    <footer className="relative overflow-hidden border-t border-primary/10 select-none">
      {/* Translucent background like header */}
      <div className="absolute inset-0 backdrop-blur-md bg-background/80 z-0"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 z-0"></div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent opacity-30"></div>
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute -top-40 right-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl opacity-30"></div>

      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-5 z-0 bg-[url('/patterns/dot-pattern.svg')]"></div>

      <motion.div
        className="container relative z-10 mx-auto pt-16 pb-8 px-6"
        initial="hidden"
        animate={scrollDirection === 'up' ? 'visible' : scrollDirection === 'down' ? 'exit' : 'visible'}
        whileInView="visible"
        viewport={{ once: false, margin: "-100px" }}
        variants={containerVariants}
      >
        {/* Top section with logo and newsletter */}
        <motion.div
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 pb-12 border-b border-primary/10"
          variants={itemVariants}
        >
          <motion.div
            className="flex items-center gap-3 mb-6 md:mb-0"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 p-2 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <Image src="/RadianceAi_Logo.svg" alt="Radiance AI Logo" width={48} height={48} className="w-full h-full" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent translate-none">
                Radiance AI
              </span>
            </Link>
          </motion.div>

          <motion.div
            className="w-full md:w-auto"
            variants={itemVariants}
          >
            <div className="flex flex-col sm:flex-row gap-3 max-w-md">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-2.5 rounded-xl bg-card/80 backdrop-blur-sm border border-primary/10 focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
              />
              <ProfessionalButton
                variant="primary"
                size="default"
                icon={<FaArrowRight />}
                iconPosition="right"
                className="h-full"
              >
                Subscribe
              </ProfessionalButton>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Subscribe to our newsletter for the latest updates
            </p>
          </motion.div>
        </motion.div>

        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          <motion.div
            className="md:col-span-5"
            variants={itemVariants}
          >
            <motion.h3
              className="text-xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -20 }}
              animate={scrollDirection === 'up' ? { opacity: 1, x: 0 } : scrollDirection === 'down' ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: false, margin: "-50px" }}
            >
              About Us
            </motion.h3>
            <motion.p
              className="text-muted-foreground mb-6 leading-relaxed"
              variants={itemVariants}
            >
              Radiance AI combines cutting-edge technology with medical expertise to provide accurate and reliable health insights. Our mission is to make healthcare more accessible and personalized for everyone.
            </motion.p>
            <div className="space-y-3">
              <motion.div
                className="flex items-center gap-3 text-muted-foreground group"
                variants={itemVariants}
                whileHover={{ x: 5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <FaMapMarkerAlt className="text-primary" size={14} />
                </div>
                <span>Developed By  Jay Patel & Shraddha Gautam</span>
              </motion.div>
              <motion.div
                className="flex items-center gap-3 text-muted-foreground group"
                variants={itemVariants}
                whileHover={{ x: 5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <FaEnvelope className="text-primary" size={14} />
                </div>
                <span>support@dgeneration.io</span>
              </motion.div>
              <motion.div
                className="flex items-center gap-3 text-muted-foreground group"
                variants={itemVariants}
                whileHover={{ x: 5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <FaPhone className="text-primary" size={14} />
                </div>
                <span>+91 95121 91655</span>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            className="md:col-span-2"
            variants={itemVariants}
          >
            <motion.h3
              className="text-lg font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -20 }}
              animate={scrollDirection === 'up' ? { opacity: 1, x: 0 } : scrollDirection === 'down' ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: false, margin: "-50px" }}
            >
              Quick Links
            </motion.h3>
            <ul className="space-y-3">
              <motion.li variants={itemVariants}>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <FaArrowRight size={10} className="text-primary/70 group-hover:translate-x-1 transition-transform" />
                  <span className="group-hover:translate-x-1 transition-transform">Home</span>
                </Link>
              </motion.li>
              <motion.li variants={itemVariants}>
                <Link href="/diagnosis" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <FaArrowRight size={10} className="text-primary/70 group-hover:translate-x-1 transition-transform" />
                  <span className="group-hover:translate-x-1 transition-transform">Get Diagnosis</span>
                </Link>
              </motion.li>
              <motion.li variants={itemVariants}>
                <Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <FaArrowRight size={10} className="text-primary/70 group-hover:translate-x-1 transition-transform" />
                  <span className="group-hover:translate-x-1 transition-transform">Dashboard</span>
                </Link>
              </motion.li>
              <motion.li variants={itemVariants}>
                <Link href="/diagnosis/history" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <FaArrowRight size={10} className="text-primary/70 group-hover:translate-x-1 transition-transform" />
                  <span className="group-hover:translate-x-1 transition-transform">History</span>
                </Link>
              </motion.li>
            </ul>
          </motion.div>

          <motion.div
            className="md:col-span-2"
            variants={itemVariants}
          >
            <motion.h3
              className="text-lg font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -20 }}
              animate={scrollDirection === 'up' ? { opacity: 1, x: 0 } : scrollDirection === 'down' ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: false, margin: "-50px" }}
            >
              Account
            </motion.h3>
            <ul className="space-y-3">
              <motion.li variants={itemVariants}>
                <Link href="/auth/login" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <FaArrowRight size={10} className="text-primary/70 group-hover:translate-x-1 transition-transform" />
                  <span className="group-hover:translate-x-1 transition-transform">Sign In</span>
                </Link>
              </motion.li>
              <motion.li variants={itemVariants}>
                <Link href="/auth/signup" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <FaArrowRight size={10} className="text-primary/70 group-hover:translate-x-1 transition-transform" />
                  <span className="group-hover:translate-x-1 transition-transform">Create Account</span>
                </Link>
              </motion.li>
              <motion.li variants={itemVariants}>
                <Link href="/dashboard/profile" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <FaArrowRight size={10} className="text-primary/70 group-hover:translate-x-1 transition-transform" />
                  <span className="group-hover:translate-x-1 transition-transform">Profile</span>
                </Link>
              </motion.li>
              <motion.li variants={itemVariants}>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <FaArrowRight size={10} className="text-primary/70 group-hover:translate-x-1 transition-transform" />
                  <span className="group-hover:translate-x-1 transition-transform">Settings</span>
                </Link>
              </motion.li>
            </ul>
          </motion.div>

          <motion.div
            className="md:col-span-3"
            variants={itemVariants}
          >
            <motion.h3
              className="text-lg font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -20 }}
              animate={scrollDirection === 'up' ? { opacity: 1, x: 0 } : scrollDirection === 'down' ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: false, margin: "-50px" }}
            >
              Legal
            </motion.h3>
            <ul className="space-y-3">
              <motion.li variants={itemVariants}>
                <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <FaArrowRight size={10} className="text-primary/70 group-hover:translate-x-1 transition-transform" />
                  <span className="group-hover:translate-x-1 transition-transform">Privacy Policy</span>
                </Link>
              </motion.li>
              <motion.li variants={itemVariants}>
                <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <FaArrowRight size={10} className="text-primary/70 group-hover:translate-x-1 transition-transform" />
                  <span className="group-hover:translate-x-1 transition-transform">Terms of Service</span>
                </Link>
              </motion.li>
              <motion.li variants={itemVariants}>
                <Link href="/disclaimer" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <FaArrowRight size={10} className="text-primary/70 group-hover:translate-x-1 transition-transform" />
                  <span className="group-hover:translate-x-1 transition-transform">Medical Disclaimer</span>
                </Link>
              </motion.li>
              <motion.li variants={itemVariants}>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <FaArrowRight size={10} className="text-primary/70 group-hover:translate-x-1 transition-transform" />
                  <span className="group-hover:translate-x-1 transition-transform">Contact Us</span>
                </Link>
              </motion.li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom section with copyright and social links */}
        <motion.div
          className="pt-6 border-t border-primary/10 flex flex-col md:flex-row justify-between items-center"
          variants={itemVariants}
        >
          <motion.p
            className="text-muted-foreground text-sm mb-4 md:mb-0"
            variants={itemVariants}
          >
            © {currentYear} <span className="translate-none">Radiance AI</span>. All rights reserved.
          </motion.p>
          <motion.div
            className="flex gap-4"
            variants={containerVariants}
            initial="hidden"
            animate={scrollDirection === 'up' ? 'visible' : scrollDirection === 'down' ? 'exit' : 'visible'}
            whileInView="visible"
            viewport={{ once: false, margin: "-50px" }}
          >
            <motion.div
              whileHover={{ y: -5, scale: 1.1 }}
              transition={{ duration: 0.2 }}
              variants={socialVariants}
            >
              <Link href="https://www.instagram.com/grims_25/" className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-all shadow-sm hover:shadow-md">
                <FaInstagram size={16} />
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ y: -5, scale: 1.1 }}
              transition={{ duration: 0.2 }}
              variants={socialVariants}
            >
              <Link href="https://www.linkedin.com/in/grims/" className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-all shadow-sm hover:shadow-md">
                <FaLinkedinIn size={16} />
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ y: -5, scale: 1.1 }}
              transition={{ duration: 0.2 }}
              variants={socialVariants}
            >
              <Link href="https://www.linkedin.com/in/shraddha-gautam-654b862b2/" className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-all shadow-sm hover:shadow-md">
                <FaLinkedinIn size={16} />
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </footer>
  );
}
