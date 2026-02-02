# Code Quality Improvement Plan

A comprehensive, prioritized execution plan for improving code quality in the Ride.me codebase.

---

## 1. Bugs & Race Conditions

### CRITICAL

#### 1.1 Firestore Rules Operator Precedence Bug
**File:** `firestore.rules:27`
```
data.email == null || data.email is string &&
```
**Problem:** Due to operator precedence, this evaluates as `(email == null) || (email is string && displayName...)` instead of `(email == null || email is string) && displayName...`. This could allow malformed documents.

**Fix:** Add explicit parentheses:
```
(data.email == null || data.email is string) &&
```

---

### HIGH

#### 1.2 No Input Validation for `setPlaybackSpeed`
**File:** `src/stores/linerider-store.ts:374-375`
```typescript
setPlaybackSpeed: (speed) =>
  set((s) => ({ settings: { ...s.settings, playbackSpeed: speed } })),
```
**Problem:** Accepts any value including NaN, Infinity, negative numbers. Could break physics simulation.

**Fix:** Validate against allowed values:
```typescript
setPlaybackSpeed: (speed) => {
  if (!SPEEDS.includes(speed as any)) return;
  set((s) => ({ settings: { ...s.settings, playbackSpeed: speed } }));
}
```

#### 1.3 `window.prompt()` for Email Recovery - Poor UX
**File:** `src/lib/firebase/auth.ts:97`
```typescript
email = window.prompt("Please provide your email for confirmation");
```
**Problems:**
- Looks like a phishing attack
- No validation of input
- User clicking Cancel returns empty string, not null (line 100 check passes incorrectly)
- Blocks the UI thread

**Fix:** Store a flag in auth-store to show a modal asking for email instead.

#### 1.4 Keyboard Shortcuts Ignore `contenteditable` Elements
**File:** `src/components/linerider/linerider-app.tsx:53-59`
```typescript
if (
  e.target instanceof HTMLInputElement ||
  e.target instanceof HTMLTextAreaElement ||
  e.target instanceof HTMLSelectElement
) {
  return;
}
```
**Problem:** Misses `contenteditable="true"` elements and custom form controls.

**Fix:** Add check:
```typescript
if (
  e.target instanceof HTMLInputElement ||
  e.target instanceof HTMLTextAreaElement ||
  e.target instanceof HTMLSelectElement ||
  (e.target instanceof HTMLElement && e.target.isContentEditable)
) {
  return;
}
```

#### 1.5 Unsafe Type Assertion for Firestore Data
**File:** `src/lib/firebase/users.ts:59`
```typescript
const profile = docSnap.data() as UserProfile;
```
**Problem:** No runtime validation. Missing or malformed fields could cause runtime errors.

**Fix:** Add validation function:
```typescript
function isValidUserProfile(data: unknown): data is UserProfile {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return typeof d.uid === 'string' &&
         (d.email === null || typeof d.email === 'string') &&
         CHARACTER_TYPES.includes(d.character as CharacterType);
}
```

---

### MEDIUM

#### 1.6 Auth Store Double-Initialization Race Condition
**File:** `src/stores/auth-store.ts:63-65`
```typescript
const s = get();
if (s.hasInitialized) return;
```
**Problem:** Synchronous check. If `init()` called twice rapidly before first completes, both could pass the check.

**Fix:** Set `hasInitialized: true` immediately before async work:
```typescript
init: () => {
  if (get().hasInitialized) return;
  set({ hasInitialized: true }); // Set immediately
  // ... rest of init
}
```

#### 1.7 Animation Frame Cleanup Race Condition
**File:** `src/components/linerider/linerider-canvas.tsx:80-82`
```typescript
function renderLoop(nowMs: number) {
  rafRef.current = null;
  if (!mounted) return;
```
**Problem:** `rafRef.current` is nullified before the mounted check. If `mounted` becomes false during execution after line 81 but before the function returns, the cleanup won't find a RAF to cancel.

**Fix:** Move the null assignment after the mounted check:
```typescript
function renderLoop(nowMs: number) {
  if (!mounted) {
    rafRef.current = null;
    return;
  }
  rafRef.current = null;
```

#### 1.8 Character Selector Canvas Context Failure Silent
**File:** `src/components/auth/character-selector.tsx:36-37`
```typescript
const ctx = canvas.getContext("2d");
if (!ctx) return;
```
**Problem:** If canvas context fails to create, user sees blank preview with no indication of error.

**Fix:** Add fallback UI or error state.

---

## 2. Design & UI Consistency

### HIGH

#### 2.1 Dark Mode Not Applied to Modals
**Files:**
- `src/app/globals.css:37-42` (dark mode variables defined)
- `src/components/auth/auth-modal.tsx`
- `src/components/auth/profile-modal.tsx`

**Problem:** Modals use hardcoded colors (`bg-white`, `text-gray-900`) that don't respond to dark mode.

**Fix:** Use CSS variables or Tailwind dark: variants:
```typescript
className="... bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
```

