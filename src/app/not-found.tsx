import { Metadata } from "next";
import { ErrorPage } from "@/components/error-page";
import { FileQuestion } from "lucide-react";

export const metadata: Metadata = {
  title: "Page Not Found | Radiance AI",
  description: "The page you're looking for doesn't exist",
};

export default function NotFoundPage() {
  return (
    <ErrorPage
      statusCode={404}
      title="Page Not Found"
      description="The page you're looking for doesn't exist or has been moved"
      suggestions={[
        "Check the URL for typos or errors",
        "Return to the homepage and navigate from there",
        "Use the navigation menu to find what you're looking for",
        "If you followed a link, it might be outdated"
      ]}
      primaryAction={{ label: "Go to Home", href: "/" }}
      secondaryAction={{ label: "Go to Dashboard", href: "/dashboard" }}
      icon={<FileQuestion className="w-10 h-10" />}
    />
  );
}
