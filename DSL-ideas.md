# Animation DSL Ideas

## Key Insight (from practice)

The pace of animation is driven by the audio recording. Every piece of the
animation knows what time interval it will be extrinsically expected to fill.
This eliminates the need for an Elastic/Clip distinction — there's no such
thing as an animation element with "intrinsic" duration. Time windows come
from the audio edit.

## Revised Temporal Model

Previously we considered two types:
- **Clip**: knows its duration
- **Elastic**: duration-free, gets assigned one

In practice, everything gets an externally-assigned time window. So the core
temporal type is just:

```typescript
// A Cue is a time-windowed drawing action.
interface Cue {
  start: number;  // seconds
  end: number;
  draw: (ctx: CanvasRenderingContext2D, t: number) => void | Promise<void>;
  // t is global time, not local — the cue decides how to use its window
}
```

An animation is a list of cues. No need for `seq` — the sequencing comes
from the audio timeline. `par` is just overlapping time windows.

Temporal combinators that are still useful:
- **easing within a window**: map global t to a [0,1] progress with easing
- **sub-cues**: break a window into sub-phases (e.g., fade in during first 0.15s)

## Spatial Model (unchanged)

Spatial layout is orthogonal to timing and still valuable:

```typescript
interface Size { width: number; height: number; }

interface Visual {
  size: Size;
  draw: (ctx: CanvasRenderingContext2D) => void | Promise<void>;
  // draws at origin (0,0); caller translates
}
```

### Leaves
```typescript
texVisual(renderer: TexRenderer, expr: string, scale?: number): Visual
rect(w: number, h: number, style: {...}): Visual
circle(radius: number, style: {...}): Visual
custom(size: Size, drawFn: (ctx) => void): Visual
```

### Layout combinators
```typescript
hstack(gap: number, ...items: Visual[]): Visual   // horizontal row
vstack(gap: number, ...items: Visual[]): Visual   // vertical column
place(frame: Size, visual: Visual, anchor: Anchor): Visual
// Anchor = 'center' | 'top-left' | etc.
```

## Bridging Spatial → Temporal

A Visual becomes a Cue by assigning it a time window and an effect:

```typescript
// Static visual, visible for the whole window
still(visual: Visual, start: number, end: number): Cue

// Fade in at start of window, hold
fadeIn(visual: Visual, start: number, end: number, fadeDuration?: number): Cue

// Slide from offset, hold
slideIn(visual: Visual, start: number, end: number, from: {dx, dy}): Cue
```

## Compile

```typescript
function compile(cues: Cue[], config: AnimationConfig): AnimationFn;
// Iterates cues, calls draw for each active cue at time t.
```

## Open questions

- Should cues be layered (z-order)? Currently just array order.
- How to handle "accumulating" visuals (e.g., ring symbols appearing one by
  one but all staying visible)? Probably just overlapping cues with
  staggered starts and a shared end time.
- CC/subtitle cues could be a special case or just regular cues that draw
  text at the bottom.
