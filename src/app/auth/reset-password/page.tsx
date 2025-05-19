import { Metadata } from "next";
import { ResetPasswordPageClient } from "./components/reset-password-page-client";

export const metadata: Metadata = {
  title: "Reset Password | Radiance AI",
  description: "Reset your Radiance AI account password",
};

export default function ResetPasswordPage() {
  return <ResetPasswordPageClient />;
}
