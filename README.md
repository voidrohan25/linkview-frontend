# LinkView - AI Mock Interview & Placement Preparation Platform (Frontend)

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)
[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com)

LinkView is an enterprise-grade AI-powered Mock Interview Management Platform designed for IT training institutes, colleges, and placement cells.

---

## 🌟 Key Features

1. **Realistic AI Mock Interview Room**:
   - **AI Human Interviewer**: Autonomic natural eye-blinking (3–5s intervals), micro-head movements, contextual status HUD, and audio-reactive lip synchronization.
   - **Prominent Live Candidate Webcam**: Real-time video preview with face-tracking bounding box, luminance analysis, and device switching.
   - **Real-Time Speech Pipeline**: Low-latency SpeechRecognition with debounced `no-speech` backoff recovery, streaming transcription, and direct text typing fallback.
   - **Continuous Anti-Cheat & Proctoring Engine**:
     - Candidate face detection & missing face alerts.
     - Camera obstruction and low-light detection.
     - Tab-switch and window-blur tracking.
     - Full-screen enforcement.
     - Copy-paste prevention.

2. **Strict Role Separation & Security Gate**:
   - **Root (`/`) Lock**: Public visitors see *only* the LinkTest login page.
   - **Google OAuth Integration**: All new Google logins receive `student` role by default.
   - **Founder & Lead Admin (Rahul Sir)**: Fixed administrative credentials with exclusive rights to promote Students to Trainers.
   - **Batch-Based Access**: Students only access assigned interview cohorts. Free Communication Skills track available for open practice.

3. **Rubric Evaluation & Scorecards**:
   - 4-factor scoring breakdown: Technical Accuracy, Conceptual Depth, Problem Solving, and Communication Fluency.
   - Full proctoring event audit log with severity indicators.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.17+ or 20+
- npm or pnpm

### 1. Installation
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local` and configure your credentials:
```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `ADMIN_EMAIL` | Fixed Super Admin email (`rahul.sir@linktest.io`) |
| `ADMIN_PASSWORD` | Fixed Super Admin password |
| `GEMINI_API_KEY` | Google Gemini API key for question evaluation |
| `ELEVENLABS_API_KEY` | (Optional) High-quality natural voice generation |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server side only) |

### 3. Local Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📦 Vercel Deployment

1. Push this repository to GitHub: `voidrohan25/linkview-frontend`.
2. Connect the repository in your [Vercel Dashboard](https://vercel.com).
3. Set the Framework Preset to **Next.js**.
4. Add the required Environment Variables from `.env.example`.
5. Click **Deploy**.
