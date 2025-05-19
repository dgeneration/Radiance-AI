import { Metadata } from "next";
import { UpdatePasswordPageClient } from "./components/update-password-page-client";

export const metadata: Metadata = {
  title: "Update Password | Radiance AI",
  description: "Update your Radiance AI account password",
};

export default function UpdatePasswordPage() {
  return <UpdatePasswordPageClient />;
}
