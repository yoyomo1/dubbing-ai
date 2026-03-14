import { redirect } from "next/navigation";
import { LockKeyhole, Sparkles } from "lucide-react";

import { SignInButton } from "@/components/auth/sign-in-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerAuthSession } from "@/lib/auth";
import { hasGoogleAuth } from "@/lib/env";

export default async function LoginPage() {
  const session = await getServerAuthSession();

  if (session?.user?.isAllowed) {
    redirect("/");
  }

  if (session?.user && !session.user.isAllowed) {
    redirect("/blocked");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-xl">
        <CardHeader className="space-y-4">
          <Badge className="w-fit">Google OAuth</Badge>
          <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)] text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>더빙AI 로그인</CardTitle>
            <CardDescription>허용된 Google 계정만 업로드와 더빙 API를 사용할 수 있습니다.</CardDescription>
          </div>
        </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-3xl bg-[var(--muted)] p-4 text-sm text-[var(--muted-foreground)]">
            과제 요구사항에 맞춰 Google 로그인 후 allowlist 검사를 진행합니다.
          </div>
          {hasGoogleAuth() ? (
            <SignInButton className="w-full" />
          ) : (
            <Button className="w-full" disabled>
              <LockKeyhole className="h-4 w-4" />
              Google OAuth 환경변수 필요
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
