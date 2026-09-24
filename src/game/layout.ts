import { stations, WORLD_RADIUS } from "./stations";

/** Live player state, written by Player every frame and read by shaders / particles. */
export const player = { x: 0, y: 0, z: 3, speed: 0, inWater: false };

/** Click-to-walk target. */
export const nav = { active: false, x: 0, z: 0, stationId: null as string | null, t: 0 };

/** Island silhouette: radius of the grass edge at a given angle. */
export function edgeRadius(a: number) {
  return (WORLD_RADIUS + 1.2) * (1 + 0.045 * Math.sin(a * 7 + 1) + 0.035 * Math.cos(a * 13 + 2) + 0.015 * Math.sin(a * 23));
}

export const PLAZA_R = 3.7;
export const FOUNTAIN_R = 1.35;

/** A spring between AMIA and the mailbox, feeding a stream that falls off the edge. */
const SPRING_A = (110 * Math.PI) / 180;
export const spring = { x: Math.cos(SPRING_A) * 14.4, z: Math.sin(SPRING_A) * 14.4, r: 1.35 };

/** Stream centreline, from the pond to just past the cliff edge. */
export const stream: [number, number][] = (() => {
  const pts: [number, number][] = [];
  const start = 14.4 + spring.r * 0.6;
  const end = edgeRadius(SPRING_A) + 0.4;
  const n = 10;
  for (let i = 0; i <= n; i++) {
    const r = start + ((end - start) * i) / n;
    const wiggle = Math.sin(i * 1.3) * 0.05 * (i > 0 && i < n ? 1 : 0);
    pts.push([Math.cos(SPRING_A + wiggle) * r, Math.sin(SPRING_A + wiggle) * r]);
  }
  return pts;
})();
export const STREAM_W = 0.9;
export const waterfallAngle = SPRING_A;

/** Flowery spots between the pavilions (flower density + butterflies). */
export const meadows: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let i = 0; i < 9; i++) {
    const a = ((i * 40 + 30) * Math.PI) / 180;
    out.push([Math.cos(a) * 9, Math.sin(a) * 9]);
    if (i % 2 === 0) out.push([Math.cos(a + 0.12) * 16.2, Math.sin(a + 0.12) * 16.2]);
  }
  return out;
})();

export function distToSeg(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax;
  const dz = bz - az;
  const l2 = dx * dx + dz * dz || 1;
  let t = ((px - ax) * dx + (pz - az) * dz) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}

export function distToStream(x: number, z: number) {
  let best = Infinity;
  for (let i = 0; i < stream.length - 1; i++) {
    const [ax, az] = stream[i];
    const [bx, bz] = stream[i + 1];
    best = Math.min(best, distToSeg(x, z, ax, az, bx, bz));
  }
  return best;
}

export function isWater(x: number, z: number) {
  return Math.hypot(x - spring.x, z - spring.z) < spring.r || distToStream(x, z) < STREAM_W / 2;
}

/** Is this spot free for decoration? `margin` grows every exclusion zone. */
export function isFree(x: number, z: number, margin = 0) {
  const r = Math.hypot(x, z);
  if (r < PLAZA_R + 0.5 + margin) return false;
  if (r > edgeRadius(Math.atan2(z, x)) - 0.6 - margin) return false;
  for (const s of stations) {
    if (s.kind === "home") continue;
    const [sx, sz] = s.position;
    if (Math.hypot(x - sx, z - sz) < 3.2 + margin) return false;
    if (distToSeg(x, z, 0, 0, sx, sz) < 1.25 + margin) return false;
  }
  if (Math.hypot(x - spring.x, z - spring.z) < spring.r + 0.5 + margin) return false;
  if (distToStream(x, z) < STREAM_W / 2 + 0.35 + margin) return false;
  return true;
}
