# 🛷 Ride.me

A free, open-source **Line Rider** clone built with modern web technologies. Draw lines, watch a rider slide down your creation, and relive the nostalgia of the classic Flash game—right in your browser.

**🌐 Live at [Ride.me](https://ride.me)**

[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.6-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2.4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/Zustand-5.0.13-443E38?logo=npm)](https://zustand-demo.pmnd.rs/)
[![Firebase](https://img.shields.io/badge/Firebase-12.13.0-FFCA28?logo=firebase)](https://firebase.google.com/)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPLv3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

<p align="center">
  <img src="https://via.placeholder.com/800x400?text=Ride.me+Demo" alt="Ride.me Demo" width="100%" />
</p>

---

## 📋 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Environment Setup](#-environment-setup)
- [Controls](#-controls)
- [Architecture](#️-architecture)
- [Tech Stack](#️-tech-stack)
- [How It Works](#️-how-it-works)
- [Development](#-development)
- [Contributing](#-contributing)
- [Scripts](#-scripts)
- [License](#-license)

---

## ✨ Features

### 🎨 Three Line Types

Just like the classic Line Rider:

| Line             | Color    | Behavior                       |
| ---------------- | -------- | ------------------------------ |
| **Normal**       | 🔵 Blue  | Standard physics with friction |
| **Acceleration** | 🔴 Red   | Speed boost with zero friction |
| **Scenery**      | 🟢 Green | Decorative only, no collision  |

### ⚡ Smooth Physics Engine

- **Verlet Integration** — Stable, accurate physics simulation
- **Fixed Timestep** — Consistent behavior regardless of frame rate
- **8 Substeps per Frame** — Smooth collision handling at high speeds
- **Spatial Hashing** — O(1) collision detection for smooth performance
- **Adjustable Speed** — Playback from 0.25x to 4x speed

### 🎮 Intuitive Controls

- Draw, pan, and erase tools
- Context-aware cursors (pencil for draw, eraser for erase)
- Mouse wheel zoom with cursor focus
- Middle/right-click panning
- Full keyboard shortcut support
- Shift+click to reposition rider start

### 📊 Real-time HUD

- Timer display with millisecond precision
- Speed indicator during playback
- Visual start position marker
- Grid overlay (toggleable)

### 🎭 Choose Your Character

Four unique animated characters to ride your tracks:

| Character           | Description                                  |
| ------------------- | -------------------------------------------- |
| 🔴 **Classic Ball** | The original rider with a trailing flag      |
| 🏂 **Snowboarder**  | Shredding the slopes with snow spray effects |
| 🛹 **Skateboarder** | Kickflipping with balance arm animations     |
| 🏇 **Horse Rider**  | Galloping majestically with flowing mane     |

Each character features unique animations that respond to speed and movement direction.

### 🔐 User Authentication (Optional)

- **Google Sign-In** — One-click authentication
- **Email/Password** — Traditional account creation
- **Email Link** — Passwordless magic link sign-in with confirmation UI
- **User Profiles** — Customizable display names and character selection
- **Secure by Default** — User data isolated with Firebase security rules
- **Shared Auth State** — Auth is backed by a single Zustand store (`src/stores/auth-store.ts`) so Firebase subscriptions are shared across the app

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) **18.0 or higher**
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ridemeapp.git
cd ridemeapp

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start drawing!

> **Note:** The app works fully offline — authentication features simply won't appear without Firebase configuration.

---

## 🔧 Environment Setup

### Firebase Configuration (Optional)

To enable user authentication, set up a Firebase project:

1. Create a project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Authentication** with these sign-in methods:
   - Google
   - Email/Password
   - Email Link (passwordless)
3. Create a **Firestore Database** for user profiles
4. Copy the environment template and add your credentials:

```bash
cp env.example .env.local
```

Then fill in your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Environment Variables Reference

| Variable                                   | Required | Description                        |
| ------------------------------------------ | -------- | ---------------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | Optional | Firebase Web API key               |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Optional | Firebase auth domain               |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | Optional | Firebase project identifier        |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Optional | Firebase storage bucket URL        |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Optional | Firebase Cloud Messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | Optional | Firebase app identifier            |

### Firebase Security Rules

The repository includes pre-configured security rules for Firestore and Storage. These rules ensure **user data isolation** — each user can only access their own data.

#### Deploying Security Rules

1. Go to [Firebase Console](https://console.firebase.google.com/) and select your project

2. **For Firestore Database:**

   - Navigate to **Firestore Database → Rules**
   - Copy the contents of `firestore.rules` and paste into the editor
   - Click **Publish**

3. **For Storage:**
   - Navigate to **Storage → Rules**
   - Copy the contents of `storage.rules` and paste into the editor
   - Click **Publish**

#### Data Structure

```
Firestore:
/users/{uid}                    ← User profile document
/users/{uid}/tracks/{trackId}   ← Saved tracks
/users/{uid}/settings/{docId}   ← User preferences (future)

Storage:
/users/{uid}/**                 ← User files (avatars, thumbnails, etc.)
```

#### Security Features

| Feature            | Description                                           |
| ------------------ | ----------------------------------------------------- |
| **User isolation** | Users can only read/write under `/users/{their-uid}/` |
| **Auth required**  | All operations require authentication                 |
| **UID matching**   | `request.auth.uid == uid` ensures ownership           |
| **Default deny**   | Any path not explicitly matched is blocked            |

---

## 🎮 Controls

### Mouse Controls

| Action          | Input                              |
| --------------- | ---------------------------------- |
| Draw lines      | Left-click + drag                  |
| Pan view        | Middle-click or Right-click + drag |
| Zoom            | Scroll wheel                       |
| Set rider start | Shift + Click                      |

### Keyboard Shortcuts

| Key          | Action                  |
| ------------ | ----------------------- |
| `D`          | Draw tool               |
| `L`          | Straight line tool      |
| `H` / `P`    | Pan tool                |
| `E`          | Erase tool              |
| `1`          | Normal line (blue)      |
| `2`          | Acceleration line (red) |
| `3`          | Scenery line (green)    |
| `Space`      | Play / Pause            |
| `S` / `Esc`  | Stop and reset rider to start |
| Hold `Tab`   | Fit full track overview (release to restore view) |
| `⌘S` / `Ctrl+S` | Save track to JSON file |
| `⌘O` / `Ctrl+O` | Open track from JSON file |
| `R` / Home / `0` | Reset camera view |
| `G`          | Toggle grid visibility  |
| `I`          | Set flag at current rider state |
| `F`          | Jump to flag            |
| `Shift+F`    | Toggle camera follow    |
| `+` / `-`    | Zoom in / out           |
| `C`          | Clear all lines         |
| `Ctrl/⌘ + Z` | Undo last action        |
| `Ctrl/⌘ + Shift + Z` | Redo last undone action |

---

## 🏗️ Architecture

```
ridemeapp/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout with fonts
│   │   ├── page.tsx                # Home page (renders LineriderApp)
│   │   ├── not-found.tsx           # 404 page
│   │   ├── globals.css             # Global styles + Tailwind
│   │   └── fonts/                  # Geist font files
│   │       ├── GeistVF.woff
│   │       └── GeistMonoVF.woff
│   │
│   ├── components/
│   │   ├── auth/                   # Authentication UI components
│   │   │   ├── auth-modal.tsx      # Sign-in/sign-up modal
│   │   │   ├── avatar.tsx          # User avatar component
│   │   │   ├── character-selector.tsx # Animated character picker
│   │   │   ├── profile-modal.tsx   # User profile editor
│   │   │   ├── user-menu.tsx       # User menu dropdown
│   │   │   └── index.ts            # Barrel exports
│   │   │
│   │   └── linerider/              # Core game components
│   │       ├── linerider-app.tsx   # Main app + keyboard handling
│   │       ├── linerider-canvas.tsx# Canvas rendering & mouse input
│   │       └── linerider-controls.tsx # UI controls panel
│   │
│   ├── hooks/
│   │   └── use-auth.ts             # Thin hook wrapper over auth store
│   │
│   ├── lib/
│   │   ├── firebase/               # Firebase integration
│   │   │   ├── config.ts           # Firebase app initialization
│   │   │   ├── auth.ts             # Authentication functions
│   │   │   ├── users.ts            # User profile CRUD operations
│   │   │   └── index.ts            # Barrel exports
│   │   │
│   │   └── linerider/              # Core physics & rendering
│   │       ├── characters.ts       # Character definitions & animations
│   │       ├── math.ts             # Vector math utilities (Vec2, Segment)
│   │       ├── physics.ts          # Verlet physics engine
│   │       ├── renderer.ts         # Canvas 2D rendering pipeline
│   │       ├── spatial-hash.ts     # O(1) collision detection
│   │       ├── transform.ts        # World ↔ Screen transforms
│   │       └── types.ts            # TypeScript type definitions
│   │
│   └── stores/
│       ├── auth-store.ts           # Auth state + single Firebase subscription
│       └── linerider-store.ts      # Game state management
│
├── public/                         # Static assets
├── env.example                     # Environment template
├── firestore.rules                 # Firestore security rules
├── storage.rules                   # Firebase Storage security rules
├── next.config.mjs                 # Next.js configuration
├── postcss.config.mjs              # PostCSS configuration
├── eslint.config.mjs               # ESLint flat config
├── tsconfig.json                   # TypeScript configuration
└── package.json                    # Dependencies & scripts
```

---

## 🛠️ Tech Stack

| Technology                                    | Version | Purpose                         |
| --------------------------------------------- | ------- | ------------------------------- |
| [Next.js](https://nextjs.org/)                | 16.2.6  | React framework with App Router |
| [React](https://react.dev/)                   | 19.2.6  | UI component library            |
| [TypeScript](https://www.typescriptlang.org/) | 6.0.3   | Type-safe JavaScript            |
| [Zustand](https://zustand-demo.pmnd.rs/)      | 5.0.13  | Lightweight state management    |
| [Firebase](https://firebase.google.com/)      | 12.13.0 | Authentication & database       |
| [Tailwind CSS](https://tailwindcss.com/)      | 4.2.4   | Utility-first CSS framework     |
| [PostCSS](https://postcss.org/)               | 8.x     | CSS transformation pipeline     |
| [ESLint](https://eslint.org/)                 | 10.4.0  | Code linting (flat config)      |

### Development Dependencies

| Package                | Version | Purpose                      |
| ---------------------- | ------- | ---------------------------- |
| `@tailwindcss/postcss` | 4.3.0   | Tailwind PostCSS plugin      |
| `@types/node`          | 25.9.1  | Node.js type definitions     |
| `@types/react`         | 19.2.15 | React type definitions       |
| `@types/react-dom`     | 19.2.3  | React DOM type definitions   |
| `eslint-config-next`   | 16.2.6  | Next.js ESLint configuration |

---

## ⚙️ How It Works

### Physics Engine

Ride.me uses **Verlet integration** for physics simulation, which provides:

1. **Stability** — No velocity explosions or tunneling through lines
2. **Simplicity** — Position-based, easy to add constraints
3. **Accuracy** — Second-order integration for realistic motion

```typescript
// Simplified Verlet step
const velocity = subtract(position, previousPosition);
previousPosition = position;
position = add(position, add(velocity, gravity));
```

#### Physics Constants

| Constant        | Value | Description                      |
| --------------- | ----- | -------------------------------- |
| Gravity         | 0.25  | World units per tick             |
| Substeps        | 8     | Physics iterations per frame     |
| Rider Radius    | 10    | Collision detection radius       |
| Normal Friction | 0.02  | Blue line friction coefficient   |
| Accel Friction  | 0.0   | Red line friction (frictionless) |
| Accel Boost     | 0.05  | Red line acceleration multiplier |
| Max Velocity    | 40    | Prevents tunneling through lines |

### Collision Detection

**Spatial hashing** divides the world into a 200×200 unit grid. Each line segment is stored in all cells it intersects, enabling O(1) lookups:

```
┌───┬───┬───┬───┐
│   │ ╱ │   │   │  Line segments are indexed
├───┼─╱─┼───┼───┤  by their bounding cells
│   │╱  │   │   │
├───┼───┼───┼───┤  Query: Find segments near (x, y)
│   │   │ ● │   │  → Check only cells within radius
├───┴───┴───┴───┤
```

### Rendering Pipeline

1. **Path2D Caching** — Line segments grouped by type into reusable paths
2. **DPR Scaling** — Crisp rendering on Retina/HiDPI displays
3. **Dirty Flagging** — Only re-render when state changes
4. **Transform Stack** — Efficient world-to-screen coordinate mapping

### State Management

The app uses **Zustand** with `subscribeWithSelector` middleware for reactive state:

```typescript
// Immutable state updates with action functions
const useLineriderStore = create<LineriderStore>()(
  subscribeWithSelector((set, get) => ({
    segments: [],
    camera: { pos: { x: 0, y: -50 }, zoom: 1.5 },
    // ... actions that update state immutably
  }))
);
```

---

## 💻 Development

### Project Structure Conventions

- **Components**: PascalCase, co-located with related files
- **Utilities**: camelCase, pure functions where possible
- **Types**: Exported from module files, prefer `type` over `interface`
- **State**: Zustand stores with immutable update patterns

### Code Style

- TypeScript strict mode enabled
- ESLint with Next.js recommended rules
- Functional components with hooks
- Prefer `const` and immutable patterns

### Building for Production

```bash
# Create optimized production build
npm run build

# Start production server
npm start
```

### Type Checking

```bash
# Run TypeScript compiler in check mode
npm run type-check
```

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Getting Started

1. **Fork** the repository
2. **Clone** your fork locally
3. **Install** dependencies: `npm install`
4. **Checkout** the `dev` branch (or branch from it for your fork)
5. **Make** your changes
6. **Validate:** `npm run lint && npm run type-check && npm run test && npm run build`
7. **Commit** and push to your branch, then open a Pull Request into `dev` or `main` as the maintainers prefer

For autonomous agents, see **[AGENTS.md](./AGENTS.md)**. For product scope and roadmap, see **[spec.md](./spec.md)**.

### Development Workflow

```bash
# Start dev server with hot reload
npm run dev

# Run linting
npm run lint

# Run automated tests
npm run test

# Build for production (catches type errors)
npm run build
```

### Roadmap

Product milestones and acceptance criteria live in **[spec.md](./spec.md)**.

---

## 📜 Scripts

| Command         | Description                              |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Start development server with hot reload |
| `npm run build` | Create optimized production build        |
| `npm run start` | Start production server                  |
| `npm run lint`  | Run ESLint for code quality              |
| `npm run type-check` | TypeScript check without emit       |
| `npm run test`  | Run Vitest test suite                    |
| `npm run test:ci` | Run Vitest with CI mode enabled        |

---

## 📄 License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)** — see [`LICENSE.md`](LICENSE.md) for details.

---

## 🙏 Acknowledgments

- Inspired by [Line Rider](https://www.linerider.com/) by Boštjan Čadež
- Built with the amazing [Next.js](https://nextjs.org/) framework
- State management powered by [Zustand](https://github.com/pmndrs/zustand)
- Fonts: [Geist](https://vercel.com/font) by Vercel

---

## 📚 Further Reading

- [Verlet Integration Explained](https://en.wikipedia.org/wiki/Verlet_integration) — The physics simulation method
- [Spatial Hashing for Collision Detection](https://www.gamedev.net/tutorials/programming/general-and-gameplay-programming/spatial-hashing-r2697/) — O(1) collision lookups
- [Canvas 2D Performance Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) — Rendering optimization

---

<p align="center">
  Made with ❤️ by the open-source community
  <br /><br />
  <a href="https://ride.me">🌐 Live Demo</a>
  ·
  <a href="https://github.com/yourusername/ridemeapp/issues">🐛 Report Bug</a>
  ·
  <a href="https://github.com/yourusername/ridemeapp/issues">💡 Request Feature</a>
</p>
