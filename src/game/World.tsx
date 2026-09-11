import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { Bush, Cloud, Flower, Lamp, Mat, MiniIsland, Rock, RoundTree, Tree, useScatter } from "./Props";
import { House, LandmarkModel, Mailbox } from "./Landmarks";
import { stations, WORLD_RADIUS, type Station } from "./stations";
import { profile } from "../data/projects";
import { tr, type Lang } from "../i18n/lang";

/* ---------- Island body ---------- */
function Island() {
  const geometry = useMemo(() => {
    const g = new THREE.CylinderGeometry(WORLD_RADIUS + 1.2, WORLD_RADIUS - 3, 3.2, 28, 1);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const r = Math.hypot(x, z);
      if (r < 0.01) continue;
      const a = Math.atan2(z, x);
      const jitter = 1 + 0.045 * Math.sin(a * 7 + 1) + 0.035 * Math.cos(a * 13 + 2);
      pos.setX(i, (x / r) * r * jitter);
      pos.setZ(i, (z / r) * r * jitter);
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <group position={[0, -1.6, 0]}>
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial attach="material-0" color="#a37556" flatShading roughness={0.9} />
        <meshStandardMaterial attach="material-1" color="#9bdc9c" flatShading roughness={0.95} />
        <meshStandardMaterial attach="material-2" color="#7a5238" flatShading />
      </mesh>
      {/* Dirt layers for a cake-like look */}
      <mesh position={[0, -1.9, 0]}>
        <cylinderGeometry args={[WORLD_RADIUS - 3.5, WORLD_RADIUS - 7, 1.4, 24]} />
        <Mat color="#8a5f42" />
      </mesh>
      <mesh position={[0, -3, 0]}>
        <coneGeometry args={[WORLD_RADIUS - 8, 2.5, 14]} />
        <Mat color="#6e4a32" />
      </mesh>
    </group>
  );
}

/* ---------- Path from center to a point ---------- */
function Path({ to, width = 1.7 }: { to: [number, number]; width?: number }) {
  const len = Math.hypot(to[0], to[1]);
  const angle = Math.atan2(to[0], to[1]);
  return (
    <mesh receiveShadow position={[to[0] / 2, 0.02, to[1] / 2]} rotation={[0, angle, 0]}>
      <boxGeometry args={[width, 0.05, len]} />
      <Mat color="#ecdfc4" />
    </mesh>
  );
}

/* ---------- Station platform + label ---------- */
function StationNode({ station, near, lang }: { station: Station; near: boolean; lang: Lang }) {
  const ring = useRef<THREE.Mesh>(null);
  const glow = useRef(0);
  useFrame(({ clock }, d) => {
    glow.current = THREE.MathUtils.lerp(glow.current, near ? 1 : 0, d * 6);
    if (ring.current) {
      const t = clock.getElapsedTime();
      const s = 1 + glow.current * (0.05 + Math.sin(t * 4) * 0.03);
      ring.current.scale.set(s, s, s);
      const m = ring.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.15 + glow.current * 0.9;
      m.opacity = 0.35 + glow.current * 0.65;
    }
  });

  const [x, z] = station.position;
  const isProject = station.kind === "project";
  const platformColor = isProject ? station.color : station.kind === "about" ? "#fbe7c6" : "#f5c451";

  return (
    <group position={[x, 0, z]}>
      {/* platform */}
      <mesh receiveShadow castShadow position={[0, 0.15, 0]}>
        <cylinderGeometry args={[2.6, 2.8, 0.3, 8]} />
        <Mat color="#fffaf1" />
      </mesh>
      <mesh receiveShadow position={[0, 0.31, 0]}>
        <cylinderGeometry args={[2.2, 2.2, 0.04, 8]} />
        <Mat color={platformColor} />
      </mesh>
      {/* glow ring */}
      <mesh ref={ring} position={[0, 0.34, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.35, 2.6, 8]} />
        <meshStandardMaterial color="#ffffff" emissive={station.color === "#232946" ? "#8fc7ff" : station.color} emissiveIntensity={0.2} transparent opacity={0.4} flatShading />
      </mesh>

      <group position={[0, 0.33, 0]}>
        {station.kind === "project" && station.project && <LandmarkModel type={station.project.landmark} />}
        {station.kind === "about" && <House />}
        {station.kind === "contact" && <Mailbox />}
      </group>

      {/* label */}
      <Html position={[0, isProject ? 4.4 : 3.6, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
        <div
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-ink bg-white px-2.5 py-1 font-mono text-[11px] font-bold tracking-wide text-ink transition-all duration-300 ${
            near ? "scale-110 shadow-hard" : "scale-100 opacity-80 shadow-hard-sm"
          }`}
        >
          <span className="inline-block h-2 w-2 rounded-full border border-ink" style={{ background: station.color }} />
          {tr(station.label, lang)}
          {station.project?.favorite && <span>★</span>}
        </div>
      </Html>
    </group>
  );
}

/* ---------- Central plaza with sign ---------- */
function Plaza({ lang }: { lang: Lang }) {
  return (
    <group>
      <mesh receiveShadow position={[0, 0.03, 0]}>
        <cylinderGeometry args={[3.6, 3.6, 0.06, 10]} />
        <Mat color="#ecdfc4" />
      </mesh>
      <mesh receiveShadow position={[0, 0.07, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 0.04, 10]} />
        <Mat color="#ff6b5b" />
      </mesh>
      {/* Signpost */}
      <group position={[2.2, 0, -2.2]}>
        <mesh castShadow position={[0, 1, 0]}>
          <cylinderGeometry args={[0.07, 0.09, 2, 6]} />
          <Mat color="#9c6b4a" />
        </mesh>
        <mesh castShadow position={[0.1, 1.7, 0]} rotation={[0, 0.6, 0]}>
          <boxGeometry args={[1.4, 0.4, 0.08]} />
          <Mat color="#ffffff" />
        </mesh>
        <mesh castShadow position={[-0.1, 1.2, 0]} rotation={[0, -0.5, 0]}>
          <boxGeometry args={[1.2, 0.4, 0.08]} />
          <Mat color="#f5c451" />
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
      <Lamp position={[-2.4, 0, -2.4]} />
      <Lamp position={[2.4, 0, 2.4]} />
      <Bush position={[-2.6, 0, 2.5]} />
      <Flower position={[-2.9, 0, 2]} color="#f5c451" />
      <Flower position={[-2.2, 0, 3]} color="#b9a7ff" />
    </group>
  );
}

/* ---------- Distance from point to segment (for scatter filtering) ---------- */
function distToSeg(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax;
  const dz = bz - az;
  const l2 = dx * dx + dz * dz || 1;
  let t = ((px - ax) * dx + (pz - az) * dz) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}

function Decorations() {
  const trees = useScatter(7, 46, 5, WORLD_RADIUS - 1);
  const rocks = useScatter(21, 16, 4, WORLD_RADIUS - 0.5);
  const bushes = useScatter(33, 22, 4, WORLD_RADIUS - 1);
  const flowers = useScatter(51, 40, 3, WORLD_RADIUS - 2);

  const free = (p: [number, number, number], margin: number) => {
    for (const s of stations) {
      if (Math.hypot(p[0] - s.position[0], p[2] - s.position[1]) < 3.4 + margin) return false;
      if (s.kind !== "home" && distToSeg(p[0], p[2], 0, 0, s.position[0], s.position[1]) < 1.4 + margin) return false;
    }
    return true;
  };

  return (
    <group>
      {trees.filter((t) => free(t.pos, 0.4)).map((t, i) => (i % 3 === 0 ? <RoundTree key={`t${i}`} position={t.pos} scale={t.scale} color={["#7fd8be", "#ffb4a2", "#8bd3a8"][t.v % 3]} /> : <Tree key={`t${i}`} position={t.pos} scale={t.scale} variant={t.v} />))}
      {rocks.filter((t) => free(t.pos, 0)).map((t, i) => (
        <Rock key={`r${i}`} position={t.pos} scale={t.scale * 0.8} color={t.v % 2 ? "#b8b4c9" : "#d7d2e3"} />
      ))}
      {bushes.filter((t) => free(t.pos, 0)).map((t, i) => (
        <Bush key={`b${i}`} position={t.pos} scale={t.scale} />
      ))}
      {flowers.filter((t) => free(t.pos, -0.6)).map((t, i) => (
        <Flower key={`f${i}`} position={t.pos} color={["#ff6b5b", "#f5c451", "#b9a7ff", "#ffffff"][t.v]} />
      ))}
    </group>
  );
}

export function World({ nearId, lang }: { nearId: string | null; lang: Lang }) {
  return (
    <group>
      <Island />
      <Plaza lang={lang} />
      {stations
        .filter((s) => s.kind !== "home")
        .map((s) => (
          <Path key={`p-${s.id}`} to={s.position} />
        ))}
      {stations
        .filter((s) => s.kind !== "home")
        .map((s) => (
          <StationNode key={s.id} station={s} near={nearId === s.id} lang={lang} />
        ))}
      <Decorations />

      {/* Sky stuff */}
      <Cloud position={[-14, 9, -6]} scale={1.4} />
      <Cloud position={[12, 11, -12]} scale={1.1} speed={0.1} />
      <Cloud position={[16, 8, 6]} scale={0.9} speed={0.2} />
      <Cloud position={[-6, 12, 14]} scale={1.2} speed={0.12} />
      <MiniIsland position={[-30, -6, 8]} scale={1.3} />
      <MiniIsland position={[28, -9, -14]} scale={1.1} />
      <MiniIsland position={[6, -12, 32]} scale={1.6} />
    </group>
  );
}
