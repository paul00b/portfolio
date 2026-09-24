import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { cached, mat, rng } from "./lowpoly";
import { meadows, player } from "./layout";
import { WORLD_RADIUS } from "./stations";

/* ================================================================== */
/*  Pooled particles                                                   */
/* ================================================================== */

interface Particle {
  alive: boolean;
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  age: number; life: number;
  size: number; grow: number;
  gravity: number; drag: number;
  rx: number; ry: number; rz: number;
  sx: number; sy: number; sz: number;
  wobble: number; seed: number;
  color: THREE.Color;
}

class Pool {
  items: Particle[];
  cursor = 0;
  constructor(public cap: number) {
    this.items = Array.from({ length: cap }, () => ({
      alive: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, age: 0, life: 1, size: 1, grow: 1,
      gravity: 0, drag: 0, rx: 0, ry: 0, rz: 0, sx: 0, sy: 0, sz: 0, wobble: 0, seed: 0, color: new THREE.Color(),
    }));
  }
  spawn(p: Partial<Omit<Particle, "color">> & { color: string }) {
    const it = this.items[this.cursor];
    this.cursor = (this.cursor + 1) % this.cap;
    Object.assign(it, {
      alive: true, age: 0, vx: 0, vy: 0, vz: 0, life: 1, size: 0.2, grow: 1, gravity: 0, drag: 0,
      rx: Math.random() * 6, ry: Math.random() * 6, rz: Math.random() * 6, sx: 0, sy: 0, sz: 0, wobble: 0, seed: Math.random() * 100,
      ...p,
      color: it.color.set(p.color),
    });
  }
}

const pools = {
  puff: new Pool(320),
  bit: new Pool(360),
  glow: new Pool(200),
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

/** Everything that spawns particles goes through here. */
export const fx = {
  dust(x: number, y: number, z: number, n = 3) {
    for (let i = 0; i < n; i++) {
      pools.puff.spawn({
        x: x + rand(-0.12, 0.12), y: y + 0.05, z: z + rand(-0.12, 0.12),
        vx: rand(-0.6, 0.6), vy: rand(0.4, 1.1), vz: rand(-0.6, 0.6),
        life: rand(0.4, 0.65), size: rand(0.05, 0.085), grow: 1.8, drag: 3.5,
        color: pick(["#f3ead8", "#ece0c6", "#fbf6ec"]),
      });
    }
  },
  land(x: number, y: number, z: number) {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      pools.puff.spawn({
        x: x + Math.cos(a) * 0.25, y: y + 0.06, z: z + Math.sin(a) * 0.25,
        vx: Math.cos(a) * rand(2, 3), vy: rand(0.2, 0.6), vz: Math.sin(a) * rand(2, 3),
        life: rand(0.45, 0.65), size: rand(0.07, 0.1), grow: 1.7, drag: 5,
        color: pick(["#f3ead8", "#fbf6ec"]),
      });
    }
  },
  splash(x: number, y: number, z: number, n = 7) {
    for (let i = 0; i < n; i++) {
      pools.bit.spawn({
        x, y: y + 0.05, z,
        vx: rand(-1.2, 1.2), vy: rand(2.2, 3.8), vz: rand(-1.2, 1.2),
        life: rand(0.45, 0.7), size: rand(0.05, 0.09), gravity: -14, drag: 0.5,
        sx: rand(-8, 8), sy: rand(-8, 8), color: pick(["#dff6ff", "#9fdcf2", "#ffffff"]),
      });
    }
    pools.puff.spawn({ x, y: y + 0.03, z, life: 0.5, size: 0.22, grow: 2.6, drag: 2, color: "#e6f8ff" });
  },
  confetti(x: number, y: number, z: number, colors: string[]) {
    for (let i = 0; i < 46; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = rand(0.6, 2.6);
      pools.bit.spawn({
        x, y, z,
        vx: Math.cos(a) * s, vy: rand(5, 9), vz: Math.sin(a) * s,
        life: rand(1.6, 2.6), size: rand(0.08, 0.13), gravity: -9, drag: 1.6, wobble: 1.2,
        sx: rand(-12, 12), sy: rand(-12, 12), sz: rand(-12, 12),
        color: pick(colors),
      });
    }
    for (let i = 0; i < 16; i++) {
      pools.glow.spawn({
        x: x + rand(-0.5, 0.5), y: y + rand(0, 1), z: z + rand(-0.5, 0.5),
        vx: rand(-1, 1), vy: rand(1.5, 3.5), vz: rand(-1, 1),
        life: rand(0.8, 1.4), size: rand(0.05, 0.09), drag: 1.5, sx: 4, sy: 4, color: "#fff3b0",
      });
    }
  },
  leaf(x: number, y: number, z: number, color: string) {
    pools.bit.spawn({
      x, y, z, vx: rand(0.1, 0.5), vy: rand(-0.2, 0.1), vz: rand(-0.3, 0.3),
      life: rand(2.8, 4.2), size: rand(0.08, 0.12), gravity: -0.9, drag: 1.8, wobble: 2.2,
      sx: rand(-3, 3), sy: rand(-3, 3), sz: rand(-3, 3), color,
    });
  },
  smoke(x: number, y: number, z: number) {
    pools.puff.spawn({
      x: x + rand(-0.05, 0.05), y, z: z + rand(-0.05, 0.05),
      vx: rand(0.1, 0.35), vy: rand(0.5, 0.8), vz: rand(-0.1, 0.1),
      life: rand(2.2, 3), size: rand(0.1, 0.14), grow: 3.2, drag: 0.3, color: pick(["#f4f1ea", "#e9e5dc"]),
    });
  },
  sparkle(x: number, y: number, z: number, color = "#fff3b0") {
    pools.glow.spawn({
      x, y, z, vx: rand(-0.2, 0.2), vy: rand(0.5, 1.2), vz: rand(-0.2, 0.2),
      life: rand(0.9, 1.6), size: rand(0.04, 0.07), drag: 0.8, sx: 3, sy: 3, color,
    });
  },
  mist(x: number, y: number, z: number) {
    pools.puff.spawn({
      x: x + rand(-0.4, 0.4), y, z: z + rand(-0.3, 0.3),
      vx: rand(-0.3, 0.3), vy: rand(-0.4, 0.3), vz: rand(0.1, 0.6),
      life: rand(1, 1.6), size: rand(0.12, 0.2), grow: 2.4, drag: 1.2, color: "#f2fbff",
    });
  },
  drop(x: number, y: number, z: number, vx: number, vy: number, vz: number) {
    pools.bit.spawn({ x, y, z, vx, vy, vz, life: 0.9, size: 0.045, gravity: -9.8, color: pick(["#cdefff", "#ffffff", "#9fdcf2"]) });
  },
};

