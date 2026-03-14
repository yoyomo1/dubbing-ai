import { redirect } from "next/navigation";

import { HomeDashboard } from "@/components/home-dashboard";
import { getServerAuthSession } from "@/lib/auth";
import { hasGoogleAuth } from "@/lib/env";

export default async function HomePage() {
  const session = await getServerAuthSession();

  if (session?.user && !session.user.isAllowed) {
    redirect("/blocked");
  }

  return (
    <HomeDashboard
      canUseApp={Boolean(session?.user?.isAllowed)}
      hasGoogleAuth={hasGoogleAuth()}
      isAdmin={Boolean(session?.user?.isAdmin)}
    />
  );
}

