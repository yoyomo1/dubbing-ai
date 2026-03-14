import Link from "next/link";
import { Languages, Mic2, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "새 더빙", href: "#workspace", icon: Sparkles },
  { label: "오디오 샘플", href: "#feed", icon: Mic2 },
  { label: "지원 언어", href: "#languages", icon: Languages },
  { label: "Allowlist", href: "/admin/allowlist", icon: ShieldCheck },
];

export function AppSidebar({
  className,
  isAdmin,
}: {
  className?: string;
  isAdmin?: boolean;
}) {
  return (
    <aside
      className={cn(
        "glass-panel hidden w-72 shrink-0 border-r border-[var(--border)] px-3 py-4 lg:flex lg:flex-col",
        className,
      )}
    >
      <div className="mb-6 px-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent)] text-white shadow-lg shadow-red-500/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">더빙AI</p>
            <p className="text-xs text-[var(--muted-foreground)]">음성 더빙 작업공간</p>
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 px-2">
          {navItems.map((item) => {
            if (item.label === "Allowlist" && !isAdmin) {
              return null;
            }

            return (
              item.href.startsWith("/") ? (
                <Link
                  key={item.label}
                  href="/admin/allowlist"
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors hover:bg-[var(--muted)]"
                >
                  <item.icon className="h-4 w-4 text-[var(--muted-foreground)]" />
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors hover:bg-[var(--muted)]"
                >
                  <item.icon className="h-4 w-4 text-[var(--muted-foreground)]" />
                  {item.label}
                </a>
              )
            );
          })}
        </div>
      </ScrollArea>
      <div className="mt-4 rounded-3xl bg-[var(--muted)] p-4">
        <Badge variant="default" className="mb-3">
          Audio Dubbing
        </Badge>
        <p className="text-sm font-medium">오디오 업로드 → 전사 → 번역 → 합성 → 다운로드</p>
        <p className="mt-2 text-xs text-[var(--muted-foreground)]">
          실제 서비스용 보이스 더빙 작업을 한 화면에서 처리합니다.
        </p>
      </div>
    </aside>
  );
}
