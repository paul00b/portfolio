import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Group, Mesh } from "three";
import { mat } from "./lowpoly";
import { fx } from "./Effects";
import { useActive } from "./active";
import type { Landmark } from "../data/projects";

/** Shared flat material, attached to the parent mesh. */
const Mat = ({ color, ...rest }: { color: string; roughness?: number; metalness?: number; emissive?: string; emissiveIntensity?: number }) => (
  <primitive object={mat(color, rest)} attach="material" />
);

/** Floating hero object: lifts, bobs harder and spins faster while you stand nearby. */
function Hover({ children, y = 0, amp = 0.15, spin = true }: { children: React.ReactNode; y?: number; amp?: number; spin?: boolean }) {
  const ref = useRef<Group>(null);
  const active = useActive();
  const acc = useRef(Math.random() * 6);
  useFrame(({ clock }, dt) => {
    if (!ref.current) return;
    const k = active.current;
    const t = clock.elapsedTime;
    acc.current += Math.min(dt, 0.05) * (0.6 + k * 2.6);
    ref.current.position.y = y + Math.sin(t * (1.5 + k)) * amp * (1 + k * 0.6) + k * 0.3;
    if (spin) ref.current.rotation.y = acc.current;
    else ref.current.rotation.z = Math.sin(t * 5) * 0.06 * k;
    const sc = 1 + k * 0.12;
    ref.current.scale.setScalar(sc);
  });
  return <group ref={ref}>{children}</group>;
}

/** Emits particles from a local point at a given rate. */
function Emitter({ position, rate, kind, color }: { position: [number, number, number]; rate: number; kind: "smoke" | "sparkle"; color?: string }) {
  const ref = useRef<Group>(null);
  const v = useMemo(() => new THREE.Vector3(), []);
  const active = useActive();
  useFrame((_, dt) => {
    if (!ref.current) return;
    const r = rate * (1 + active.current * 1.5);
    if (Math.random() > Math.min(dt, 0.05) * r) return;
    ref.current.getWorldPosition(v);
    if (kind === "smoke") fx.smoke(v.x, v.y, v.z);
    else fx.sparkle(v.x + (Math.random() - 0.5) * 0.8, v.y + (Math.random() - 0.5) * 0.4, v.z + (Math.random() - 0.5) * 0.8, color);
  });
  return <group ref={ref} position={position} />;
}

/* ---------- BANK: a card-shaped building + floating coin ---------- */
function Bank() {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.9, 0]}>
        <boxGeometry args={[2.2, 1.8, 1.6]} />
        <Mat color="#fff4f0" />
      </mesh>
      {/* columns */}
      {[-0.7, -0.23, 0.23, 0.7].map((x) => (
        <mesh key={x} castShadow position={[x, 0.85, 0.9]}>
          <cylinderGeometry args={[0.1, 0.1, 1.6, 6]} />
          <Mat color="#ffd3cc" />
        </mesh>
      ))}
      {/* roof */}
      <mesh castShadow position={[0, 2.05, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.75, 0.7, 4]} />
        <Mat color="#ff6b5b" />
      </mesh>
      {/* steps */}
      <mesh receiveShadow position={[0, 0.1, 1.15]}>
        <boxGeometry args={[2.4, 0.2, 0.6]} />
        <Mat color="#e4d4cf" />
      </mesh>
      <Emitter position={[0, 3.1, 0]} rate={3} kind="sparkle" color="#ffe28a" />
      {/* Floating coin */}
      <group position={[0, 3.1, 0]}>
        <Hover amp={0.12}>
          <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.45, 0.45, 0.12, 12]} />
            <meshStandardMaterial color="#f5c451" flatShading metalness={0.4} roughness={0.4} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.07]}>
            <torusGeometry args={[0.28, 0.05, 6, 12]} />
            <Mat color="#e0a929" />
          </mesh>
        </Hover>
      </group>
    </group>
  );
}

