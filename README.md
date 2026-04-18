<div align="center">

# ⚡ DevPulse

### Your GitHub. Understood.

A full-stack Developer Intelligence Platform that connects to your GitHub account and provides deep analytics on coding behavior, wellness scoring, productivity trends, code quality evolution, team health, achievement tracking, and AI-generated weekly insights — all in a beautiful, real-time dashboard.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen?style=for-the-badge)](https://devpulse.vercel.app)
[![GitHub](https://img.shields.io/badge/github-repo-blue?style=for-the-badge)](https://github.com/TECHMINEs/devpulse)
[![License](https://img.shields.io/badge/license-MIT-yellow?style=for-the-badge)](LICENSE)
[![Built With](https://img.shields.io/badge/built_with-React_+_Node_+_Python-purple?style=for-the-badge)]()

</div>

---

> **📸 Screenshot** — run locally to see the full dashboard experience. The dark-mode UI features glassmorphism cards, real-time charts, animated wellness gauges, and a 52-week commit heatmap.

---

## 💡 Why I Built This

During a particularly intense project deadline last semester, I found myself committing code at 3am every night for two straight weeks. I was exhausted, my code quality tanked, and I didn't even realize how bad it had gotten until I was completely burned out.

I wished something had flagged it before it got that bad — something that looked at my patterns and said *"Hey, you've been coding until 3am for 12 days straight. Maybe take a break."*

That's what DevPulse does. It's not just another analytics dashboard — it's a **developer wellness tool** that uses your GitHub data to understand *how* you work, not just *what* you ship. It detects unhealthy patterns like excessive night coding, sprint/crash cycles, and declining commit quality. It uses a machine learning model to predict wellness trends and sends weekly digest emails with AI-powered personalized insights.

I built it as a portfolio project because it touches every major area of full-stack development: real-time systems, background job processing, ML integration, email delivery, OAuth, caching, team features, and a polished React frontend. It demonstrates that I can build production-grade software, not just CRUD apps.

---

## ✨ Features

### Implemented
- [x] **GitHub OAuth** — One-click sign-in with automatic repository and commit sync
- [x] **Wellness Scoring** — ML-powered wellness score (0-100) based on commit patterns, timing, and quality
- [x] **Real-time Dashboard** — Live charts with wellness timeline, commit heatmap, hourly activity, language distribution
- [x] **WebSocket Sync** — Real-time progress updates during data sync via Socket.io
- [x] **ML Microservice** — Python FastAPI service with RandomForest classifier + Ridge regressor for wellness prediction
- [x] **7-Day Predictions** — ML-powered forecast of future wellness scores
- [x] **Achievement System** — 9 badges with automatic detection (Night Owl, Early Bird, Streak, Centurion, etc.)
- [x] **Goal Tracking** — Set and track development goals with progress visualization
- [x] **Team Mode** — Create teams, invite members, view aggregate wellness and leaderboards
- [x] **Public Profiles** — Shareable developer cards at `/profile/{username}`
- [x] **Weekly Digest** — Automated Monday morning email with stats, charts, and AI-generated insights
- [x] **Deep Analytics** — Radar chart, benchmark comparison, commit velocity, code volume analysis
- [x] **Admin Panel** — Platform stats, user management, system health monitoring
- [x] **Background Jobs** — Bull + Redis queues for async data processing
- [x] **Redis Caching** — 15-minute TTL cache for GitHub API responses
- [x] **PDF Reports** — Downloadable weekly and monthly PDF reports
- [x] **Dark Mode** — Beautiful dark theme with class-based toggle and localStorage persistence
- [x] **PWA** — Installable as a Progressive Web App with offline support
- [x] **API Documentation** — Swagger/OpenAPI docs at `/api/docs`
- [x] **CI/CD** — GitHub Actions pipeline (lint + build + ML training verification)
- [x] **Rate Limiting** — Per-user API rate limiting to prevent abuse

### Roadmap
- [ ] Chrome extension — see your wellness score in the browser toolbar
- [ ] React Native mobile app
- [ ] Fine-tuned ML model trained on real (anonymized) data
- [ ] Public API for third-party integrations
- [ ] Jira/Linear integration for correlating ticket work with commit patterns
- [ ] VS Code extension showing wellness in the status bar

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite 5, TailwindCSS, Recharts, React Router v6, Zustand, TanStack Query v5, Socket.io-client |
| **Backend** | Node.js 20, Express, Socket.io, Bull (Redis queues), Passport.js, JWT, Winston, PDFKit |
| **ML Service** | Python 3.11, FastAPI, scikit-learn, pandas, numpy, joblib, uvicorn |
| **Database** | PostgreSQL 15 |
| **Caching** | Redis 7 (ioredis) |
| **Email** | Nodemailer + Handlebars templates |
| **AI** | OpenAI GPT-4o-mini (weekly digest insights) |
| **CI/CD** | GitHub Actions |
| **Deployment** | Vercel (frontend), Render (backend + ML), Neon.tech (Postgres) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser / PWA                          │
│                    React + Vite + TailwindCSS                  │
│              Recharts │ Socket.io-client │ Zustand             │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / WSS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Express.js API Server                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Routes   │  │ Services │  │ Workers  │  │ Socket.io│       │
│  │ (REST)   │  │ (GitHub, │  │ (Bull    │  │ (Real-   │       │
│  │          │  │  ML, etc)│  │  Queues) │  │  time)   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│         │              │             │             │            │
└─────────┼──────────────┼─────────────┼─────────────┼───────────┘
          │              │             │             │
     ┌────▼────┐   ┌─────▼────┐  ┌────▼────┐  ┌────▼─────┐
     │PostgreSQL│   │  Redis   │  │ GitHub  │  │ FastAPI  │
     │  (Data) │   │ (Cache + │  │   API   │  │ ML Model │
     │         │   │  Queues) │  │         │  │ (Python) │
     └─────────┘   └──────────┘  └─────────┘  └──────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- GitHub OAuth App (create at https://github.com/settings/developers)

### Clone & Install

```bash
git clone https://github.com/TECHMINEs/devpulse.git
cd devpulse

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install ML service dependencies
cd ml-service && pip install -r requirements.txt && cd ..
```

### Environment Setup

```bash
cp .env.example .env
# Edit .env with your values:
# - DATABASE_URL (your PostgreSQL connection string)
# - REDIS_URL (your Redis connection)
# - GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET
# - JWT_SECRET (any random string)
```

### Database Setup

```bash
# Create database
createdb devpulse

# Run schema
psql devpulse < backend/src/db/schema.sql
```

### Train ML Models

```bash
cd ml-service
python train.py
# This generates model_classifier.pkl and model_regressor.pkl
```

### Run Everything

Open 3 terminal windows:

```bash
# Terminal 1: ML Service
cd ml-service && python main.py
# Runs on http://localhost:8000

# Terminal 2: Backend
cd backend && npm run dev
# Runs on http://localhost:5000

# Terminal 3: Frontend
cd frontend && npm run dev
# Runs on http://localhost:5173
```

Visit **http://localhost:5173** and sign in with GitHub!

---

## 📖 API Documentation

Full Swagger/OpenAPI documentation available at:
- **Development:** http://localhost:5000/api/docs
- **Production:** https://devpulse-api.onrender.com/api/docs

Key endpoints:
- `GET /auth/github` — GitHub OAuth flow
- `POST /api/sync/trigger` — Trigger data sync
- `GET /api/analytics/wellness` — Wellness score history
- `GET /api/analytics/radar` — Radar chart data
- `GET /api/analytics/predictions` — ML predictions
- `POST /predict` (ML service) — Wellness score prediction

---

## ⚠️ Known Limitations

1. **ML model trained on synthetic data** — The RandomForest classifier and Ridge regressor are trained on 1000 synthetic samples. Real-world accuracy would improve significantly with actual anonymized developer data.
2. **GitLab sync is beta** — The GitLab integration is partially implemented. GitHub is the primary supported provider.
3. **No mobile app yet** — The PWA works on mobile browsers, but a native React Native app is on the roadmap.
4. **Weekly digest chart rendering** — Server-side chart rendering requires `node-canvas` which can be tricky to install on some systems. The current implementation uses text-based email reports.
5. **Single Redis instance** — Rate limiting uses in-memory storage; should switch to Redis-backed limiter for multi-instance deployments.
6. **No end-to-end tests** — Unit tests exist but E2E testing is not yet set up. Planning to add Playwright tests.

---

## 📚 What I Learned

1. **OAuth is deceptively complex** — Getting GitHub OAuth working with JWT + httpOnly cookies + CORS + redirect flows took much longer than expected. Passport.js v2 is essential; v1 doesn't handle scopes properly.

2. **Real-time architecture decisions matter** — Socket.io room-based auth required careful thinking about when to authenticate (handshake vs. post-connect) and how to share the io instance between the API server and Bull workers.

3. **Caching transforms performance** — Adding Redis caching to GitHub API calls reduced average sync time from ~45s to ~5s for returning users. The cache key strategy (token prefix + endpoint) was simple but effective.

4. **ML in production is mostly plumbing** — Training the model was the easy part. Building the FastAPI service, handling model loading at startup, creating Pydantic validation, and managing the Node→Python communication via HTTP was 80% of the work.

5. **Email is still terrible** — HTML email rendering is wildly inconsistent across clients. Gmail strips most CSS. The only reliable approach is inline styles in a `<table>` layout — like it's 2005.

6. **Background jobs are essential for UX** — Moving the sync process to a Bull queue (instead of blocking the API) and adding real-time progress via Socket.io completely transformed the user experience from "why is this so slow" to "wow, it's scanning my repos live."

---

## 🗺️ Roadmap

- 🔌 **Chrome Extension** — Wellness score badge in the browser toolbar
- 📱 **React Native App** — Native mobile app with push notifications
- 🧠 **Real ML Model** — Fine-tune on anonymized real data from opt-in users
- 🔓 **Public API** — REST API with API key auth for third-party integrations
- 📊 **Jira/Linear** — Correlate ticket completion with commit patterns
- 💬 **Slack Bot** — `/devpulse` command for team wellness check-ins
- 🌍 **Timezone-aware cron** — Per-user timezone for weekly digest scheduling
- 📈 **A/B testing** — Test different wellness formula parameters

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
  <p>Built with ❤️ and way too much caffeine</p>
  <p><em>"The best code is the code you write when you're well-rested."</em></p>
</div>
