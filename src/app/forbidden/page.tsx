import { Metadata } from "next";
import { ErrorPage } from "@/components/error-page";
import { ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Access Denied | Radiance AI",
  description: "You don't have permission to access this page",
};

export default function ForbiddenPage() {
  return (
    <ErrorPage
      statusCode={403}
      title="Access Denied"
      description="You don't have permission to access this page"
      suggestions={[
        "Log in with an account that has the required permissions",
        "Return to the homepage or dashboard",
        "If you believe this is an error, contact support"
      ]}
      primaryAction={{ label: "Go to Dashboard", href: "/dashboard" }}
      secondaryAction={{ label: "Go to Login", href: "/auth/login" }}
      icon={<ShieldAlert className="w-10 h-10" />}
      isDestructive={true}
    />
  );
}
