# Neo Chess

A real-time chess web app with local play, online matchmaking, account-based game history, and rated games with Elo updates.

Built with React, TypeScript, Express, Socket.IO, PostgreSQL, Drizzle ORM, and HTML Canvas.

## Overview

Neo Chess is a browser-based chess app designed for quick local games and live online matches.

Players can start a local game immediately, choose from built-in time controls, and use move navigation controls to review the game. Logged-in users can also queue for online games, play rated or casual matches, offer draws, resign, and return to their game history.

Online rated games update each player's Elo when the game ends. Rating changes are shown directly on the player cards, similar to Lichess.

The app includes:
- a custom canvas chess board
- animated piece movement
- responsive mobile and desktop layouts
- account login/sign-up
- Google sign-in support
- friend lists and friend requests
- online game persistence
- a Games tab for ongoing and historical games

## Features

- Local chess games with Bullet, Blitz, Rapid, Classical, and Unlimited time controls
- Online matchmaking with rated and casual modes
- Elo-based rating ranges for rated matchmaking
- Elo updates when rated online games end
- Player cards with clocks, captured material, active-turn state, and rating deltas
- Online resignation and draw-offer flows
- Ongoing games and game history for logged-in users
- Account system with username/password auth and optional Google sign-in
- Friend requests, friend list management, and friend opponent selection
- Responsive layouts for mobile and desktop
- Desktop chess layout with centered board, player cards above/below, and a vertical action bar
- Custom HTML Canvas chess board with animated movement, board rotation, and crisp pixel-aligned rendering
- Typed Socket.IO client/server communication through shared TypeScript types
- PostgreSQL persistence using Drizzle ORM
- Render-ready Node/Express deployment model

## Usage

### Play screen

Use the Play tab to choose between online and local play. Logged-out users can start local games immediately; online play requires login.

![Neo Chess play screen](docs/screenshots/play-screen.png)

### Local games

Choose a time control to start a local game. The desktop game view centers the board and player cards, with game controls kept in a vertical action bar beside the board.

![Neo Chess local game desktop layout](docs/screenshots/local-game-desktop.png)

### Online games

After logging in, switch to Online, select rated or casual play, choose a rating range, and queue for a match. In online games, your side is always shown at the bottom of the board.

Suggested screenshot to add later: an active online game showing two logged-in players, the draw/resign controls, and the rated Elo delta after the game ends.

### Games tab

The Games tab is available after login. It shows ongoing games first, followed by finished game history with filters for online/local history.

Suggested screenshot to add later: the Games tab with at least one ongoing online game and one completed rated game.

### Account popup

Use the account icon in the header to log in, sign up, continue with Google, manage friends, and log out.

Suggested screenshot to add later: the logged-in account popup showing friend requests and the friends list.

## Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- Socket.IO Client
- HTML Canvas
- CSS with responsive media queries

### Backend
- Node.js
- Express
- TypeScript
- Socket.IO
- PostgreSQL
- Drizzle ORM

### Shared
- Shared TypeScript socket contracts
- Shared chess state and move-generation logic

### Deployment
- Render
- Express serves the built client from the server package in production

## Architecture

Neo Chess is organized as a small npm workspace monorepo:

```text
.
├── client/   # React/Vite app and chess UI
├── server/   # Express, Socket.IO, auth, matchmaking, persistence
└── shared/   # Shared TypeScript types and chess logic
```

The frontend owns the interactive chess UI. The board is rendered with HTML Canvas, while React manages navigation, account state, matchmaking controls, player cards, popups, and game lists.

The backend owns authenticated online behavior:
- sessions and account state
- friend requests and friend snapshots
- online matchmaking
- online move validation
- game finalization
- rated Elo updates
- persistence of online game snapshots

Socket.IO is used for live updates. The client and server both import the shared socket event types, so event payloads stay typed across the full stack.

PostgreSQL stores users, sessions, friendships, and online game snapshots. Drizzle ORM defines the schema and migrations. On startup, the server hydrates persisted online games back into memory so players can re-enter ongoing games.

## Live Demo

Render URL:

```text
TODO: add Render URL here
```

## Getting Started

### Prerequisites

- Node.js 22 or newer
- npm
- PostgreSQL database

### Installation

```bash
git clone <repo-url>
cd Neo-Chess
npm install
```

### Environment variables

Create `client/.env`:

```env
VITE_SERVER_URL=http://localhost:3000
```

Create `server/.env`:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/neo_chess
DATABASE_SSL=false
CLIENT_ORIGIN=http://localhost:5173
CLIENT_ORIGINS=http://localhost:5173,http://localhost:5174

# Optional, only needed for Google sign-in
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

For hosted databases, set `DATABASE_SSL=true` or omit it if the default SSL behavior is appropriate for the database host.

### Apply database migrations

```bash
npm --workspace server run db:migrate
```

### Run in development

Run client and server together:

```bash
npm run dev
```

Then open:

```text
http://localhost:5173/
```

If Vite uses a fallback port such as `5174`, use that URL instead. The server accepts local development origins on localhost, 127.0.0.1, and private LAN addresses.

To run only one side:

```bash
npm run dev:client
npm run dev:server
```

### Build

```bash
npm run build
```

### Start production server

```bash
npm --workspace server run start
```

The production server serves the built client from `client/dist` and hosts the API/Socket.IO server from the same Express process.
