# 🎵 Our Music — Private Music PWA

A stunning, private music PWA for two — visually superior to Spotify, built with love.

![Our Music](https://img.shields.io/badge/PWA-Music-9B6DFF?style=for-the-badge)

---

## ✨ Features

- **Aurora UI** — Animated gradient backgrounds, glassmorphism, and micro-animations
- **Search Anything** — Finds songs from Telegram bots with a 5-step fallback chain
- **Now Playing** — Dynamic color extraction, rotating vinyl art, waveform visualizer
- **Synced Lyrics** — Auto-scrolling, tap-to-seek lyrics panel
- **PWA** — Install on home screen, offline song caching
- **Private** — No accounts, no tracking, just music

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────┐
│                  Frontend                     │
│         React 18 + Vite + Tailwind           │
│         Framer Motion + Zustand              │
│              Port 5173                        │
└──────────────────┬───────────────────────────┘
                   │ /api/*
┌──────────────────▼───────────────────────────┐
│                  Backend                      │
│              Express.js                       │
│              Port 3001                        │
│    ┌─────────┬────────────┬──────────────┐   │
│    │Supabase │    R2      │  Lyrics API  │   │
│    └─────────┴────────────┴──────────────┘   │
└──────────────────┬───────────────────────────┘
                   │ POST /fetch
┌──────────────────▼───────────────────────────┐
│          Telegram Microservice               │
│         FastAPI + Pyrogram                   │
│              Port 8001                        │
│                                              │
│  Fallback Chain:                             │
│  1. @MusicsHunterBot (Hindi/Punjabi/English) │
│  2. @SMLoadBot (Bollywood)                   │
│  3. @DeezerMusicBot (Mainstream)             │
│  4. YouTube → @YtDlBot (All Haryanvi)       │
└──────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+
- **Python** 3.9+
- **npm** 9+

### 1. Clone & Install

```bash
# Frontend
cd music-app/frontend
npm install

# Backend
cd ../backend
npm install

# Telegram Service
cd ../telegram-service
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy the env template
cp .env.example .env

# Also for telegram service
cp telegram-service/.env.example telegram-service/.env
```

Fill in your credentials (see table below).

### 3. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) → Create a new project
2. Open the SQL Editor and run:

```sql
-- Songs table
create table songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text,
  album text,
  duration integer,
  r2_url text not null,
  album_art_url text,
  play_count integer default 0,
  created_at timestamp default now()
);

-- Play history
create table play_history (
  id uuid primary key default gen_random_uuid(),
  song_id uuid references songs(id),
  played_at timestamp default now()
);

-- Liked songs
create table liked_songs (
  id uuid primary key default gen_random_uuid(),
  song_id uuid references songs(id),
  liked_at timestamp default now()
);

-- Lyrics cache
create table lyrics (
  id uuid primary key default gen_random_uuid(),
  song_id uuid references songs(id),
  lyrics_data jsonb,
  is_synced boolean default false
);

-- Helper function
create or replace function increment_play_count(song_id uuid)
returns void as $$
begin
  update songs set play_count = play_count + 1 where id = song_id;
end;
$$ language plpgsql;
```

### 4. Run Everything

```bash
# Terminal 1 — Frontend
cd music-app/frontend
npm run dev

# Terminal 2 — Backend
cd music-app/backend
node server.js

# Terminal 3 — Telegram Service
cd music-app/telegram-service
python main.py
```

Open **http://localhost:5173** in your browser.

---

## 🔑 Required Credentials

| Service | Where to get | Cost |
|---------|-------------|------|
| Supabase URL + Key | [supabase.com](https://supabase.com) → Project Settings → API | Free |
| Cloudflare R2 | [dash.cloudflare.com](https://dash.cloudflare.com) → R2 → Manage API Tokens | Free (10GB) |
| Telegram API ID/Hash | [my.telegram.org](https://my.telegram.org) → API Development Tools | Free |
| Genius API Key | [genius.com/api-clients](https://genius.com/api-clients) | Free (optional) |

---

## 📱 PWA Installation

1. Open the app in Safari (iPhone) or Chrome (Android)
2. Tap **Share** → **Add to Home Screen**
3. The app will launch in standalone mode with its own splash screen

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Background | `#080808` |
| Accent Purple | `#9B6DFF` |
| Accent Pink | `#FF6DB3` |
| Accent Blue | `#6DB8FF` |
| Display Font | Clash Display |
| Body Font | Satoshi |
| Glass Effect | `rgba(255,255,255,0.06)` + `backdrop-blur(20px)` |

---

## 📂 Project Structure

```
music-app/
├── frontend/           React PWA
│   ├── src/
│   │   ├── components/ UI components
│   │   ├── pages/      Page views
│   │   ├── hooks/      Custom hooks
│   │   └── store/      Zustand state
│   └── public/         PWA assets
├── backend/            Express API
│   ├── routes/         API endpoints
│   ├── services/       External services
│   └── middleware/     Caching, etc.
└── telegram-service/   Python microservice
```

---

Built with 💜 for Harsh
