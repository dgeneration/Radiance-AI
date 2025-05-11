import { Metadata } from "next";
import { SignupPageClient } from "./components/signup-page-client";

export const metadata: Metadata = {
  title: "Sign Up | Radiance AI",
  description: "Create a new Radiance AI account",
};

export default function SignupPage() {
  return <SignupPageClient />;
}
