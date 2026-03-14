# 더빙AI

오디오 업로드 후 `전사 -> 번역 -> 음성 합성 -> 다운로드` 흐름을 제공하는 Next.js 기반 음성 더빙 서비스입니다. `Google OAuth`, `화이트리스트 접근 제어`, `Turso 저장`, `Vercel 배포`를 중심으로 구성했습니다.

## 주요 기능

- 오디오 업로드 기반 음성 더빙
- 품질 우선 기준으로 선별한 9개 언어 지원
- ElevenLabs STT / TTS + Gemini 번역 파이프라인
- Google 로그인 후 allowlist 기반 접근 제어
- 관리자 allowlist 페이지에서 허용 이메일 추가/삭제
- shadcn/ui + Radix 기반 상호작용 레이어

## 기술 스택

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui primitives
- NextAuth
- Turso + Drizzle ORM
- ElevenLabs API
- Gemini Flash API

## 로컬 실행

```bash
npm install
cp .env.example .env.local
npm run dev
```

필수 환경변수:

- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `OWNER_EMAILS`
- `TURSO_DATABASE_URL`
- `ELEVENLABS_API_KEY`
- `GEMINI_API_KEY`

환경변수가 일부 비어 있으면 화면은 뜨지만 실제 더빙은 mock 모드로 동작합니다.

## 주요 페이지

- `/` : 랜딩 + 실제 더빙 워크스페이스
- `/login` : Google 로그인
- `/blocked` : 미허용 계정 안내
- `/admin/allowlist` : 관리자 allowlist 관리

## 배포

1. GitHub 저장소에 push
2. Vercel 프로젝트 연결
3. Vercel 환경변수에 `.env.example` 값 등록
4. 자동 배포 후 로그인/업로드/다운로드 검증

상세 자동배포 가이드: [Vercel Deploy Guide](docs/VERCEL_DEPLOY.md)

배포 전 권장 점검:

```bash
npm run verify:release
```

## 코딩 에이전트 활용 방식

- 요구사항 PDF 분석 후 구현 범위를 확정
- 서비스형 음성 더빙 화면으로 UI 재설계
- shadcn/ui 컴포넌트 레이어를 먼저 구축
- 인증, allowlist, 더빙 API 순으로 구현

## 제출 체크리스트

- README에 서비스 소개, 주요 기능, 기술 스택, 실행 방법, 배포 URL 기재
- GitHub 저장소 주소 제출
- 홍보 게시글 URL 목록 제출
- Vercel 배포 URL 제출
