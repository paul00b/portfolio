import { rng } from "./lowpoly";
import { edgeRadius, isFree, meadows } from "./layout";

export type TreeKind = "pine" | "round" | "blossom" | "tall";
export interface TreeSpot {
  x: number;
  z: number;
  scale: number;
  kind: TreeKind;
  v: number;
  rot: number;
}
export interface Spot {
  x: number;
  z: number;
  scale: number;
  v: number;
  rot: number;
}

function polar(r: () => number, minR: number, maxR: number) {
  const a = r() * Math.PI * 2;
  const d = minR + Math.sqrt(r()) * (maxR - minR);
  return [Math.cos(a) * d, Math.sin(a) * d] as const;
}

export const trees: TreeSpot[] = (() => {
  const r = rng(11);
  const out: TreeSpot[] = [];
  for (let i = 0; i < 260 && out.length < 58; i++) {
    const [x, z] = polar(r, 4.5, 20);
    if (!isFree(x, z, 0.55)) continue;
    if (out.some((t) => Math.hypot(t.x - x, t.z - z) < 1.55)) continue;
    const edge = Math.hypot(x, z) / edgeRadius(Math.atan2(z, x));
    const roll = r();
    const kind: TreeKind = roll < 0.4 ? "pine" : roll < 0.78 ? "round" : roll < 0.9 ? "tall" : "blossom";
    out.push({ x, z, kind, scale: 0.75 + r() * 0.5 + (edge > 0.85 ? 0.15 : 0), v: Math.floor(r() * 4), rot: r() * Math.PI * 2 });
  }
  return out;
})();

export const treeColliders = trees.map((t) => ({ x: t.x, z: t.z, r: 0.22 * t.scale }));

export const rocks: Spot[] = (() => {
  const r = rng(23);
  const out: Spot[] = [];
  for (let i = 0; i < 120 && out.length < 22; i++) {
    const [x, z] = polar(r, 4.5, 20);
    if (!isFree(x, z, 0.1)) continue;
    if (trees.some((t) => Math.hypot(t.x - x, t.z - z) < 1)) continue;
    out.push({ x, z, scale: 0.5 + r() * 0.8, v: Math.floor(r() * 3), rot: r() * Math.PI * 2 });
  }
  return out;
})();

export const bushes: Spot[] = (() => {
  const r = rng(31);
  const out: Spot[] = [];
  for (let i = 0; i < 160 && out.length < 30; i++) {
    const [x, z] = polar(r, 4.2, 20);
    if (!isFree(x, z, 0.05)) continue;
    if (trees.some((t) => Math.hypot(t.x - x, t.z - z) < 0.9)) continue;
    if (out.some((b) => Math.hypot(b.x - x, b.z - z) < 1)) continue;
    out.push({ x, z, scale: 0.7 + r() * 0.55, v: Math.floor(r() * 4), rot: r() * Math.PI * 2 });
  }
  return out;
})();

export const mushrooms: Spot[] = (() => {
  const r = rng(41);
  const out: Spot[] = [];
  for (const t of trees) {
    if (r() > 0.28) continue;
    const a = r() * Math.PI * 2;
    const x = t.x + Math.cos(a) * 0.55;
    const z = t.z + Math.sin(a) * 0.55;
    if (!isFree(x, z, -0.4)) continue;
    out.push({ x, z, scale: 0.7 + r() * 0.6, v: Math.floor(r() * 2), rot: r() * Math.PI });
  }
  return out;
})();

/** Flowers cluster in meadows, with a sprinkle everywhere else. */
export const flowers: Spot[] = (() => {
  const r = rng(53);
  const out: Spot[] = [];
  for (let i = 0; i < 900 && out.length < 260; i++) {
    let x: number;
    let z: number;
    if (r() < 0.7) {
      const [mx, mz] = meadows[Math.floor(r() * meadows.length)];
      const a = r() * Math.PI * 2;
      const d = Math.pow(r(), 0.7) * 2.4;
      x = mx + Math.cos(a) * d;
      z = mz + Math.sin(a) * d;
    } else [x, z] = polar(r, 4, 20);
    if (!isFree(x, z, -0.35)) continue;
    if (trees.some((t) => Math.hypot(t.x - x, t.z - z) < 0.35)) continue;
    out.push({ x, z, scale: 0.75 + r() * 0.5, v: Math.floor(r() * 5), rot: r() * Math.PI * 2 });
  }
  return out;
})();

export const grass: Spot[] = (() => {
  const r = rng(67);
  const out: Spot[] = [];
  for (let i = 0; i < 4000 && out.length < 1500; i++) {
    const [x, z] = polar(r, 3.9, 20.5);
    if (!isFree(x, z, -0.45)) continue;
    out.push({ x, z, scale: 0.6 + r() * 0.8, v: Math.floor(r() * 3), rot: r() * Math.PI * 2 });
  }
  return out;
})();
