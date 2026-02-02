# CLAUDE.md - Project Guide for AI Assistants

This is a Line Rider clone built with Next.js 16, React 19, TypeScript, Firebase, Zustand, and Tailwind CSS 4.

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
├── app/                    # Next.js App Router pages
├── components/
│   ├── auth/              # Authentication UI (modals, user menu)
│   ├── linerider/         # Game UI (canvas, controls, main app)
│   └── ui/                # Shared UI components
├── hooks/                 # Custom React hooks
├── lib/
│   ├── firebase/          # Firebase config & API functions
│   └── linerider/         # Physics engine, renderer, math utilities
└── stores/                # Zustand state stores
```

## Architecture Patterns

### State Management (Zustand)
- `auth-store.ts`: Authentication state, Firebase listener management
- `linerider-store.ts`: Game state (tool, track, physics, camera, settings)
- Stores use `subscribeWithSelector` middleware for efficient subscriptions
- Use `useShallow()` for optimized selectors in components

### Firebase Integration
- Lazy initialization - instances created only when configured
- Check `isFirebaseConfigured()` before Firebase operations
- Auth methods: Google OAuth, email/password, passwordless email link
- Firestore path: `/users/{uid}` with tracks/settings subcollections

### Physics Engine (`lib/linerider/`)
- Verlet integration with 8-point rider model
- 8 substeps per frame for stability
- Spatial hashing for O(1) collision queries
- Line types: `normal` (friction), `accel` (boost), `scenery` (decorative)

## Code Conventions

### Naming
- Files: `kebab-case.tsx` for components, `kebab-case.ts` for utilities
- Hooks: `use-*.ts` prefix
- Types: `PascalCase` with suffixes like `State`, `Actions`, `Props`
- Functions: verb prefixes (`signIn`, `toggle`, `set`), `is` for booleans

### TypeScript
- Strict mode enabled
- Path alias: `@/*` maps to `src/*`
- Use `Readonly<>` for immutable types
- Explicit type narrowing with guards

### Components
- `"use client"` directive explicit on client components
- Barrel exports via `index.ts` files
- Hooks consume stores directly (minimal prop drilling)
- Modals use React portals

## Environment Variables

Required for Firebase (see `.env.example`):
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

## Key Constants

Centralized in `lib/linerider/constants.ts`:
- `PHYSICS_DT`: Fixed physics timestep (1/60)
- `PLAYBACK_SPEEDS`: Valid speed multipliers [0.25, 0.5, 1, 2, 4]
- `ZOOM`: Min/max/default zoom levels

Physics tuning in `lib/linerider/physics.ts`:
- Gravity: `0.25`, Substeps: `8`, Max velocity: `40`
- Friction (normal): `0.02`, Friction (accel): `0.0`

Character options: `ball`, `snowboarder`, `skateboarder`, `horse`

## Pages

- `/` - Main game
- `/privacy` - Privacy policy
- `/terms` - Terms of service
- `/not-found` - 404 page with navigation back

## Testing

No testing framework configured. When adding tests, use:
- Vitest or Jest for unit tests
- React Testing Library for components
- Playwright for e2e
