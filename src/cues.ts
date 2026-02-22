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
  { id: 'hom-mappings', defaultTime: 19.5, label: 'Mappings' },
  { id: 'scene-param', defaultTime: 30, label: 'Param2D' },
  { id: 'param-plotStart', defaultTime: 30.5, label: 'Plot2D' },
  { id: 'scene-param3d', defaultTime: 40, label: 'Param3D' },
  { id: 'param3d-plotStart', defaultTime: 40.5, label: 'Plot3D' },
  { id: 'scene-duality', defaultTime: 50, label: 'Duality' },
  { id: 'duality-row2', defaultTime: 55, label: 'Row2' },
  { id: 'duality-row3', defaultTime: 58, label: 'Row3' },
  { id: 'duality-row4', defaultTime: 61, label: 'Row4' },
  { id: 'duality-row5', defaultTime: 63, label: 'Row5' },
  { id: 'duality-uniformize', defaultTime: 64, label: 'Uniform' },
  { id: 'duality-fadeOut', defaultTime: 67, label: 'Closing' },
  { id: 'anim-end', defaultTime: 70, label: 'END' },
];

const STORAGE_KEY = 'janim-cues';

const defaults = new Map<string, number>(CUE_DEFS.map(c => [c.id, c.defaultTime]));
const overrides = new Map<string, number>();

// Load from localStorage on module init
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const obj = JSON.parse(stored) as Record<string, number>;
    for (const [k, v] of Object.entries(obj)) {
      if (defaults.has(k) && typeof v === 'number') {
        overrides.set(k, v);
      }
    }
  }
} catch { /* ignore */ }

function save(): void {
  const obj: Record<string, number> = {};
  for (const [k, v] of overrides) obj[k] = v;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

export function getCue(id: string): number {
  return overrides.get(id) ?? defaults.get(id) ?? 0;
}

export function setCue(id: string, time: number): void {
  overrides.set(id, time);
  save();
}
