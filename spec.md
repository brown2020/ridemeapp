# spec.md — Ride.me Product Specification

Authoritative product, architecture, and roadmap document for Ride.me.  
Agent implementation rules: **AGENTS.md**. User-facing setup: **README.md**.

---

## 1. Product overview

### Product promise

Draw tracks in the browser, press play, and watch your rider follow the lines with believable physics—like the classic Line Rider, free and open source, with optional sign-in to save identity (character, display name) and a planned path to saved and shared tracks.

### Target users

| Segment | Need |
|---------|------|
| Casual players | Quick doodles, immediate play, no account |
| Nostalgia / Line Rider fans | Familiar line types, shortcuts, physics feel |
| Track builders | Precise geometry, iteration on sections, persistence (gap today) |
| Signed-in users | Profile, character, future cloud tracks |

### Core workflows (today)

1. **Create** — Open `/`, draw with pencil, switch line types, pan/zoom, set start with Shift+click.
2. **Test** — Space to play/pause; adjust speed; optional camera follow.
3. **Refine** — Undo, erase, clear; repeat until satisfied (work is lost on refresh).
4. **Optional identity** — Sign in (if Firebase configured), pick character, edit profile.

### Product goals

1. **Parity** with Line Rider table-stakes editor and playback (see roadmap).
2. **Persistence** — Never lose work: local files first, then cloud for signed-in users.
3. **Sharing** — One-link playback and optional fork (differentiator vs linerider.com).
4. **Polish** — Modern responsive UI, accurate help text, mobile-friendly input (later).

---

## 2. Current application state

*Verified by code review (May 2026). Items marked **(inferred)** are not backed by automated tests.*

### What the app does

Single-route canvas game (`LineriderApp`) filling the viewport. No separate landing page. Legal content at `/privacy` and `/terms`.

### Feature inventory

| Area | Status | Notes |
|------|--------|-------|
| Pencil draw | ✅ | `ToolMode: draw`, min 3px segment spacing |
| Straight line tool | ❌ | Only freehand |
| Pan | ✅ | Tool + middle/right drag |
| Eraser | ✅ | `erasePath`, radius scaled by zoom |
| Line types normal/accel/scenery | ✅ | Keys 1/2/3 |
| Play / pause | ✅ | Space; **resumes** mid-ride |
| Stop (reset to start) | ⚠️ Partial | `resetRider()` unused in UI; `R` resets camera + rider |
| Playback speeds | ✅ | 0.25×–4×, validated |
| Camera follow | ✅ | `F` |
| Grid | ✅ | `G` |
| Zoom | ✅ | Wheel, +/- keys, toolbar |
| Undo | ✅ | Max 200 steps |
| Redo | ❌ | |
| Flags / timeline | ❌ | |
| Tab overview | ❌ | |
| Track save/load | ❌ | Ephemeral in memory |
| Track sharing | ❌ | |
| Characters (4) | ✅ | Animated rendering |
| Auth Google / email / link | ✅ | Optional via env |
| User profile Firestore | ✅ | `/users/{uid}` |
| Cloud tracks | ❌ | Rules only at `/users/{uid}/tracks/{id}` |
| Tests | ❌ | No runner configured |
| API routes / Server Actions | ❌ | |
| Middleware / route guards | ❌ | |

### User flows

**Anonymous play**

1. Load `/` → canvas ready, default rider start near origin.
2. Draw → segments append to Zustand store, spatial hash invalidated on version bump.
3. Play → physics loop in canvas; HUD shows time and speed; OOB auto-pauses.
4. Refresh → **all track data lost**.

**Signed-in (Firebase configured)**

1. Sign In → auth modal → profile created/merged in Firestore.
2. Character from profile applied to game store via `LineriderApp` effect.
3. Profile modal → update display name / character.
4. Tracks still **not** saved to Firestore.

### Integrations

| Integration | Usage |
|-------------|--------|
| Firebase Auth | Google, email/password, email link |
| Firestore | User profiles only (client SDK) |
| Firebase Storage | Rules exist; **no app code** |
| Vercel | Hosting **(inferred from README/domain)** |

### Architecture summary

