"use client";

import { useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const handleLogout = async () => {
      try {
        // Sign out the user
        await supabase.auth.signOut();

        // Clear any local storage items related to auth
        localStorage.removeItem("supabase.auth.token");

        // Redirect to login page after a short delay
        setTimeout(() => {
          router.push("/auth/login");
          router.refresh();
        }, 2000);
      } catch (error) {
        console.error("Error during logout:", error);
      }
    };

    handleLogout();
  }, [router, supabase.auth]);

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Logging Out</CardTitle>
          <CardDescription>
            Clearing your session and redirecting you to the login page...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/auth/login")}
          >
            Return to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
