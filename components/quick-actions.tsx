"use client";

import { Compass, FileAudio2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const items = [
  { label: "새 오디오 더빙 시작", value: "audio", href: "#workspace", icon: FileAudio2 },
  { label: "지원 언어 보기", value: "languages", href: "#languages", icon: Compass },
  { label: "관리자 allowlist", value: "admin", href: "/admin/allowlist", icon: ShieldCheck },
];

export function QuickActions() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const actions = useMemo(() => items, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">빠른 실행</Button>
      </DialogTrigger>
      <DialogContent className="p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>빠른 실행</DialogTitle>
          <DialogDescription>업로드 작업, 언어 섹션, 관리자 페이지로 바로 이동합니다.</DialogDescription>
        </DialogHeader>
        <Command>
          <CommandInput placeholder="작업 또는 섹션 검색" />
          <CommandList>
            <CommandEmpty>일치하는 작업이 없습니다.</CommandEmpty>
            <CommandGroup heading="Action">
              {actions.map((item) => (
                <CommandItem
                  key={item.value}
                  onSelect={() => {
                    setOpen(false);
                    if (item.href.startsWith("#")) {
                      window.location.hash = item.href.slice(1);
                    } else {
                      router.push("/admin/allowlist");
                    }
                  }}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
