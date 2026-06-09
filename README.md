# 🎯 Hidden Word Duel

A **real-time, two-player word-guessing game**. A secret word hides behind tiles —
`_ _ _ _ _` — and every few seconds the server flips one more letter. Both players
race to guess the full word first. ⚡

> First correct guess wins the round. Same-tick tie? It's a draw. **First to 3 points wins the match.**

---

## ✨ How it works

1. Two players join the lobby and get matched. 🤝
2. A hidden word appears as blank tiles. 🔲
3. Each tick reveals one random letter. 🔤
4. Players get **one guess per tick** — guess the whole word to win the round. 🏆
5. Win 3 rounds to take the match. 🥇

---

## 🛠 Built with

**Next.js + Tailwind** (frontend) · **NestJS + WebSockets** (backend) · **PostgreSQL** (database) · **JWT** (auth)

---

## 🚀 Run it locally

**1. Start a database** (Docker):
```bash
docker run -d --name hwd-postgres \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=hiddenwordduel -p 5436:5432 postgres:16-alpine
```

**2. Start the backend** → http://localhost:3000
```bash
cd backened/hidden-word-game
npm install
npm run start:dev
```

**3. Start the frontend** → http://localhost:3000 (or 3001 if 3000 is taken)
```bash
cd frontend
npm install
npm run dev
```

**4. Play!** Open the frontend in **two browser windows**, register an account in
each, hit **Find Match**, and start dueling. 🎮

---

## 📁 Project structure

```
backened/hidden-word-game/   → NestJS API + WebSocket game engine
frontend/                    → Next.js UI (lobby, login, game board)
```

The game engine lives in
[`game-loop.service.ts`](backened/hidden-word-game/src/match/game-loop.service.ts) —
it runs the ticks, enforces the rules, and handles wins, draws, and disconnects.

---

