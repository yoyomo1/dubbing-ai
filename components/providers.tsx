"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { Toaster } from "sonner";

import { LocaleProvider } from "@/components/locale-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider session={session}>
      <LocaleProvider>
        <TooltipProvider delayDuration={120}>
          {children}
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </LocaleProvider>
    </SessionProvider>
  );
}
