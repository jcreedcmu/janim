# Plan: Animation DSL for janim

## Context

The current approach defines animations as raw `AnimationFn = (ctx, t) => void` with manual time-slicing and positioning. We want a functional DSL with inductive data types and combinators that compile down to `AnimationFn`.

## Core Types

### Temporal

```typescript
// Knows its own duration. t is in [0, duration].
interface Clip {
  duration: number;
  draw: (ctx: CanvasRenderingContext2D, t: number) => void | Promise<void>;
}

// No intrinsic duration. progress is in [0, 1].
// overflow says what happens when given more time than the transition needs.
type Overflow = 'hold' | 'loop' | 'bounce' | 'hide';
interface Elastic {
  draw: (ctx: CanvasRenderingContext2D, progress: number) => void | Promise<void>;
  overflow?: Overflow; // default: 'hold'
}
```

### Spatial

```typescript
interface Size { width: number; height: number; }

// Something with a bounding box that draws itself at the origin.
interface Visual {
  size: Size;
  draw: (ctx: CanvasRenderingContext2D) => void | Promise<void>;
}
```

## Combinators

### Temporal

```typescript
seq(...clips: Clip[]): Clip           // concatenate; duration = sum
par(...clips: Clip[]): Clip           // overlay; duration = max
withDuration(e: Elastic, d: number): Clip
withEasing(e: Elastic, fn: (t: number) => number): Elastic
```

### Spatial leaves

```typescript
texVisual(renderer: TexRenderer, expr: string, scale?: number): Visual
rect(w: number, h: number, style: {...}): Visual
circle(radius: number, style: {...}): Visual
custom(size: Size, drawFn: (ctx) => void): Visual
```

### Spatial layout

```typescript
hstack(gap: number, ...items: Visual[]): Visual   // horizontal row
vstack(gap: number, ...items: Visual[]): Visual   // vertical column
place(frame: Size, visual: Visual, anchor: Anchor): Visual  // position within frame
// Anchor = 'center' | 'top-left' | 'top' | 'bottom-right' | etc.
```

### Bridging spatial → temporal

```typescript
still(visual: Visual, duration: number): Clip     // static visual for a duration
fadeIn(visual: Visual): Elastic                    // progress controls opacity
slideIn(visual: Visual, from: {dx, dy}): Elastic  // progress controls position
transition(drawFn: (ctx, progress) => void|Promise<void>): Elastic  // escape hatch
```

### Compile

```typescript
function compile(clip: Clip): { animFn: AnimationFn; duration: number };
```

## File Changes

- **New: `src/dsl.ts`** — all types and combinators above
- **`src/janim.ts`** — unchanged; re-export DSL for convenience
- **`src/example.ts`** — rewrite using DSL

## Example rewrite sketch

```typescript
const emc2 = texVisual(tex, 'E = mc^2', 3);
const integral = texVisual(tex, '\\int_0^\\infty ...', 2.5);
const frame = { width: 1920, height: 1080 };

const animation = seq(
  withDuration(withEasing(fadeIn(place(frame, emc2, 'center')), easeInOut), 1),
  still(place(frame, emc2, 'center'), 0.5),  // hold
  // bezier phase as a custom clip...
  withDuration(withEasing(slideIn(
    place(frame, integral, 'center'),
    { dx: 1000, dy: 0 }
  ), easeInOut), 1.5),
);
const { animFn, duration } = compile(animation);
```

## Implementation order

1. Create `src/dsl.ts` with `Clip`, `Elastic`, `Visual`, `Size` types
2. Temporal combinators: `seq`, `par`, `withDuration`, `withEasing`
3. Spatial leaves: `texVisual`, `rect`, `circle`, `custom`
4. Layout: `hstack`, `vstack`, `place`
5. Bridges: `still`, `fadeIn`, `slideIn`, `transition`
6. `compile`
7. Rewrite `src/example.ts`
8. Re-export from `src/janim.ts`

## Verification

- `npm run dev` — browser preview works
- `./render.sh` — mp4 renders correctly
