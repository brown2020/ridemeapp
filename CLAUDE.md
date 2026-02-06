# CLAUDE.md — Project Guide for AI Assistants

Ride.me is a Line Rider clone built with Next.js 16, React 19, TypeScript, Firebase, Zustand, and Tailwind CSS 4. Deployed on Vercel.

## Quick Reference

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript validation
```

## Project Structure

```
src/
├── app/                         # Next.js App Router
│   ├── layout.tsx               # Root layout (fonts, metadata)
│   ├── page.tsx                 # Home — renders LineriderApp
│   ├── error.tsx                # Global error boundary
│   ├── not-found.tsx            # 404 page
│   ├── globals.css              # Tailwind CSS 4, CSS variables
│   ├── privacy/page.tsx         # Privacy policy (static)
│   └── terms/page.tsx           # Terms of service (static)
├── components/
│   ├── auth/                    # Auth UI
│   │   ├── auth-modal.tsx       # Sign in / sign up modal (Google, email/password, email link)
│   │   ├── avatar.tsx           # User avatar with fallback initials
│   │   ├── character-selector.tsx # Animated character picker (canvas previews)
│   │   ├── email-confirm-modal.tsx # Email link confirmation prompt
│   │   ├── profile-modal.tsx    # Profile editing (display name, character)
│   │   ├── user-menu.tsx        # Sign in button or avatar + profile modal
│   │   └── index.ts             # Barrel exports
│   ├── linerider/               # Game UI
│   │   ├── linerider-app.tsx    # Main container, keyboard shortcuts, profile sync
│   │   ├── linerider-canvas.tsx # Canvas rendering, pointer events, physics loop
│   │   └── linerider-controls.tsx # Toolbar (responsive), playback, view, actions
│   └── ui/
│       └── loading-spinner.tsx  # SVG spinner
├── hooks/
│   ├── use-auth.ts              # Auth hook — wraps auth store for components
│   └── use-modal-a11y.ts       # Focus trap, Escape key, focus restoration
├── lib/
│   ├── firebase/
│   │   ├── auth.ts              # Auth functions (Google, email, email link, sign out)
│   │   ├── config.ts            # Lazy Firebase app/auth/db initialization
│   │   ├── index.ts             # Barrel exports
│   │   └── users.ts             # Firestore user profiles (CRUD with merge)
│   └── linerider/
│       ├── characters.ts        # 4 character renderers + preview drawing
│       ├── constants.ts         # PHYSICS_DT, PLAYBACK_SPEEDS, ZOOM, SPATIAL_CELL_SIZE
│       ├── index.ts             # Barrel exports
│       ├── math.ts              # Vec2 ops, Segment type, closest-point-on-segment
│       ├── physics.ts           # Verlet integration, collision, rider state
│       ├── renderer.ts          # Grid, segments, start flag, HUD drawing
│       ├── spatial-hash.ts      # Spatial indexing for collision queries
│       ├── transform.ts         # Screen ↔ world coordinate transforms
│       └── types.ts             # Camera, Viewport types
└── stores/
    ├── auth-store.ts            # Auth state, Firebase listener, error mapping
    └── linerider-store.ts       # Game state (tool, track, physics, camera, settings)
