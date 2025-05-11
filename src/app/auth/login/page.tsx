import { Metadata } from "next";
import { LoginPageClient } from "./components/login-page-client";

export const metadata: Metadata = {
  title: "Login | Radiance AI",
  description: "Login to your Radiance AI account",
};

export default function LoginPage() {
  return <LoginPageClient />;
}
