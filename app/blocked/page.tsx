import Link from "next/link";
import { Ban, ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BlockedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fef2f2] text-[#b91c1c]">
            <Ban className="h-5 w-5" />
          </div>
          <CardTitle>접근이 허용되지 않은 계정입니다</CardTitle>
          <CardDescription>관리자 allowlist에 등록된 이메일만 실제 더빙 워크스페이스를 사용할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/login">
              <ChevronLeft className="h-4 w-4" />
              로그인 화면으로
            </Link>
          </Button>
          <Button asChild>
            <Link href="/">랜딩으로 이동</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

