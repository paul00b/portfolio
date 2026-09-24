import { memo, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { cached, facet, mat, noise2, palette, radialTexture, rng } from "./lowpoly";
import { Cloud, MiniIsland, Vegetation } from "./Nature";
import { Birds, Butterflies, fx, Particles, Pollen } from "./Effects";
import { House, LandmarkModel, Mailbox } from "./Landmarks";
import { stations, type Station } from "./stations";
import { ActiveCtx } from "./active";
import { edgeRadius, FOUNTAIN_R, nav, PLAZA_R, spring, stream, STREAM_W, waterfallAngle } from "./layout";
import { profile } from "../data/projects";
import { tr, type Lang } from "../i18n/lang";


const walkTo = (x: number, z: number, stationId: string | null = null) => {
  nav.active = true;
  nav.x = x;
  nav.z = z;
  nav.stationId = stationId;
  nav.t = 0;
};

/* ================================================================== */
/*  Island                                                             */
/* ================================================================== */

const CLIFF: { y: number; dr: number; f: number; band: number }[] = [
  { y: -0.01, dr: 0.1, f: 1, band: 0 },
  { y: -0.34, dr: 0.16, f: 1, band: 0 },
  { y: -0.46, dr: -0.04, f: 1, band: 1 },
  { y: -1.25, dr: -0.3, f: 1, band: 2 },
  { y: -2.1, dr: -0.8, f: 1, band: 3 },
  { y: -3.1, dr: -2.0, f: 1, band: 4 },
  { y: -4.3, dr: 0, f: 0.72, band: 5 },
  { y: -5.7, dr: 0, f: 0.5, band: 6 },
  { y: -7.3, dr: 0, f: 0.3, band: 7 },
  { y: -8.9, dr: 0, f: 0.12, band: 7 },
  { y: -10, dr: 0, f: 0, band: 7 },
];
const BAND_COLORS = ["#82c67c", "#b4815a", "#a06f4b", "#c29668", "#8f5f41", "#948a9b", "#81788b", "#6f6879"];

export function cliffRadius(j: number, a: number) {
  const c = CLIFF[j];
  const R = edgeRadius(a);
  const rough = j >= 2 ? noise2(a * 6, j * 1.7, 3) * 0.28 : 0;
  return (R + c.dr) * c.f + rough;
}

function useIslandGeometry() {
  return useMemo(() => {
    const r = rng(5);
    const color = new THREE.Color();

    // ---- grass top: a jittered grid clipped to the island outline
    const top = new THREE.PlaneGeometry(46, 46, 46, 46);
    top.rotateX(-Math.PI / 2);
    const p = top.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i) + (r() - 0.5) * 0.55;
      let z = p.getZ(i) + (r() - 0.5) * 0.55;
      const a = Math.atan2(z, x);
      const R = edgeRadius(a) + 0.12;
      const d = Math.hypot(x, z);
      if (d > R) {
        x = (x / d) * R;
        z = (z / d) * R;
      }
      p.setXYZ(i, x, 0, z);
    }
    const flat = top.toNonIndexed();
    flat.deleteAttribute("uv");
    const fp = flat.attributes.position as THREE.BufferAttribute;
    const cols = new Float32Array(fp.count * 3);
    const g0 = new THREE.Color(palette.grass[0]);
    const g1 = new THREE.Color("#a4dc8f");
    const g2 = new THREE.Color("#79bf76");
    for (let f = 0; f < fp.count; f += 3) {
      const cx = (fp.getX(f) + fp.getX(f + 1) + fp.getX(f + 2)) / 3;
      const cz = (fp.getZ(f) + fp.getZ(f + 1) + fp.getZ(f + 2)) / 3;
      const n = noise2(cx * 0.16, cz * 0.16, 2) * 0.5 + noise2(cx * 0.5, cz * 0.5, 9) * 0.25;
      color.copy(g0).lerp(n > 0 ? g1 : g2, Math.min(1, Math.abs(n) * 1.4));
      color.offsetHSL(0, 0, (r() - 0.5) * 0.035);
      for (let k = 0; k < 3; k++) color.toArray(cols, (f + k) * 3);
    }
    flat.setAttribute("color", new THREE.BufferAttribute(cols, 3));
    flat.computeVertexNormals();

    // ---- cliff: stacked rings, each band a different stratum
    const SEG = 84;
    const pos: number[] = [];
    const col: number[] = [];
    const ring = (j: number, i: number) => {
      const a = (i / SEG) * Math.PI * 2;
      const rad = cliffRadius(j, a);
      const yj = CLIFF[j].y + (j >= 2 && j < CLIFF.length - 1 ? noise2(a * 5, j, 7) * 0.12 : 0);
      return [Math.cos(a) * rad, yj, Math.sin(a) * rad];
    };
    for (let j = 0; j < CLIFF.length - 1; j++) {
      for (let i = 0; i < SEG; i++) {
        const a = ring(j, i);
        const b = ring(j, i + 1);
        const c = ring(j + 1, i);
        const d = ring(j + 1, i + 1);
        const tint = (r() - 0.5) * 0.06;
        const base = new THREE.Color(BAND_COLORS[CLIFF[j].band]);
        for (const tri of [
          [a, c, b],
          [b, c, d],
        ]) {
          color.copy(base).offsetHSL(0, 0, tint + (r() - 0.5) * 0.03);
          for (const v of tri) {
            pos.push(v[0], v[1], v[2]);
            col.push(color.r, color.g, color.b);
          }
        }
      }
    }
    const cliff = new THREE.BufferGeometry();
    cliff.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    cliff.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    cliff.computeVertexNormals();
    return { top: flat, cliff };
  }, []);
}