/* ---------- ASSISTANT (AMIA): a warm practice + a floating conversation ---------- */
function Assistant() {
  const dots = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!dots.current) return;
    const t = clock.getElapsedTime();
    dots.current.children.forEach((c, i) => {
      c.position.y = Math.sin(t * 4 - i * 0.6) * 0.05;
    });
  });
  return (
    <group>
      {/* practice body — warm, not clinical */}
      <mesh castShadow receiveShadow position={[0, 0.8, 0]}>
        <boxGeometry args={[2.1, 1.6, 1.6]} />
        <Mat color="#fff3e6" />
      </mesh>
      {/* plum roof slab */}
      <mesh castShadow receiveShadow position={[0, 1.72, 0]}>
        <boxGeometry args={[2.35, 0.26, 1.85]} />
        <Mat color="#4a2545" />
      </mesh>
      {/* wooden band */}
      <mesh position={[0, 0.24, 0]}>
        <boxGeometry args={[2.14, 0.28, 1.64]} />
        <Mat color="#a9754c" />
      </mesh>
      {/* warm windows */}
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x, 1.0, 0.81]}>
          <boxGeometry args={[0.5, 0.5, 0.04]} />
          <meshStandardMaterial color="#ffeec2" emissive="#ffd889" emissiveIntensity={0.4} flatShading />
        </mesh>
      ))}
      {/* daffodil door */}
      <mesh position={[0, 0.6, 0.81]}>
        <boxGeometry args={[0.5, 1.0, 0.04]} />
        <Mat color="#f5c451" />
      </mesh>
      {/* floating conversation bubble */}
      <group position={[0, 2.95, 0]}>
        <Hover amp={0.13} spin={false}>
          <mesh castShadow>
            <boxGeometry args={[1.5, 0.9, 0.22]} />
            <Mat color="#ffffff" />
          </mesh>
          <mesh position={[-0.25, -0.58, 0]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.2, 0.35, 3]} />
            <Mat color="#ffffff" />
          </mesh>
          {/* typing dots */}
          <group ref={dots} position={[0, 0, 0.13]}>
            {[-0.36, 0, 0.36].map((x) => (
              <mesh key={x} position={[x, 0, 0]}>
                <sphereGeometry args={[0.11, 8, 8]} />
                <Mat color="#4a2545" />
              </mesh>
            ))}
          </group>
        </Hover>
      </group>
      {/* the spark of the assistant */}
      <group position={[1.15, 3.5, 0.3]}>
        <Hover amp={0.09}>
          <mesh castShadow>
            <octahedronGeometry args={[0.24, 0]} />
            <meshStandardMaterial color="#f5c451" emissive="#f5c451" emissiveIntensity={0.7} flatShading />
          </mesh>
        </Hover>
      </group>
      <pointLight position={[0, 2.9, 0.5]} intensity={1.4} distance={4} color="#ffd889" />
    </group>
  );
}

/* ---------- GYM (Gymlib x Wellpass): a club + a floating dumbbell ---------- */
function Gym() {
  const bell = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (bell.current) bell.current.rotation.z = Math.sin(clock.getElapsedTime() * 1.2) * 0.25;
  });
  return (
    <group>
      {/* club body */}
      <mesh castShadow receiveShadow position={[0, 0.75, 0]}>
        <boxGeometry args={[2.3, 1.5, 1.7]} />
        <Mat color="#ffffff" />
      </mesh>
      {/* mint canopy */}
      <mesh castShadow receiveShadow position={[0, 1.62, 0]}>
        <boxGeometry args={[2.55, 0.24, 1.95]} />
        <Mat color="#3fb994" />
      </mesh>
      {/* glass front */}
      <mesh position={[0, 0.85, 0.86]}>
        <boxGeometry args={[1.9, 1.0, 0.04]} />
        <meshStandardMaterial color="#d8f6ec" emissive="#7fd8be" emissiveIntensity={0.3} flatShading />
      </mesh>
      <mesh position={[0, 0.2, 0.87]}>
        <boxGeometry args={[2.3, 0.3, 0.05]} />
        <Mat color="#2f9c7c" />
      </mesh>
      {/* rolled mats outside */}
      {[0, 1].map((i) => (
        <mesh key={i} castShadow position={[-1.45, 0.2 + i * 0.34, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.8, 8]} />
          <Mat color={i ? "#f5c451" : "#ff6b5b"} />
        </mesh>
      ))}
      {/* floating dumbbell */}
      <group position={[0, 3.0, 0]}>
        <Hover amp={0.14} spin={false}>
          <group ref={bell} rotation={[0, 0.5, 0]}>
            <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.09, 0.09, 1.5, 8]} />
              <Mat color="#c9d2e0" />
            </mesh>
            {[-0.62, 0.62].map((x) => (
              <group key={x}>
                <mesh castShadow position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.36, 0.36, 0.3, 8]} />
                  <Mat color="#2f9c7c" />
                </mesh>
                <mesh position={[x * 1.28, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.26, 0.26, 0.22, 8]} />
                  <Mat color="#7fd8be" />
                </mesh>
              </group>
            ))}
          </group>
        </Hover>
      </group>
    </group>
  );
}