const dummy = new THREE.Object3D();

function PoolMesh({ pool, geometry, material }: { pool: Pool; geometry: THREE.BufferGeometry; material: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useFrame(({ clock }, dt) => {
    const mesh = ref.current;
    if (!mesh) return;
    const d = Math.min(dt, 0.05);
    const t = clock.elapsedTime;
    for (let i = 0; i < pool.cap; i++) {
      const p = pool.items[i];
      if (!p.alive) {
        dummy.scale.setScalar(0);
        dummy.position.set(0, -999, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        continue;
      }
      p.age += d;
      if (p.age >= p.life) {
        p.alive = false;
        continue;
      }
      const k = Math.exp(-p.drag * d);
      p.vx *= k;
      p.vz *= k;
      p.vy = p.vy * (p.gravity ? 1 : k) + p.gravity * d;
      p.x += p.vx * d + (p.wobble ? Math.sin(t * 3 + p.seed) * p.wobble * d : 0);
      p.y += p.vy * d;
      p.z += p.vz * d + (p.wobble ? Math.cos(t * 2.3 + p.seed) * p.wobble * 0.6 * d : 0);
      p.rx += p.sx * d;
      p.ry += p.sy * d;
      p.rz += p.sz * d;
      const u = p.age / p.life;
      const inK = Math.min(1, u / 0.12);
      const outK = u < 0.6 ? 1 : 1 - (u - 0.6) / 0.4;
      const s = p.size * (1 + (p.grow - 1) * u) * inK * outK;
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.rx, p.ry, p.rz);
      dummy.scale.setScalar(Math.max(0, s));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, p.color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, pool.cap]}
      frustumCulled={false}
      onUpdate={(m) => {
        m.setColorAt(0, new THREE.Color("#ffffff"));
      }}
    />
  );
}

export function Particles() {
  const puffGeo = useMemo(() => cached("fx-puff", () => new THREE.IcosahedronGeometry(1, 0)), []);
  const bitGeo = useMemo(() => cached("fx-bit", () => new THREE.BoxGeometry(1, 1, 0.25)), []);
  const glowGeo = useMemo(() => cached("fx-glow", () => new THREE.OctahedronGeometry(1, 0)), []);
  const puffMat = useMemo(() => new THREE.MeshStandardMaterial({ flatShading: true, roughness: 1 }), []);
  const bitMat = useMemo(() => new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.7, side: THREE.DoubleSide }), []);
  const glowMat = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []);
  return (
    <group>
      <PoolMesh pool={pools.puff} geometry={puffGeo} material={puffMat} />
      <PoolMesh pool={pools.bit} geometry={bitGeo} material={bitMat} />
      <PoolMesh pool={pools.glow} geometry={glowGeo} material={glowMat} />
    </group>
  );
}

