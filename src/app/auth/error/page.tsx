import { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Authentication Error | Radiance AI",
  description: "An error occurred during authentication",
};

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function AuthErrorPage({ searchParams }: PageProps) {
  const errorMessage =
    typeof searchParams?.message === "string"
      ? searchParams.message
      : "An error occurred during authentication";

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
          <CardDescription>
            There was a problem with your authentication request
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
            {errorMessage}
          </div>
          <p className="text-muted-foreground mb-2">This can happen if:</p>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1 mb-4">
            <li>Your session has expired</li>
            <li>Your account was deleted or disabled</li>
            <li>There&apos;s a mismatch between your browser&apos;s stored data and our system</li>
            <li>You&apos;re using an invalid or expired authentication token</li>
          </ul>
          <p className="text-muted-foreground mb-4">
            Try resetting your authentication state or contact support if the problem persists.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/auth/reset-auth">Reset Authentication</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/auth/login">Return to Login</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/">Go to Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