function Island() {
  const { top, cliff } = useIslandGeometry();
  const ground = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }), []);
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    walkTo(e.point.x, e.point.z);
  };
  return (
    <group>
      <mesh geometry={top} material={ground} receiveShadow onClick={onClick} />
      <mesh geometry={cliff} material={ground} receiveShadow castShadow />
      <UnderIsland />
    </group>
  );
}

/** Roots and loose rocks drifting under the island. */
function UnderIsland() {
  const ref = useRef<THREE.Group>(null);
  const rocks = useMemo(() => {
    const r = rng(91);
    return Array.from({ length: 9 }, (_, i) => {
      const a = (i / 9) * Math.PI * 2 + r() * 0.4;
      const d = 6 + r() * 9;
      return { p: [Math.cos(a) * d, -6.5 - r() * 5, Math.sin(a) * d] as [number, number, number], s: 0.35 + r() * 0.7, seed: r() * 10, c: palette.rock[i % 3] };
    });
  }, []);
  const roots = useMemo(() => {
    const r = rng(19);
    return Array.from({ length: 16 }, () => {
      const a = r() * Math.PI * 2;
      const d = 7 + r() * 8;
      return { p: [Math.cos(a) * d, -2.4 - r() * 1.5, Math.sin(a) * d] as [number, number, number], len: 0.8 + r() * 1.6, tilt: (r() - 0.5) * 0.5 };
    });
  }, []);
  const geo = facet("float-rock", () => new THREE.DodecahedronGeometry(1, 0), 0.15, 4, [1, 0.8, 1]);
  const cap = facet("float-cap", () => new THREE.CylinderGeometry(1.05, 0.95, 0.3, 7), 0.06, 5);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.children.forEach((c, i) => {
      const r0 = rocks[i];
      c.position.y = r0.p[1] + Math.sin(t * 0.6 + r0.seed) * 0.3;
      c.rotation.y = t * 0.1 + r0.seed;
    });
  });
  return (
    <group>
      <group ref={ref}>
        {rocks.map((r0, i) => (
          <group key={i} position={r0.p} scale={r0.s}>
            <mesh geometry={geo} material={mat(r0.c)} />
            {i % 3 === 0 && <mesh geometry={cap} material={mat(palette.grass[1])} position={[0, 0.72, 0]} scale={0.8} />}
          </group>
        ))}
      </group>
      {roots.map((r0, i) => (
        <mesh key={i} position={r0.p} rotation={[r0.tilt, 0, r0.tilt]} material={mat("#6e4a32")}>
          <cylinderGeometry args={[0.035, 0.07, r0.len, 4]} />
        </mesh>
      ))}
    </group>
  );
}

/* ================================================================== */
/*  Water                                                              */
/* ================================================================== */

const waterTime = { value: 0 };