/* ---------- AGENCY (Redpill): a studio + a very large red pill ---------- */
function Agency() {
  const pill = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (pill.current) pill.current.rotation.z = clock.getElapsedTime() * 0.5;
  });
  return (
    <group>
      {/* studio */}
      <mesh castShadow receiveShadow position={[0, 0.8, 0]}>
        <boxGeometry args={[2.2, 1.6, 1.6]} />
        <Mat color="#f2eefe" />
      </mesh>
      {/* sawtooth workshop roof */}
      {[-0.55, 0.1, 0.75].map((x) => (
        <mesh key={x} castShadow position={[x, 1.78, 0]} rotation={[0, 0, -0.5]}>
          <boxGeometry args={[0.55, 0.5, 1.65]} />
          <Mat color="#b9a7ff" />
        </mesh>
      ))}
      {/* three client screens, three brands */}
      {[
        { x: -0.62, c: "#ff6b5b" },
        { x: 0, c: "#f5c451" },
        { x: 0.62, c: "#8fc7ff" },
      ].map((w) => (
        <mesh key={w.x} position={[w.x, 0.95, 0.81]}>
          <boxGeometry args={[0.46, 0.6, 0.05]} />
          <meshStandardMaterial color={w.c} emissive={w.c} emissiveIntensity={0.28} flatShading />
        </mesh>
      ))}
      <mesh position={[0, 0.35, 0.81]}>
        <boxGeometry args={[0.5, 0.7, 0.04]} />
        <Mat color="#7358f5" />
      </mesh>
      {/* the red pill */}
      <group position={[0, 3.0, 0]}>
        <Hover amp={0.14} spin={false}>
          <group ref={pill} rotation={[0, 0, 0.6]}>
            <mesh castShadow position={[0, 0.3, 0]}>
              <cylinderGeometry args={[0.34, 0.34, 0.6, 10]} />
              <Mat color="#e4503f" />
            </mesh>
            <mesh castShadow position={[0, 0.6, 0]}>
              <sphereGeometry args={[0.34, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <Mat color="#e4503f" />
            </mesh>
            <mesh castShadow position={[0, -0.3, 0]}>
              <cylinderGeometry args={[0.34, 0.34, 0.6, 10]} />
              <Mat color="#fff6f4" />
            </mesh>
            <mesh castShadow position={[0, -0.6, 0]} rotation={[Math.PI, 0, 0]}>
              <sphereGeometry args={[0.34, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <Mat color="#fff6f4" />
            </mesh>
          </group>
        </Hover>
      </group>
      {/* paint bucket by the door */}
      <mesh castShadow position={[1.45, 0.2, 0.6]}>
        <cylinderGeometry args={[0.22, 0.18, 0.4, 8]} />
        <Mat color="#b9a7ff" />
      </mesh>
    </group>
  );
}

/* ---------- SYSTEM (Primary foundations): a tower of tokens & components ---------- */
function System() {
  const blocks: { p: [number, number, number]; s: [number, number, number]; c: string }[] = [
    { p: [0, 0.25, 0], s: [1.9, 0.5, 1.9], c: "#4a2545" },
    { p: [-0.28, 0.75, 0.2], s: [1.35, 0.5, 1.35], c: "#fff3e6" },
    { p: [0.2, 1.25, -0.2], s: [1.1, 0.5, 1.1], c: "#8e3f7a" },
    { p: [0, 1.75, 0.1], s: [0.85, 0.5, 0.85], c: "#f5c451" },
    { p: [0.08, 2.25, -0.08], s: [0.6, 0.5, 0.6], c: "#fff3e6" },
  ];
  return (
    <group>
      {blocks.map((b, i) => (
        <mesh key={i} castShadow receiveShadow position={b.p}>
          <boxGeometry args={b.s} />
          <Mat color={b.c} />
        </mesh>
      ))}
      {/* a toggle, because every system has one */}
      <group position={[1.5, 0.35, 0.85]}>
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.18, 0.4, 2, 8]} />
          <Mat color="#f5c451" />
        </mesh>
        <mesh position={[0.2, 0, 0]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <Mat color="#ffffff" />
        </mesh>
      </group>
      {/* floating design token */}
      <group position={[0, 3.15, 0]}>
        <Hover amp={0.12}>
          <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.42, 0.42, 0.14, 6]} />
            <Mat color="#f5c451" />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.08]}>
            <cylinderGeometry args={[0.22, 0.22, 0.06, 6]} />
            <Mat color="#4a2545" />
          </mesh>
        </Hover>
      </group>
      {/* loose components waiting to be adopted */}
      <mesh castShadow position={[-1.5, 0.12, 0.7]}>
        <boxGeometry args={[0.5, 0.24, 0.5]} />
        <Mat color="#8e3f7a" />
      </mesh>
      <mesh castShadow position={[-1.35, 0.34, 0.55]}>
        <boxGeometry args={[0.34, 0.2, 0.34]} />
        <Mat color="#fff3e6" />
      </mesh>
    </group>
  );
}