- **Next.js 16** App Router: mostly client components for the game.
- **Zustand** stores: `linerider-store` (game), `auth-store` (session).
- **Canvas 2D** render loop with Path2D caching per `trackVersion`.
- **Physics:** Verlet integration, `PHYSICS_DT`, spatial hash (`SPATIAL_CELL_SIZE` 200), constants in `src/lib/linerider/constants.ts`.
- **Firebase:** Lazy init in `config.ts`; `isFirebaseConfigured()` guards all paths.

### Technical constraints

- Client-only Firebase (public config vars).
- Firestore track documents limited by rules (name required; owner-only read/write).
- AGPL-3.0 license.
- No server-side track validation or thumbnails yet.
- Canvas performance tied to segment count **(inferred)**.

### Known limitations

1. **No track persistence** — largest product gap.
2. **No straight-line tool** — precise geometry is painful.
3. **No explicit Stop control** — pause vs restart is confusing; `resetRider` not in toolbar.
4. **No redo, flags, scrubbing, tab overview.**
5. **No select/move/copy** — erase and redraw only.
6. **No sharing or gallery.**
7. **No touch-optimized gestures** — mouse/keyboard first.
8. **No automated tests.**
9. **Help panel incomplete** — omits `C`, full zoom keys, pause/resume nuance.
10. **Auth UI hidden** when Firebase env missing (by design).

### Partially implemented / abandoned

| Item | State |
|------|--------|
| `resetRider` action | Implemented in store, **not wired** to controls |
| `/users/{uid}/tracks` | Firestore rules only |
| `storage.rules` | Avatars/thumbnails planned, unused |
| Multi-point / Bosh rider physics | `createRider` removed; ball-only simulation |

### Doc drift corrected (was wrong in older docs)

- **Play/pause does resume** mid-ride (`togglePlaying` does not reset rider).
- **Email link** uses `EmailConfirmModal`, not `window.prompt`.
- **Privacy/terms pages exist** at `/privacy`, `/terms`.
- **404** includes link home.
- **Firestore profile validation** exists in `users.ts`; rules use explicit parentheses for email.

---

## 3. Product roadmap

Ordered for product impact and dependencies. Each item is sized for **one focused commit sequence** on `dev`. Acceptance criteria are testable by hand.

### Milestone 1 — Redo

**User value:** Recover from accidental undo without redrawing.

**Intent:** Add `redoStack` in `linerider-store`; clear on new edits; `⌘⇧Z` / toolbar button.

**Acceptance criteria:**

- [ ] After undo, redo restores previous segments.
- [ ] New draw/erase/clear clears redo stack.
- [ ] Toolbar redo disabled when stack empty.

---

### Milestone 2 — Straight line tool

**User value:** Precise ramps and structures (table stakes vs Line Rider).

**Intent:** `ToolMode: "line"`; click–click placement; preview segment; `L` shortcut; Shift snaps to 15°; one undo step per line.

**Acceptance criteria:**

- [ ] `L` activates line tool with distinct cursor.
- [ ] Two clicks place one segment of active line type.
- [ ] Shift constrains angle to 15° increments.
- [ ] Help panel documents line tool.

---

### Milestone 3 — Stop vs play/pause

**User value:** Clear mental model: pause to inspect, stop to rerun from start.

**Intent:** Keep resume on play; add Stop button (`S` / Escape); wire `resetRider`; separate `resetCamera` from full simulation reset if needed.

**Acceptance criteria:**

- [ ] Pause freezes rider; play continues from same state.
- [ ] Stop resets rider to `riderStart`, time 0, not playing.
- [ ] `R` / Home / `0` reset view only (or documented combined behavior).

---

### Milestone 4 — Flag and jump

**User value:** Iterate on one section of a long track (depends on Milestone 3).

**Intent:** Store flag snapshot (rider state + elapsed time); `I` set, `F` jump; move camera follow to `Shift+F`.

**Acceptance criteria:**

- [ ] Flag set while playing or paused.
- [ ] `F` restores flagged state and pauses.
- [ ] HUD shows flag indicator when set.
- [ ] Flag clears on clear track / new start.

---

### Milestone 5 — Tab track overview

**User value:** See full track layout without manual zoom guessing.

