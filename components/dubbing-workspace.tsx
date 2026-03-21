"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Download, FileAudio2, Film, Loader2, Sparkles, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useLocale } from "@/components/locale-provider";
import { SignInButton } from "@/components/auth/sign-in-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  stageOrder,
  supportedLanguages,
  voiceProfiles,
  voicePresets,
  voiceSpeedOptions,
  type JobStage,
  type VoiceGenderId,
  type VoiceProfileId,
  type VoicePresetId,
  type VoiceSpeedId,
} from "@/lib/constants";
import {
  extractAudioFromVideo,
  getMediaDuration,
  MAX_CLIENT_MEDIA_SECONDS,
  muxAudioWithVideo,
  trimAudioSegment,
} from "@/lib/media/client-ffmpeg";

const formSchema = z.object({
  targetLanguage: z.string().min(2),
  voiceProfile: z.string().min(2),
  processingRange: z.enum(["full", "selected-range"]),
  cropStartSeconds: z.coerce.number().min(0),
  cropDurationSeconds: z.coerce.number().min(1).max(MAX_CLIENT_MEDIA_SECONDS),
});

type DubbingFormInput = z.input<typeof formSchema>;
type DubbingFormValues = z.output<typeof formSchema>;

function progressForStage(stage: JobStage) {
  const index = stageOrder.indexOf(stage);
  return index < 0 ? 0 : Math.max(8, Math.round((index / (stageOrder.length - 2)) * 100));
}

