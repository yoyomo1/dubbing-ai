"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpegPromise: Promise<FFmpeg> | null = null;

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

export async function extractAudioFromVideo(file: File) {
  const ffmpeg = await getFfmpeg();
  const inputName = `input.${extFromName(file.name)}`;
  const outputName = "audio.mp3";

  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec(["-i", inputName, "-vn", "-acodec", "libmp3lame", outputName]);
  const data = await ffmpeg.readFile(outputName);
  const bytes = new Uint8Array(data as Uint8Array);
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  return new File([bytes], "extracted-audio.mp3", { type: "audio/mpeg" });
}

export async function muxAudioWithVideo(videoFile: File, audioBlob: Blob) {
  const ffmpeg = await getFfmpeg();
  const inputVideo = `video.${extFromName(videoFile.name)}`;
  const inputAudio = "dubbed-audio.mp3";
  const outputName = "dubbed-video.mp4";

  await ffmpeg.writeFile(inputVideo, await fetchFile(videoFile));
  await ffmpeg.writeFile(inputAudio, await fetchFile(audioBlob));
  await ffmpeg.exec([
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
    "-shortest",
    outputName,
  ]);

  const data = await ffmpeg.readFile(outputName);
  const bytes = new Uint8Array(data as Uint8Array);
  await ffmpeg.deleteFile(inputVideo);
  await ffmpeg.deleteFile(inputAudio);
  await ffmpeg.deleteFile(outputName);

  return new Blob([bytes], { type: "video/mp4" });
}
