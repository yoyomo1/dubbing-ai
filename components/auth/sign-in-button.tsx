"use client";

import { Loader2, LogIn } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";

export function SignInButton({ className }: { className?: string }) {
  const { locale } = useLocale();
  const [pending, setPending] = useState(false);

  return (
    <Button
      className={className}
      onClick={async () => {
        setPending(true);
        await signIn("google", { callbackUrl: "/" });
        setPending(false);
      }}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
      {locale === "ko" ? "Google로 로그인" : "Sign in with Google"}
    </Button>
  );
}
