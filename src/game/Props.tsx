import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

/* ---------- Materials helper ---------- */
export const Mat = ({ color, ...rest }: { color: string; roughness?: number; metalness?: number; emissive?: string; emissiveIntensity?: number }) => (
  <meshStandardMaterial color={color} flatShading roughness={0.85} metalness={0} {...rest} />
);

/* ---------- Tree ---------- */
export function Tree({
  position,
  scale = 1,
  variant = 0,
}: {
  position: [number, number, number];
  scale?: number;
  variant?: number;
}) {
  const greens = ["#6cc59a", "#4fb68a", "#8bd3a8", "#3fa97e"];
  const g = greens[variant % greens.length];
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.12, 0.16, 0.7, 6]} />
        <Mat color="#9c6b4a" />
      </mesh>
      <mesh castShadow position={[0, 1.05, 0]}>
        <coneGeometry args={[0.7, 1.1, 6]} />
        <Mat color={g} />
      </mesh>
      <mesh castShadow position={[0, 1.65, 0]}>
        <coneGeometry args={[0.52, 0.9, 6]} />
        <Mat color={g} />
      </mesh>
      <mesh castShadow position={[0, 2.15, 0]}>
        <coneGeometry args={[0.32, 0.7, 6]} />
        <Mat color={g} />
      </mesh>
    </group>
  );
}

/* ---------- Round tree ---------- */
export function RoundTree({ position, scale = 1, color = "#7fd8be" }: { position: [number, number, number]; scale?: number; color?: string }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.1, 0.14, 0.8, 5]} />
        <Mat color="#9c6b4a" />
      </mesh>
      <mesh castShadow position={[0, 1.15, 0]}>
        <dodecahedronGeometry args={[0.6, 0]} />
        <Mat color={color} />
      </mesh>
      <mesh castShadow position={[0.35, 0.95, 0.2]}>
        <dodecahedronGeometry args={[0.35, 0]} />
        <Mat color={color} />
      </mesh>
    </group>
  );
}

/* ---------- Rock ---------- */
export function Rock({ position, scale = 1, color = "#b8b4c9" }: { position: [number, number, number]; scale?: number; color?: string }) {
  return (
    <mesh castShadow receiveShadow position={position} scale={scale} rotation={[0.3, position[0], 0.2]}>
      <dodecahedronGeometry args={[0.4, 0]} />
      <Mat color={color} />
    </mesh>
  );
}

/* ---------- Bush ---------- */
export function Bush({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.25, 0]}>
        <icosahedronGeometry args={[0.35, 0]} />
        <Mat color="#5cc192" />
      </mesh>
      <mesh castShadow position={[0.3, 0.2, 0.1]}>
        <icosahedronGeometry args={[0.25, 0]} />
        <Mat color="#6ccf9d" />
      </mesh>
    </group>
  );
}

/* ---------- Flower ---------- */
export function Flower({ position, color = "#ff6b5b" }: { position: [number, number, number]; color?: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 4]} />
        <Mat color="#4fb68a" />
      </mesh>
      <mesh castShadow position={[0, 0.34, 0]}>
        <dodecahedronGeometry args={[0.1, 0]} />
        <Mat color={color} />
      </mesh>
    </group>
  );
}

/* ---------- Lamp post ---------- */
export function Lamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 1.8, 6]} />
        <Mat color="#3b3f57" />
      </mesh>
      <mesh castShadow position={[0, 1.85, 0]}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial color="#ffe9a8" emissive="#ffd45e" emissiveIntensity={0.9} flatShading />
      </mesh>
      <mesh position={[0, 2.05, 0]}>
        <coneGeometry args={[0.28, 0.2, 4]} />
        <Mat color="#3b3f57" />
      </mesh>
      <pointLight position={[0, 1.8, 0]} intensity={1.4} distance={4} color="#ffd45e" />
    </group>
  );
}

/* ---------- Cloud (floating, drifting) ---------- */
export function Cloud({ position, scale = 1, speed = 0.15 }: { position: [number, number, number]; scale?: number; speed?: number }) {
  const ref = useRef<Group>(null);
  const start = position[0];
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.position.x = start + Math.sin(t * speed + position[2]) * 2.5;
    ref.current.position.y = position[1] + Math.sin(t * 0.5 + position[0]) * 0.2;
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh>
        <dodecahedronGeometry args={[0.8, 0]} />
        <Mat color="#ffffff" />
      </mesh>
      <mesh position={[0.9, -0.1, 0.1]}>
        <dodecahedronGeometry args={[0.6, 0]} />
        <Mat color="#ffffff" />
      </mesh>
      <mesh position={[-0.85, -0.15, -0.1]}>
        <dodecahedronGeometry args={[0.55, 0]} />
        <Mat color="#ffffff" />
      </mesh>
      <mesh position={[0.2, 0.35, -0.3]}>
        <dodecahedronGeometry args={[0.5, 0]} />
        <Mat color="#ffffff" />
      </mesh>
    </group>
  );
}

/* ---------- Floating mini island in the distance ---------- */
export function MiniIsland({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = position[1] + Math.sin(clock.getElapsedTime() * 0.6 + position[0]) * 0.3;
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh>
        <cylinderGeometry args={[1.4, 0.2, 1.6, 7]} />
        <Mat color="#9c6b4a" />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[1.45, 1.4, 0.3, 7]} />
        <Mat color="#8bd3a8" />
      </mesh>
      <Tree position={[0.3, 1, 0.2]} scale={0.7} variant={1} />
      <Rock position={[-0.6, 1.05, -0.3]} scale={0.6} />
    </group>
  );
}

/* ---------- Scattered decoration generator ---------- */
export function useScatter(seed: number, count: number, minR: number, maxR: number) {
  return useMemo(() => {
    let s = seed;
    const rnd = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    const items: { pos: [number, number, number]; scale: number; v: number }[] = [];
    for (let i = 0; i < count; i++) {
      const a = rnd() * Math.PI * 2;
      const r = minR + rnd() * (maxR - minR);
      items.push({ pos: [Math.cos(a) * r, 0, Math.sin(a) * r], scale: 0.7 + rnd() * 0.6, v: Math.floor(rnd() * 4) });
    }
    return items;
  }, [seed, count, minR, maxR]);
}
