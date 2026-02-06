# spec.md — Improvement Spec for Ride.me

Based on `competitor-analysis.md` (target) and `CLAUDE.md` (current state).

---

## 1. Table Stakes Gaps

These are features Line Rider has that we're missing. Without them, we can't be taken seriously as a competitor.

### 1.1 Straight Line Tool

**We have:** Freehand pencil only.
**They have:** Both freehand pencil (Q) and straight line tool (W).
**What to build:**

- Add a `"line"` tool mode alongside `"draw"`, `"pan"`, `"erase"`.
- Click to set start point, see a preview line as you move the mouse, click again (or release) to place the line.
- The line becomes a single segment of the current `lineType`.
- Keyboard shortcut: `L` to activate line tool.
- Show a crosshair cursor when active.
- Hold Shift while placing to snap to 15° angle increments (0°, 15°, 30°, 45°, etc.) for precise slopes.
- The line tool should push history just like the pencil tool (one undo = one line).

### 1.2 Resume from Pause (Don't Restart)

**We have:** Play always resets rider to start position and begins from frame 0.
**They have:** Play resumes from the current paused state. A separate "stop" resets to beginning.

**What to build:**

- **Play** resumes the rider from wherever it currently is (if paused mid-ride, it continues).
- **Stop** resets the rider to start position and frame 0.
- The current play/pause button becomes play/pause (Space). Add a separate **Stop** button (square icon, shortcut `S` or `Escape`).
- When stopped (rider at start): Play starts simulation from beginning.
- When paused (rider mid-ride): Play continues simulation from current position.
- When playing: the button shows Pause. Clicking it pauses (freezes rider in place).
- `togglePlaying` in the store needs to differentiate between "paused mid-ride" and "stopped at start."

### 1.3 Flag / Marker System

**We have:** Nothing.
**They have:** Flag (I key) marks a frame on the timeline. F jumps to that flag. Flag can be dragged on timeline.

**What to build:**

- User can set a **flag** at any point during playback or while paused mid-ride by pressing `I`. This records the current rider state and frame number.
- Pressing `F` when a flag exists: resets the rider to the flagged state (position, velocity, frame) and pauses. The next Play continues from the flag.
- If no flag is set, `F` still toggles camera follow (move this to `Shift+F` or remove conflict — see below).
- Visual indicator: small flag icon in the HUD showing the flagged frame number. If no flag, show nothing.
- `clearFlag` action to remove the flag (e.g., when track changes or user clears it).
- **Keyboard conflict resolution:** Currently `F` = toggle camera follow. Change camera follow to `Shift+F`. `F` = jump to flag (matches Line Rider). `I` = set flag.

### 1.4 Redo

**We have:** Undo only (⌘Z). No redo.
**They have:** Full undo/redo.

**What to build:**

- Add `redoHistory: Segment[][]` stack alongside the existing `history` stack.
- On undo: push current segments to redo stack.
- On redo: pop from redo stack, push current to history.
- Clear redo stack on any new track modification (draw, erase, clear).
- Keyboard shortcut: `⌘Shift+Z` / `Ctrl+Shift+Z` for redo.
- Add redo button in the toolbar next to undo.

### 1.5 Save & Load Tracks

**We have:** Tracks are ephemeral — lost on refresh. Firestore rules exist but no code.
**They have:** Local save/load with file formats. URL-based track sharing.

**What to build:**

#### 1.5a Local File Save/Load (no auth required)
- **Save to file:** Export current track as a `.json` file download. Contains: segments array, rider start position, metadata (name, date, character).
- **Load from file:** Import a `.json` file to replace the current track. Validate the schema before loading.
- File menu or buttons in toolbar: "Save" (download icon) and "Load" (upload icon).
- Keyboard: `⌘S` / `Ctrl+S` = save to file. `⌘O` / `Ctrl+O` = load from file.

#### 1.5b Cloud Save (auth required)
- Authenticated users can save tracks to Firestore at `/users/{uid}/tracks/{trackId}`.
- Track document: `{ name, segments, riderStart, character, lineCount, createdAt, updatedAt }`.
- "My Tracks" panel (slide-out or modal) lists saved tracks with name, line count, and date.
- Click a track to load it. Confirm if current track has unsaved changes.
- Save button: if track was loaded from cloud, updates it. If new, prompts for a name.
- Maximum 50 tracks per user (enforce in rules or code).
- Segments stored as a compact array: `[[ax, ay, bx, by, typeIndex], ...]` to minimize Firestore document size.

### 1.6 Tab Overview

**We have:** Nothing.
**They have:** Press Tab to zoom out and see the full track, then zoom back.

**What to build:**

- Press `Tab`: animate camera to show entire track bounding box (fit all segments in view with padding).
- Release `Tab` (or press again): animate camera back to previous position/zoom.
- During overview: don't allow drawing or erasing. Pan only.
- Implementation: calculate bounding box of all segments, compute zoom level to fit viewport, lerp camera to that state.

