import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** Deterministic PRNG, so the island looks the same on every visit. */
export function rng(seed: number) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Cheap 3D hash → [-1, 1], stable per position (keeps shared vertices welded). */
function hash3(x: number, y: number, z: number, seed: number) {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 19.19) * 43758.5453;
  return (n - Math.floor(n)) * 2 - 1;
}

/** Smooth 2D value noise in [-1, 1]. */
export function noise2(x: number, y: number, seed = 0) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash3(xi, yi, 0, seed);
  const b = hash3(xi + 1, yi, 0, seed);
  const c = hash3(xi, yi + 1, 0, seed);
  const d = hash3(xi + 1, yi + 1, 0, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

const geoCache = new Map<string, THREE.BufferGeometry>();

/**
 * Welds a primitive, pushes every vertex a little, then un-welds it so each
 * face gets its own flat normal. That irregularity is what separates a
 * hand-made low-poly look from plain primitives.
 */
export function facet(key: string, make: () => THREE.BufferGeometry, amount = 0.08, seed = 1, squash: [number, number, number] = [1, 1, 1]) {
  const k = `${key}|${amount}|${seed}|${squash.join(",")}`;
  const hit = geoCache.get(k);
  if (hit) return hit;
  let g = make();
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  g = mergeVertices(g, 1e-4);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    p.setXYZ(
      i,
      (x + hash3(x, y, z, seed) * amount) * squash[0],
      (y + hash3(y, z, x, seed + 7) * amount) * squash[1],
      (z + hash3(z, x, y, seed + 13) * amount) * squash[2],
    );
  }
  g = g.toNonIndexed();
  g.computeVertexNormals();
  geoCache.set(k, g);
  return g;
}

/** Plain cached geometry (no jitter). */
export function cached(key: string, make: () => THREE.BufferGeometry) {
  const hit = geoCache.get(key);
  if (hit) return hit;
  const g = make();
  geoCache.set(key, g);
  return g;
}

const matCache = new Map<string, THREE.MeshStandardMaterial>();

/** Shared flat-shaded material: one instance per colour for the whole scene. */
export function mat(color: string, opts: { emissive?: string; emissiveIntensity?: number; roughness?: number; metalness?: number; transparent?: boolean; opacity?: number } = {}) {
  const k = `${color}|${JSON.stringify(opts)}`;
  const hit = matCache.get(k);
  if (hit) return hit;
  const m = new THREE.MeshStandardMaterial({
    color,
    flatShading: true,
    roughness: opts.roughness ?? 0.85,
    metalness: opts.metalness ?? 0,
    emissive: opts.emissive ?? "#000000",
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
  });
  matCache.set(k, m);
  return m;
}

/** Soft radial gradient, used for contact shadows and glows. */
let radialTex: THREE.Texture | null = null;
export function radialTexture() {
  if (radialTex) return radialTex;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.45, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  radialTex = new THREE.CanvasTexture(c);
  return radialTex;
}

export const palette = {
  grass: ["#8fd18a", "#86ca82", "#9ad893", "#7fc47d", "#94d58c"],
  grassDark: "#6fb56f",
  path: "#eadcbf",
  pathDark: "#dccaa6",
  stone: ["#d9d3c7", "#cfc8ba", "#e3ddd2", "#c4bcad"],
  soil: ["#b07d57", "#9c6b48", "#8a5b3d", "#7a4e35"],
  rock: ["#8f8697", "#7d7487", "#a39bab"],
  leaf: ["#5fb56f", "#4fa564", "#6fc27a", "#43975a"],
  pine: ["#3f8f63", "#357f58", "#4a9d6d"],
  blossom: ["#f6a6a0", "#f8bf7a", "#f3d27a"],
  trunk: "#8a5a3c",
  water: "#6cc7e8",
  waterDeep: "#3fa5d0",
  foam: "#f2fbff",
};