/* ---------- ROCKET: tiny planet + rocket ---------- */
function Rocket() {
  const ring = useRef<Group>(null);
  const flame = useRef<Mesh>(null);
  const active = useActive();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ring.current) ring.current.rotation.y = t * 0.8;
    if (flame.current) {
      const f = 1 + Math.sin(t * 31) * 0.12 + Math.sin(t * 17) * 0.1 + active.current * 0.8;
      flame.current.scale.set(1 + active.current * 0.3, f, 1 + active.current * 0.3);
    }
  });
  return (
    <group>
      {/* planet */}
      <mesh castShadow receiveShadow position={[0, 1.0, 0]}>
        <icosahedronGeometry args={[1.0, 1]} />
        <Mat color="#3d4680" />
      </mesh>
      {/* craters */}
      {[
        [0.7, 1.5, 0.4],
        [-0.6, 1.3, 0.7],
        [0.2, 0.6, 0.9],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <dodecahedronGeometry args={[0.16, 0]} />
          <Mat color="#2a3160" />
        </mesh>
      ))}
      {/* rocket on top */}
      <group position={[0, 2.0, 0]}>
        <mesh castShadow position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.28, 0.32, 1.0, 8]} />
          <Mat color="#ffffff" />
        </mesh>
        <mesh castShadow position={[0, 1.25, 0]}>
          <coneGeometry args={[0.28, 0.5, 8]} />
          <Mat color="#ff6b5b" />
        </mesh>
        <mesh position={[0, 0.6, 0.29]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#8fc7ff" emissive="#8fc7ff" emissiveIntensity={0.5} flatShading />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} castShadow position={[Math.cos((i * Math.PI * 2) / 3) * 0.32, 0.05, Math.sin((i * Math.PI * 2) / 3) * 0.32]} rotation={[0, -(i * Math.PI * 2) / 3, 0]}>
            <boxGeometry args={[0.22, 0.4, 0.06]} />
            <Mat color="#ff6b5b" />
          </mesh>
        ))}
        {/* flame */}
        <Emitter position={[0, -0.35, 0]} rate={5} kind="smoke" />
        <mesh ref={flame} position={[0, -0.15, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.16, 0.35, 6]} />
          <meshStandardMaterial color="#f5c451" emissive="#ffb347" emissiveIntensity={1.2} flatShading />
        </mesh>
      </group>
      {/* orbiting satellite */}
      <group ref={ring} position={[0, 1.2, 0]}>
        <mesh castShadow position={[1.7, 0.3, 0]}>
          <boxGeometry args={[0.25, 0.25, 0.25]} />
          <Mat color="#f5c451" />
        </mesh>
        <mesh position={[1.7, 0.3, 0]}>
          <boxGeometry args={[0.8, 0.04, 0.3]} />
          <Mat color="#8fc7ff" />
        </mesh>
      </group>
      <pointLight position={[0, 2.2, 0]} intensity={2} distance={4} color="#ffb347" />
    </group>
  );
}