**Intent:** Hold Tab (or toggle): fit segment bounding box in viewport; release restores prior camera; disable draw/erase during overview.

**Acceptance criteria:**

- [ ] Tab shows all segments with padding.
- [ ] Release Tab restores previous camera.
- [ ] No segment edits during overview.

---

### Milestone 6 — Local save and load (JSON)

**User value:** Keep tracks without an account; backup and share files manually.

**Intent:** Serialize `{ version, name, segments, riderStart, character }`; download/upload `.json`; `⌘S` / `⌘O`; confirm before replace.

**Acceptance criteria:**

- [ ] Save downloads valid JSON reflecting current canvas.
- [ ] Load replaces track after confirmation.
- [ ] Invalid files show error, no partial corrupt state.
- [ ] Works without Firebase.

---

### Milestone 7 — Cloud save and My Tracks

**User value:** Cross-device persistence for signed-in users.

**Intent:** CRUD in `/users/{uid}/tracks/{trackId}`; compact segment encoding; list modal; name prompt on first save; cap 50 tracks **(inferred limit from prior spec)**.

**Acceptance criteria:**

- [ ] Signed-in user saves and reloads track from Firestore.
- [ ] List shows name, date, line count.
- [ ] Unsaved canvas prompts before load/replace.
- [ ] Rules reject invalid payloads.

**Depends on:** Milestone 6 schema.

---

### Milestone 8 — Shareable play-only URL

**User value:** Send a link; recipient watches without setup.

**Intent:** Public read model (e.g. `public: true` + `/tracks/{id}` or slug route); `/t/[id]` play-only view; copy link button; optional fork for authed users.

**Acceptance criteria:**

- [ ] Shared URL loads track read-only.
- [ ] Play works without sign-in.
- [ ] Fork copies to owner’s library when signed in.

**Depends on:** Milestone 7.

---

### Milestone 9 — Eraser and draw polish

**User value:** Faster editing, fewer undo steps.

**Intent:** Single undo per erase stroke; optional radius circle; Shift = 3× erase radius; endpoint snap (10px screen) for line/pencil start.

**Acceptance criteria:**

- [ ] One erase drag = one undo.
- [ ] Snap highlight when near endpoint.
- [ ] Space-hold temporary pan **(optional sub-item)** with short-press play unchanged.

---

### Milestone 10 — Demo track onboarding

**User value:** First visit shows what’s possible without a blank canvas.

**Intent:** First visit (localStorage flag) loads small bundled demo; dismiss banner; Clear removes demo.

**Acceptance criteria:**

- [ ] New visitor sees demo track once.
- [ ] Play demonstrates three line types.
- [ ] Clear returns to empty track.

---

### Milestone 11 — Touch and mobile toolbar

**User value:** Usable on phones and tablets.

**Intent:** Touch draw/pan/pinch zoom; larger hit targets on small breakpoints; test on iOS Safari.

**Acceptance criteria:**

- [ ] Draw and pan work with one finger.
- [ ] Pinch zooms toward focal point.
- [ ] Toolbar usable at 375px width.

---

### Milestone 12 — Public browse gallery (optional)

**User value:** Discovery without external forums.

**Intent:** `/browse` lists recent public tracks; card → play view.

**Acceptance criteria:**

- [ ] Page lists paginated public tracks.
- [ ] Click opens play-only experience.

**Depends on:** Milestone 8.

---

## 4. Explicitly not on roadmap (now)

Aligned with prior product strategy—revisit only with strong user demand:

| Feature | Reason |
|---------|--------|
| Select / move / scale / rotate | High complexity; erase/redraw suffices initially |
| Per-frame camera keyframes | Power-user cinematic feature |
| .trk legacy import | JSON is sufficient |
| Video/GIF export | Large scope; separate project |
| Multi-rider | Not table stakes for web clone |
| Key rebinding | Low impact |

---

## 5. Competitor context

Line Rider (linerider.com) analysis is archived in **competitor-analysis.md** (pointer only). Table-stakes list there informed milestones 2–7 above.

---

## 6. References

- **AGENTS.md** — agent workflow, validation, git rules
- **README.md** — install, env, controls summary
- **firestore.rules** / **storage.rules** — security contracts for future features
