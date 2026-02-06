# Competitor Analysis: Line Rider (linerider.com)

## 1. Core Value Prop

Line Rider is a physics sandbox where you draw lines and watch a sled-riding character (Bosh) ride them. It's a creative toy, not a traditional game — there's no score, no win condition, and no levels. The core loop is: **draw → play → watch → iterate**. The satisfaction comes from seeing your track work (or fail spectacularly).

**Who it's for:** Casual creative players (quick doodles), dedicated track artists (complex multi-minute rides synced to music), and the nostalgia crowd who remember the 2006 Flash original.

**Why people use it:** It's immediately understandable (draw a line, watch physics happen), infinitely replayable (every track is different), and deeply creative at the high end (community artists create stunning choreographed rides).

## 2. Feature Breakdown

### Drawing Tools
| Tool | What it does | How it works |
|------|-------------|--------------|
| **Pencil (Q)** | Freehand drawing | Click-drag to draw smooth curves. Creates many small segments. |
| **Line Tool (W)** | Straight lines | Click start point, click end point. Precise, clean geometry. |
| **Eraser (E)** | Remove lines | Click-drag over lines to delete them. |
| **Select Tool** | Move/scale/rotate lines | Draw box to select, then drag to move, drag corners to scale, right-click corners to rotate. Ctrl+X/C/V for cut/copy/paste. |
| **Hand/Move Tool (T)** | Pan the canvas | Click-drag to pan. Space held temporarily activates this from any tool. |

### Line Types
| Type | Key | Color | Physics |
|------|-----|-------|---------|
| **Normal** | 1 | Blue | Standard friction, rider rides on it |
| **Acceleration** | 2 | Red | Boosts rider speed on contact. Configurable multiplier (up to 255x in Advanced). |
| **Scenery** | 3 | Green | No collision. Decorative only. |

### Playback & Timeline
- **Play/Stop (Y/U):** Play resumes from current position (does NOT restart from beginning)
- **Flag (I):** Marks a frame position on the timeline. Can be dragged. Pressing F jumps to the flag.
- **Slow motion (M):** Toggle slow-mo playback
- **Timeline scrubbing:** Frame-by-frame stepping through the simulation
- **Home key:** Jump to beginning of track
- **End key:** Jump to last drawn line position
- **Tab:** Quick overview — zooms out to show full track, then zooms back

### Camera
- **Zoom in/out (Z/X during play, scroll wheel while editing)**
- **Predictive/Soft Camera modes:** Camera smoothly anticipates rider movement
- **Per-frame camera state:** Zoom and position stored per frame for cinematic rides
- **Camera follow:** Follows the rider during playback

### Save & Share
- **Local save:** Tracks saved to browser storage / local files
- **File formats:** .track.json (web compatible), .trk (desktop)
- **URL sharing:** Tracks can be loaded via `?track=` URL parameter pointing to a hosted .track.json file
- **No built-in gallery/community:** Sharing requires external hosting (Dropbox links, forum posts)

### Navigation Shortcuts
- **D:** Drag rider start position
- **Backspace:** Delete last drawn line (quick undo)
- **Space:** Temporary hand tool (hold)
- **Tab:** Full track overview zoom

### Advanced Features (Line Rider Advanced / Desktop)
- Transparent frame overlay for animation (previous frame ghost)
- Key rebinding for all controls
- Red line multiplier and acceleration inversion
- ffmpeg integration for video export
- Autoload last track

## 3. UX Strengths (What They Get Right)

1. **Immediate gratification:** Draw one line, press play, watch physics happen. Zero learning curve for the basic experience.

2. **Tool switching is fast:** Single-key shortcuts (Q/W/E/R/T) for all tools. Space for temporary hand tool. No menus needed for core workflow.

3. **Flag system is powerful:** The ability to set a flag at any point in the timeline and instantly jump back to it makes iterating on a specific section of track effortless. This is the core editing workflow for serious creators.

4. **Line tool + Pencil tool distinction:** Having both freehand (organic shapes) and straight-line (precise geometry) tools covers the full creative range. Most users work primarily with the line tool for control.

5. **Resume from pause:** Play doesn't restart — it continues from wherever you stopped. Combined with the flag, this means you can test a specific section without rewatching the whole track.

6. **Minimal UI:** The interface stays out of the way. The canvas is the experience.

7. **Select tool for editing:** Being able to select, move, scale, and rotate groups of lines after drawing them is essential for non-trivial tracks. Copy/paste enables pattern reuse.

## 4. UX Weaknesses (What They Get Wrong)

1. **No built-in sharing/gallery:** Tracks can only be shared via external file hosting. There's no "publish" button, no community browse, no way to discover tracks without going to forums. This is the biggest gap.

2. **No accounts or cloud save in web version:** Your tracks are local-only. Switch browsers or clear data and they're gone. No cross-device sync.

3. **Outdated UI design:** The web version looks dated. No modern design language, no responsive mobile experience, no dark mode.

4. **No straight-line tool in some versions:** Some web clones only have freehand pencil, making precise geometry frustrating.

5. **No touch/mobile optimization:** Despite having mobile apps, the web version is desktop-first. Drawing with touch is awkward.

6. **Limited undo:** Only single-step undo in some versions. No undo history visualization.

7. **No video/GIF export in web version:** Desktop Advanced has ffmpeg, but the web version has no built-in way to export a recording of your ride.

8. **Discovoverability:** New users don't know what's possible. No onboarding, no examples, no tutorial tracks.

## 5. Table Stakes (Must-Have to Compete)

Any Line Rider competitor must have:

1. **Three line types** (normal, acceleration, scenery) with keyboard shortcuts
2. **Freehand drawing tool** (pencil) for organic shapes
3. **Straight line tool** for precise geometry
4. **Eraser tool**
5. **Pan and zoom** (scroll wheel zoom, right-click/middle-click pan)
6. **Play/pause** with physics simulation
7. **Flag/marker system** to set and jump to a position in the timeline
8. **Resume from pause** (play continues, doesn't restart)
9. **Undo/redo** with reasonable depth
10. **Rider start position** that can be moved
11. **Keyboard shortcuts** for all core tools and actions
12. **Save and load tracks** (at minimum to local storage / file download)
13. **Camera follow** during playback
14. **Zoom controls** both during editing and playback

## 6. Differentiators (Where We Can Win)

1. **Cloud save with accounts:** linerider.com has no accounts. We already have Firebase auth. Cloud-saving tracks means never losing work and accessing from any device.

2. **Built-in sharing:** Generate shareable URLs for tracks. No Dropbox links needed. One click to share.

3. **Community gallery:** Browse and play tracks made by other users. linerider.com has nothing like this — the community relies on forums and YouTube. A built-in gallery would be a first for a web-based Line Rider.

4. **Modern, polished UI:** linerider.com looks like 2010. We can offer a clean, modern interface that feels premium.

5. **Responsive/touch support:** Good mobile drawing experience would reach an audience linerider.com doesn't serve well on the web.

6. **Video/GIF export from browser:** Let users record and download their rides without external tools.

7. **Track forking:** See a track you like? Fork it and modify it. Git-for-tracks.

8. **Onboarding experience:** Tutorial track, example tracks, or guided first-use. linerider.com drops you on a blank canvas with no guidance.