const waterMats = new Map<string, THREE.MeshStandardMaterial>();
function makeWater(key: string, color: string) {
  const m = new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.15, metalness: 0.05, emissive: "#1a6f95", emissiveIntensity: 0.12 });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = waterTime;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uTime;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vec4 wpos = modelMatrix * vec4(position, 1.0);
        transformed.y += (sin(wpos.x * 3.1 + uTime * 2.2) * 0.5 + cos(wpos.z * 2.7 + uTime * 1.8) * 0.5 + sin((wpos.x + wpos.z) * 4.3 + uTime * 3.1) * 0.35) * 0.018;`,
      );
  };
  m.customProgramCacheKey = () => "water";
  waterMats.set(key, m);
  return m;
}

/** A disc triangulated in rings (so waves can ripple across it). */
function discGeometry(radius: number, rings: number, seed: number) {
  return cached(`disc-${radius}-${rings}-${seed}`, () => {
    const r = rng(seed);
    const pts: [number, number][][] = [];
    for (let k = 0; k <= rings; k++) {
      const rr = (radius * k) / rings;
      const n = Math.max(1, k * 6);
      const ring: [number, number][] = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + (k % 2) * 0.2;
        const j = k > 0 && k < rings ? (r() - 0.5) * 0.12 * radius / rings : 0;
        ring.push([Math.cos(a) * (rr + j), Math.sin(a) * (rr + j)]);
      }
      pts.push(ring);
    }
    const pos: number[] = [];
    for (let k = 0; k < rings; k++) {
      const inner = pts[k];
      const outer = pts[k + 1];
      let ii = 0;
      for (let oi = 0; oi < outer.length; oi++) {
        const o0 = outer[oi];
        const o1 = outer[(oi + 1) % outer.length];
        const target = Math.floor(((oi + 1) * inner.length) / outer.length) % inner.length;
        const i0 = inner[ii % inner.length];
        pos.push(i0[0], 0, i0[1], o1[0], 0, o1[1], o0[0], 0, o0[1]);
        if (inner.length > 1 && target !== ii % inner.length) {
          const i1 = inner[target];
          pos.push(i0[0], 0, i0[1], i1[0], 0, i1[1], o1[0], 0, o1[1]);
          ii = target;
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    return g;
  });
}

function Water() {
  const pondGeo = discGeometry(spring.r, 5, 3);
  const streamGeo = useMemo(() => {
    const pos: number[] = [];
    const L: [number, number][] = [];
    const Rt: [number, number][] = [];
    const Mid: [number, number][] = [];
    stream.forEach(([x, z], i) => {
      const [nx, nz] = stream[Math.min(i + 1, stream.length - 1)];
      const [px, pz] = stream[Math.max(i - 1, 0)];
      const tx = nx - px;
      const tz = nz - pz;
      const l = Math.hypot(tx, tz) || 1;
      const w = (STREAM_W / 2) * (1 + Math.sin(i * 2.1) * 0.12);
      L.push([x - (tz / l) * w, z + (tx / l) * w]);
      Rt.push([x + (tz / l) * w, z - (tx / l) * w]);
      Mid.push([x, z]);
    });
    for (let i = 0; i < stream.length - 1; i++) {
      for (const [a, b] of [
        [L, Mid],
        [Mid, Rt],
      ] as const) {
        pos.push(a[i][0], 0, a[i][1], b[i][0], 0, b[i][1], a[i + 1][0], 0, a[i + 1][1]);
        pos.push(b[i][0], 0, b[i][1], b[i + 1][0], 0, b[i + 1][1], a[i + 1][0], 0, a[i + 1][1]);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    return g;
  }, []);

  const bankStones = useMemo(() => {
    const r = rng(33);
    const out: { p: [number, number, number]; s: number; c: string; rot: number }[] = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const toEdge = Math.abs(Math.atan2(Math.sin(a - waterfallAngle), Math.cos(a - waterfallAngle)));
      if (toEdge < 0.45) continue;
      out.push({ p: [spring.x + Math.cos(a) * (spring.r + 0.08), 0.04, spring.z + Math.sin(a) * (spring.r + 0.08)], s: 0.16 + r() * 0.14, c: palette.stone[i % 4], rot: r() * 3 });
    }
    stream.forEach(([x, z], i) => {
      if (i === 0 || i >= stream.length - 1 || i % 2) return;
      const [nx, nz] = stream[i + 1];
      const tx = nx - x;
      const tz = nz - z;
      const l = Math.hypot(tx, tz) || 1;
      for (const side of [1, -1]) {
        out.push({ p: [x + (tz / l) * 0.62 * side, 0.03, z - (tx / l) * 0.62 * side], s: 0.1 + r() * 0.1, c: palette.stone[(i + side + 4) % 4], rot: r() * 3 });
      }
    });
    return out;
  }, []);
  const stoneGeo = facet("bank-stone", () => new THREE.DodecahedronGeometry(1, 0), 0.12, 6, [1.2, 0.55, 1]);

  const lily = useMemo(() => {
    const s = new THREE.Shape();
    s.absarc(0, 0, 0.22, 0.35, Math.PI * 2 - 0.1, false);
    s.lineTo(0, 0);
    const g = new THREE.ShapeGeometry(s, 5);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const lilies = useRef<THREE.Group>(null);

  // waterfall ribbon, following the cliff profile
  const fallGeo = useMemo(() => {
    const a = waterfallAngle;
    const dir = new THREE.Vector2(Math.cos(a), Math.sin(a));
    const tan = new THREE.Vector2(-dir.y, dir.x);
    const prof: [number, number][] = [[edgeRadius(a) - 0.2, 0.02]];
    for (let j = 0; j < 7; j++) prof.push([cliffRadius(j, a) + 0.22 + j * 0.05, CLIFF[j].y - 0.02]);
    prof.push([cliffRadius(6, a) + 0.6, -7.5], [cliffRadius(6, a) + 0.7, -11]);
    const pos: number[] = [];
    const uv: number[] = [];
    const W = STREAM_W * 0.55;
    let acc = 0;
    const lens = [0];
    for (let i = 1; i < prof.length; i++) {
      acc += Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]);
      lens.push(acc);
    }
    for (let i = 0; i < prof.length - 1; i++) {
      const [r0, y0] = prof[i];
      const [r1, y1] = prof[i + 1];
      const w0 = W * (1 + i * 0.05);
      const w1 = W * (1 + (i + 1) * 0.05);
      const p = (r: number, y: number, w: number, s: number) => [dir.x * r + tan.x * w * s, y, dir.y * r + tan.y * w * s];
      const A = p(r0, y0, w0, -1);
      const B = p(r0, y0, w0, 1);
      const Cc = p(r1, y1, w1, -1);
      const D = p(r1, y1, w1, 1);
      const v0 = lens[i] / acc;
      const v1 = lens[i + 1] / acc;
      pos.push(...A, ...Cc, ...B, ...B, ...Cc, ...D);
      uv.push(0, v0, 0, v1, 1, v0, 1, v0, 0, v1, 1, v1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  }, []);
  const fallMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: { uTime: waterTime },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; varying vec2 vUv;
          void main(){
            float y = vUv.y * 9.0 - uTime * 1.6;
            float s = fract(y + sin(vUv.x * 9.0 + floor(y) * 3.1) * 0.25);
            float streak = smoothstep(0.55, 0.9, s);
            float edge = smoothstep(0.32, 0.0, min(vUv.x, 1.0 - vUv.x));
            vec3 col = mix(vec3(0.42, 0.78, 0.92), vec3(0.95, 0.99, 1.0), clamp(streak * 0.8 + edge * 0.7, 0.0, 1.0));
            float a = (1.0 - smoothstep(0.55, 1.0, vUv.y)) * 0.92;
            gl_FragColor = vec4(col, a);
          }`,
      }),
    [],
  );

  const lip = useMemo(() => {
    const a = waterfallAngle;
    const r = edgeRadius(a) + 0.05;
    return [Math.cos(a) * r, Math.sin(a) * r] as const;
  }, []);

  useFrame(({ clock }, dt) => {
    waterTime.value = clock.elapsedTime;
    if (Math.random() < dt * 14) fx.mist(lip[0], -0.2 - Math.random() * 0.8, lip[1]);
    if (Math.random() < dt * 1.2) fx.splash(spring.x + (Math.random() - 0.5) * 0.6, 0.02, spring.z + (Math.random() - 0.5) * 0.6, 2);
    if (lilies.current) lilies.current.children.forEach((c, i) => (c.rotation.y = Math.sin(clock.elapsedTime * 0.4 + i) * 0.3 + i * 2));
  });

  return (
    <group>
      <mesh geometry={pondGeo} material={makeWaterOnce("pond")} position={[spring.x, 0.025, spring.z]} receiveShadow />
      <mesh geometry={streamGeo} material={makeWaterOnce("pond")} position={[0, 0.02, 0]} receiveShadow />
      <mesh position={[spring.x, 0.012, spring.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[spring.r - 0.02, spring.r + 0.16, 28]} />
        <meshStandardMaterial color="#d9cfb8" flatShading roughness={1} />
      </mesh>
      {bankStones.map((s, i) => (
        <mesh key={i} geometry={stoneGeo} material={mat(s.c)} position={s.p} scale={s.s} rotation={[0, s.rot, 0]} castShadow receiveShadow />
      ))}
      <group ref={lilies}>
        {[
          [0.45, -0.3],
          [-0.5, 0.35],
          [0.1, 0.6],
        ].map(([dx, dz], i) => (
          <group key={i} position={[spring.x + dx, 0.05, spring.z + dz]}>
            <mesh geometry={lily} material={mat(i === 1 ? "#5aa860" : "#6cbf6e")} />
            {i === 0 && (
              <mesh material={mat("#ffb4d0")} position={[0.03, 0.05, 0.02]}>
                <icosahedronGeometry args={[0.07, 0]} />
              </mesh>
            )}
          </group>
        ))}
      </group>
      <mesh geometry={fallGeo} material={fallMat} renderOrder={2} />
    </group>
  );
}

