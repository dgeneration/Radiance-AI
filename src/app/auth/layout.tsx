import { Footer } from "@/components/footer";
import { AuthHeader } from "@/components/auth-header";
import { NavigationProgress } from "@/components/navigation-progress";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <NavigationProgress />
      <AuthHeader />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