#### 2.2 Inconsistent Color Naming
**Files:**
- `src/components/linerider/linerider-controls.tsx` uses `slate-*`
- `src/components/auth/*.tsx` uses `gray-*`

**Problem:** Two different gray scales used inconsistently.

**Fix:** Standardize on one (`slate-*` is more modern) across all components.

---

### MEDIUM

#### 2.3 Toolbar Help Text Shows Incomplete Keyboard Shortcuts
**File:** `src/components/linerider/linerider-controls.tsx:443-448`
```html
<kbd>D</kbd> <kbd>H</kbd> <kbd>E</kbd> → tools
```
**File:** `src/components/linerider/linerider-app.tsx:81`
```typescript
if (key === "h" || key === "p") setTool("pan");
```
**Problem:** Help shows "H" for pan, but "P" also works. Help doesn't mention all shortcuts (G, F, C, R, Home, 0).

**Fix:** Update help panel to show all shortcuts accurately.

#### 2.4 No Responsive Breakpoint Configuration
**Problem:** Uses Tailwind's `lg:` breakpoints but no custom breakpoint configuration. Mobile toolbar could use better breakpoints for tablets.

**Fix:** Consider adding custom breakpoints in Tailwind config for medium tablets.

---

### LOW

#### 2.5 404 Page Has No Navigation
**File:** `src/app/not-found.tsx`

**Problem:** User is stuck on 404 page with no way to navigate back.

**Fix:** Add a "Go Home" link:
```tsx
<a href="/" className="mt-4 text-blue-600 hover:underline">
  ← Go back home
</a>
```

---

## 3. Core Pages Audit

### STATUS

| Page | Exists | Notes |
|------|--------|-------|
| Home (`/`) | ✅ | Renders game directly - no landing page |
| About | ❌ | **Missing** |
| Privacy Policy | ❌ | **Missing** - Required for Firebase Auth |
| Terms of Service | ❌ | **Missing** - Required for Firebase Auth |
| 404 | ✅ | Minimal, needs navigation link |

### REQUIRED ACTIONS

#### 3.1 Add Privacy Policy Page
**Priority:** HIGH (legal requirement for apps collecting user data)
**Path:** `src/app/privacy/page.tsx`

#### 3.2 Add Terms of Service Page
**Priority:** HIGH (legal requirement)
**Path:** `src/app/terms/page.tsx`

#### 3.3 Add About Page (Optional)
**Priority:** LOW
**Path:** `src/app/about/page.tsx`

#### 3.4 Consider Landing Page
**Priority:** LOW
**Current:** Home page immediately shows the game with no explanation.
**Consider:** A simple hero section explaining what Ride.me is, with a "Start Drawing" button.

---

## 4. Simplification Opportunities

### Dead Code to Remove

#### 4.1 Unused `createRider()` Function
**File:** `src/lib/linerider/physics.ts:78-130`
```typescript
export function createRider(startPos: Vec2): RiderState {
```
**Status:** Exported but never imported. Only `createSimpleRider()` is used.
**Action:** Delete function.

#### 4.2 Unused `drawSimpleRider()` and `drawBoshRider()` Functions
**File:** `src/lib/linerider/renderer.ts:264-406`
```typescript
export function drawSimpleRider(...) { ... }
export function drawBoshRider(...) { ... }
```
**Status:** Characters now use specialized functions in `characters.ts`. These are abandoned code paths.
**Action:** Delete both functions.

#### 4.3 Redundant `vecSub` Alias
**File:** `src/lib/linerider/physics.ts:151`
```typescript
const vecSub = sub;
```
**Problem:** Created to avoid "conflict" with loop variable `sub` in line 175, but the loop variable is actually named `sub` (not conflicting).
**Action:** Remove alias, use `sub` directly. Actually the conflict is real - line 175 uses `sub` as loop counter. Rename the loop variable to `substep` instead.

---

### Over-Engineered Patterns

#### 4.4 Duplicate `onCloseRef` Pattern
**Files:**
- `src/components/auth/auth-modal.tsx:27-30`
- `src/components/auth/profile-modal.tsx:31-34`
- `src/hooks/use-modal-a11y.ts:31-34`

**Problem:** Same pattern repeated 3 times:
```typescript
const onCloseRef = useRef(onClose);
useEffect(() => {
  onCloseRef.current = onClose;
}, [onClose]);
```

**Fix:** Extract to a utility hook:
```typescript
// src/hooks/use-stable-callback.ts
export function useStableCallback<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useRef(fn);
  useEffect(() => { ref.current = fn; }, [fn]);
  return useCallback((...args) => ref.current(...args), []) as T;
}
```
Then remove the pattern from all three files.

#### 4.5 Excessive Refs in Canvas Component
**File:** `src/components/linerider/linerider-canvas.tsx:32-48`
**Count:** 9 refs for interaction state