function makeWaterOnce(key: string) {
  return waterMats.get(key) ?? makeWater(key, palette.water);
}

/* ================================================================== */
/*  Paths                                                              */
/* ================================================================== */

function pathGeometry(to: [number, number], seed: number) {
  return cached(`path-${seed}`, () => {
    const r = rng(seed);
    const len = Math.hypot(to[0], to[1]);
    const ux = to[0] / len;
    const uz = to[1] / len;
    const nx = -uz;
    const nz = ux;
    const start = PLAZA_R - 0.4;
    const end = len - 2.3;
    const N = Math.ceil((end - start) / 0.7);
    const L: [number, number][] = [];
    const Rr: [number, number][] = [];
    for (let i = 0; i <= N; i++) {
      const d = start + ((end - start) * i) / N;
      const bend = Math.sin(d * 0.45 + seed) * 0.18;
      const wl = 0.82 + (r() - 0.5) * 0.18;
      const wr = 0.82 + (r() - 0.5) * 0.18;
      L.push([ux * d + nx * (wl + bend), uz * d + nz * (wl + bend)]);
      Rr.push([ux * d - nx * (wr - bend), uz * d - nz * (wr - bend)]);
    }
    const pos: number[] = [];
    const col: number[] = [];
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      for (const tri of [
        [L[i], Rr[i], L[i + 1]],
        [Rr[i], Rr[i + 1], L[i + 1]],
      ]) {
        c.set(palette.path).offsetHSL(0, 0, (r() - 0.5) * 0.05);
        for (const v of tri) {
          pos.push(v[0], 0, v[1]);
          col.push(c.r, c.g, c.b);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  });
}

function Paths() {
  const pathMat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1 }), []);
  const targets = stations.filter((s) => s.kind !== "home");
  const stones = useMemo(() => {
    const r = rng(71);
    const out: { x: number; z: number; rot: number; s: number; c: string }[] = [];
    targets.forEach((s, ti) => {
      const len = Math.hypot(s.position[0], s.position[1]);
      const ux = s.position[0] / len;
      const uz = s.position[1] / len;
      for (let d = PLAZA_R + 0.4; d < len - 2.7; d += 0.85 + r() * 0.35) {
        const side = (r() - 0.5) * 0.55 + Math.sin(d * 0.45 + ti + 3) * 0.18;
        out.push({ x: ux * d - uz * side, z: uz * d + ux * side, rot: r() * Math.PI, s: 0.15 + r() * 0.08, c: palette.stone[Math.floor(r() * 4)] });
      }
    });
    return out;
  }, [targets]);
  const stoneGeo = facet("step-stone", () => new THREE.CylinderGeometry(1, 1, 0.3, 7), 0.12, 3);
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    stones.forEach((s, i) => {
      o.position.set(s.x, 0.02, s.z);
      o.rotation.set(0, s.rot, 0);
      o.scale.set(s.s, 0.2, s.s * 0.85);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, c.set(s.c));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [stones]);
  return (
    <group>
      {targets.map((s, i) => (
        <mesh key={s.id} geometry={pathGeometry(s.position, i + 3)} material={pathMat} position={[0, 0.006, 0]} receiveShadow />
      ))}
      <instancedMesh ref={ref} args={[stoneGeo, mat("#ffffff"), stones.length]} receiveShadow />
    </group>
  );
}

