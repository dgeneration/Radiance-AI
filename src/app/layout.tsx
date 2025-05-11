import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";
import { createClient } from "@/utils/supabase/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Radiance AI - Your Intelligent Health Companion",
  description: "AI-powered health diagnosis platform using Perplexity Sonar",
  icons: {
    icon: '/RadianceAi_Logo.svg',
    apple: '/RadianceAi_Logo.svg',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get the current user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={cn(
          `${geistSans.variable} ${geistMono.variable}`,
          "min-h-screen bg-background font-sans antialiased"
        )}
        suppressHydrationWarning
      >
        <Providers user={user}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