**Assessment:** Most are necessary for performance (avoiding re-renders during pointer drag). The `segmentPaths*` refs could potentially move to the store, but the current approach is valid for performance. **No change needed.**

---

### Unused Dependencies

**File:** `package.json`

Run `npx depcheck` to identify unused dependencies. Current inspection shows all deps are used:
- `firebase` ✅
- `lucide-react` ✅
- `next` ✅
- `react` / `react-dom` ✅
- `zustand` ✅

**No unused dependencies found.**

---

## 5. Structure & Organization

### Naming Inconsistencies

#### 5.1 File Naming is Consistent ✅
All files use `kebab-case.tsx` - good.

#### 5.2 Loop Variable Conflicts with Import
**File:** `src/lib/linerider/physics.ts:175`
```typescript
for (let sub = 0; sub < PHYSICS.SUBSTEPS; sub++) {
```
**Problem:** `sub` shadows the imported `sub` function from `./math`.
**Fix:** Rename to `substep`:
```typescript
for (let substep = 0; substep < PHYSICS.SUBSTEPS; substep++) {
```

#### 5.3 Inconsistent Type Export Pattern
**Files:**
- `src/stores/linerider-store.ts:22` re-exports types from lib
- `src/lib/linerider/index.ts` doesn't exist (no barrel export for linerider lib)

**Fix:** Add barrel export for linerider lib:
```typescript
// src/lib/linerider/index.ts
export * from './math';
export * from './physics';
export * from './renderer';
export * from './characters';
export * from './spatial-hash';
export * from './transform';
export * from './types';
```

---

### Module Responsibilities

#### 5.4 `renderer.ts` Contains Unused Code
**File:** `src/lib/linerider/renderer.ts`

**Current Contents:**
- Grid drawing ✅ (used)
- Segment drawing ✅ (used)
- HUD drawing ✅ (used)
- Start flag drawing ✅ (used)
- `drawSimpleRider` ❌ (unused - superseded by characters.ts)
- `drawBoshRider` ❌ (unused - superseded by characters.ts)

**Fix:** Remove dead rider drawing functions (see 4.2).

#### 5.5 Physics Constants Scattered
**Files:**
- `src/lib/linerider/physics.ts` - `PHYSICS` object
- `src/stores/linerider-store.ts:126` - `SPATIAL_CELL_SIZE`
- `src/components/linerider/linerider-canvas.tsx:20` - `PHYSICS_DT`
- `src/components/linerider/linerider-controls.tsx:33` - `SPEEDS`
- `src/components/linerider/linerider-controls.tsx:141-142` - `MIN_ZOOM`, `MAX_ZOOM`

**Fix:** Consolidate into one constants file:
```typescript
// src/lib/linerider/constants.ts
export const PHYSICS = { ... };
export const PHYSICS_DT = 1 / 60;
export const SPATIAL_CELL_SIZE = 200;
export const SPEEDS = [0.25, 0.5, 1, 2, 4] as const;
export const ZOOM = { MIN: 0.2, MAX: 5, DEFAULT: 1.5 } as const;
```

---

## Execution Priority Order

### Phase 1: Critical Fixes (Do First)
1. ✓ Fix Firestore rules precedence bug (1.1)
2. ✓ Add playback speed validation (1.2)
3. ✓ Fix keyboard shortcut contenteditable check (1.4)

### Phase 2: High Priority
4. Replace `window.prompt()` with modal (1.3)
5. Add Firestore data validation (1.5)
6. Fix auth store race condition (1.6)
7. Add Privacy Policy page (3.1)
8. Add Terms of Service page (3.2)
9. Standardize color naming (2.2)

### Phase 3: Code Cleanup
10. Remove dead code: `createRider()`, `drawSimpleRider()`, `drawBoshRider()` (4.1, 4.2)
11. Extract `useStableCallback` hook (4.4)
12. Rename `sub` loop variable to `substep` (4.3, 5.2)
13. Create constants file (5.5)
14. Add barrel export for linerider lib (5.3)

### Phase 4: Polish
15. Add dark mode support to modals (2.1)
16. Update help panel with all shortcuts (2.3)
17. Add navigation to 404 page (2.5)
18. Fix animation frame race condition (1.7)
19. Add character selector error state (1.8)

---

## Summary Statistics

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Bugs & Race Conditions | 1 | 4 | 3 | 0 |
| Design & UI | 0 | 2 | 2 | 1 |
| Core Pages | 0 | 2 | 0 | 2 |
| Simplification | 0 | 0 | 4 | 1 |
| Structure | 0 | 0 | 3 | 0 |
| **Total** | **1** | **8** | **12** | **4** |

---

## Guiding Principle Applied

> *"Prefer the simplest solution that works. The goal is a codebase clean enough to be a textbook example in a Stanford CS class—clear, obvious, and boring in the best way."*

Each recommendation follows this principle:
- No new abstractions unless they reduce duplication in 3+ places
- No framework additions - use what's already there
- Delete before refactor
- Validate at boundaries, trust internals
- Clear names over clever code
