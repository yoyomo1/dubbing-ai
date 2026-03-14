import { redirect } from "next/navigation";

import { AllowlistManager } from "@/components/admin/allowlist-manager";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerAuthSession } from "@/lib/auth";
import { getAllowlistEntries } from "@/lib/db";

export default async function AllowlistPage() {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.isAdmin) {
    redirect("/blocked");
  }

  const entries = await getAllowlistEntries();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="container-shell space-y-6 px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Allowlist 관리자</CardTitle>
          </CardHeader>
          <CardContent>
            <AllowlistManager initialEntries={entries} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

