"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpegPromise: Promise<FFmpeg> | null = null;
export const MAX_CLIENT_MEDIA_SECONDS = 60;

async function getFfmpeg() {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const ffmpeg = new FFmpeg();
      const baseUrl = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";

      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseUrl}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseUrl}/ffmpeg-core.wasm`, "application/wasm"),
      });

      return ffmpeg;
    })();
  }

  return ffmpegPromise;
}

function extFromName(name: string) {
  return name.split(".").pop() || "mp4";
}

async function safeDelete(ffmpeg: FFmpeg, ...names: string[]) {
  await Promise.allSettled(names.map((name) => ffmpeg.deleteFile(name)));
}

function loadMediaDuration(file: File, tagName: "audio" | "video") {
  return new Promise<number>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const element = document.createElement(tagName);

    const cleanup = () => {
      URL.revokeObjectURL(url);
      element.removeAttribute("src");
      element.load();
    };

    element.preload = "metadata";
    element.onloadedmetadata = () => {
      const duration = Number.isFinite(element.duration) ? element.duration : 0;
      cleanup();
      resolve(duration);
    };
    element.onerror = () => {
      cleanup();
      reject(new Error("Failed to read media metadata."));
    };
    element.src = url;
  });
}

export function getMediaDuration(file: File) {
  const tagName = file.type.startsWith("video/") ? "video" : "audio";
  return loadMediaDuration(file, tagName);
}

export async function trimAudioFile(file: File, maxDurationSeconds = MAX_CLIENT_MEDIA_SECONDS) {
  return trimAudioSegment(file, 0, maxDurationSeconds);
}

export async function trimAudioSegment(
  file: File,
  startTimeSeconds = 0,
  durationSeconds = MAX_CLIENT_MEDIA_SECONDS,
) {
  const ffmpeg = await getFfmpeg();
  const inputName = `input.${extFromName(file.name)}`;
  const outputName = "trimmed-audio.mp3";

  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec([
    "-i",
    inputName,
    "-ss",
    String(startTimeSeconds),
    "-t",
    String(durationSeconds),
    "-acodec",
    "libmp3lame",
    outputName,
  ]);
  const data = await ffmpeg.readFile(outputName);
  const bytes = new Uint8Array(data as Uint8Array);
  await safeDelete(ffmpeg, inputName, outputName);

  return new File([bytes], "trimmed-audio.mp3", { type: "audio/mpeg" });
}

export async function extractAudioFromVideo(
  file: File,
  options?: { startTimeSeconds?: number; durationSeconds?: number },
) {
  const ffmpeg = await getFfmpeg();
  const inputName = `input.${extFromName(file.name)}`;
  const outputName = "audio.mp3";

  await ffmpeg.writeFile(inputName, await fetchFile(file));
  const command = ["-i", inputName];
  if (typeof options?.startTimeSeconds === "number" && typeof options?.durationSeconds === "number") {
    command.push("-ss", String(options.startTimeSeconds), "-t", String(options.durationSeconds));
  }
  command.push("-vn", "-acodec", "libmp3lame", outputName);
  await ffmpeg.exec(command);
  const data = await ffmpeg.readFile(outputName);
  const bytes = new Uint8Array(data as Uint8Array);
  await safeDelete(ffmpeg, inputName, outputName);

  return new File([bytes], "extracted-audio.mp3", { type: "audio/mpeg" });
}

export async function muxAudioWithVideo(
  videoFile: File,
  audioBlob: Blob,
  options?: { startTimeSeconds?: number; durationSeconds?: number },
) {
  const ffmpeg = await getFfmpeg();
  const inputVideo = `video.${extFromName(videoFile.name)}`;
  const inputAudio = "dubbed-audio.mp3";
  const outputName = "dubbed-video.mp4";

  await ffmpeg.writeFile(inputVideo, await fetchFile(videoFile));
  await ffmpeg.writeFile(inputAudio, await fetchFile(audioBlob));
  const command = [];
  if (typeof options?.startTimeSeconds === "number" && typeof options?.durationSeconds === "number") {
    command.push("-ss", String(options.startTimeSeconds), "-t", String(options.durationSeconds));
  }
  command.push(
    "-i",
    inputVideo,
    "-i",
    inputAudio,
    "-map",
    "0:v:0",
    "-map",
    "1:a:0",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-af",
    "apad",
    "-shortest",
    "-movflags",
    "+faststart",
    outputName,
  );
  await ffmpeg.exec(command);

  const data = await ffmpeg.readFile(outputName);
  const bytes = new Uint8Array(data as Uint8Array);
  await safeDelete(ffmpeg, inputVideo, inputAudio, outputName);

  return new Blob([bytes], { type: "video/mp4" });
}
