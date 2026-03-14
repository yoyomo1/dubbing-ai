import type { Metadata } from "next";

import { Providers } from "@/components/providers";
import { getServerAuthSession } from "@/lib/auth";

import "./globals.css";

export const metadata: Metadata = {
  title: "더빙AI",
  description: "오디오 기반 음성 더빙 서비스",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerAuthSession();

  return (
    <html lang="ko">
      <body>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
