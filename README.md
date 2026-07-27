# EVE Tracker

A local project & activity tracker for your EVE Online main character, with an
industry/production focus. Backend is Node/Express with a SQLite database
(via Node's built-in `node:sqlite`); frontend is a Vite + React dashboard.
Everything runs on your machine — nothing is hosted or synced elsewhere.

## What it does

- Freeform **projects** and **activity log** — track anything you're working
  on in-game, with status, priority, and a timestamped log of what you did.
- **EVE SSO login** to pull live character data from ESI: industry jobs
  (manufacturing/research/reactions), blueprint library, planetary interaction
  colonies (with extraction timers), and wallet balance.
- Link industry jobs to projects, or log manual jobs by hand if you'd rather
  not connect a character at all.
- A **dashboard** with stat tiles, a project-status breakdown, an industry
  jobs table with time-remaining indicators, PI extraction countdowns, and a
  wallet balance trend.

## Requirements

- Node.js 20+ (this was set up with Node 24 LTS)

## First run

```bash
cd backend
npm install
npm run dev        # http://localhost:3001
```

```bash
cd frontend
npm install
npm run dev         # http://localhost:5173
```

Open `http://localhost:5173`. The tracker works immediately for projects and
activities — no EVE login required for that part.

## Connecting your character (optional, for ESI data)

Industry jobs, blueprints, PI, and wallet sync require registering your own
application with CCP and logging in via EVE SSO:

1. Go to https://developers.eveonline.com/applications and create a new
   application.
   - **Connection Type**: Authentication & API Access
   - **Callback URL**: `http://localhost:3001/auth/callback` (must match exactly)
   - **Scopes**: `esi-industry.read_character_jobs.v1`,
     `esi-characters.read_blueprints.v1`, `esi-planets.manage_planets.v1`,
     `esi-wallet.read_character_wallet.v1`
2. Copy the generated **Client ID** and **Secret Key** into `backend/.env`:
   ```
   ESI_CLIENT_ID=your_client_id
   ESI_CLIENT_SECRET=your_secret_key
   ESI_CONTACT_EMAIL=you@example.com
   ```
3. Restart the backend, then go to **Settings** in the app and click
   **Connect character via EVE SSO**.
4. Once connected, the app syncs automatically every 10 minutes, or click
   **Sync now** on the Settings/Industry pages for an immediate refresh.

Your access/refresh tokens are stored in the local SQLite database
(`data/eve-tracker.db`). This is a single-user local tool, so tokens are kept
in plain text there — don't share that file.

## Project layout

```
backend/    Express API + SQLite (data/eve-tracker.db) + ESI sync
frontend/   Vite + React dashboard
data/       SQLite database file (gitignored)
```

## Notes

- The backend re-derives blueprint/item/planet names from ESI's public
  `/universe/` endpoints and caches them in memory per process.
- Deleting a project sets `project_id` to null on any linked activities/jobs
  rather than deleting them.