/* ---------- SCHOOL (The Hacking Project): a desk, a terminal, a graduation cap ---------- */
function School() {
  const caret = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (caret.current) caret.current.visible = Math.floor(clock.getElapsedTime() * 2) % 2 === 0;
  });
  return (
    <group>
      {/* desk */}
      <mesh castShadow receiveShadow position={[0, 0.72, 0]}>
        <boxGeometry args={[2.4, 0.16, 1.5]} />
        <Mat color="#c98f5f" />
      </mesh>
      {[
        [-1.05, 0.6],
        [1.05, 0.6],
        [-1.05, -0.6],
        [1.05, -0.6],
      ].map(([x, z], i) => (
        <mesh key={i} castShadow position={[x, 0.34, z]}>
          <boxGeometry args={[0.14, 0.68, 0.14]} />
          <Mat color="#a9754c" />
        </mesh>
      ))}
      {/* laptop */}
      <group position={[-0.15, 0.8, 0.05]} rotation={[0, 0.35, 0]}>
        <mesh castShadow position={[0, 0.03, 0.3]}>
          <boxGeometry args={[1.1, 0.06, 0.72]} />
          <Mat color="#e3e8f2" />
        </mesh>
        <mesh castShadow position={[0, 0.42, -0.05]} rotation={[-0.32, 0, 0]}>
          <boxGeometry args={[1.1, 0.74, 0.06]} />
          <Mat color="#2f7fd6" />
        </mesh>
        <mesh position={[0, 0.42, -0.01]} rotation={[-0.32, 0, 0]}>
          <boxGeometry args={[0.94, 0.6, 0.02]} />
          <meshStandardMaterial color="#0f1a2e" emissive="#123055" emissiveIntensity={0.5} flatShading />
        </mesh>
        {/* code lines on the screen */}
        {[0.16, 0.03, -0.1].map((y, i) => (
          <mesh key={y} position={[-0.2 + i * 0.06, 0.42 + y, 0.005]} rotation={[-0.32, 0, 0]}>
            <boxGeometry args={[0.4 - i * 0.08, 0.05, 0.01]} />
            <Mat color={["#8fc7ff", "#7fd8be", "#f5c451"][i]} />
          </mesh>
        ))}
        <mesh ref={caret} position={[0.22, 0.19, 0.005]} rotation={[-0.32, 0, 0]}>
          <boxGeometry args={[0.05, 0.09, 0.01]} />
          <Mat color="#ffffff" />
        </mesh>
      </group>
      {/* a small stack of books */}
      {[
        { y: 0.85, c: "#ff6b5b" },
        { y: 0.97, c: "#f5c451" },
        { y: 1.09, c: "#b9a7ff" },
      ].map((b) => (
        <mesh key={b.y} castShadow position={[0.85, b.y, -0.2]} rotation={[0, 0.2, 0]}>
          <boxGeometry args={[0.5, 0.12, 0.66]} />
          <Mat color={b.c} />
        </mesh>
      ))}
      {/* floating graduation cap */}
      <group position={[0, 2.6, 0]}>
        <Hover amp={0.12}>
          <mesh castShadow position={[0, -0.12, 0]}>
            <cylinderGeometry args={[0.26, 0.3, 0.24, 8]} />
            <Mat color="#232946" />
          </mesh>
          <mesh castShadow position={[0, 0.04, 0]} rotation={[0, Math.PI / 4, 0]}>
            <boxGeometry args={[0.95, 0.08, 0.95]} />
            <Mat color="#232946" />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <Mat color="#f5c451" />
          </mesh>
          <mesh position={[0.34, -0.05, 0.34]}>
            <boxGeometry args={[0.05, 0.34, 0.05]} />
            <Mat color="#f5c451" />
          </mesh>
        </Hover>
      </group>
    </group>
  );
}

