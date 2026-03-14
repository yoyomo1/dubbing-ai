const DEFAULT_SECRET = "dev-secret-change-me";

const baseVoiceMap = {
  en: process.env.ELEVENLABS_VOICE_EN || "21m00Tcm4TlvDq8ikWAM",
  de: process.env.ELEVENLABS_VOICE_DE || process.env.ELEVENLABS_VOICE_EN || "21m00Tcm4TlvDq8ikWAM",
  es: process.env.ELEVENLABS_VOICE_ES || "XB0fDUnXU5powFXDhCwa",
  pl: process.env.ELEVENLABS_VOICE_PL || process.env.ELEVENLABS_VOICE_EN || "21m00Tcm4TlvDq8ikWAM",
  pt: process.env.ELEVENLABS_VOICE_PT || process.env.ELEVENLABS_VOICE_ES || "XB0fDUnXU5powFXDhCwa",
  fil: process.env.ELEVENLABS_VOICE_FIL || process.env.ELEVENLABS_VOICE_EN || "21m00Tcm4TlvDq8ikWAM",
  it: process.env.ELEVENLABS_VOICE_IT || process.env.ELEVENLABS_VOICE_EN || "21m00Tcm4TlvDq8ikWAM",
  hi: process.env.ELEVENLABS_VOICE_HI || process.env.ELEVENLABS_VOICE_EN || "21m00Tcm4TlvDq8ikWAM",
  cs: process.env.ELEVENLABS_VOICE_CS || process.env.ELEVENLABS_VOICE_EN || "21m00Tcm4TlvDq8ikWAM",
  fr: process.env.ELEVENLABS_VOICE_FR || process.env.ELEVENLABS_VOICE_EN || "21m00Tcm4TlvDq8ikWAM",
  ar: process.env.ELEVENLABS_VOICE_AR || process.env.ELEVENLABS_VOICE_EN || "21m00Tcm4TlvDq8ikWAM",
  ro: process.env.ELEVENLABS_VOICE_RO || process.env.ELEVENLABS_VOICE_EN || "21m00Tcm4TlvDq8ikWAM",
  tr: process.env.ELEVENLABS_VOICE_TR || process.env.ELEVENLABS_VOICE_EN || "21m00Tcm4TlvDq8ikWAM",
  hr: process.env.ELEVENLABS_VOICE_HR || process.env.ELEVENLABS_VOICE_EN || "21m00Tcm4TlvDq8ikWAM",
  ko: process.env.ELEVENLABS_VOICE_KO || "EXAVITQu4vr4xnSDxMaL",
  sk: process.env.ELEVENLABS_VOICE_SK || process.env.ELEVENLABS_VOICE_EN || "21m00Tcm4TlvDq8ikWAM",
  uk: process.env.ELEVENLABS_VOICE_UK || process.env.ELEVENLABS_VOICE_EN || "21m00Tcm4TlvDq8ikWAM",
  sv: process.env.ELEVENLABS_VOICE_SV || process.env.ELEVENLABS_VOICE_EN || "21m00Tcm4TlvDq8ikWAM",
  ta: process.env.ELEVENLABS_VOICE_TA || process.env.ELEVENLABS_VOICE_EN || "21m00Tcm4TlvDq8ikWAM",
  da: process.env.ELEVENLABS_VOICE_DA || process.env.ELEVENLABS_VOICE_EN || "21m00Tcm4TlvDq8ikWAM",
} as const;

const curatedVoiceMap = {
  NEUTRAL_BALANCED: "21m00Tcm4TlvDq8ikWAM",
  NEUTRAL_WARM: "21m00Tcm4TlvDq8ikWAM",
  NEUTRAL_BRIGHT: "EXAVITQu4vr4xnSDxMaL",
  NEUTRAL_DEEP: "pNInz6obpgDQGcFmaJgB",
  FEMALE_BALANCED: "21m00Tcm4TlvDq8ikWAM",
  FEMALE_WARM: "21m00Tcm4TlvDq8ikWAM",
  FEMALE_BRIGHT: "EXAVITQu4vr4xnSDxMaL",
  FEMALE_DEEP: "MF3mGyEYCl7XYWbV9V6O",
  MALE_BALANCED: "TxGEqnHWrfWFTfGW9XjX",
  MALE_WARM: "ErXwobaYiN019PkySvjV",
  MALE_BRIGHT: "TxGEqnHWrfWFTfGW9XjX",
  MALE_DEEP: "pNInz6obpgDQGcFmaJgB",
} as const;

function parseCsv(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export const env = {
  appUrl: process.env.NEXTAUTH_URL || "http://localhost:3000",
  authSecret: process.env.NEXTAUTH_SECRET || DEFAULT_SECRET,
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  tursoUrl: process.env.TURSO_DATABASE_URL || "file:local.db",
  tursoAuthToken: process.env.TURSO_AUTH_TOKEN || "",
  ownerEmails: parseCsv(process.env.OWNER_EMAILS),
  seedAllowlist: parseCsv(process.env.ALLOWLIST_EMAILS),
  elevenlabsApiKey: process.env.ELEVENLABS_API_KEY || "",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  voiceMap: baseVoiceMap,
};

export function hasGoogleAuth() {
  return Boolean(env.googleClientId && env.googleClientSecret);
}

export function hasAiProviders() {
  return Boolean(env.elevenlabsApiKey && env.geminiApiKey);
}

export function resolveVoiceId(
  targetLanguage: string,
  voicePreset = "balanced",
  voiceGender = "neutral",
) {
  const languageKey = targetLanguage.toLowerCase() as keyof typeof baseVoiceMap;
  const presetKey = voicePreset.toUpperCase();
  const genderKey = voiceGender.toUpperCase();
  const languageVoice = baseVoiceMap[languageKey] || baseVoiceMap.en;

  const languageGenderPreset =
    process.env[`ELEVENLABS_VOICE_${languageKey.toUpperCase()}_${genderKey}_${presetKey}`];
  const languageGender = process.env[`ELEVENLABS_VOICE_${languageKey.toUpperCase()}_${genderKey}`];
  const presetSpecific =
    process.env[`ELEVENLABS_VOICE_${languageKey.toUpperCase()}_${presetKey}`];
  const genderSpecific = process.env[`ELEVENLABS_VOICE_${genderKey}`];
  const genderPreset = process.env[`ELEVENLABS_VOICE_${genderKey}_${presetKey}`];
  const presetFallback = process.env[`ELEVENLABS_VOICE_${presetKey}`];
  const curatedFallback =
    curatedVoiceMap[`${genderKey}_${presetKey}` as keyof typeof curatedVoiceMap] ||
    curatedVoiceMap[`NEUTRAL_${presetKey}` as keyof typeof curatedVoiceMap];

  return (
    languageGenderPreset ||
    languageGender ||
    presetSpecific ||
    genderPreset ||
    genderSpecific ||
    presetFallback ||
    curatedFallback ||
    languageVoice
  );
}
