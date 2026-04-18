# Changelog

All notable changes to DevPulse will be documented in this file.

## [1.0.0] — 2026-04-18

### 🎉 Full Release
- Complete polish of all features
- CI/CD pipeline with GitHub Actions (lint + build + ML training)
- Swagger API documentation at `/api/docs`
- PWA support — installable, offline-capable
- Final UI polish and responsive design pass

## [0.7.0] — 2026-04-16

### Added
- GitLab OAuth integration (beta)
- Admin panel with platform stats, user management, system health dashboard
- Admin can promote/demote users and view all sync jobs

## [0.6.0] — 2026-04-14

### Added
- Weekly digest emails via Nodemailer + Handlebars HTML templates
- AI-powered insights using OpenAI GPT-4o-mini for personalized weekly analysis
- Scheduled cron job (every Monday at 8am) for automated digest delivery
- Email alert when wellness score drops below user-defined threshold

### Fixed
- Email template broken on Gmail — had to inline all CSS (HTML email standardization is pain)

## [0.5.0] — 2026-04-12

### Added
- Team mode: create teams, invite members, join via invite links
- Team dashboard with aggregate wellness timeline
- Team leaderboard with anonymization option
- Public developer profile at `/profile/{username}`
- Public profile share button with clipboard copy

## [0.4.0] — 2026-04-10

### Added
- Achievement/badge system with 9 initial achievements
- Achievement checks run automatically after every sync
- Real-time achievement unlock notifications via Socket.io
- Goals feature: create, track progress, mark complete
- Goal types: daily commits, weekly commits, wellness score, no-night-commits streak

## [0.3.0] — 2026-04-08

### Added
- Redis caching for GitHub API responses (15-minute TTL)
- Bull queue for background sync jobs — no more blocking API responses
- WebSocket real-time sync progress with Socket.io
- Sync progress modal with animated progress bar and live repo scanning
- Rate limiting with `rate-limiter-flexible`

### Fixed
- Socket.io auth was broken — fixed handshake token validation
- CORS issue between Vite dev server and Express (took way too long to fix)

## [0.2.0] — 2026-04-06

### Added
- ML wellness scoring with Python FastAPI microservice
- RandomForestClassifier + Ridge regressor trained on synthetic data
- Recharts dashboard with wellness timeline, hourly activity, language distribution
- Commit heatmap (52-week grid like GitHub contributions)
- Wellness gauge component (circular arc with animated score)
- Radar chart (6 dimensions: consistency, volume, timing, diversity, quality, wellness)
- Benchmark comparison table (user vs industry average)

### Fixed
- ML service returning wrong risk flag — retrained model with better synthetic data generation

## [0.1.0] — 2026-04-04

### Added
- Project initialization with Vite + React + Express
- GitHub OAuth with Passport.js (`passport-github2`)
- PostgreSQL schema with all tables (users, repos, commits, wellness, achievements, goals, teams)
- Basic commit sync from GitHub API
- JWT authentication with httpOnly cookie support
- Winston structured logging

### Fixed
- CORS issue between Vite dev server and Express backend
