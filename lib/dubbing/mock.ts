import { Buffer } from "node:buffer";

import { supportedLanguages } from "@/lib/constants";

function createSilentWav(durationSeconds = 2, sampleRate = 16000) {
  const numChannels = 1;
  const bytesPerSample = 2;
  const totalSamples = durationSeconds * sampleRate;
  const dataSize = totalSamples * numChannels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28);
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32);
  buffer.writeUInt16LE(bytesPerSample * 8, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}

export function buildMockDub(fileName: string, targetLanguage: string) {
  const language =
    supportedLanguages.find((item) => item.code === targetLanguage)?.labelEn ?? targetLanguage;

  const transcript = `${fileName} 파일을 분석한 mock transcript입니다. 실제 API 키를 연결하면 ElevenLabs STT 결과가 표시됩니다.`;
  const translatedText = `${language} 음성으로 더빙될 문장을 mock 모드로 생성했습니다. 제출용 데모 흐름은 그대로 검증할 수 있습니다.`;

  return {
    transcript,
    translatedText,
    audioBase64: createSilentWav(2).toString("base64"),
    audioMimeType: "audio/wav",
    provider: "mock",
  };
}
