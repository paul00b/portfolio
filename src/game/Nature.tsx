import { memo, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { cached, facet, mat, palette, rng } from "./lowpoly";
import { fx } from "./Effects";
import { player } from "./layout";
import { bushes, flowers, grass, mushrooms, rocks, trees, type TreeKind } from "./scatter";

/* ================================================================== */
/*  Wind: one shader patch shared by everything that sways             */
/* ================================================================== */

const windUniforms = {
  uTime: { value: 0 },
  uPlayer: { value: new THREE.Vector3(0, 0, 3) },
};

export function WindDriver() {
  useFrame(({ clock }) => {
    windUniforms.uTime.value = clock.elapsedTime;
    windUniforms.uPlayer.value.set(player.x, player.y, player.z);
  });
  return null;
}

interface SwayOpts {
  wind: number; // bend at 1 unit high
  push: number; // how hard the player pushes it aside
  pushR: number; // push radius
  squash?: number; // how much it flattens when stepped on
  color?: string;
  vertexColors?: boolean;
  side?: THREE.Side;
  roughness?: number;
}

const swayCache = new Map<string, THREE.MeshStandardMaterial>();

function swayMaterial(key: string, o: SwayOpts) {
  const hit = swayCache.get(key);
  if (hit) return hit;
  {
    const m = new THREE.MeshStandardMaterial({
      color: o.color ?? "#ffffff",
      flatShading: true,
      roughness: o.roughness ?? 0.9,
      vertexColors: o.vertexColors ?? false,
      side: o.side ?? THREE.FrontSide,
    });
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = windUniforms.uTime;
      shader.uniforms.uPlayer = windUniforms.uPlayer;
      shader.uniforms.uWind = { value: o.wind };
      shader.uniforms.uPush = { value: o.push };
      shader.uniforms.uPushR = { value: o.pushR };
      shader.uniforms.uSquash = { value: o.squash ?? 0 };
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
          uniform float uTime; uniform vec3 uPlayer; uniform float uWind; uniform float uPush; uniform float uPushR; uniform float uSquash;`,
        )
        .replace(
          "#include <project_vertex>",
          `
          vec4 wp = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
          vec3 root = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          float h = max(transformed.y, 0.0);
          float gust = sin(uTime * 1.3 + root.x * 0.21 + root.z * 0.17) * 0.6 + sin(uTime * 2.7 + root.x * 0.9) * 0.25 + 0.35;
          vec2 off = normalize(vec2(1.0, 0.45)) * gust * uWind * h * h;
          vec2 dp = root.xz - uPlayer.xz;
          float dist = length(dp);
          float push = smoothstep(uPushR, 0.0, dist) * step(uPlayer.y, root.y + 1.2);
          off += (dp / max(dist, 0.001)) * push * uPush * h;
          wp.xz += off;
          wp.y -= push * uSquash * h;
          vec4 mvPosition = viewMatrix * wp;
          gl_Position = projectionMatrix * mvPosition;
          `,
        );
    };
    m.customProgramCacheKey = () => `sway-${key}`;
    swayCache.set(key, m);
    return m;
  }
}

/* ================================================================== */
/*  Instanced helper                                                   */
/* ================================================================== */

interface Inst {
  x: number;
  y?: number;
  z: number;
  rot?: number;
  scale?: number;
  sy?: number;
  color?: string;
}

const dummy = new THREE.Object3D();
const tmpColor = new THREE.Color();

function Instanced({ geometry, material, items, castShadow = true, receiveShadow = true }: { geometry: THREE.BufferGeometry; material: THREE.Material; items: Inst[]; castShadow?: boolean; receiveShadow?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    items.forEach((it, i) => {
      dummy.position.set(it.x, it.y ?? 0, it.z);
      dummy.rotation.set(0, it.rot ?? 0, 0);
      const s = it.scale ?? 1;
      dummy.scale.set(s, s * (it.sy ?? 1), s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, tmpColor.set(it.color ?? "#ffffff"));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow={castShadow} receiveShadow={receiveShadow} />;
}

/** Bake several positioned primitives into one geometry. */
function bake(key: string, parts: { g: THREE.BufferGeometry; p?: [number, number, number]; r?: [number, number, number]; s?: [number, number, number] }[]) {
  return cached(key, () => {
    const gs = parts.map(({ g, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1] }) => {
      const c = g.index ? g.toNonIndexed() : g.clone();
      if (c.attributes.uv) c.deleteAttribute("uv");
      const m = new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)), new THREE.Vector3(...s));
      c.applyMatrix4(m);
      return c;
    });
    const merged = mergeGeometries(gs, false)!;
    merged.computeVertexNormals();
    return merged;
  });
}

/* ================================================================== */
/*  Trees                                                              */
/* ================================================================== */

const R = (seed: number) => rng(seed);

function treeParts(kind: TreeKind) {
  switch (kind) {
    case "pine":
      return {
        trunk: bake("pine-trunk", [{ g: new THREE.CylinderGeometry(0.08, 0.13, 0.75, 6), p: [0, 0.37, 0] }]),
        leaves: [
          bake("pine-1", [{ g: facet("pc1", () => new THREE.ConeGeometry(0.82, 1.05, 7, 1), 0.05, 1), p: [0, 0.95, 0] }]),
          bake("pine-2", [{ g: facet("pc2", () => new THREE.ConeGeometry(0.64, 0.9, 7, 1), 0.045, 2), p: [0, 1.5, 0], r: [0, 0.4, 0] }]),
          bake("pine-3", [{ g: facet("pc3", () => new THREE.ConeGeometry(0.44, 0.75, 7, 1), 0.04, 3), p: [0, 2.02, 0], r: [0, 0.8, 0] }]),
        ],
        tones: [0, 1, 2],
      };
    case "tall":
      return {
        trunk: bake("tall-trunk", [{ g: new THREE.CylinderGeometry(0.07, 0.12, 1.1, 6), p: [0, 0.55, 0] }]),
        leaves: [
          bake("tall-1", [{ g: facet("tl1", () => new THREE.IcosahedronGeometry(0.55, 1), 0.07, 4), p: [0, 1.75, 0], s: [1, 1.9, 1] }]),
          bake("tall-2", [{ g: facet("tl2", () => new THREE.IcosahedronGeometry(0.3, 0), 0.05, 5), p: [0.12, 2.55, 0.05] }]),
        ],
        tones: [0, 2],
      };
    case "blossom":
    case "round":
    default:
      return {
        trunk: bake("round-trunk", [
          { g: new THREE.CylinderGeometry(0.09, 0.15, 1.0, 6), p: [0, 0.5, 0] },
          { g: new THREE.CylinderGeometry(0.04, 0.06, 0.45, 5), p: [0.18, 0.95, 0.05], r: [0, 0, -0.7] },
        ]),
        leaves: [
          bake("round-1", [
            { g: facet("rl1", () => new THREE.IcosahedronGeometry(0.72, 1), 0.09, 6), p: [0, 1.5, 0] },
            { g: facet("rl2", () => new THREE.IcosahedronGeometry(0.48, 1), 0.07, 7), p: [0.48, 1.25, 0.18] },
            { g: facet("rl3", () => new THREE.IcosahedronGeometry(0.45, 1), 0.07, 8), p: [-0.42, 1.3, -0.2] },
          ]),
          bake("round-2", [{ g: facet("rl4", () => new THREE.IcosahedronGeometry(0.42, 1), 0.06, 9), p: [0.05, 1.98, 0.08] }]),
        ],
        tones: [0, 2],
      };
  }
}

function leafTone(kind: TreeKind, v: number, layer: number) {
  if (kind === "pine") return palette.pine[Math.min(2, (layer + v) % 3)];
  if (kind === "blossom") return layer ? "#ffd0c9" : palette.blossom[v % palette.blossom.length];
  if (layer) return ["#8fd57f", "#7fcd7d", "#9bdc86", "#86cf88"][v % 4];
  return palette.leaf[v % palette.leaf.length];
}

function Trees() {
  const groups = useMemo(() => {
    const kinds: TreeKind[] = ["pine", "round", "tall", "blossom"];
    return kinds.map((kind) => {
      const list = trees.filter((t) => t.kind === kind);
      const parts = treeParts(kind);
      return { kind, list, parts };
    });
  }, []);
  const trunkMat = swayMaterial("trunk", { wind: 0.004, push: 0, pushR: 0.1 });
  const leafMat = swayMaterial("leaves", { wind: 0.018, push: 0.07, pushR: 1.3 });

  // falling leaves + a shake when you brush past
  const brushed = useRef<Set<number>>(new Set());
  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    trees.forEach((t, i) => {
      const leafy = t.kind === "round" || t.kind === "blossom";
      if (leafy && Math.random() < d * 0.05) {
        fx.leaf(t.x + (Math.random() - 0.5) * 0.9 * t.scale, 1.4 * t.scale, t.z + (Math.random() - 0.5) * 0.9 * t.scale, leafTone(t.kind, t.v, 0));
      }
      const near = Math.hypot(player.x - t.x, player.z - t.z) < 0.9 * t.scale;
      if (near && !brushed.current.has(i)) {
        brushed.current.add(i);
        if (leafy || t.kind === "tall") for (let k = 0; k < 4; k++) fx.leaf(t.x + (Math.random() - 0.5), 1.5 * t.scale, t.z + (Math.random() - 0.5), leafTone(t.kind, t.v, 0));
      } else if (!near) brushed.current.delete(i);
    });
  });

  return (
    <group>
      {groups.map(({ kind, list, parts }) => (
        <group key={kind}>
          <Instanced geometry={parts.trunk} material={trunkMat} items={list.map((t) => ({ x: t.x, z: t.z, rot: t.rot, scale: t.scale, color: palette.trunk }))} />
          {parts.leaves.map((g, li) => (
            <Instanced key={li} geometry={g} material={leafMat} items={list.map((t) => ({ x: t.x, z: t.z, rot: t.rot, scale: t.scale, color: leafTone(kind, t.v, parts.tones[li] ? 1 : 0) }))} />
          ))}
        </group>
      ))}
    </group>
  );
}

/* ================================================================== */
/*  Rocks, bushes, mushrooms                                           */
/* ================================================================== */

function Rocks() {
  const geoA = facet("rockA", () => new THREE.DodecahedronGeometry(0.42, 0), 0.08, 3, [1.2, 0.7, 1]);
  const geoB = facet("rockB", () => new THREE.IcosahedronGeometry(0.36, 0), 0.07, 4, [1, 0.8, 1.3]);
  const moss = facet("moss", () => new THREE.SphereGeometry(0.4, 7, 3, 0, Math.PI * 2, 0, Math.PI * 0.32), 0.03, 5, [1.15, 0.9, 1]);
  const a = rocks.filter((_, i) => i % 2 === 0);
  const b = rocks.filter((_, i) => i % 2 === 1);
  const rockMat = mat("#ffffff", { roughness: 0.95 });
  return (
    <group>
      <Instanced geometry={geoA} material={rockMat} items={a.map((r) => ({ x: r.x, y: 0.1 * r.scale, z: r.z, rot: r.rot, scale: r.scale, color: palette.stone[r.v % 4] }))} />
      <Instanced geometry={geoB} material={rockMat} items={b.map((r) => ({ x: r.x, y: 0.1 * r.scale, z: r.z, rot: r.rot, scale: r.scale, color: palette.rock[r.v % 3] }))} />
      <Instanced geometry={moss} material={mat("#ffffff")} castShadow={false} items={a.filter((r) => r.v !== 1).map((r) => ({ x: r.x, y: 0.12 * r.scale, z: r.z, rot: r.rot, scale: r.scale * 1.0, color: "#86c77a" }))} />
    </group>
  );
}

function Bushes() {
  const geo = bake("bush", [
    { g: facet("b1", () => new THREE.IcosahedronGeometry(0.38, 1), 0.05, 11), p: [0, 0.3, 0] },
    { g: facet("b2", () => new THREE.IcosahedronGeometry(0.28, 1), 0.04, 12), p: [0.32, 0.22, 0.1] },
    { g: facet("b3", () => new THREE.IcosahedronGeometry(0.26, 1), 0.04, 13), p: [-0.28, 0.2, -0.08] },
  ]);
  const berry = bake("berries", [
    { g: new THREE.IcosahedronGeometry(0.05, 0), p: [0.12, 0.6, 0.25] },
    { g: new THREE.IcosahedronGeometry(0.05, 0), p: [-0.2, 0.45, 0.28] },
    { g: new THREE.IcosahedronGeometry(0.05, 0), p: [0.42, 0.35, 0.22] },
    { g: new THREE.IcosahedronGeometry(0.05, 0), p: [0.25, 0.5, -0.2] },
    { g: new THREE.IcosahedronGeometry(0.05, 0), p: [-0.3, 0.32, 0.12] },
  ]);
  const bushMat = swayMaterial("bush", { wind: 0.05, push: 0.35, pushR: 0.9, squash: 0.12 });
  const berryMat = swayMaterial("berry", { wind: 0.05, push: 0.35, pushR: 0.9, squash: 0.12, roughness: 0.4 });
  const tones = ["#5fb56f", "#6cc27a", "#56aa68", "#74c883"];
  const berryColors = ["#ff6b5b", "#f5f0ff", "#f5c451"];
  const brushed = useRef<Set<number>>(new Set());
  useFrame(() => {
    bushes.forEach((b, i) => {
      const near = Math.hypot(player.x - b.x, player.z - b.z) < 0.7 * b.scale && player.speed > 1;
      if (near && !brushed.current.has(i)) {
        brushed.current.add(i);
        for (let k = 0; k < 3; k++) fx.leaf(b.x + (Math.random() - 0.5) * 0.5, 0.5, b.z + (Math.random() - 0.5) * 0.5, tones[b.v]);
      } else if (!near) brushed.current.delete(i);
    });
  });
  return (
    <group>
      <Instanced geometry={geo} material={bushMat} items={bushes.map((b) => ({ x: b.x, z: b.z, rot: b.rot, scale: b.scale, color: tones[b.v] }))} />
      <Instanced geometry={berry} material={berryMat} castShadow={false} items={bushes.filter((b) => b.v < 3).map((b) => ({ x: b.x, z: b.z, rot: b.rot, scale: b.scale, color: berryColors[b.v] }))} />
    </group>
  );
}

function Mushrooms() {
  const stem = bake("m-stem", [{ g: new THREE.CylinderGeometry(0.035, 0.045, 0.14, 6), p: [0, 0.07, 0] }]);
  const cap = bake("m-cap", [{ g: new THREE.SphereGeometry(0.1, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2), p: [0, 0.12, 0], s: [1, 0.75, 1] }]);
  const dots = bake("m-dots", [
    { g: new THREE.IcosahedronGeometry(0.018, 0), p: [0.04, 0.19, 0.03] },
    { g: new THREE.IcosahedronGeometry(0.015, 0), p: [-0.05, 0.18, 0.02] },
    { g: new THREE.IcosahedronGeometry(0.016, 0), p: [0.0, 0.2, -0.05] },
  ]);
  return (
    <group>
      <Instanced geometry={stem} material={mat("#ffffff")} items={mushrooms.map((m) => ({ x: m.x, z: m.z, rot: m.rot, scale: m.scale, color: "#f7efe0" }))} />
      <Instanced geometry={cap} material={mat("#ffffff", { roughness: 0.5 })} items={mushrooms.map((m) => ({ x: m.x, z: m.z, rot: m.rot, scale: m.scale, color: m.v ? "#e8604f" : "#c98a52" }))} />
      <Instanced geometry={dots} material={mat("#fffaf0")} castShadow={false} items={mushrooms.filter((m) => m.v).map((m) => ({ x: m.x, z: m.z, rot: m.rot, scale: m.scale }))} />
    </group>
  );
}

/* ================================================================== */
/*  Grass & flowers (bend away from the player)                        */
/* ================================================================== */

function tuftGeometry() {
  return cached("grass-tuft", () => {
    const pos: number[] = [];
    const col: number[] = [];
    const base = new THREE.Color("#5fae62");
    const tip = new THREE.Color("#b8e79a");
    const blades = [
      [0, 0, 0.3, 0.0],
      [0.06, 0.03, 0.22, 2.1],
      [-0.05, -0.04, 0.25, 4.2],
      [0.02, -0.06, 0.18, 1.2],
    ];
    for (const [bx, bz, h, a] of blades) {
      const w = 0.035;
      const dx = Math.cos(a) * w;
      const dz = Math.sin(a) * w;
      const lean = 0.06;
      const tx = bx + Math.cos(a + 1.57) * lean;
      const tz = bz + Math.sin(a + 1.57) * lean;
      pos.push(bx - dx, 0, bz - dz, bx + dx, 0, bz + dz, tx, h, tz);
      col.push(base.r, base.g, base.b, base.r, base.g, base.b, tip.r, tip.g, tip.b);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  });
}

function Grass() {
  const geo = tuftGeometry();
  const m = swayMaterial("grass", { wind: 1.1, push: 0.55, pushR: 0.8, squash: 0.35, vertexColors: true, side: THREE.DoubleSide });
  const tints = ["#ffffff", "#e9f5d8", "#f4ffe4"];
  return <Instanced geometry={geo} material={m} castShadow={false} items={grass.map((g) => ({ x: g.x, z: g.z, rot: g.rot, scale: g.scale, sy: 0.9 + (g.v * 0.15), color: tints[g.v] }))} />;
}

const FLOWER_COLORS = ["#ff7a6b", "#f5c451", "#b9a7ff", "#ffffff", "#ff9fc4"];

function Flowers() {
  const stem = bake("f-stem", [
    { g: new THREE.CylinderGeometry(0.012, 0.016, 0.32, 4), p: [0, 0.16, 0] },
    { g: new THREE.ConeGeometry(0.04, 0.1, 3), p: [0.04, 0.1, 0], r: [0, 0, -0.9] },
  ]);
  const petals = bake(
    "f-petals",
    Array.from({ length: 5 }, (_, i) => {
      const a = (i / 5) * Math.PI * 2;
      return { g: new THREE.IcosahedronGeometry(0.05, 0), p: [Math.cos(a) * 0.055, 0.33, Math.sin(a) * 0.055] as [number, number, number], s: [1, 0.35, 0.7] as [number, number, number], r: [0, -a, 0] as [number, number, number] };
    }),
  );
  const center = bake("f-center", [{ g: new THREE.IcosahedronGeometry(0.03, 0), p: [0, 0.345, 0] }]);
  const stemMat = swayMaterial("f-stem", { wind: 0.5, push: 0.6, pushR: 0.7, squash: 0.3 });
  const petalMat = swayMaterial("f-petal", { wind: 0.5, push: 0.6, pushR: 0.7, squash: 0.3, roughness: 0.6 });
  const items = flowers.map((f) => ({ x: f.x, z: f.z, rot: f.rot, scale: f.scale }));
  return (
    <group>
      <Instanced geometry={stem} material={stemMat} castShadow={false} items={items.map((it) => ({ ...it, color: "#5aa860" }))} />
      <Instanced geometry={petals} material={petalMat} castShadow={false} items={flowers.map((f, i) => ({ ...items[i], color: FLOWER_COLORS[f.v] }))} />
      <Instanced geometry={center} material={petalMat} castShadow={false} items={flowers.map((f, i) => ({ ...items[i], color: f.v === 1 ? "#e07b39" : "#f5c451" }))} />
    </group>
  );
}

export const Vegetation = memo(function Vegetation() {
  return (
    <group>
      <WindDriver />
      <Trees />
      <Rocks />
      <Bushes />
      <Mushrooms />
      <Grass />
      <Flowers />
    </group>
  );
});

/* ================================================================== */
/*  Sky props                                                          */
/* ================================================================== */

export function Cloud({ position, scale = 1, speed = 0.15, seed = 1 }: { position: [number, number, number]; scale?: number; speed?: number; seed?: number }) {
  const ref = useRef<THREE.Group>(null);
  const puffs = useMemo(() => {
    const r = R(seed * 13);
    return Array.from({ length: 6 }, (_, i) => ({
      p: [(i - 2.5) * 0.55 + (r() - 0.5) * 0.3, (r() - 0.3) * 0.35 + (i === 2 || i === 3 ? 0.35 : 0), (r() - 0.5) * 0.6] as [number, number, number],
      s: 0.45 + r() * 0.4 + (i === 2 || i === 3 ? 0.2 : 0),
      g: i % 3,
    }));
  }, [seed]);
  const geos = [0, 1, 2].map((i) => facet(`cloud${i}`, () => new THREE.IcosahedronGeometry(1, 1), 0.08, 20 + i, [1, 0.8, 1]));
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.position.x = position[0] + Math.sin(t * speed + seed) * 3;
    ref.current.position.y = position[1] + Math.sin(t * 0.4 + seed * 2) * 0.25;
  });
  const white = mat("#ffffff", { roughness: 1, emissive: "#dfe9ff", emissiveIntensity: 0.25 });
  return (
    <group ref={ref} position={position} scale={scale}>
      {puffs.map((p, i) => (
        <mesh key={i} geometry={geos[p.g]} material={white} position={p.p} scale={p.s} castShadow />
      ))}
    </group>
  );
}

export function MiniIsland({ position, scale = 1, seed = 1 }: { position: [number, number, number]; scale?: number; seed?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.position.y = position[1] + Math.sin(t * 0.5 + seed) * 0.35;
    ref.current.rotation.y = Math.sin(t * 0.1 + seed) * 0.1;
  });
  const top = facet(`mi-top${seed}`, () => new THREE.CylinderGeometry(1.5, 1.35, 0.35, 8), 0.06, seed);
  const bottom = facet(`mi-bot${seed}`, () => new THREE.ConeGeometry(1.35, 2.2, 8, 3), 0.12, seed + 3);
  const pine = treeParts("pine");
  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh geometry={top} material={mat(palette.grass[0])} position={[0, 0.9, 0]} />
      <mesh geometry={bottom} material={mat(palette.soil[1])} position={[0, -0.35, 0]} rotation={[Math.PI, 0, 0]} />
      <mesh geometry={pine.trunk} material={mat(palette.trunk)} position={[0.35, 1.05, 0.1]} scale={0.7} />
      {pine.leaves.map((g, i) => (
        <mesh key={i} geometry={g} material={mat(palette.pine[i])} position={[0.35, 1.05, 0.1]} scale={0.7} />
      ))}
      <mesh geometry={facet("mi-rock", () => new THREE.DodecahedronGeometry(0.3, 0), 0.06, 2)} material={mat(palette.stone[1])} position={[-0.6, 1.15, -0.2]} />
    </group>
  );
}