```

## Current Features

### Drawing
- **Pencil tool (D):** Freehand drawing — click-drag creates connected segments. 3px minimum draw distance.
- **Pan tool (H/P):** Drag to pan camera. Also activated by middle/right mouse button from any tool.
- **Eraser tool (E):** Click-drag to erase segments within a 15-unit radius (scaled by zoom).
- **Three line types:** Normal (blue, friction), Acceleration (red, speed boost), Scenery (green, decorative only). Switch with keys 1/2/3.
- **Shift+click** sets rider start position anywhere on canvas.

### What's Missing from Drawing
- No straight line tool (only freehand pencil)
- No select/move/scale/rotate tool
- No copy/paste
- No redo (only undo)

### Playback
- **Play/Pause (Space):** Toggles simulation.
- **Speed control:** 0.25×, 0.5×, 1×, 2×, 4× with turtle/rabbit buttons.
- **Camera follow:** Smooth adaptive following during playback. Toggle with F.
- **Auto-pause:** Stops when rider goes out of bounds.
- **HUD:** Timer (MM:SS.MS) and speed indicator during playback.

### What's Missing from Playback
- Play always restarts from rider start (no resume from pause)
- No flag/marker system (can't bookmark a point in the timeline)
- No timeline scrubbing or frame stepping
- No slow motion toggle
- No "jump to beginning" / "jump to flag" shortcuts

### Physics Engine
- Verlet integration, 8 substeps per frame at 1/60s timestep.
- Spatial hashing for O(1) collision queries (cell size 200).
- 4 collision iterations per substep with penetration resolution.
- Gravity: 0.25, air resistance: 0.9995, max velocity: 40.
- Normal lines: friction 0.02. Accel lines: friction 0.0, boost 0.05.
- Scenery lines: no collision. Single-point rider (ball physics).
- Out-of-bounds detection: y > 100k, |x| > 500k.

### Characters
Four selectable characters: Ball (default), Snowboarder, Skateboarder, Horse. Each has unique rendering with velocity-based animations (trails, particles, bounce, gallop). Selected in profile modal, persisted to Firestore.

### Authentication
- Google OAuth popup
- Email + password (sign in / sign up)
- Passwordless email link (magic link)
- User profiles stored in Firestore at `/users/{uid}`
- Profile includes: uid, email, displayName, photoURL, character, timestamps
- Error codes mapped to user-friendly messages

### Track Persistence — NOT IMPLEMENTED
- Firestore rules define `/users/{uid}/tracks/{trackId}` with validation
- **No code exists to save, load, list, or share tracks**
- Tracks are ephemeral — lost on page refresh
- No track serialization/deserialization
- No local storage fallback
- No file export/import

### Camera & View
- Scroll wheel zoom at cursor position
- Zoom in/out buttons and keyboard shortcuts (+/-)
- Grid overlay (toggle with G)
- Camera follow toggle (F)
- Reset camera (R, Home, 0)
- Zoom range: 0.2× to 5×, default 1.5×

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| D | Draw tool |
| H / P | Pan tool |
| E | Erase tool |
| 1 | Normal line (+ draw tool) |
| 2 | Accel line (+ draw tool) |
| 3 | Scenery line (+ draw tool) |
| Space | Play / pause |
| + / = | Zoom in |
| - / _ | Zoom out |
| G | Toggle grid |
| F | Toggle camera follow |
| R / Home / 0 | Reset camera |
| ⌘Z / Ctrl+Z | Undo |
| C | Clear track |
| Shift+click | Set rider start |

### UI
- Responsive toolbar: full on lg+, collapsible menu on smaller screens.
- Help panel with controls reference.
- Modals use React portals with focus trap and Escape to close.
- Custom cursors for draw (pencil) and erase (eraser) tools.

## Architecture Patterns

### State Management (Zustand)
- `auth-store.ts`: Auth state, Firebase `onAuthStateChanged` listener, user-friendly error mapping for auth error codes.
- `linerider-store.ts`: Tool, lineType, segments, history, camera, rider, settings, spatial hash. Actions for drawing, erasing, physics, camera, playback.
- Both use `subscribeWithSelector` middleware.
- Components use `useShallow()` for optimized selectors.

### Firebase Integration
- Lazy initialization — instances created only when env vars are set.
- `isFirebaseConfigured()` guard before all operations.
- Auth: Google, email/password, passwordless email link.
- Firestore: `/users/{uid}` profiles with `setDoc({ merge: true })` for atomic upserts.
- Storage rules exist for avatars and track thumbnails (not used by code yet).

### Rendering Architecture
- Single `<canvas>` element fills viewport.
- `requestAnimationFrame` loop driven by store subscriptions + interaction state.
- Path2D caching per track version for efficient segment rendering.
- Fixed-timestep physics with accumulator pattern (max 4 iterations/frame).
- Render only when `needsRenderRef` is flagged (store change, interaction, or playing).

## Data Models

### Firestore: `/users/{uid}`
```typescript
{
  uid: string,
  email: string | null,
  displayName: string | null,
  photoURL: string | null,
  character: "ball" | "snowboarder" | "skateboarder" | "horse",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Firestore: `/users/{uid}/tracks/{trackId}` (rules exist, code does not)
- Requires `name` field (string, max 100 chars)
- Owner-only access

### In-Memory: Track Segments
```typescript
Segment: { id: string, a: Vec2, b: Vec2, type: "normal" | "accel" | "scenery" }
```
Stored as `segments: Segment[]` in linerider-store. History stack (max 200) for undo.

## Environment Variables

Required for Firebase (see `env.example`):
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

## Code Conventions

- Files: `kebab-case.tsx` / `kebab-case.ts`
- Hooks: `use-*.ts`
- Types: `PascalCase` with suffixes (`State`, `Actions`, `Props`)
- `"use client"` explicit on all client components
- Barrel exports via `index.ts`
- Minimal prop drilling — components consume stores directly
- TypeScript strict mode, `@/*` path alias

## Known Limitations

1. **No track persistence** — biggest gap. Tracks vanish on refresh.
2. **No straight line tool** — only freehand pencil. Precise geometry is impossible.
3. **No resume from pause** — play always restarts from beginning.
4. **No flag/timeline** — can't bookmark or scrub to a position.
5. **No select/move tool** — can't edit lines after drawing.
6. **No redo** — only undo.
7. **No track sharing** — no way to share a track with anyone.
8. **Single-point rider** — physics supports constraints but only a ball is simulated.
9. **No touch gestures** — pinch zoom, two-finger pan not implemented.
10. **No offline support** — no service worker or local storage fallback.