/* ================================================================== */
/*  Pollen / light motes drifting over the island                      */
/* ================================================================== */

export function Pollen({ count = 140 }: { count?: number }) {
  const { gl } = useThree();
  const [geo, material] = useMemo(() => {
    const r = rng(77);
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * (WORLD_RADIUS + 2);
      pos[i * 3] = Math.cos(a) * d;
      pos[i * 3 + 1] = 0.4 + r() * 4;
      pos[i * 3 + 2] = Math.sin(a) * d;
      seed[i] = r();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("seed", new THREE.BufferAttribute(seed, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uSize: { value: 7 * Math.min(2, gl.getPixelRatio()) }, uZoom: { value: 1 } },
      vertexShader: /* glsl */ `
        uniform float uTime; uniform float uSize; uniform float uZoom;
        attribute float seed;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          float t = uTime * (0.25 + seed * 0.2);
          p.x += sin(t + seed * 31.0) * 0.9;
          p.y += sin(t * 1.3 + seed * 17.0) * 0.5;
          p.z += cos(t * 0.8 + seed * 11.0) * 0.9;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          float tw = 0.55 + 0.45 * sin(uTime * (1.5 + seed * 2.0) + seed * 40.0);
          vAlpha = tw;
          gl_PointSize = uSize * uZoom * (0.6 + seed * 0.6) * (0.7 + 0.3 * tw);
        }`,
      fragmentShader: /* glsl */ `
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          a = a * a;
          gl_FragColor = vec4(vec3(1.0, 0.95, 0.75) * a * vAlpha * 0.9, a * vAlpha);
        }`,
    });
    return [g, m];
  }, [count, gl]);

  useFrame(({ clock, camera }) => {
    material.uniforms.uTime.value = clock.elapsedTime;
    material.uniforms.uZoom.value = (camera as THREE.OrthographicCamera).zoom / 45;
  });
  return <points geometry={geo} material={material} frustumCulled={false} />;
}

/* ================================================================== */
/*  Butterflies (they flee when you walk up to them)                   */
/* ================================================================== */

function wingGeometry() {
  return cached("butterfly-wing", () => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.bezierCurveTo(0.05, 0.22, 0.28, 0.26, 0.26, 0.1);
    s.bezierCurveTo(0.25, 0.02, 0.2, -0.02, 0.12, -0.03);
    s.bezierCurveTo(0.22, -0.08, 0.18, -0.2, 0.06, -0.14);
    s.lineTo(0, 0);
    const g = new THREE.ShapeGeometry(s, 3);
    g.rotateX(-Math.PI / 2);
    return g;
  });
}

const BUTTERFLY_COLORS = ["#ffffff", "#f5c451", "#ff8a7a", "#b9a7ff", "#8fc7ff", "#ffb4d9", "#f5c451"];

