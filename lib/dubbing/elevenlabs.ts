import { Buffer } from "node:buffer";

import { env, hasAiProviders, resolveVoiceId } from "@/lib/env";
import type { VoicePresetId, VoiceGenderId, VoiceSpeedId } from "@/lib/constants";

export type TranscriptionWord = {
  text?: string;
  start?: number;
  end?: number;
  type?: string;
  speaker_id?: string;
};

export type TranscriptionResult = {
  text: string;
  languageCode?: string;
  languageProbability?: number;
  words: TranscriptionWord[];
};

export async function transcribeAudio(file: File) {
  if (!hasAiProviders()) {
    return {
      text: `${file.name}에 대한 mock transcript`,
      languageCode: "en",
      languageProbability: 0,
      words: [],
    } satisfies TranscriptionResult;
  }

  const body = new FormData();
  body.append("model_id", "scribe_v2");
  body.append("file", file);

  const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: {
      "xi-api-key": env.elevenlabsApiKey,
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs transcription failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    text?: string;
    language_code?: string;
    language_probability?: number;
    words?: TranscriptionWord[];
  };

  return {
    text: payload.text?.trim() || `${file.name} transcript unavailable`,
    languageCode: payload.language_code,
    languageProbability: payload.language_probability,
    words: payload.words ?? [],
  } satisfies TranscriptionResult;
}

export async function synthesizeSpeech(
  text: string,
  targetLanguage: string,
  voicePreset: VoicePresetId = "balanced",
  voiceGender: VoiceGenderId = "neutral",
  voiceSpeed: VoiceSpeedId = "1.00",
) {
  if (!hasAiProviders()) {
    return {
      audioBase64: Buffer.alloc(0).toString("base64"),
      audioMimeType: "audio/wav",
      provider: "mock",
    };
  }

  const voiceId = resolveVoiceId(targetLanguage, voicePreset, voiceGender);

  const voiceSettingsByPreset: Record<VoicePresetId, { stability: number; similarity_boost: number; style: number }> = {
    balanced: {
      stability: 0.5,
      similarity_boost: 0.82,
      style: 0.12,
    },
    warm: {
      stability: 0.64,
      similarity_boost: 0.78,
      style: 0.06,
    },
    bright: {
      stability: 0.38,
      similarity_boost: 0.72,
      style: 0.28,
    },
    deep: {
      stability: 0.58,
      similarity_boost: 0.84,
      style: 0.14,
    },
  };

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": env.elevenlabsApiKey,
      },
      body: JSON.stringify({
        model_id: "eleven_flash_v2_5",
        text,
        voice_settings: {
          ...voiceSettingsByPreset[voicePreset],
          speed: Number(voiceSpeed),
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    let detailMessage = "";

    try {
      const payload = JSON.parse(errorText) as {
        detail?:
          | string
          | {
              message?: string;
              code?: string;
              type?: string;
            };
      };

      if (typeof payload.detail === "string") {
        detailMessage = payload.detail;
      } else if (payload.detail?.message) {
        detailMessage = payload.detail.message;
      }
    } catch {
      detailMessage = errorText.trim();
    }

    if (response.status === 402) {
      throw new Error(
        `ElevenLabs TTS credits are insufficient or payment is required (402).${detailMessage ? ` Details: ${detailMessage}` : ""}`,
      );
    }

    throw new Error(
      `ElevenLabs synthesis failed with ${response.status}.${detailMessage ? ` Details: ${detailMessage}` : ""}`,
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return {
    audioBase64: buffer.toString("base64"),
    audioMimeType: response.headers.get("content-type") || "audio/mpeg",
    provider: "elevenlabs",
  };
}
