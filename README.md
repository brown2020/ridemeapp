# Ride.me (ridemeapp)

A free, browser-based **Line Rider**–style track editor and physics rider. Draw lines, press play, and watch your rider follow the track. Play anonymously with local JSON save/load, or sign in with Firebase to sync profiles, characters, and cloud tracks.

**Live demo:** [https://ride.me](https://ride.me)

## Features

- **Canvas editor** — pencil draw, straight-line tool (Shift snaps to 15°), pan, eraser, undo/redo (up to 200 steps)
- **Line types** — normal, acceleration, and scenery (keys `1` / `2` / `3`)
- **Playback** — play/pause (Space), stop/reset, speed from 0.25×–4×, camera follow (`F`), grid (`G`), zoom (wheel / `+/-`)
- **Flags & overview** — set/jump flag; hold Tab for overview pan
- **Local tracks** — save/open track JSON (`⌘S` / `⌘O`)
- **Optional Firebase Auth** — Google, email/password, and email-link sign-in; forgot-password flow
- **Cloud tracks** — My Tracks modal stores compact track data under `/users/{uid}/tracks/{id}` when Firebase is configured
- **Characters** — four selectable rider characters applied from the user profile
- **Legal pages** — `/privacy` and `/terms`

Works without Firebase: the editor and local file I/O remain fully usable when env vars are unset (deferred client init).

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js `^16.2.9` (App Router) |
| UI | React `^19.2.7`, Tailwind CSS `^4.3.1`, Lucide icons, Geist fonts |
| Language | TypeScript `^6` |
| Auth / data | Firebase `^12` (Auth + Firestore client SDK) |
| State | Zustand `^5` |
| Physics / canvas | Custom engine under `src/lib/linerider/` + canvas hooks |
| Tests | Vitest `^4` |
| Lint | ESLint `^10` + `eslint-config-next` |

No Stripe, no AI providers, no Server Actions, and no API routes in the current tree.

## Project structure

```
src/
  app/                 # Routes: /, /login, /signup, /forgot-password, /privacy, /terms
  components/
    linerider/         # Canvas app, controls, help, engine hook
    auth/              # Auth forms, profile, My Tracks, character picker
    ui/                # Shared modal / spinner
    legal/             # Legal document layout
  hooks/               # Auth + modal a11y hooks
  lib/
    linerider/         # Physics, math, renderer, track encoding/file I/O
    firebase/          # Config, auth helpers, users, tracks
    auth/              # Session wait helper
  stores/              # Zustand auth + linerider stores
tests/                 # Additional Vitest coverage (if present)
firestore.rules
storage.rules          # Present; app code does not yet use Storage
env.example
.github/workflows/     # CI
```

## Getting started

### Prerequisites

- Node.js 22+
- npm
- Optional: Firebase project (Auth + Firestore) for sign-in and cloud tracks

### Clone and install

```bash
git clone https://github.com/brown2020/ridemeapp.git
cd ridemeapp
npm install
```

### Environment variables

Copy `env.example` to `.env.local`. Leave blank to run the editor without cloud features.

| Variable | Purpose | Where to get it |
| --- | --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web API key | Firebase Console → Project settings → Your apps |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain | Firebase Console |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Project id | Firebase Console |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket id | Firebase Console |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender id | Firebase Console |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Web app id | Firebase Console |

### Firebase setup (optional)

1. Enable **Google**, **Email/Password**, and (optionally) **Email link** providers.
2. Deploy `firestore.rules` so users only read/write their own `users/{uid}` documents and track subcollections.
3. `storage.rules` are included for future use; the app does not upload files to Storage today.

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Next.js development server |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run typecheck` / `npm run type-check` | `tsc --noEmit` |
| `npm test` | Vitest |
| `npm run test:ci` | Vitest with `CI=true` |
| `npm run doctor` | `react-doctor` check |

## Testing and CI

CI (`.github/workflows/ci.yml`) on `dev` / `main` and PRs:

1. `npm ci --ignore-scripts`
2. `npm run lint`
3. `npm run typecheck`
4. `npm test`
5. `npm run build` (Firebase `NEXT_PUBLIC_*` secrets injected only on the build step)

Unit coverage includes physics/math helpers, track encoding, Zustand store logic, and Firebase config/tracks helpers.

## Deployment

Hosted at [ride.me](https://ride.me) (typically Vercel). Set the same `NEXT_PUBLIC_FIREBASE_*` values in the host’s environment. Deploy Firestore rules before enabling production auth/cloud tracks.

## Contributing

1. Branch from `dev`.
2. Run `npm run lint`, `npm run typecheck`, and `npm test` before pushing.
3. Do not commit `.env.local` or secrets.

## License

[GNU Affero General Public License v3.0](LICENSE.md) (AGPL-3.0).
