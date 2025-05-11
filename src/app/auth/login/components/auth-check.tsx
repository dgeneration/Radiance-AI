"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export function AuthCheck({ 
  children,
  redirectUrl = "/dashboard"
}: { 
  children: React.ReactNode;
  redirectUrl?: string;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        
        if (data?.user) {
          // If user is already logged in, redirect to dashboard
          router.push(redirectUrl);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [router, redirectUrl]);
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}
