"use client";

import { DubbingWorkspace } from "@/components/dubbing-workspace";
import { SiteHeader } from "@/components/site-header";

export function HomeDashboard({
  canUseApp,
  hasGoogleAuth,
  isAdmin,
}: {
  canUseApp: boolean;
  hasGoogleAuth: boolean;
  isAdmin: boolean;
}) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-shell px-0">
        <main className="mx-auto min-w-0 max-w-6xl px-4 py-8 lg:px-6 lg:py-10">
          <DubbingWorkspace canUseApp={canUseApp} hasGoogleAuth={hasGoogleAuth} />
        </main>
      </div>
    </div>
  );
}
