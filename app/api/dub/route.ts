import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerAuthSession } from "@/lib/auth";
import { runDubbing } from "@/lib/dubbing/service";
import { voiceGenders, voicePresets, voiceSpeedOptions } from "@/lib/constants";
import type { VoiceGenderId, VoicePresetId, VoiceSpeedId } from "@/lib/constants";

export const runtime = "nodejs";

const requestSchema = z.object({
  mediaType: z.enum(["audio", "video"]),
  targetLanguage: z.string().min(2),
  voicePreset: z.enum(voicePresets.map((preset) => preset.id) as [string, ...string[]]).optional(),
  voiceGender: z.enum(voiceGenders.map((gender) => gender.id) as [string, ...string[]]).optional(),
  voiceSpeed: z.enum(voiceSpeedOptions.map((speed) => speed.id) as [string, ...string[]]).optional(),
});

export async function POST(request: Request) {
  const session = await getServerAuthSession();

  if (!session?.user?.isAllowed) {
    return NextResponse.json({ error: "허용된 계정만 더빙 API를 사용할 수 있습니다." }, { status: 401 });
  }

  const formData = await request.formData();
  const media = formData.get("media");
  const mediaType = formData.get("mediaType");
  const targetLanguage = formData.get("targetLanguage");
  const voicePreset = formData.get("voicePreset");
  const voiceGender = formData.get("voiceGender");
  const voiceSpeed = formData.get("voiceSpeed");

  if (!(media instanceof File)) {
    return NextResponse.json({ error: "업로드 파일이 필요합니다." }, { status: 400 });
  }

  const payload = requestSchema.parse({
    mediaType,
    targetLanguage,
    voicePreset,
    voiceGender,
    voiceSpeed,
  });

  try {
    const result = await runDubbing(
      media,
      payload.targetLanguage,
      (payload.voicePreset ?? "balanced") as VoicePresetId,
      (payload.voiceGender ?? "neutral") as VoiceGenderId,
      (payload.voiceSpeed ?? "1.00") as VoiceSpeedId,
    );

    return NextResponse.json({
      ...result,
      mediaType: payload.mediaType,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "더빙 처리 실패" },
      { status: 500 },
    );
  }
}
