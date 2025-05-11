import { MobileMenu } from "@/components/mobile-menu";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className="relative overflow-hidden">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background/80 z-0 pointer-events-none"></div>

        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5 z-0 bg-[url('/patterns/dot-pattern.svg')] pointer-events-none"></div>

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileMenu />
    </>
  );
}
