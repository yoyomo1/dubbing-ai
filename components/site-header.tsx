"use client";

import Link from "next/link";
import { Shield, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";

import { useLocale } from "@/components/locale-provider";
import { SignInButton } from "@/components/auth/sign-in-button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SiteHeader() {
  const { locale, setLocale } = useLocale();
  const { data: session } = useSession();
  const initials = session?.user?.email?.slice(0, 2).toUpperCase() || "DA";
  const isKorean = locale === "ko";

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/88 backdrop-blur-xl">
      <div className="container-shell flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent)] text-white shadow-lg shadow-red-500/25">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">{isKorean ? "더빙AI" : "DubbingAI"}</p>
            <p className="text-xs text-[var(--muted-foreground)]">AI audio dubbing</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-full border border-[var(--border)] bg-white p-1">
            <button
              className={`rounded-full px-3 py-1 text-xs font-medium ${locale === "ko" ? "bg-[var(--accent)] text-white" : "text-[var(--muted-foreground)]"}`}
              onClick={() => setLocale("ko")}
              type="button"
            >
              KO
            </button>
            <button
              className={`rounded-full px-3 py-1 text-xs font-medium ${locale === "en" ? "bg-[var(--accent)] text-white" : "text-[var(--muted-foreground)]"}`}
              onClick={() => setLocale("en")}
              type="button"
            >
              EN
            </button>
          </div>

          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full transition hover:opacity-90">
                  <Avatar>
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/">{isKorean ? "대시보드" : "Dashboard"}</Link>
                </DropdownMenuItem>
                {session.user.isAdmin ? (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/allowlist">
                      <Shield className="mr-2 h-4 w-4" />
                      {isKorean ? "Allowlist 관리" : "Manage Allowlist"}
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <div className="w-full">
                    <SignOutButton />
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <SignInButton />
          )}
        </div>
      </div>
    </header>
  );
}
