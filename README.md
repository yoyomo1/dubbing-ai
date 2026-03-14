# DubbingAI

DubbingAI is a Next.js-based dubbing service that supports the full flow of `transcription -> translation -> speech synthesis -> download` for uploaded audio or video files. The app is built around `Google OAuth`, allowlist-based access control, Turso-backed persistence, and an ElevenLabs + Gemini media pipeline.

<img width="1363" height="689" alt="Image" src="https://github.com/user-attachments/assets/82bbef3c-8ae5-4669-a114-7521b28b4939" />

## Features

- Audio and video dubbing from a single upload flow
- 9 quality-first supported target languages
- ElevenLabs STT / TTS and Gemini translation pipeline
- Google sign-in with allowlist-based access control
- Admin allowlist management page
- shadcn/ui + Radix interaction layer

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui primitives
- NextAuth
- Turso + Drizzle ORM
- ElevenLabs API
- Gemini Flash API

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Required environment variables:

- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `OWNER_EMAILS`
- `TURSO_DATABASE_URL`
- `ELEVENLABS_API_KEY`
- `GEMINI_API_KEY`

If some provider variables are missing, the UI still loads but dubbing falls back to mock mode.

## Main Routes

- `/` : landing page and dubbing workspace
- `/login` : Google sign-in
- `/blocked` : blocked account notice
- `/admin/allowlist` : admin allowlist management

## Coding Agent Workflow

- Reviewed the assignment PDF and locked the implementation scope
- Reworked the product into a service-style dubbing experience
- Built the interaction layer with shadcn/ui first
- Implemented auth, allowlist, and dubbing APIs in sequence

## Links

- GitHub: `https://github.com/yoyomo1/dubbing-ai`
- Live App: `https://dubbing-ai-web.vercel.app`