function Butterfly({ home, color, seed }: { home: [number, number]; color: string; seed: number }) {
  const g = useRef<THREE.Group>(null);
  const wl = useRef<THREE.Mesh>(null);
  const wr = useRef<THREE.Mesh>(null);
  const st = useRef({ ox: 0, oy: 0, oz: 0, px: home[0], py: 1, pz: home[1] });
  const wmat = useMemo(() => new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, flatShading: true, roughness: 0.6 }), [color]);
  const geo = wingGeometry();
  useFrame(({ clock }, dt) => {
    const d = Math.min(dt, 0.05);
    const t = clock.elapsedTime + seed * 10;
    const s = st.current;
    const bx = home[0] + Math.sin(t * 0.37) * 2.2 + Math.sin(t * 1.1) * 0.4;
    const bz = home[1] + Math.cos(t * 0.29) * 2.2 + Math.cos(t * 0.9) * 0.4;
    const by = 0.9 + Math.sin(t * 0.8) * 0.35 + Math.abs(Math.sin(t * 5)) * 0.08;
    const dx = s.px - player.x;
    const dz = s.pz - player.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 2 && dist > 0.001) {
      const push = (2 - dist) * 9 * d;
      s.ox += (dx / dist) * push;
      s.oz += (dz / dist) * push;
      s.oy += push * 0.6;
    }
    const decay = Math.exp(-d * 0.35);
    s.ox *= decay;
    s.oz *= decay;
    s.oy *= Math.exp(-d * 0.6);
    const nx = bx + s.ox;
    const ny = by + Math.min(s.oy, 3);
    const nz = bz + s.oz;
    const vx = nx - s.px;
    const vz = nz - s.pz;
    s.px = nx;
    s.py = ny;
    s.pz = nz;
    if (g.current) {
      g.current.position.set(nx, ny, nz);
      if (Math.abs(vx) + Math.abs(vz) > 1e-5) g.current.rotation.y = Math.atan2(vx, vz);
    }
    const flap = 0.25 + Math.abs(Math.sin(t * 16)) * 1.15;
    if (wl.current) wl.current.rotation.z = flap;
    if (wr.current) wr.current.rotation.z = -flap;
  });
  return (
    <group ref={g} scale={0.9}>
      <mesh material={mat("#3a2f3f")} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.018, 0.14, 2, 4]} />
      </mesh>
      <group rotation={[0, -Math.PI / 2, 0]}>
        <mesh ref={wl} geometry={geo} material={wmat} />
        <mesh ref={wr} geometry={geo} material={wmat} scale={[-1, 1, 1]} />
      </group>
    </group>
  );
}

export function Butterflies() {
  const list = useMemo(() => meadows.slice(0, 9).map((m, i) => ({ home: m, color: BUTTERFLY_COLORS[i % BUTTERFLY_COLORS.length], seed: i * 1.7 })), []);
  return (
    <group>
      {list.map((b, i) => (
        <Butterfly key={i} {...b} />
      ))}
    </group>
  );
}

/* ================================================================== */
/*  Birds circling high above                                          */
/* ================================================================== */

function Bird({ radius, height, speed, phase, cx, cz }: { radius: number; height: number; speed: number; phase: number; cx: number; cz: number }) {
  const g = useRef<THREE.Group>(null);
  const l = useRef<THREE.Group>(null);
  const r = useRef<THREE.Group>(null);
  const wing = useMemo(
    () =>
      cached("bird-wing", () => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0.12, 0, 0, -0.12, 0.55, 0.02, -0.05], 3));
        geo.computeVertexNormals();
        return geo;
      }),
    [],
  );
  const wmat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f4f1ea", side: THREE.DoubleSide, flatShading: true }), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * speed + phase;
    if (g.current) {
      g.current.position.set(cx + Math.cos(t) * radius, height + Math.sin(t * 2.3) * 0.4, cz + Math.sin(t) * radius);
      g.current.rotation.y = -t + (speed > 0 ? Math.PI : 0);
      g.current.rotation.z = 0.25 * Math.sign(speed);
    }
    const cycle = (clock.elapsedTime * 0.6 + phase) % 3;
    const f = cycle < 1.2 ? Math.sin(cycle * 14) * 0.7 : 0.08;
    if (l.current) l.current.rotation.z = f;
    if (r.current) r.current.rotation.z = -f;
  });
  return (
    <group ref={g}>
      <mesh material={mat("#f4f1ea")} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.07, 0.4, 4]} />
      </mesh>
      <group ref={l}>
        <mesh geometry={wing} material={wmat} />
      </group>
      <group ref={r} scale={[-1, 1, 1]}>
        <mesh geometry={wing} material={wmat} />
      </group>
    </group>
  );
}

export function Birds() {
  return (
    <group scale={0.5}>
      <Bird radius={36} height={22} speed={0.12} phase={0} cx={0} cz={0} />
      <Bird radius={37.5} height={22.6} speed={0.12} phase={0.18} cx={0} cz={0} />
      <Bird radius={34.8} height={23.2} speed={0.12} phase={0.3} cx={0} cz={0} />
      <Bird radius={42} height={16} speed={-0.09} phase={2} cx={-6} cz={4} />
    </group>
  );
}