/* ---------- ABOUT: tiny Parisian house ---------- */
export function House() {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.9, 0]}>
        <boxGeometry args={[2, 1.8, 1.6]} />
        <Mat color="#fbe7c6" />
      </mesh>
      <mesh castShadow position={[0, 2.15, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.6, 0.9, 4]} />
        <Mat color="#4a5580" />
      </mesh>
      <mesh castShadow position={[0.5, 2.5, -0.3]}>
        <boxGeometry args={[0.25, 0.6, 0.25]} />
        <Mat color="#e4d4cf" />
      </mesh>
      <Emitter position={[0.5, 2.85, -0.3]} rate={2.2} kind="smoke" />
      {/* flower boxes */}
      {[-0.55, 0.55].map((x) => (
        <group key={x} position={[x, 0.93, 0.95]}>
          {[-0.15, 0, 0.15].map((dx, i) => (
            <mesh key={dx} position={[dx, 0.07, 0]}>
              <icosahedronGeometry args={[0.07, 0]} />
              <Mat color={["#ff7a6b", "#f5c451", "#ff9fc4"][i]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* windows with balconies */}
      {[-0.55, 0.55].map((x) => (
        <group key={x}>
          <mesh position={[x, 1.15, 0.81]}>
            <boxGeometry args={[0.4, 0.6, 0.04]} />
            <meshStandardMaterial color="#fff2c9" emissive="#ffd889" emissiveIntensity={0.35} flatShading />
          </mesh>
          <mesh position={[x, 0.85, 0.9]}>
            <boxGeometry args={[0.5, 0.04, 0.2]} />
            <Mat color="#232946" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.45, 0.81]}>
        <boxGeometry args={[0.45, 0.9, 0.04]} />
        <Mat color="#ff6b5b" />
      </mesh>
    </group>
  );
}

/* ---------- CONTACT: mailbox ---------- */
export function Mailbox() {
  return (
    <group>
      <mesh castShadow position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 1, 6]} />
        <Mat color="#3b3f57" />
      </mesh>
      <mesh castShadow position={[0, 1.2, 0]}>
        <boxGeometry args={[0.7, 0.55, 0.9]} />
        <Mat color="#f5c451" />
      </mesh>
      <mesh castShadow position={[0, 1.48, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.35, 0.35, 0.7, 10, 1, false, 0, Math.PI]} />
        <Mat color="#f5c451" />
      </mesh>
      <mesh position={[0.36, 1.2, 0]}>
        <boxGeometry args={[0.02, 0.35, 0.6]} />
        <Mat color="#e0a929" />
      </mesh>
      <MailFlag />
      {/* floating letter */}
      <group position={[0, 2.3, 0]}>
        <Hover amp={0.12}>
          <mesh castShadow>
            <boxGeometry args={[0.7, 0.45, 0.05]} />
            <Mat color="#ffffff" />
          </mesh>
          <mesh position={[0, 0.02, 0.03]}>
            <boxGeometry args={[0.16, 0.16, 0.02]} />
            <Mat color="#ff6b5b" />
          </mesh>
        </Hover>
      </group>
    </group>
  );
}

function MailFlag() {
  const ref = useRef<Group>(null);
  const active = useActive();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const k = active.current;
    ref.current.rotation.x = -Math.PI / 2 + k * (Math.PI / 2) + Math.sin(clock.elapsedTime * 8) * 0.08 * k;
  });
  return (
    <group ref={ref} position={[-0.38, 1.1, -0.25]}>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.03, 0.5, 0.03]} />
        <Mat color="#3b3f57" />
      </mesh>
      <mesh position={[0, 0.42, 0.1]}>
        <boxGeometry args={[0.03, 0.16, 0.2]} />
        <Mat color="#ff6b5b" />
      </mesh>
    </group>
  );
}

export function LandmarkModel({ type }: { type: Landmark }) {
  switch (type) {
    case "assistant":
      return <Assistant />;
    case "system":
      return <System />;
    case "gym":
      return <Gym />;
    case "bank":
      return <Bank />;
    case "agency":
      return <Agency />;
    case "school":
      return <School />;
    case "rocket":
      return <Rocket />;
  }
}
