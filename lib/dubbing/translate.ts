import { env, hasAiProviders } from "@/lib/env";
import { sleep } from "@/lib/utils";

export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage?: string,
) {
  if (!hasAiProviders()) {
    return `[${targetLanguage}] ${text}`;
  }

  const charLength = text.length;
  const byteLength = new TextEncoder().encode(text).length;
  console.info("[translateText] transcript stats", {
    targetLanguage,
    charLength,
    byteLength,
  });

  const requestBody = JSON.stringify({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Translate the following transcript${sourceLanguage ? ` from ${sourceLanguage}` : ""} into ${targetLanguage}. Respond with plain text only.\n\n${text}`,
          },
        ],
      },
    ],
  });

  let response: Response | null = null;
  let lastErrorMessage = "";

  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: requestBody,
      },
    );

    if (response.ok) {
      break;
    }

    let details = "";
    try {
      details = await response.text();
    } catch {
      details = "";
    }

    lastErrorMessage = details;

    if (response.status !== 429) {
      throw new Error(`Gemini translation failed with ${response.status}${details ? `: ${details}` : ""}`);
    }

    if (attempt < 2) {
      await sleep((attempt + 1) * 1200);
    }
  }

  if (!response || !response.ok) {
    throw new Error(
      `Gemini translation is temporarily rate-limited (429). Retry later or use a different API key.${lastErrorMessage ? ` Details: ${lastErrorMessage}` : ""}`,
    );
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  return (
    payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim() || `[${targetLanguage}] ${text}`
  );
}
