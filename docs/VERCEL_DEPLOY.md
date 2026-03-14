# Vercel Auto-Deploy Guide

This guide configures GitHub push -> Vercel automatic deployment for `DubbingAI`.

## 1) Security First (Do this before deploy)

1. Rotate any keys that were exposed in chat/history.
2. Keep real secrets only in `.env.local` (already git-ignored).
3. Run:

```bash
npm run security:scan
```

## 2) Push to GitHub

1. Create a GitHub repository.
2. Add remote and push the default branch.

```bash
git remote add origin <your-github-repo-url>
git add .
git commit -m "feat: dubbing ai service"
git push -u origin main
```

## 3) Import Project in Vercel

1. Go to Vercel Dashboard.
2. Click `Add New...` -> `Project`.
3. Import your GitHub repository.
4. Framework Preset: `Next.js` (auto-detected).
5. Build command: `npm run build`.
6. Output directory: leave default.

## 4) Set Environment Variables in Vercel

Add these in `Project Settings -> Environment Variables`:

- `NEXTAUTH_URL` = `https://<your-vercel-domain>`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `OWNER_EMAILS`
- `ALLOWLIST_EMAILS`
- `ELEVENLABS_API_KEY`
- `GEMINI_API_KEY`

Optional voice envs:

- `ELEVENLABS_VOICE_EN`
- `ELEVENLABS_VOICE_DE`
- `ELEVENLABS_VOICE_ES`
- `ELEVENLABS_VOICE_PL`
- `ELEVENLABS_VOICE_PT`
- `ELEVENLABS_VOICE_IT`
- `ELEVENLABS_VOICE_FR`
- `ELEVENLABS_VOICE_KO`
- `ELEVENLABS_VOICE_DA`

## 5) Update Google OAuth Redirect URIs

In Google Cloud OAuth client settings, add:

- `https://<your-vercel-domain>/api/auth/callback/google`

Also add JS origin:

- `https://<your-vercel-domain>`

## 6) Verify Production

1. Open deployed URL.
2. Sign in with allowlisted account.
3. Upload one audio and one video file.
4. Confirm:
   - transcript + translation visible
   - dubbed audio/video downloadable
   - no 500 errors in Vercel logs

## 7) Automatic Deploy Check

After changing code:

1. `git push`
2. Confirm Vercel auto build starts
3. Validate latest deployment URL