/* ================================================================== */
/*  Plaza: paving, fountain, benches, lamps, signpost                  */
/* ================================================================== */

function Paving() {
  const tiles = useMemo(() => {
    const r = rng(8);
    const out: { x: number; z: number; rot: number; w: number; d: number; c: string }[] = [];
    [1.95, 2.6, 3.25].forEach((rad, k) => {
      const n = Math.round(rad * 4.2);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + k * 0.3;
        out.push({ x: Math.cos(a) * rad, z: Math.sin(a) * rad, rot: -a, w: 0.56, d: ((Math.PI * 2 * rad) / n) * 0.86, c: palette.stone[Math.floor(r() * 4)] });
      }
    });
    return out;
  }, []);
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = facet("tile", () => new THREE.BoxGeometry(1, 1, 1, 1, 1, 1), 0.03, 2);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    tiles.forEach((t, i) => {
      o.position.set(t.x, 0.03, t.z);
      o.rotation.set(0, t.rot, 0);
      o.scale.set(t.w, 0.06, t.d);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, c.set(t.c));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [tiles]);
  return (
    <group>
      <mesh receiveShadow position={[0, 0.012, 0]} material={mat("#d8ccb4")}>
        <cylinderGeometry args={[PLAZA_R, PLAZA_R + 0.1, 0.03, 36]} />
      </mesh>
      <instancedMesh ref={ref} args={[geo, mat("#ffffff"), tiles.length]} receiveShadow />
    </group>
  );
}

