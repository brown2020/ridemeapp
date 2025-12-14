# 🛷 Ride.me

A free, open-source **Line Rider** clone built with modern web technologies. Draw lines, watch a rider slide down your creation, and relive the nostalgia of the classic Flash game—right in your browser.

**🌐 Live at [Ride.me](https://ride.me)**

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<p align="center">
  <img src="https://via.placeholder.com/800x400?text=Ride.me+Demo" alt="Ride.me Demo" width="100%" />
</p>

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
- **Spatial Hashing** — O(1) collision detection for smooth performance
- **Adjustable Speed** — Playback from 0.25x to 4x speed

### 🎮 Intuitive Controls

- Draw, pan, and erase tools
- Mouse wheel zoom with cursor focus
- Middle/right-click panning
- Full keyboard shortcut support

### 📊 Real-time HUD

- Timer display with millisecond precision
- Speed indicator during playback
- Start position marker

### 🔐 User Authentication (Optional)

- **Google Sign-In** — One-click authentication
- **Email/Password** — Traditional account creation
- **Email Link** — Passwordless magic link sign-in
- **User Profiles** — Customizable display names

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18.0 or higher
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ride-me.git
cd ride-me

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start drawing!

### Firebase Setup (Optional)

To enable user authentication, set up a Firebase project:

1. Create a project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Authentication** with these sign-in methods:
   - Google
   - Email/Password
   - Email Link (passwordless)
3. Create a **Firestore Database** for user profiles
4. Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

> **Note:** The app works without Firebase — authentication features simply won't appear.

### Build for Production

```bash
npm run build
npm start
```

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
| `H` / `P`    | Pan tool                |
| `E`          | Erase tool              |
| `1`          | Normal line (blue)      |
| `2`          | Acceleration line (red) |
| `3`          | Scenery line (green)    |
| `Space`      | Play / Pause            |
| `R`          | Reset rider position    |
| `G`          | Toggle grid visibility  |
| `F`          | Toggle camera follow    |
| `C`          | Clear all lines         |
| `Ctrl/⌘ + Z` | Undo last action        |

---

## 🏗️ Architecture

```
ride-me/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Home page
│   │   └── globals.css             # Global styles
│   │
│   ├── components/
│   │   ├── auth/                   # Authentication UI
│   │   │   ├── auth-modal.tsx      # Sign-in/sign-up modal
│   │   │   ├── profile-modal.tsx   # User profile editor
│   │   │   └── user-menu.tsx       # User menu button
│   │   │
│   │   └── linerider/              # Game components
│   │       ├── linerider-app.tsx   # Main app + keyboard handling
│   │       ├── linerider-canvas.tsx # Canvas rendering & input
│   │       └── linerider-controls.tsx # UI controls panel
│   │
│   ├── hooks/
│   │   └── use-auth.ts             # Firebase auth hook
│   │
│   ├── lib/
│   │   ├── firebase/               # Firebase integration
│   │   │   ├── config.ts           # Firebase initialization
│   │   │   ├── auth.ts             # Auth functions
│   │   │   └── users.ts            # User profile CRUD
│   │   │
│   │   └── linerider/              # Core game logic
│   │       ├── math.ts             # Vector math utilities
│   │       ├── physics.ts          # Verlet physics engine
│   │       ├── renderer.ts         # Canvas 2D rendering
│   │       ├── spatial-hash.ts     # Collision optimization
│   │       ├── transform.ts        # Coordinate transforms
│   │       └── types.ts            # TypeScript types
│   │
│   └── stores/
│       └── linerider-store.ts      # Zustand state management
│
├── public/                         # Static assets
├── .env.example                    # Environment template
├── package.json
├── tsconfig.json
└── next.config.mjs
```

---

## 🛠️ Tech Stack

| Technology                                    | Version | Purpose                         |
| --------------------------------------------- | ------- | ------------------------------- |
| [Next.js](https://nextjs.org/)                | 16.0    | React framework with App Router |
| [React](https://react.dev/)                   | 19.2    | UI component library            |
| [TypeScript](https://www.typescriptlang.org/) | 5.x     | Type-safe JavaScript            |
| [Zustand](https://zustand-demo.pmnd.rs/)      | 5.0     | Lightweight state management    |
| [Firebase](https://firebase.google.com/)      | 11.x    | Authentication & database       |
| [Tailwind CSS](https://tailwindcss.com/)      | 4.1     | Utility-first CSS framework     |
| [ESLint](https://eslint.org/)                 | 9.x     | Code linting                    |

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

### Collision Detection

**Spatial hashing** divides the world into a grid of cells. Each line segment is stored in all cells it intersects, enabling O(1) lookups:

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

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run linting: `npm run lint`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Ideas for Contributions

- [ ] **Save/Load Tracks** — Store tracks in Firestore per user
- [ ] **Share Tracks** — Public track gallery and sharing
- [ ] **Touch Support** — Mobile-friendly drawing
- [ ] **Line Snapping** — Snap to grid or existing points
- [ ] **Replay System** — Record and share rides
- [ ] **Leaderboards** — Track completion times
- [ ] **Custom Rider** — Different rider physics/appearance
- [ ] **Sound Effects** — Audio feedback for collisions
- [ ] **Themes** — Dark mode and custom color schemes

---

## 📜 Scripts

| Command         | Description                              |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Start development server with hot reload |
| `npm run build` | Create optimized production build        |
| `npm run start` | Start production server                  |
| `npm run lint`  | Run ESLint for code quality              |

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Inspired by [Line Rider](https://www.linerider.com/) by Boštjan Čadež
- Built with the amazing [Next.js](https://nextjs.org/) framework
- State management powered by [Zustand](https://github.com/pmndrs/zustand)

---

<p align="center">
  Made with ❤️ by the open-source community
  <br />
  <a href="https://ride.me">Ride.me</a>
  ·
  <a href="https://github.com/yourusername/ride-me/issues">Report Bug</a>
  ·
  <a href="https://github.com/yourusername/ride-me/issues">Request Feature</a>
</p>