function base64ToBlob(base64: string, mimeType: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const restSeconds = safeSeconds % 60;
  return `${minutes}:${String(restSeconds).padStart(2, "0")}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function DubbingWorkspace({
  canUseApp,
  hasGoogleAuth,
}: {
  canUseApp: boolean;
  hasGoogleAuth: boolean;
}) {
  const { locale } = useLocale();
  const form = useForm<DubbingFormInput, unknown, DubbingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      targetLanguage: "en",
      voiceProfile: "neutral-balanced",
      processingRange: "full",
      cropStartSeconds: 0,
      cropDurationSeconds: 60,
    },
  });

  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);
  const [selectedMediaDuration, setSelectedMediaDuration] = useState<number | null>(null);
  const [jobStage, setJobStage] = useState<JobStage>("idle");
  const [transcript, setTranscript] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [resultAudioUrl, setResultAudioUrl] = useState<string | null>(null);
  const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null);
  const [activeTextTab, setActiveTextTab] = useState<"transcript" | "translation">("transcript");
  const [analysis, setAnalysis] = useState<{
    languageCode: string;
    languageProbability: number;
    speakerCount: number;
    wordCount: number;
    wordsPerSecond: number;
    recommendedVoicePreset: VoicePresetId;
    recommendedVoiceGender: VoiceGenderId;
    recommendedVoiceSpeed: VoiceSpeedId;
  } | null>(null);
  useEffect(() => {
    if (!selectedMedia) {
      setSelectedMediaUrl(null);
      setSelectedMediaDuration(null);
      return;
    }

    const url = URL.createObjectURL(selectedMedia);
    setSelectedMediaUrl(url);

    let cancelled = false;
    getMediaDuration(selectedMedia)
      .then((duration) => {
        if (!cancelled) {
          setSelectedMediaDuration(duration);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSelectedMediaDuration(null);
        }
      });

    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [selectedMedia]);

  useEffect(() => {
    return () => {
      if (resultAudioUrl) {
        URL.revokeObjectURL(resultAudioUrl);
      }
      if (resultVideoUrl) {
        URL.revokeObjectURL(resultVideoUrl);
      }
    };
  }, [resultAudioUrl, resultVideoUrl]);

  useEffect(() => {
    if (selectedMediaDuration === null) {
      return;
    }

    const roundedDuration = Math.max(1, Math.floor(selectedMediaDuration));
    form.setValue("cropStartSeconds", 0, { shouldDirty: false, shouldValidate: false });
    form.setValue("cropDurationSeconds", Math.min(roundedDuration, MAX_CLIENT_MEDIA_SECONDS), {
      shouldDirty: false,
      shouldValidate: false,
    });
  }, [form, selectedMediaDuration]);

  const currentMediaType = useMemo(() => {
    if (!selectedMedia) return "audio";
    return selectedMedia.type.startsWith("video/") ? "video" : "audio";
  }, [selectedMedia]);
  const isProcessing =
    jobStage === "extracting" ||
    jobStage === "transcribing" ||
    jobStage === "synthesizing" ||
    jobStage === "muxing";
  const resultMediaUrl = currentMediaType === "video" ? resultVideoUrl : resultAudioUrl;
  const selectedProcessingRange = form.watch("processingRange");
  const shouldCropOnDevice = selectedProcessingRange === "selected-range";
  const cropStartSeconds = form.watch("cropStartSeconds");
  const cropDurationSeconds = form.watch("cropDurationSeconds");
  const roundedMediaDuration = selectedMediaDuration ? Math.max(1, Math.floor(selectedMediaDuration)) : null;
  const cropStartMax = roundedMediaDuration ? Math.max(0, roundedMediaDuration - 1) : MAX_CLIENT_MEDIA_SECONDS;
  const cropStartValue =
    typeof cropStartSeconds === "number" ? cropStartSeconds : Number(cropStartSeconds ?? 0) || 0;
  const cropDurationValue =
    typeof cropDurationSeconds === "number"
      ? cropDurationSeconds
      : Number(cropDurationSeconds ?? Math.min(roundedMediaDuration ?? MAX_CLIENT_MEDIA_SECONDS, MAX_CLIENT_MEDIA_SECONDS)) ||
        Math.min(roundedMediaDuration ?? MAX_CLIENT_MEDIA_SECONDS, MAX_CLIENT_MEDIA_SECONDS);
  const cropAvailableDuration = roundedMediaDuration
    ? Math.max(1, Math.min(MAX_CLIENT_MEDIA_SECONDS, roundedMediaDuration - cropStartValue))
    : MAX_CLIENT_MEDIA_SECONDS;
  const cropEndValue = cropStartValue + cropDurationValue;
  const isKorean = locale === "ko";

  useEffect(() => {
    if (!shouldCropOnDevice || !roundedMediaDuration) {
      return;
    }

    const safeStart = clamp(cropStartValue, 0, Math.max(0, roundedMediaDuration - 1));
    const safeDuration = clamp(
      cropDurationValue,
      1,
      Math.min(MAX_CLIENT_MEDIA_SECONDS, roundedMediaDuration - safeStart),
    );

    if (safeStart !== cropStartSeconds) {
      form.setValue("cropStartSeconds", safeStart, { shouldDirty: true, shouldValidate: false });
    }
    if (safeDuration !== cropDurationSeconds) {
      form.setValue("cropDurationSeconds", safeDuration, { shouldDirty: true, shouldValidate: false });
    }
  }, [cropDurationSeconds, cropDurationValue, cropStartSeconds, cropStartValue, form, roundedMediaDuration, shouldCropOnDevice]);

  const applyCropRange = (start: number, duration: number) => {
    if (!roundedMediaDuration) {
      return;
    }

    const safeStart = clamp(Math.floor(start), 0, Math.max(0, roundedMediaDuration - 1));
    const safeDuration = clamp(
      Math.floor(duration),
      1,
      Math.min(MAX_CLIENT_MEDIA_SECONDS, roundedMediaDuration - safeStart),
    );

    form.setValue("cropStartSeconds", safeStart, { shouldDirty: true, shouldValidate: false });
    form.setValue("cropDurationSeconds", safeDuration, { shouldDirty: true, shouldValidate: false });
  };

  const alignCropToFileEnd = () => {
    if (!roundedMediaDuration) {
      return;
    }

    const safeStart = clamp(cropStartValue, 0, Math.max(0, roundedMediaDuration - 1));
    const remainingDuration = Math.min(MAX_CLIENT_MEDIA_SECONDS, roundedMediaDuration - safeStart);
    applyCropRange(safeStart, remainingDuration);
  };

  const applyFirstMinutePreset = () => {
    if (!roundedMediaDuration) {
      return;
    }

    applyCropRange(0, Math.min(roundedMediaDuration, MAX_CLIENT_MEDIA_SECONDS));
  };

  const applyLastMinutePreset = () => {
    if (!roundedMediaDuration) {
      return;
    }

    const start = Math.max(0, roundedMediaDuration - MAX_CLIENT_MEDIA_SECONDS);
    applyCropRange(start, roundedMediaDuration - start);
  };

  const t = {
    brand: isKorean ? "더빙AI" : "DubbingAI",
    heroTitle: isKorean
      ? "오디오와 비디오를 업로드하면 바로 더빙 결과를 만들어줍니다"
      : "Upload audio or video and get dubbed output instantly",
    heroDescription: isKorean
      ? "원본 음성을 전사하고, 선택한 언어로 번역한 뒤 자연스러운 음성으로 다시 생성합니다. 비디오는 더빙된 음성을 다시 합쳐 결과 파일로 제공합니다."
      : "The app extracts speech, translates it into your selected language, and generates natural dubbed audio. For video, the dubbed track is merged back into the final file.",
    newJob: isKorean ? "새 더빙 작업" : "New Dubbing Job",
    supportsMedia: isKorean ? "오디오와 비디오 파일 모두 업로드할 수 있습니다." : "You can upload both audio and video files.",
    oauthRequired: isKorean ? "Google OAuth 설정 필요" : "Google OAuth Required",
    oauthDescription: isKorean
      ? "`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`를 설정해야 실제 로그인 플로우가 동작합니다."
      : "Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `NEXTAUTH_SECRET` to enable the real sign-in flow.",
    signInRequired: isKorean ? "로그인 후 사용할 수 있습니다" : "Sign in to continue",
    signInDescription: isKorean
      ? "허용된 Google 계정으로 로그인하면 업로드 폼이 활성화됩니다."
      : "The upload form is enabled after signing in with an allowed Google account.",
    fileRequired: isKorean ? "먼저 오디오 또는 비디오 파일을 선택해야 합니다." : "Select an audio or video file first.",
    allowlistedOnly: isKorean ? "허용된 Google 계정으로 로그인해야 업로드가 가능합니다." : "You must sign in with an allowed Google account to upload.",
    dubbingFailed: isKorean ? "더빙 처리 실패" : "Dubbing failed",
    dubbingReady: isKorean ? "더빙 결과가 준비되었습니다." : "Dubbed output is ready.",
    dubbingFailedToast: isKorean ? "더빙 처리에 실패했습니다." : "Failed to process dubbing.",
    fileSelected: (name: string) => (isKorean ? `${name} 파일이 선택되었습니다.` : `${name} selected.`),
    sourcePlaceholder: isKorean ? "파일을 선택하면 원본이 여기에 표시됩니다." : "The source preview will appear here after selecting a file.",
    resultGenerating: isKorean ? "더빙 결과를 생성하고 있습니다." : "Generating dubbed output.",
    resultPlaceholder: isKorean ? "더빙 결과가 여기에 표시됩니다." : "Dubbed output will appear here.",
    sourceTitle: isKorean ? "원본" : "Source",
    sourceSubtitle: isKorean ? "업로드한 원본 미리보기" : "Source preview",
    resultTitle: isKorean ? "더빙 결과" : "Dubbed Output",
    resultSubtitleReady: isKorean ? "생성된 더빙 결과 미리보기" : "Dubbed output preview",
    resultSubtitlePending: isKorean ? "더빙 시작 후 결과 표시" : "Output appears after dubbing starts",
    ready: isKorean ? "준비됨" : "Ready",
    processing: isKorean ? "생성 중" : "Processing",
    idle: isKorean ? "대기" : "Idle",
    uploadTitle: isKorean ? "오디오 또는 비디오 업로드" : "Upload Audio or Video",
    uploadFormats: isKorean ? "입력 형식: .mp4, .mov, .mp3, .wav, .aac" : "Formats: .mp4, .mov, .mp3, .wav, .aac",
    recommendedLength: isKorean ? "권장 길이 90초 이하" : "Recommended length: under 90 seconds",
    processingRange: isKorean ? "처리 범위" : "Processing Range",
    chooseProcessingRange: isKorean ? "처리 범위를 선택하세요" : "Select processing range",
    processingRangeDesc: isKorean
      ? "대용량 파일이나 모바일 환경에서는 앞 1분만 처리하면 더 안정적으로 동작합니다."
      : "For large files or mobile devices, processing only the first minute is more reliable.",
    processFullFile: isKorean ? "전체 파일 처리" : "Process full file",
    processFirstMinute: isKorean ? "선택 구간 처리" : "Process selected range",
    cropStart: isKorean ? "시작 시간(초)" : "Start time (sec)",
    cropDuration: isKorean ? "선택 길이(초)" : "Selected length (sec)",
    cropRangeDesc: isKorean
      ? "선택 구간은 최대 60초까지만 처리됩니다."
      : "The selected range can be up to 60 seconds.",
    cropRangeGuide: isKorean
      ? "숫자 입력이 불편하면 아래 슬라이더나 빠른 선택 버튼을 사용하세요."
      : "Use the sliders or quick actions below if typing numbers is inconvenient.",
    cropRangeCurrent: (start: number, end: number) =>
      isKorean
        ? `현재 선택 구간 ${formatDuration(start)} ~ ${formatDuration(end)}`
        : `Selected range ${formatDuration(start)} ~ ${formatDuration(end)}`,
    cropRangeLength: (duration: number) =>
      isKorean ? `선택 길이 ${formatDuration(duration)}` : `Selected length ${formatDuration(duration)}`,
    cropRangeFileLength: (duration: number) =>
      isKorean ? `파일 길이 ${formatDuration(duration)}` : `File length ${formatDuration(duration)}`,
    cropAlignToEnd: isKorean ? "영상 끝까지 맞추기" : "Extend to file end",
    cropPresetFirstMinute: isKorean ? "처음 1분" : "First minute",
    cropPresetLastMinute: isKorean ? "마지막 1분" : "Last minute",
    cropPreset15: isKorean ? "15초" : "15 sec",
    cropPreset30: isKorean ? "30초" : "30 sec",
    cropPreset45: isKorean ? "45초" : "45 sec",
    cropPreset60: isKorean ? "60초" : "60 sec",
    cropRangeInvalid: isKorean
      ? "선택 구간은 0초 이상이고 최대 60초 이내여야 합니다."
      : "The selected range must start at 0 or later and be no longer than 60 seconds.",
    cropRangeBeyondFile: isKorean
      ? "선택 구간이 파일 길이를 초과합니다."
      : "The selected range exceeds the file duration.",
    cropDetected: (duration: number) =>
      isKorean
        ? `현재 파일 길이 ${formatDuration(duration)} · 선택한 구간만 업로드 전에 기기에서 잘라 처리`
        : `Current file length ${formatDuration(duration)} · only the selected range will be cropped on-device before upload`,
    chooseFile: isKorean ? "파일 선택" : "Choose File",
    changeFile: isKorean ? "파일 변경" : "Change File",
    targetLanguage: isKorean ? "타겟 언어" : "Target Language",
    chooseLanguage: isKorean ? "언어를 선택하세요" : "Select a language",
    supportLangDesc: isKorean ? "품질 우선 기준으로 선별한 9개 언어를 지원합니다." : "Supports 9 quality-first languages.",
    voiceChoice: isKorean ? "목소리 선택" : "Voice Choice",
    chooseVoice: isKorean ? "원하는 목소리를 선택하세요" : "Choose a voice",
    voiceDesc: isKorean ? "성별과 톤을 합친 목소리 옵션에서 바로 선택할 수 있습니다." : "Choose from combined voice gender and tone options.",
    startDubbing: isKorean ? "더빙 시작" : "Start Dubbing",
    downloadResult: isKorean ? "결과 다운로드" : "Download Result",
    progress: isKorean ? "진행 상태" : "Progress",
    supportedLanguages: isKorean ? "지원 언어" : "Supported Languages",
    autoRecommended: isKorean ? "자동 추천" : "Auto Recommendation",
    detectedLanguage: isKorean ? "감지 언어" : "Detected language",
    speakerCount: isKorean ? "화자 수" : "Speaker count",
    speechRate: isKorean ? "발화 속도" : "Speech rate",
    recommendedTone: isKorean ? "추천 톤" : "Recommended tone",
    recommendedSpeed: isKorean ? "추천 속도" : "Recommended speed",
    textReview: isKorean ? "텍스트 확인" : "Text Review",
    textReviewVideo: isKorean ? "영상에서 추출한 텍스트와 번역 결과를 확인할 수 있습니다." : "Review extracted video text and translated output.",
    textReviewAudio: isKorean ? "추출한 텍스트와 번역 결과를 확인할 수 있습니다." : "Review extracted audio text and translated output.",
    extractedText: isKorean ? "추출 텍스트" : "Extracted Text",
    translatedText: isKorean ? "번역 텍스트" : "Translated Text",
    extractedVideoPlaceholder: isKorean ? "영상에서 추출한 텍스트가 여기에 표시됩니다." : "Extracted video text will appear here.",
    extractedAudioPlaceholder: isKorean ? "오디오에서 추출한 텍스트가 여기에 표시됩니다." : "Extracted audio text will appear here.",
    translatedPlaceholder: isKorean ? "번역 결과가 여기에 표시됩니다." : "Translated text will appear here.",
    video: isKorean ? "비디오" : "Video",
    audio: isKorean ? "오디오" : "Audio",
  };
  const stageLabels: Record<JobStage, string> = {
    idle: isKorean ? "대기" : "Idle",
    extracting: isKorean ? "기기에서 미디어 준비 중" : "Preparing media on device",
    transcribing: "ElevenLabs STT",
    translating: isKorean ? "번역 모델 처리" : "Translating",
    synthesizing: "ElevenLabs TTS",
    muxing: isKorean ? "비디오 결과 생성" : "Merging dubbed video",
    done: isKorean ? "완료" : "Done",
    error: isKorean ? "오류" : "Error",
  };
  const getLanguageLabel = (code: string) => {
    const language = supportedLanguages.find((item) => item.code === code);
    return language ? (isKorean ? language.labelKo : language.labelEn) : code;
  };
  const getLanguageAccent = (code: string) => {
    const language = supportedLanguages.find((item) => item.code === code);
    return language ? (isKorean ? language.accentKo : language.accentEn) : code;
  };
  const getVoiceProfileLabel = (id: VoiceProfileId) => {
    const profile = voiceProfiles.find((item) => item.id === id);
    return profile ? (isKorean ? profile.labelKo : profile.labelEn) : id;
  };
  const getVoiceProfileDescription = (id: VoiceProfileId) => {
    const profile = voiceProfiles.find((item) => item.id === id);
    return profile ? (isKorean ? profile.descriptionKo : profile.descriptionEn) : id;
  };
  const getVoicePresetLabel = (id: VoicePresetId) => {
    const preset = voicePresets.find((item) => item.id === id);
    return preset ? (isKorean ? preset.labelKo : preset.labelEn) : id;
  };
  const getVoiceSpeedLabel = (id: VoiceSpeedId) => {
    const speed = voiceSpeedOptions.find((item) => item.id === id);
    return speed ? (isKorean ? speed.labelKo : speed.labelEn) : id;
  };

  async function onSubmit(values: DubbingFormValues) {
    if (!selectedMedia) {
      toast.error(t.fileRequired);
      return;
    }

    if (!canUseApp) {
      toast.error(t.allowlistedOnly);
      return;
    }

    setTranscript("");
    setTranslatedText("");
    setAnalysis(null);
    setActiveTextTab("transcript");
    if (resultAudioUrl) URL.revokeObjectURL(resultAudioUrl);
    setResultAudioUrl(null);
    if (resultVideoUrl) URL.revokeObjectURL(resultVideoUrl);
    setResultVideoUrl(null);

    const selectedVoiceProfile =
      voiceProfiles.find((profile) => profile.id === values.voiceProfile) ?? voiceProfiles[0];

    try {
      let uploadFile = selectedMedia;
      const mediaType = currentMediaType;
      if (shouldCropOnDevice) {
        if (
          values.cropStartSeconds < 0 ||
          values.cropDurationSeconds <= 0 ||
          values.cropDurationSeconds > MAX_CLIENT_MEDIA_SECONDS
        ) {
          toast.error(t.cropRangeInvalid);
          return;
        }

        if (
          selectedMediaDuration !== null &&
          values.cropStartSeconds + values.cropDurationSeconds > selectedMediaDuration
        ) {
          toast.error(t.cropRangeBeyondFile);
          return;
        }
      }

      const trimOptions =
        shouldCropOnDevice
          ? {
              startTimeSeconds: values.cropStartSeconds,
              durationSeconds: values.cropDurationSeconds,
            }
          : undefined;

      if (mediaType === "video") {
        setJobStage("extracting");
        uploadFile = await extractAudioFromVideo(selectedMedia, trimOptions);
      } else if (trimOptions) {
        setJobStage("extracting");
        uploadFile = await trimAudioSegment(
          selectedMedia,
          trimOptions.startTimeSeconds,
          trimOptions.durationSeconds,
        );
      }

      setJobStage("transcribing");

      const formData = new FormData();
      formData.append("media", uploadFile);
      formData.append("mediaType", mediaType);
      formData.append("targetLanguage", values.targetLanguage);
      formData.append("voicePreset", selectedVoiceProfile.voicePreset);
      formData.append("voiceGender", selectedVoiceProfile.voiceGender);

      const response = await fetch("/api/dub", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => ({ error: t.dubbingFailed }))) as { error?: string };
        throw new Error(error.error || t.dubbingFailed);
      }

      setJobStage("synthesizing");
      const payload = (await response.json()) as {
        transcript: string;
        translatedText: string;
        audioBase64: string;
        audioMimeType: string;
        analysis?: {
          languageCode: string;
          languageProbability: number;
          speakerCount: number;
          wordCount: number;
          wordsPerSecond: number;
          recommendedVoicePreset: VoicePresetId;
          recommendedVoiceGender: VoiceGenderId;
          recommendedVoiceSpeed: VoiceSpeedId;
        };
        appliedVoicePreset?: VoicePresetId;
        appliedVoiceGender?: VoiceGenderId;
        appliedVoiceSpeed?: VoiceSpeedId;
      };

      setTranscript(payload.transcript);
      setTranslatedText(payload.translatedText);
      setAnalysis(payload.analysis ?? null);

      const audioBlob = base64ToBlob(payload.audioBase64, payload.audioMimeType);
      const audioUrl = URL.createObjectURL(audioBlob);
      setResultAudioUrl(audioUrl);

      if (mediaType === "video") {
        setJobStage("muxing");
        const muxedVideo = await muxAudioWithVideo(selectedMedia, audioBlob, trimOptions);
        setResultVideoUrl(URL.createObjectURL(muxedVideo));
      }

      setJobStage("done");
      toast.success(t.dubbingReady);
    } catch (error) {
      console.error(error);
      setJobStage("error");
      toast.error(error instanceof Error ? error.message : t.dubbingFailedToast);
    }
  }

  function renderMediaPreview(url: string | null, mediaType: "audio" | "video", variant: "source" | "result") {
    if (!url) {
      return (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-[28px] border border-dashed border-[var(--border)] bg-[var(--panel-strong)] p-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
            {mediaType === "video" ? <Film className="h-6 w-6" /> : <FileAudio2 className="h-6 w-6" />}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-[var(--foreground)]">
              {variant === "source"
                ? t.sourcePlaceholder
                : isProcessing
                  ? t.resultGenerating
                  : t.resultPlaceholder}
            </p>
          </div>
        </div>
      );
    }

    if (mediaType === "video") {
      return <video controls className="aspect-video w-full rounded-[28px] bg-black object-contain" src={url} />;
    }

    return (
      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--panel-strong)] p-6">
        <audio controls className="w-full" src={url} />
      </div>
    );
  }

  return (
    <section id="workspace" className="space-y-8">
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <Badge className="mx-auto bg-black text-white">{t.brand}</Badge>
        <h1 className="text-4xl font-bold leading-tight tracking-tight lg:text-5xl">
          {t.heroTitle}
        </h1>
        <p className="text-base text-[var(--muted-foreground)] lg:text-lg">
          {t.heroDescription}
        </p>
      </div>

      <Card className="mx-auto max-w-6xl overflow-hidden border-0 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="grid gap-0 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="border-b border-[var(--border)] p-6 lg:border-b-0 lg:border-r lg:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)] text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">{t.newJob}</p>
                <p className="text-sm text-[var(--muted-foreground)]">{t.supportsMedia}</p>
              </div>
            </div>

            {!hasGoogleAuth ? (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="mb-2 h-4 w-4" />
                <AlertTitle>{t.oauthRequired}</AlertTitle>
                <AlertDescription>{t.oauthDescription}</AlertDescription>
              </Alert>
            ) : null}

            {!canUseApp ? (
              <Alert className="mb-6">
                <AlertTitle>{t.signInRequired}</AlertTitle>
                <AlertDescription className="flex flex-wrap items-center gap-3">
                  {t.signInDescription}
                  <SignInButton />
                </AlertDescription>
              </Alert>
            ) : null}

            <Form {...form}>
              <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
                <FormItem>
                  <FormControl>
                    <>
                      <Input
                        className="hidden"
                        id="media-upload"
                        type="file"
                        accept=".mp4,.mov,.mp3,.wav,.aac,audio/aac,audio/*,video/mp4,video/quicktime"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            setSelectedMedia(file);
                            setActiveTextTab("transcript");
                            toast.success(t.fileSelected(file.name));
                          }
                        }}
                      />
                      {selectedMedia ? (
                        <div className="space-y-4 rounded-[32px] border border-[var(--border)] bg-[linear-gradient(180deg,#fcfcfd_0%,#ffffff_100%)] p-5 shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold">{selectedMedia.name}</p>
                              <p className="text-sm text-[var(--muted-foreground)]">
                                {isKorean
                                  ? "파일이 선택되었습니다. 원본과 더빙 결과를 바로 비교할 수 있습니다."
                                  : "File selected. Compare the source and dubbed output in one place."}
                              </p>
                            </div>
                            <label
                              htmlFor="media-upload"
                              className="inline-flex cursor-pointer items-center rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--panel-strong)]"
                            >
                              {t.changeFile}
                            </label>
                          </div>

                          <div className="grid gap-4 lg:grid-cols-2">
                            <div className="space-y-3 rounded-[28px] border border-[var(--border)] bg-white p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold">{t.sourceTitle}</p>
                                  <p className="text-sm text-[var(--muted-foreground)]">{t.sourceSubtitle}</p>
                                </div>
                                <Badge variant="secondary">{currentMediaType === "video" ? t.video : t.audio}</Badge>
                              </div>
                              {renderMediaPreview(selectedMediaUrl, currentMediaType, "source")}
                            </div>

                            <div className="space-y-3 rounded-[28px] border border-[var(--border)] bg-white p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold">{t.resultTitle}</p>
                                  <p className="text-sm text-[var(--muted-foreground)]">
                                    {resultMediaUrl ? t.resultSubtitleReady : t.resultSubtitlePending}
                                  </p>
                                </div>
                                <Badge variant={resultMediaUrl ? "default" : "secondary"}>
                                  {resultMediaUrl ? t.ready : isProcessing ? t.processing : t.idle}
                                </Badge>
                              </div>
                              {renderMediaPreview(resultMediaUrl, currentMediaType, "result")}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <label
                          htmlFor="media-upload"
                          className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-4 rounded-[32px] border border-dashed border-[var(--border)] bg-[linear-gradient(180deg,#fcfcfd_0%,#f8fafc_100%)] p-8 text-center transition hover:border-[var(--accent)]/40 hover:bg-[linear-gradient(180deg,#ffffff_0%,#fef2f2_100%)]"
                        >
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--muted)]">
                            <Upload className="h-7 w-7" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-lg font-semibold">{t.uploadTitle}</p>
                            <p className="text-sm text-[var(--muted-foreground)]">{t.uploadFormats}</p>
                            <p className="text-xs text-[var(--muted-foreground)]">{t.recommendedLength}</p>
                          </div>
                          <span className="rounded-full bg-black px-5 py-2.5 text-sm text-white">{t.chooseFile}</span>
                        </label>
                      )}
                    </>
                  </FormControl>
                  {shouldCropOnDevice && selectedMediaDuration ? (
                    <FormDescription>{t.cropDetected(selectedMediaDuration)}</FormDescription>
                  ) : null}
                </FormItem>

                <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr]">
                  <FormField
                    control={form.control}
                    name="targetLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.targetLanguage}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder={t.chooseLanguage} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {supportedLanguages.map((language) => (
                              <SelectItem key={language.code} value={language.code}>
                                {getLanguageLabel(language.code)} · {getLanguageAccent(language.code)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>{t.supportLangDesc}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="voiceProfile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.voiceChoice}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder={t.chooseVoice} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {voiceProfiles.map((profile) => (
                              <SelectItem key={profile.id} value={profile.id}>
                                {getVoiceProfileLabel(profile.id)} · {getVoiceProfileDescription(profile.id)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>{t.voiceDesc}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="processingRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.processingRange}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder={t.chooseProcessingRange} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="full">{t.processFullFile}</SelectItem>
                            <SelectItem value="selected-range">{t.processFirstMinute}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>{t.processingRangeDesc}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </div>

                {shouldCropOnDevice ? (
                  <div className="space-y-4 rounded-[28px] border border-[var(--border)] bg-[var(--panel-strong)] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={applyFirstMinutePreset}>
                        {t.cropPresetFirstMinute}
                      </Button>
                      {roundedMediaDuration && roundedMediaDuration > MAX_CLIENT_MEDIA_SECONDS ? (
                        <Button type="button" variant="outline" size="sm" onClick={applyLastMinutePreset}>
                          {t.cropPresetLastMinute}
                        </Button>
                      ) : null}
                      <Button type="button" variant="ghost" size="sm" onClick={alignCropToFileEnd}>
                        {t.cropAlignToEnd}
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
                    <FormField
                      control={form.control}
                      name="cropStartSeconds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.cropStart}</FormLabel>
                          <FormControl>
                            <Input
                              min={0}
                              max={cropStartMax}
                              step={1}
                              type="number"
                              name={field.name}
                              value={cropStartValue}
                              onBlur={field.onBlur}
                              onChange={(event) => field.onChange(event.target.value)}
                              ref={field.ref}
                            />
                          </FormControl>
                          <input
                            className="mt-3 w-full accent-[var(--accent)]"
                            max={cropStartMax}
                            min={0}
                            step={1}
                            type="range"
                            value={cropStartValue}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cropDurationSeconds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.cropDuration}</FormLabel>
                          <FormControl>
                            <Input
                              min={1}
                              max={cropAvailableDuration}
                              step={1}
                              type="number"
                              name={field.name}
                              value={cropDurationValue}
                              onBlur={field.onBlur}
                              onChange={(event) => field.onChange(event.target.value)}
                              ref={field.ref}
                            />
                          </FormControl>
                          <input
                            className="mt-3 w-full accent-[var(--accent)]"
                            max={cropAvailableDuration}
                            min={1}
                            step={1}
                            type="range"
                            value={cropDurationValue}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                          <FormDescription>{t.cropRangeDesc}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { label: t.cropPreset15, value: 15 },
                        { label: t.cropPreset30, value: 30 },
                        { label: t.cropPreset45, value: 45 },
                        { label: t.cropPreset60, value: 60 },
                      ].map((preset) => {
                        const isDisabled = preset.value > cropAvailableDuration;
                        const isActive = cropDurationValue === preset.value;

                        return (
                        <Button
                          key={preset.value}
                          type="button"
                          variant={isActive ? "default" : "outline"}
                          size="sm"
                          disabled={isDisabled}
                          onClick={() => applyCropRange(cropStartValue, preset.value)}
                        >
                          {preset.label}
                        </Button>
                        );
                      })}
                    </div>
                    <div className="space-y-1 text-sm text-[var(--muted-foreground)]">
                      <p>{t.cropRangeGuide}</p>
                      <p>{t.cropRangeCurrent(cropStartValue, cropEndValue)}</p>
                      <p>
                        {t.cropRangeLength(cropDurationValue)}
                        {roundedMediaDuration ? ` · ${t.cropRangeFileLength(roundedMediaDuration)}` : ""}
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" size="lg" disabled={!selectedMedia || isProcessing}>
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {t.startDubbing}
                  </Button>
                  {resultMediaUrl ? (
                    <Button asChild variant="outline" size="lg">
                      <a
                        href={resultMediaUrl}
                        download={currentMediaType === "video" ? "dubbed-video.mp4" : "dubbed-audio"}
                      >
                        <Download className="h-4 w-4" />
                        {t.downloadResult}
                      </a>
                    </Button>
                  ) : null}
                </div>
              </form>
            </Form>
          </div>

          <div className="bg-[linear-gradient(180deg,#fff7f7_0%,#ffffff_100%)] p-6 lg:p-8">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-[var(--muted-foreground)]">{t.progress}</p>
                <p className="mt-1 text-2xl font-semibold">{stageLabels[jobStage]}</p>
              </div>

              <Progress value={jobStage === "idle" ? 0 : progressForStage(jobStage)} />

              <div className="space-y-3">
                {stageOrder.slice(1, -1).map((stage) => (
                  <div key={stage} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
                    <span className="text-sm">{stageLabels[stage]}</span>
                    <Badge variant={jobStage === stage ? "default" : "secondary"}>
                      {jobStage === stage ? "active" : "queued"}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="rounded-[28px] border border-[var(--border)] bg-white p-4">
                <p className="mb-2 text-sm font-medium">{t.supportedLanguages}</p>
                <div className="flex flex-wrap gap-2">
                  {supportedLanguages.map((language) => (
                    <Badge key={language.code} variant="secondary">
                      {getLanguageLabel(language.code)}
                    </Badge>
                  ))}
                </div>
              </div>

              {analysis ? (
                <div className="rounded-[28px] border border-[var(--border)] bg-white p-4">
                  <p className="mb-2 text-sm font-medium">{t.autoRecommended}</p>
                  <div className="space-y-2 text-sm text-[var(--muted-foreground)]">
                    <p>{t.detectedLanguage}: {analysis.languageCode}</p>
                    <p>{t.speakerCount}: {analysis.speakerCount}</p>
                    <p>{t.speechRate}: {analysis.wordsPerSecond} words/sec</p>
                    <p>
                      {t.recommendedTone}: {getVoicePresetLabel(analysis.recommendedVoicePreset)}
                    </p>
                    <p>
                      {t.recommendedSpeed}: {getVoiceSpeedLabel(analysis.recommendedVoiceSpeed)}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      <div className="mx-auto max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle>{t.textReview}</CardTitle>
            <CardDescription>
              {currentMediaType === "video"
                ? t.textReviewVideo
                : t.textReviewAudio}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTextTab} onValueChange={(value) => setActiveTextTab(value as "transcript" | "translation")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="transcript">{t.extractedText}</TabsTrigger>
                <TabsTrigger value="translation">{t.translatedText}</TabsTrigger>
              </TabsList>
              <TabsContent value="transcript">
                <ScrollArea className="h-52 rounded-3xl border border-[var(--border)] bg-[var(--panel-strong)]">
                  <div className="p-4">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--foreground)]">
                      {transcript ||
                        (currentMediaType === "video"
                          ? t.extractedVideoPlaceholder
                          : t.extractedAudioPlaceholder)}
                    </p>
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="translation">
                <ScrollArea className="h-52 rounded-3xl border border-[var(--border)] bg-[var(--panel-strong)]">
                  <div className="p-4">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--foreground)]">
                      {translatedText || t.translatedPlaceholder}
                    </p>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
