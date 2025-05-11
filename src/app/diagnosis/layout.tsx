import { MobileMenu } from "@/components/mobile-menu";

export default function DiagnosisLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}

      {/* Mobile Navigation */}
      <MobileMenu />
    </>
  );
}
