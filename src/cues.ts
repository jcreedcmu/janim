export type CueDef = { id: string; defaultTime: number; label: string };

export const CUE_DEFS: CueDef[] = [
  { id: 'anim-begin', defaultTime: 0, label: 'BEGIN' },
  { id: 'scene-title', defaultTime: 0, label: 'Title' },
  { id: 'scene-rings', defaultTime: 3, label: 'Rings' },
  { id: 'rings-labels', defaultTime: 3.5, label: 'Labels' },
  { id: 'rings-polys', defaultTime: 6, label: 'Polys' },
  { id: 'scene-hom', defaultTime: 10, label: 'Hom' },
  { id: 'hom-typeSig', defaultTime: 10.5, label: 'TypeSig' },
  { id: 'hom-constants', defaultTime: 17, label: 'Constants' },
  { id: 'hom-ringOps', defaultTime: 18, label: 'RingOps' },
  { id: 'hom-mappings', defaultTime: 19.5, label: 'Mappings' },
  { id: 'scene-param', defaultTime: 30, label: 'Param2D' },
  { id: 'scene-param3d', defaultTime: 40, label: 'Param3D' },
  { id: 'param3d-plotStart', defaultTime: 40.5, label: 'Plot3D' },
  { id: 'scene-duality', defaultTime: 50, label: 'Duality' },
  { id: 'duality-row2', defaultTime: 55, label: 'Row2' },
  { id: 'duality-row3', defaultTime: 58, label: 'Row3' },
  { id: 'duality-row4', defaultTime: 61, label: 'Row4' },
  { id: 'duality-uniformize', defaultTime: 63, label: 'Uniform' },
  { id: 'duality-row5', defaultTime: 64, label: 'Row5' },
  { id: 'duality-fadeOut', defaultTime: 67, label: 'Closing' },
  { id: 'anim-end', defaultTime: 70, label: 'END' },
];

const STORAGE_KEY = 'janim-cues';

const defaults = new Map<string, number>(CUE_DEFS.map(c => [c.id, c.defaultTime]));
const overrides = new Map<string, number>();

function loadOverrides(obj: Record<string, number>): void {
  for (const [k, v] of Object.entries(obj)) {
    if (defaults.has(k) && typeof v === 'number') {
      overrides.set(k, v);
    }
  }
}

// Load from cues.json (works in both Node and browser)
try {
  // Use a dynamic import with a variable to prevent Vite from bundling it
  const jsonPath = '../cues.json';
  const mod = await import(/* @vite-ignore */ jsonPath);
  loadOverrides(mod.default ?? mod);
} catch { /* ignore — file may not exist */ }

// In browser, localStorage takes priority over cues.json
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) loadOverrides(JSON.parse(stored));
} catch { /* ignore — not in browser */ }

function save(): void {
  const obj: Record<string, number> = {};
  for (const [k, v] of overrides) obj[k] = v;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(obj)); } catch { /* ignore */ }
}

export function getCue(id: string): number {
  return overrides.get(id) ?? defaults.get(id) ?? 0;
}

export function setCue(id: string, time: number): void {
  overrides.set(id, time);
  save();
}
