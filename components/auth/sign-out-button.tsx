"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const { locale } = useLocale();

  return (
    <Button variant="ghost" onClick={() => signOut({ callbackUrl: "/login" })}>
      <LogOut className="h-4 w-4" />
      {locale === "ko" ? "로그아웃" : "Sign out"}
    </Button>
  );
}
