"use client";

import { PlayCircle } from "lucide-react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { sampleCards } from "@/lib/constants";

export function SampleFeed({ filter }: { filter: string }) {
  const cards = useMemo(() => {
    if (filter === "전체") {
      return sampleCards;
    }

    return sampleCards.filter((card) => card.kind === filter || card.subtitle.includes(filter));
  }, [filter]);

  return (
    <section id="feed" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">샘플 결과 피드</h2>
          <p className="text-sm text-[var(--muted-foreground)]">서비스에서 처리할 오디오 더빙 예시를 카드 형태로 보여줍니다.</p>
        </div>
        <Badge variant="secondary">{cards.length} cards</Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.id} className="overflow-hidden">
            <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-slate-200 via-slate-100 to-red-100">
              <div className="absolute inset-0 flex items-center justify-center">
                <PlayCircle className="h-14 w-14 text-white drop-shadow-lg" />
              </div>
              <Badge className="absolute bottom-3 right-3 bg-black/80 text-white">{card.duration}</Badge>
            </div>
            <CardContent className="flex gap-3 pt-4">
              <div className="mt-1 h-10 w-10 rounded-full bg-[var(--muted)]" />
              <div className="space-y-1">
                <p className="font-medium leading-tight">{card.title}</p>
                <p className="text-sm text-[var(--muted-foreground)]">{card.subtitle}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{card.views}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