function Fountain() {
  const basin = useMemo(
    () =>
      new THREE.LatheGeometry(
        [
          new THREE.Vector2(1.05, 0.0),
          new THREE.Vector2(FOUNTAIN_R, 0.0),
          new THREE.Vector2(FOUNTAIN_R + 0.04, 0.34),
          new THREE.Vector2(FOUNTAIN_R - 0.08, 0.44),
          new THREE.Vector2(1.08, 0.4),
          new THREE.Vector2(1.05, 0.2),
        ],
        12,
      ),
    [],
  );
  const column = useMemo(
    () =>
      new THREE.LatheGeometry(
        [
          new THREE.Vector2(0.0, 0.2),
          new THREE.Vector2(0.28, 0.2),
          new THREE.Vector2(0.22, 0.35),
          new THREE.Vector2(0.14, 0.45),
          new THREE.Vector2(0.12, 0.9),
          new THREE.Vector2(0.2, 1.0),
          new THREE.Vector2(0.55, 1.08),
          new THREE.Vector2(0.58, 1.16),
          new THREE.Vector2(0.5, 1.18),
          new THREE.Vector2(0.12, 1.12),
          new THREE.Vector2(0.1, 1.4),
          new THREE.Vector2(0.16, 1.46),
          new THREE.Vector2(0.0, 1.56),
        ],
        10,
      ),
    [],
  );
  const water = discGeometry(1.08, 4, 9);
  const bowlWater = discGeometry(0.5, 2, 4);
  const sheet = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: { uTime: waterTime },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform float uTime; varying vec2 vUv;
          void main(){
            float s = fract(vUv.y * 3.0 + uTime * 1.4 + sin(vUv.x * 40.0) * 0.08);
            float streak = smoothstep(0.6, 0.95, s);
            vec3 col = mix(vec3(0.6, 0.86, 0.95), vec3(1.0), streak);
            float a = 0.55 + streak * 0.35;
            gl_FragColor = vec4(col, a * smoothstep(0.0, 0.15, vUv.y));
          }`,
      }),
    [],
  );
  useFrame((_, dt) => {
    const n = Math.random() < dt * 30 ? 1 : 0;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 0.7 + Math.random() * 0.3;
      fx.drop(0, 1.58, 0, Math.cos(a) * sp, 2.4 + Math.random() * 0.8, Math.sin(a) * sp);
    }
    if (Math.random() < dt * 3) {
      const a = Math.random() * Math.PI * 2;
      fx.splash(Math.cos(a) * 0.6, 0.32, Math.sin(a) * 0.6, 1);
    }
  });
  return (
    <group>
      <mesh geometry={basin} material={mat("#e4dccd")} castShadow receiveShadow />
      <mesh geometry={water} material={makeWaterOnce("pond")} position={[0, 0.32, 0]} />
      <mesh geometry={column} material={mat("#efe8da")} castShadow receiveShadow />
      <mesh geometry={bowlWater} material={makeWaterOnce("pond")} position={[0, 1.13, 0]} />
      <mesh material={sheet} position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.56, 0.62, 0.8, 16, 1, true]} />
      </mesh>
    </group>
  );
}

function Bench({ angle, r = 3.15 }: { angle: number; r?: number }) {
  const x = Math.cos(angle) * r;
  const z = Math.sin(angle) * r;
  const wood = mat("#b98457");
  const iron = mat("#3b3f57");
  return (
    <group position={[x, 0.06, z]} rotation={[0, -angle - Math.PI / 2, 0]}>
      {[-0.1, 0.04, 0.18].map((dz, i) => (
        <mesh key={i} material={wood} position={[0, 0.34, dz - 0.04]} castShadow>
          <boxGeometry args={[1.1, 0.05, 0.12]} />
        </mesh>
      ))}
      {[0.5, 0.65].map((y, i) => (
        <mesh key={i} material={wood} position={[0, y, -0.2]} rotation={[-0.15, 0, 0]} castShadow>
          <boxGeometry args={[1.1, 0.1, 0.04]} />
        </mesh>
      ))}
      {[-0.46, 0.46].map((dx) => (
        <group key={dx} position={[dx, 0, 0]}>
          <mesh material={iron} position={[0, 0.17, 0.12]}>
            <boxGeometry args={[0.05, 0.34, 0.05]} />
          </mesh>
          <mesh material={iron} position={[0, 0.38, -0.18]} rotation={[-0.15, 0, 0]}>
            <boxGeometry args={[0.05, 0.76, 0.05]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Lamp({ angle, r = 3.4 }: { angle: number; r?: number }) {
  const x = Math.cos(angle) * r;
  const z = Math.sin(angle) * r;
  const iron = mat("#353a52");
  const glass = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (glass.current) glass.current.emissiveIntensity = 1.6 + Math.sin(clock.elapsedTime * 3 + angle * 5) * 0.12;
  });
  return (
    <group position={[x, 0, z]}>
      <mesh material={iron} position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.17, 0.16, 6]} />
      </mesh>
      <mesh material={iron} position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.05, 1.8, 6]} />
      </mesh>
      <mesh position={[0, 1.95, 0]}>
        <cylinderGeometry args={[0.13, 0.1, 0.28, 6]} />
        <meshStandardMaterial ref={glass} color="#fff1c4" emissive="#ffc861" emissiveIntensity={1.6} flatShading toneMapped={false} />
      </mesh>
      <mesh material={iron} position={[0, 2.14, 0]} castShadow>
        <coneGeometry args={[0.2, 0.16, 6]} />
      </mesh>
      <mesh material={iron} position={[0, 2.26, 0]}>
        <sphereGeometry args={[0.035, 6, 4]} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.1, 20]} />
        <meshBasicMaterial map={radialTexture()} color="#ffd98a" transparent opacity={0.28} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Signpost({ lang }: { lang: Lang }) {
  const angle = (-12 * Math.PI) / 180;
  const x = Math.cos(angle) * 3.05;
  const z = Math.sin(angle) * 3.05;
  const wood = mat("#9c6b4a");
  return (
    <group position={[x, 0, z]}>
      <mesh material={wood} position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 2, 6]} />
      </mesh>
      <mesh material={mat("#fffaf1")} position={[0.1, 1.72, 0]} rotation={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[1.3, 0.34, 0.07]} />
      </mesh>
      <mesh material={mat("#ff6b5b")} position={[0.72, 1.72, 0.45]} rotation={[0, 0.6, 0]}>
        <coneGeometry args={[0.17, 0.2, 3]} />
      </mesh>
      <mesh material={mat("#f5c451")} position={[-0.1, 1.28, 0]} rotation={[0, -0.5, 0]} castShadow>
        <boxGeometry args={[1.1, 0.32, 0.07]} />
      </mesh>
      <Html position={[0, 2.5, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
        <div className="whitespace-nowrap rounded-xl border-2 border-ink bg-ink px-3 py-1.5 text-center text-white shadow-hard-sm">
          <div className="font-sans text-sm font-bold leading-tight">{profile.name}</div>
          <div className="font-mono text-[10px] text-mint">
            {tr(profile.title, lang).toLowerCase()} @ {profile.company.toLowerCase()}
          </div>
        </div>
      </Html>
    </group>
  );
}

const Plaza = memo(function Plaza({ lang }: { lang: Lang }) {
  const deg = (d: number) => (d * Math.PI) / 180;
  return (
    <group>
      <Paving />
      <Fountain />
      <Bench angle={deg(70)} />
      <Bench angle={deg(-130)} />
      <Lamp angle={deg(30)} />
      <Lamp angle={deg(150)} />
      <Lamp angle={deg(-90)} />
      <Signpost lang={lang} />
    </group>
  );
});

/* ================================================================== */
/*  Stations                                                           */
/* ================================================================== */

function VisitFlag({ color, angle }: { color: string; angle: number }) {
  const g = useRef<THREE.Group>(null);
  const cloth = useRef<THREE.Mesh>(null);
  const s = useRef({ v: 0, x: 0 });
  useFrame(({ clock }, dt) => {
    const d = Math.min(dt, 0.05);
    const st = s.current;
    st.v += ((1 - st.x) * 160 - st.v * 11) * d;
    st.x += st.v * d;
    if (g.current) g.current.scale.setScalar(Math.max(0, st.x));
    if (cloth.current) cloth.current.rotation.y = Math.sin(clock.elapsedTime * 3.2 + angle) * 0.25;
  });
  const flagGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 0, -0.32, 0, 0.5, -0.16, 0], 3));
    geo.computeVertexNormals();
    return geo;
  }, []);
  return (
    <group ref={g} position={[Math.cos(angle) * 2.35, 0.3, Math.sin(angle) * 2.35]} scale={0}>
      <mesh material={mat("#fffaf1")} position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 1.1, 5]} />
      </mesh>
      <mesh material={mat("#f5c451")} position={[0, 1.12, 0]}>
        <sphereGeometry args={[0.045, 6, 4]} />
      </mesh>
      <mesh ref={cloth} geometry={flagGeo} position={[0, 1.07, 0]} castShadow>
        <meshStandardMaterial color={color} side={THREE.DoubleSide} flatShading />
      </mesh>
    </group>
  );
}

function StationNode({ station, near, visited, lang }: { station: Station; near: boolean; visited: boolean; lang: Lang }) {
  const ring = useRef<THREE.Mesh>(null);
  const inlay = useRef<THREE.Mesh>(null);
  const active = useRef(0);
  const [hover, setHover] = useState(false);
  const [x, z] = station.position;
  const isProject = station.kind === "project";
  const color = station.color === "#232946" ? "#8fc7ff" : station.color;
  const platformColor = isProject ? station.color : station.kind === "about" ? "#f3d9ae" : "#f5c451";
  const toCenter = Math.atan2(-z, -x);

  useFrame(({ clock }, dt) => {
    const d = Math.min(dt, 0.05);
    active.current = THREE.MathUtils.lerp(active.current, near ? 1 : hover ? 0.35 : 0, d * 6);
    const k = active.current;
    const t = clock.elapsedTime;
    if (ring.current) {
      const s = 1 + k * (0.04 + Math.sin(t * 4) * 0.025);
      ring.current.scale.set(s, s, s);
      ring.current.rotation.z = t * 0.2;
      const m = ring.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.18 + k * 0.7;
    }
    
    if (near && Math.random() < d * 22) {
      const a = Math.random() * Math.PI * 2;
      fx.sparkle(x + Math.cos(a) * 2.45, 0.4, z + Math.sin(a) * 2.45, Math.random() < 0.5 ? "#fff3b0" : color);
    }
  });

  const baseGeo = facet("platform", () => new THREE.CylinderGeometry(2.62, 2.85, 0.3, 12, 1), 0.035, 7);
  const rimGeo = facet("platform-rim", () => new THREE.CylinderGeometry(2.45, 2.55, 0.08, 12, 1), 0.02, 8);
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    walkTo(x, z, station.id);
  };

  return (
    <group position={[x, 0, z]}>
      <group
        onClick={click}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = "";
        }}
      >
        <mesh geometry={baseGeo} material={mat("#f4ede0")} position={[0, 0.15, 0]} receiveShadow castShadow />
        <mesh geometry={rimGeo} material={mat("#e6dccb")} position={[0, 0.3, 0]} receiveShadow />
        <mesh ref={inlay} material={mat(platformColor)} position={[0, 0.345, 0]} receiveShadow>
          <cylinderGeometry args={[2.2, 2.24, 0.02, 12]} />
        </mesh>
        <mesh material={mat("#ffffff", { roughness: 0.6 })} position={[0, 0.358, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <ringGeometry args={[1.72, 1.8, 12]} />
        </mesh>
        {/* a step up from the path */}
        <mesh material={mat("#ece3d3")} position={[Math.cos(toCenter) * 2.95, 0.08, Math.sin(toCenter) * 2.95]} rotation={[0, -toCenter, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.55, 0.16, 1.3]} />
        </mesh>
      </group>
      <mesh ref={ring} position={[0, 0.362, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.26, 2.44, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} toneMapped={false} depthWrite={false} />
      </mesh>

      <ActiveCtx.Provider value={active}>
        <group position={[0, 0.33, 0]}>
          {station.kind === "project" && station.project && <LandmarkModel type={station.project.landmark} />}
          {station.kind === "about" && <House />}
          {station.kind === "contact" && <Mailbox />}
        </group>
      </ActiveCtx.Provider>

      {visited && <VisitFlag color={color} angle={toCenter + 0.9} />}

      <Html position={[0, isProject ? 4.4 : 3.7, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
        <div
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-ink bg-white px-2.5 py-1 font-mono text-[11px] font-bold tracking-wide text-ink transition-all duration-300 ${
            near ? "-translate-y-1 scale-110 shadow-hard" : hover ? "scale-105 shadow-hard" : "scale-100 opacity-85 shadow-hard-sm"
          }`}
        >
          <span className="relative inline-flex h-2 w-2">
            {near && <span className="absolute inset-0 animate-ping rounded-full" style={{ background: station.color }} />}
            <span className="relative inline-block h-2 w-2 rounded-full border border-ink" style={{ background: station.color }} />
          </span>
          {tr(station.label, lang)}
          {station.project?.favorite && <span className="text-mustard">★</span>}
          {visited && <span className="text-mint-dark">✓</span>}
        </div>
      </Html>
    </group>
  );
}

