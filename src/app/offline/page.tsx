import { Metadata } from "next";
import { ErrorPage } from "@/components/error-page";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = {
  title: "Offline | Radiance AI",
  description: "You are currently offline",
};

export default function OfflinePage() {
  return (
    <ErrorPage
      title="You're Offline"
      description="It seems you're not connected to the internet"
      message="Some features of Radiance AI may not be available while you're offline. Cached pages will still be accessible."
      suggestions={[
        "Check your internet connection",
        "Return to the homepage",
        "Try accessing previously visited pages that may be cached",
        "Reconnect to Wi-Fi or mobile data"
      ]}
      primaryAction={{ label: "Return to Homepage", href: "/" }}
      icon={<WifiOff className="w-10 h-10" />}
    />
  );
}
