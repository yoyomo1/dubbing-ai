export const supportedLanguages = [
  { code: "en", labelKo: "영어", labelEn: "English", accentKo: "글로벌 영어", accentEn: "Global English" },
  { code: "de", labelKo: "독일어", labelEn: "German", accentKo: "베를린 톤", accentEn: "Berlin Neutral" },
  { code: "es", labelKo: "스페인어", labelEn: "Spanish", accentKo: "스페인/중남미 중립", accentEn: "Spain / LatAm Neutral" },
  { code: "pl", labelKo: "폴란드어", labelEn: "Polish", accentKo: "바르샤바 톤", accentEn: "Warsaw Neutral" },
  { code: "pt", labelKo: "포르투갈어", labelEn: "Portuguese", accentKo: "브라질 톤", accentEn: "Brasil Neutral" },
  { code: "it", labelKo: "이탈리아어", labelEn: "Italian", accentKo: "로마 톤", accentEn: "Rome Neutral" },
  { code: "fr", labelKo: "프랑스어", labelEn: "French", accentKo: "파리 톤", accentEn: "Paris Neutral" },
  { code: "ko", labelKo: "한국어", labelEn: "Korean", accentKo: "서울 톤", accentEn: "Seoul Tone" },
  { code: "da", labelKo: "덴마크어", labelEn: "Danish", accentKo: "코펜하겐 톤", accentEn: "Copenhagen Neutral" },
] as const;

export const voicePresets = [
  {
    id: "balanced",
    labelKo: "균형형",
    labelEn: "Balanced",
    descriptionKo: "성별과 장르를 크게 타지 않는 기본 보이스",
    descriptionEn: "A balanced default voice for general use",
  },
  {
    id: "warm",
    labelKo: "부드러운 톤",
    labelEn: "Warm",
    descriptionKo: "차분하고 따뜻한 화자 느낌",
    descriptionEn: "A calm and warm speaking tone",
  },
  {
    id: "bright",
    labelKo: "밝은 톤",
    labelEn: "Bright",
    descriptionKo: "명료하고 경쾌한 화자 느낌",
    descriptionEn: "A clear and energetic speaking tone",
  },
  {
    id: "deep",
    labelKo: "중저음 톤",
    labelEn: "Deep",
    descriptionKo: "무게감 있는 화자 느낌",
    descriptionEn: "A lower and heavier speaking tone",
  },
] as const;

export type VoicePresetId = (typeof voicePresets)[number]["id"];

export const voiceGenders = [
  {
    id: "neutral",
    labelKo: "상관없음",
    labelEn: "Any",
  },
  {
    id: "female",
    labelKo: "여성 톤",
    labelEn: "Female",
  },
  {
    id: "male",
    labelKo: "남성 톤",
    labelEn: "Male",
  },
] as const;

export type VoiceGenderId = (typeof voiceGenders)[number]["id"];

export const voiceProfiles = [
  {
    id: "neutral-balanced",
    labelKo: "기본 보이스",
    labelEn: "Default Voice",
    descriptionKo: "가장 무난한 기본 더빙 톤",
    descriptionEn: "The safest default dubbing voice",
    voicePreset: "balanced",
    voiceGender: "neutral",
  },
  {
    id: "female-bright",
    labelKo: "여성 밝은 톤",
    labelEn: "Female Bright",
    descriptionKo: "명료하고 경쾌한 여성 보이스",
    descriptionEn: "A clear and energetic female voice",
    voicePreset: "bright",
    voiceGender: "female",
  },
  {
    id: "female-warm",
    labelKo: "여성 부드러운 톤",
    labelEn: "Female Warm",
    descriptionKo: "차분하고 부드러운 여성 보이스",
    descriptionEn: "A calm and soft female voice",
    voicePreset: "warm",
    voiceGender: "female",
  },
  {
    id: "male-bright",
    labelKo: "남성 밝은 톤",
    labelEn: "Male Bright",
    descriptionKo: "선명하고 가벼운 남성 보이스",
    descriptionEn: "A clear and lighter male voice",
    voicePreset: "bright",
    voiceGender: "male",
  },
  {
    id: "male-warm",
    labelKo: "남성 부드러운 톤",
    labelEn: "Male Warm",
    descriptionKo: "차분하고 안정적인 남성 보이스",
    descriptionEn: "A calm and steady male voice",
    voicePreset: "warm",
    voiceGender: "male",
  },
  {
    id: "male-deep",
    labelKo: "남성 중저음 톤",
    labelEn: "Male Deep",
    descriptionKo: "무게감 있는 남성 보이스",
    descriptionEn: "A lower and heavier male voice",
    voicePreset: "deep",
    voiceGender: "male",
  },
] as const satisfies ReadonlyArray<{
  id: string;
  labelKo: string;
  labelEn: string;
  descriptionKo: string;
  descriptionEn: string;
  voicePreset: VoicePresetId;
  voiceGender: VoiceGenderId;
}>;

export type VoiceProfileId = (typeof voiceProfiles)[number]["id"];

export const voiceSpeedOptions = [
  {
    id: "0.96",
    labelKo: "느리게",
    labelEn: "Slow",
  },
  {
    id: "1.00",
    labelKo: "기본",
    labelEn: "Normal",
  },
  {
    id: "1.08",
    labelKo: "빠르게",
    labelEn: "Fast",
  },
] as const;

export type VoiceSpeedId = (typeof voiceSpeedOptions)[number]["id"];

export const filterChips = [
  "전체",
  "오디오",
  "영어",
  "독일어",
  "스페인어",
  "폴란드어",
  "포르투갈어",
  "이탈리아어",
  "프랑스어",
  "한국어",
  "덴마크어",
] as const;

export const sampleCards = [
  {
    id: "creator-brief",
    title: "인터뷰 클립 보이스 더빙",
    subtitle: "WAV -> 영어 음성",
    kind: "오디오",
    duration: "0:34",
    views: "크리에이터용 음성 현지화",
  },
  {
    id: "podcast-cut",
    title: "팟캐스트 클립 현지화",
    subtitle: "WAV -> 독일어 음성",
    kind: "오디오",
    duration: "1:12",
    views: "전사 / 번역 / TTS",
  },
  {
    id: "support-demo",
    title: "브랜드 내레이션 현지화",
    subtitle: "MP3 -> 스페인어 음성",
    kind: "오디오",
    duration: "0:48",
    views: "결과 다운로드 지원",
  },
];

export const stageOrder = [
  "idle",
  "extracting",
  "transcribing",
  "translating",
  "synthesizing",
  "muxing",
  "done",
  "error",
] as const;

export type JobStage = (typeof stageOrder)[number];