/* ================================================================== */
/*  Click-to-walk marker                                               */
/* ================================================================== */

function NavMarker() {
  const g = useRef<THREE.Group>(null);
  const k = useRef(0);
  useFrame(({ clock }, dt) => {
    const d = Math.min(dt, 0.05);
    k.current = THREE.MathUtils.lerp(k.current, nav.active && !nav.stationId ? 1 : 0, d * 10);
    if (!g.current) return;
    g.current.visible = k.current > 0.02;
    g.current.position.set(nav.x, 0.04, nav.z);
    const s = k.current * (1 + Math.sin(clock.elapsedTime * 7) * 0.08);
    g.current.scale.set(s, s, s);
    g.current.rotation.y = clock.elapsedTime * 1.5;
  });
  return (
    <group ref={g} visible={false}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.26, 0.36, 6]} />
        <meshBasicMaterial color="#ff6b5b" toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.1, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

/* ================================================================== */

const Sky = memo(function Sky() {
  return (
    <group>
      {/* behind the island (away from the camera) */}
      <Cloud position={[-22, 4, -16]} scale={1.8} seed={1} />
      <Cloud position={[-10, 6, -28]} scale={1.5} speed={0.1} seed={2} />
      <Cloud position={[-30, 2, -2]} scale={1.4} speed={0.2} seed={3} />
      <Cloud position={[6, 3, -30]} scale={1.3} speed={0.12} seed={4} />
      {/* below the island rim, in front */}
      <Cloud position={[4, -6, 26]} scale={1.8} speed={0.08} seed={5} />
      <Cloud position={[26, -5, 2]} scale={1.5} speed={0.1} seed={6} />
      <Cloud position={[18, -9, 18]} scale={1.2} speed={0.14} seed={7} />
      <MiniIsland position={[-30, -6, 8]} scale={1.3} seed={1} />
      <MiniIsland position={[28, -9, -14]} scale={1.1} seed={2} />
      <MiniIsland position={[6, -12, 32]} scale={1.6} seed={3} />
      <MiniIsland position={[30, -4, 22]} scale={0.8} seed={4} />
    </group>
  );
});

export function World({ nearId, lang, visited }: { nearId: string | null; lang: Lang; visited: Set<string> }) {
  return (
    <group>
      <Island />
      <Paths />
      <Water />
      <Plaza lang={lang} />
      {stations
        .filter((s) => s.kind !== "home")
        .map((s) => (
          <StationNode key={s.id} station={s} near={nearId === s.id} visited={visited.has(s.id)} lang={lang} />
        ))}
      <Vegetation />
      <NavMarker />
      <Particles />
      <Pollen />
      <Butterflies />
      <Birds />
      <Sky />
    </group>
  );
}
