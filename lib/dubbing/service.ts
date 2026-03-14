import { buildMockDub } from "@/lib/dubbing/mock";
import {
  synthesizeSpeech,
  transcribeAudio,
  type TranscriptionResult,
} from "@/lib/dubbing/elevenlabs";
import { translateText } from "@/lib/dubbing/translate";
import { hasAiProviders } from "@/lib/env";
import type { VoiceGenderId, VoicePresetId, VoiceSpeedId } from "@/lib/constants";

function analyzeTranscription(transcription: TranscriptionResult) {
  const spokenWords = transcription.words.filter(
    (word) => word.type === "word" && word.text?.trim(),
  );
  const speakerIds = new Set(
    spokenWords.map((word) => word.speaker_id).filter(Boolean),
  );

  const starts = spokenWords
    .map((word) => word.start)
    .filter((value): value is number => typeof value === "number");
  const ends = spokenWords
    .map((word) => word.end)
    .filter((value): value is number => typeof value === "number");

  const durationSeconds =
    starts.length && ends.length ? Math.max(...ends) - Math.min(...starts) : 0;
  const wordsPerSecond =
    durationSeconds > 0 ? Number((spokenWords.length / durationSeconds).toFixed(2)) : 0;

  let recommendedVoiceSpeed: VoiceSpeedId = "1.00";
  let recommendedVoicePreset: VoicePresetId = "balanced";

  if (wordsPerSecond >= 2.8) {
    recommendedVoiceSpeed = "1.08";
    recommendedVoicePreset = "bright";
  } else if (wordsPerSecond > 0 && wordsPerSecond <= 1.8) {
    recommendedVoiceSpeed = "0.96";
    recommendedVoicePreset = "warm";
  }

  return {
    languageCode: transcription.languageCode || "unknown",
    languageProbability: transcription.languageProbability ?? 0,
    speakerCount: Math.max(speakerIds.size, spokenWords.length ? 1 : 0),
    wordCount: spokenWords.length,
    wordsPerSecond,
    recommendedVoicePreset,
    recommendedVoiceGender: "neutral" as VoiceGenderId,
    recommendedVoiceSpeed,
  };
}

export async function runDubbing(
  file: File,
  targetLanguage: string,
  voicePreset: VoicePresetId = "balanced",
  voiceGender: VoiceGenderId = "neutral",
  voiceSpeed: VoiceSpeedId = "1.00",
) {
  if (!hasAiProviders()) {
    return buildMockDub(file.name, targetLanguage);
  }

  const transcription = await transcribeAudio(file);
  const analysis = analyzeTranscription(transcription);
  const effectiveVoicePreset =
    voicePreset === "balanced" ? analysis.recommendedVoicePreset : voicePreset;
  const effectiveVoiceSpeed =
    voiceSpeed === "1.00" ? analysis.recommendedVoiceSpeed : voiceSpeed;

  const translatedText = await translateText(
    transcription.text,
    targetLanguage,
    transcription.languageCode,
  );
  const audio = await synthesizeSpeech(
    translatedText,
    targetLanguage,
    effectiveVoicePreset,
    voiceGender,
    effectiveVoiceSpeed,
  );

  return {
    transcript: transcription.text,
    translatedText,
    transcription,
    analysis,
    appliedVoicePreset: effectiveVoicePreset,
    appliedVoiceGender: voiceGender,
    appliedVoiceSpeed: effectiveVoiceSpeed,
    ...audio,
  };
}
