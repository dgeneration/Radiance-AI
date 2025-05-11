"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { User } from "@supabase/supabase-js";

interface LayoutWithHeaderFooterProps {
  children: React.ReactNode;
  user: User | null;
}

export function LayoutWithHeaderFooter({ children, user }: LayoutWithHeaderFooterProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header user={user} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