---

## 2. Improvement Opportunities

Things we both have, but they do better.

### 2.1 Better Eraser

**We have:** Fixed radius eraser that deletes whole segments on contact.
**They have:** Larger eraser with better hitbox, undo applies to whole erase strokes.

**What to build:**

- Currently each erase during drag is a separate history entry. Change to: push history once on erase-start, batch all erasures in a single drag into one undo step.
- Show erase radius as a visual circle around the cursor.
- Scale erase radius with a modifier: hold Shift while erasing for 3× larger radius.

### 2.2 Temporary Hand Tool

**We have:** Must switch to pan tool to pan.
**They have:** Hold Space to temporarily activate hand tool, release to return to previous tool.

**What to build:**

- While Space is held (keydown without keyup), temporarily switch to pan mode.
- On Space keyup, restore previous tool.
- Don't trigger play/pause on Space if it was held for pan (only toggle play on quick press).
- Implementation: track `spaceHeld` state. On keydown: if not already held, start pan. On keyup: if was held for > 200ms, restore tool (don't toggle play). If quick press (< 200ms), toggle play.

### 2.3 Snap to Previous Line Endpoint

**We have:** Freehand drawing starts wherever you click.
**They have:** Line snapping.

**What to build:**

- When starting a new line (line tool or pencil), if the cursor is within 10px (screen) of an existing segment endpoint, snap to that endpoint.
- Visual feedback: highlight the snap target with a small circle.
- This enables clean connections between lines without gaps.
- Only snap to endpoints, not midpoints (keeps it simple).

---

## 3. Differentiators

Things we can do that Line Rider doesn't, or ways to be meaningfully better.

### 3.1 Shareable Track URLs

**They have:** Share via hosted .track.json files with `?track=` URL param. Requires external hosting.
**We can do better:**

- Every saved cloud track gets a shareable URL: `ride.me/t/{trackId}`.
- Visiting the URL loads the track in read-only playback mode. Viewer can press Play to watch.
- "Fork" button: copies the track to the viewer's account for editing (requires auth).
- Share button on the toolbar generates and copies the URL.
- No Firestore rules change needed for public read — add a `public` flag to track documents and a top-level `/tracks/{trackId}` collection with public read access.

### 3.2 Track Gallery / Browse

**They have:** Nothing built-in. Community uses forums.
**We can do:**

- `/browse` page showing recently published public tracks.
- Grid of track cards with: name, author, line count, preview thumbnail (if available), play count.
- Click a card to open the track in play mode.
- Simple Firestore query: `tracks` collection, ordered by `createdAt desc`, paginated.
- No complex recommendation or search — just recent public tracks.

### 3.3 Onboarding / Example Track

**They have:** Blank canvas, no guidance.
**We can do:**

- For first-time visitors (no saved state), load a simple pre-built demo track that showcases the three line types.
- Small banner: "This is a demo track. Press Play to watch, or Clear to start fresh."
- The demo track should be 10-15 lines: a small hill, an acceleration boost, and some scenery decoration. Simple enough to understand the mechanics in 5 seconds.

---

## 4. Not Doing

Things Line Rider has that we're intentionally skipping.

| Feature | Why we're skipping it |
|---------|----------------------|
| **Select / move / scale / rotate tool** | Complex to build well (box selection, transform handles, copy/paste buffer). Adds significant code. Ship without it — users can erase and redraw. Revisit later if users request it. |
| **Per-frame camera state** | Only useful for cinematic animation — a power-user feature. Our camera follow already handles normal use cases. |
| **Transparent frame overlay** | Animation-specific feature for syncing line art to frames. Not relevant for most users. |
| **Key rebinding** | Nice-to-have but not competitive. Our defaults match Line Rider conventions. |
| **Multi-rider support** | Line Rider 2 feature, not in the web version. Not table stakes. |
| **Video/GIF export** | Desirable but complex (Canvas recording API, encoding). Defer to a future iteration. |
| **Desktop app / offline** | We're web-first. PWA could come later. |
| **Slow-motion toggle (M key)** | Our speed control already covers 0.25× which is slow-mo. No need for a separate toggle. |
| **Track file format compatibility (.trk)** | Our JSON format is simpler and web-native. No need to support legacy formats. |

---

## Implementation Priority

The spec items above should be implemented in this order:

1. **Table stakes first** (1.1–1.6): These close the gap with Line Rider's core editor.
2. **Improvements** (2.1–2.3): These polish the experience above Line Rider's level.
3. **Differentiators** (3.1–3.3): These give users a reason to choose us over Line Rider.

Within table stakes, the order is:
1. 1.4 Redo (small change, big usability win)
2. 1.1 Straight Line Tool (core drawing capability)
3. 1.2 Resume from Pause (core playback fix)
4. 1.3 Flag / Marker System (depends on 1.2)
5. 1.6 Tab Overview (small, self-contained)
6. 1.5 Save & Load (largest feature, most files touched)
