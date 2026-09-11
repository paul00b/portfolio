import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { controls, onJump } from "./useControls";
import { obstacles, stations, WORLD_RADIUS, type Station } from "./stations";
import { Mat } from "./Props";
import { ui } from "../data/ui";
import { tr, type Lang } from "../i18n/lang";

const CAM_OFFSET = new THREE.Vector3(18, 18, 18);
const SCREEN_UP = new THREE.Vector3(-1, 0, -1).normalize();
const SCREEN_RIGHT = new THREE.Vector3(1, 0, -1).normalize();

const SPEED = 6.5;
const GRAVITY = -32;
const JUMP_V = 10.5;

interface PlayerProps {
  enabled: boolean;
  onNearChange: (station: Station | null) => void;
  posRef: React.MutableRefObject<{ x: number; z: number; angle: number }>;
  near: Station | null;
  lang: Lang;
}

function groundHeightAt(x: number, z: number) {
  for (const s of stations) {
    if (s.kind === "home") continue;
    if (Math.hypot(x - s.position[0], z - s.position[1]) < 2.55) return 0.33;
  }
  return 0;
}

/* Typewriter speech bubble */
function SpeechBubble({ station, lang }: { station: Station | null; lang: Lang }) {
  const [text, setText] = useState("");
  const full = station ? tr(station.quote, lang) : "";
  useEffect(() => {
    if (!station) return;
    setText("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setText(full.slice(0, i));
      if (i >= full.length) window.clearInterval(id);
    }, 18);
    return () => window.clearInterval(id);
  }, [station, full]);

  if (!station) return null;
  const showHint = station.kind !== "home";
  return (
    <div className="animate-pop relative w-[240px] sm:w-[280px] select-none">
      <div className="rounded-2xl border-2 border-ink bg-white px-4 py-3 shadow-hard">
        <div className="mb-1 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-coral">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-coral" /> Paul
        </div>
        <p className="text-[13px] leading-snug text-ink font-medium">
          {text}
          <span className="animate-blink ml-0.5 inline-block h-3 w-1.5 translate-y-0.5 bg-ink" />
        </p>
        {showHint && (
          <div className="mt-2 flex items-center gap-2 font-mono text-[11px] text-ink-soft">
            <span className="kbd animate-key">E</span>
            {tr(station.kind === "project" ? ui.openProject : station.kind === "about" ? ui.aboutMe : ui.contactHint, lang)}
          </div>
        )}
      </div>
      {/* tail */}
      <div className="absolute left-1/2 -bottom-[9px] h-4 w-4 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-ink bg-white" />
    </div>
  );
}

export function Player({ enabled, onNearChange, posRef, near, lang }: PlayerProps) {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const footL = useRef<THREE.Mesh>(null);
  const footR = useRef<THREE.Mesh>(null);
  const eyes = useRef<THREE.Group>(null);
  const antenna = useRef<THREE.Group>(null);

  const state = useRef({
    pos: new THREE.Vector3(0, 0, 3),
    vy: 0,
    grounded: true,
    facing: 0,
    speed: 0,
    squash: 1,
    walkT: 0,
    blinkT: 2,
    nearId: null as string | null,
    wantJump: false,
  });

  const { camera, size } = useThree();
  const camTarget = useMemo(() => new THREE.Vector3(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  // Jump events (edge-triggered)
  useEffect(() => {
    return onJump(() => {
      if (enabled) state.current.wantJump = true;
    });
  }, [enabled]);

  // Camera zoom responsive
  useEffect(() => {
    const cam = camera as THREE.OrthographicCamera;
    const z = THREE.MathUtils.clamp(Math.min(size.width, size.height) / 15, 22, 58);
    cam.zoom = z;
    cam.updateProjectionMatrix();
  }, [camera, size]);

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    const s = state.current;

    // --- input → direction
    tmp.set(0, 0, 0);
    if (enabled) {
      if (controls.up) tmp.add(SCREEN_UP);
      if (controls.down) tmp.sub(SCREEN_UP);
      if (controls.right) tmp.add(SCREEN_RIGHT);
      if (controls.left) tmp.sub(SCREEN_RIGHT);
    }
    const moving = tmp.lengthSq() > 0;
    if (moving) tmp.normalize();

    // smooth speed
    s.speed = THREE.MathUtils.lerp(s.speed, moving ? SPEED : 0, d * (moving ? 12 : 16));
    if (moving) {
      const targetAngle = Math.atan2(tmp.x, tmp.z);
      let diff = targetAngle - s.facing;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      s.facing += diff * Math.min(1, d * 14);
    }
    const dirX = Math.sin(s.facing);
    const dirZ = Math.cos(s.facing);
    s.pos.x += dirX * s.speed * d;
    s.pos.z += dirZ * s.speed * d;

    // --- obstacles
    for (const o of obstacles) {
      const dx = s.pos.x - o.x;
      const dz = s.pos.z - o.z;
      const dist = Math.hypot(dx, dz);
      const min = o.r + 0.45;
      if (dist < min && dist > 0.0001) {
        s.pos.x = o.x + (dx / dist) * min;
        s.pos.z = o.z + (dz / dist) * min;
      }
    }
    // --- world bounds
    const r = Math.hypot(s.pos.x, s.pos.z);
    const maxR = WORLD_RADIUS - 1.2;
    if (r > maxR) {
      s.pos.x = (s.pos.x / r) * maxR;
      s.pos.z = (s.pos.z / r) * maxR;
    }

    // --- vertical
    const ground = groundHeightAt(s.pos.x, s.pos.z);
    if (s.wantJump && s.grounded) {
      s.vy = JUMP_V;
      s.grounded = false;
      s.squash = 1.35;
    }
    s.wantJump = false;
    s.vy += GRAVITY * d;
    s.pos.y += s.vy * d;
    if (s.pos.y <= ground) {
      if (!s.grounded && s.vy < -4) s.squash = 0.6; // landing squash
      s.pos.y = ground;
      s.vy = 0;
      s.grounded = true;
    } else if (s.pos.y > ground + 0.02) {
      s.grounded = false;
    }
    s.squash = THREE.MathUtils.lerp(s.squash, 1, d * 10);

    // --- animation
    s.walkT += d * s.speed * 2.2;
    const bob = s.grounded ? Math.abs(Math.sin(s.walkT)) * 0.12 * (s.speed / SPEED) : 0;
    if (group.current) {
      group.current.position.set(s.pos.x, s.pos.y, s.pos.z);
      group.current.rotation.y = s.facing;
    }
    if (body.current) {
      body.current.position.y = 0.5 + bob;
      const sq = s.squash;
      body.current.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
      body.current.rotation.x = THREE.MathUtils.lerp(body.current.rotation.x, (s.speed / SPEED) * 0.22, d * 8);
    }
    if (footL.current && footR.current) {
      const sw = s.grounded ? Math.sin(s.walkT) * 0.22 * (s.speed / SPEED) : 0.15;
      footL.current.position.z = sw;
      footR.current.position.z = -sw;
      footL.current.position.y = 0.08 + Math.max(0, Math.sin(s.walkT)) * 0.08 * (s.speed / SPEED);
      footR.current.position.y = 0.08 + Math.max(0, -Math.sin(s.walkT)) * 0.08 * (s.speed / SPEED);
    }
    if (antenna.current) {
      antenna.current.rotation.x = THREE.MathUtils.lerp(antenna.current.rotation.x, -(s.speed / SPEED) * 0.5 - s.vy * 0.03, d * 6);
    }
    // blink
    s.blinkT -= d;
    if (eyes.current) {
      const closed = s.blinkT < 0.12 && s.blinkT > 0;
      eyes.current.scale.y = THREE.MathUtils.lerp(eyes.current.scale.y, closed ? 0.1 : 1, d * 30);
      if (s.blinkT <= 0) s.blinkT = 2.5 + Math.random() * 3;
    }
    if (shadow.current) {
      const k = Math.max(0.35, 1 - (s.pos.y - ground) * 0.25);
      shadow.current.scale.set(k, k, 1);
      shadow.current.position.y = ground - s.pos.y + 0.02;
      (shadow.current.material as THREE.MeshBasicMaterial).opacity = 0.22 * k;
    }

    // --- camera follow
    camTarget.lerp(s.pos, 1 - Math.pow(0.001, d));
    camera.position.copy(camTarget).add(CAM_OFFSET);
    camera.lookAt(camTarget);

    // --- share position
    posRef.current.x = s.pos.x;
    posRef.current.z = s.pos.z;
    posRef.current.angle = s.facing;

    // --- proximity
    let found: Station | null = null;
    let best = Infinity;
    for (const st of stations) {
      const dist = Math.hypot(s.pos.x - st.position[0], s.pos.z - st.position[1]);
      if (dist < st.radius && dist < best) {
        best = dist;
        found = st;
      }
    }
    const id = found?.id ?? null;
    if (id !== s.nearId) {
      s.nearId = id;
      onNearChange(found);
    }
  });

  return (
    <group ref={group}>
      {/* blob shadow */}
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.5, 16]} />
        <meshBasicMaterial color="#1f2233" transparent opacity={0.22} />
      </mesh>

      {/* feet */}
      <mesh ref={footL} castShadow position={[0.22, 0.08, 0]}>
        <sphereGeometry args={[0.17, 8, 6]} />
        <Mat color="#232946" />
      </mesh>
      <mesh ref={footR} castShadow position={[-0.22, 0.08, 0]}>
        <sphereGeometry args={[0.17, 8, 6]} />
        <Mat color="#232946" />
      </mesh>

      {/* body */}
      <group ref={body} position={[0, 0.5, 0]}>
        <mesh castShadow>
          <icosahedronGeometry args={[0.52, 1]} />
          <meshStandardMaterial color="#ff6b5b" flatShading roughness={0.6} />
        </mesh>
        {/* belly patch */}
        <mesh position={[0, -0.1, 0.36]} scale={[1, 0.9, 0.5]}>
          <icosahedronGeometry args={[0.28, 1]} />
          <Mat color="#ffd9c2" />
        </mesh>
        {/* eyes */}
        <group ref={eyes} position={[0, 0.12, 0.42]}>
          {[-0.16, 0.16].map((x) => (
            <group key={x} position={[x, 0, 0]}>
              <mesh>
                <sphereGeometry args={[0.11, 10, 10]} />
                <meshStandardMaterial color="#ffffff" roughness={0.3} />
              </mesh>
              <mesh position={[0, 0, 0.08]}>
                <sphereGeometry args={[0.055, 8, 8]} />
                <meshStandardMaterial color="#1f2233" roughness={0.2} />
              </mesh>
              <mesh position={[0.025, 0.03, 0.12]}>
                <sphereGeometry args={[0.02, 6, 6]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>
          ))}
        </group>
        {/* blush */}
        {[-0.3, 0.3].map((x) => (
          <mesh key={x} position={[x, -0.02, 0.36]} scale={[1, 0.6, 0.3]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#ff9d8f" roughness={1} />
          </mesh>
        ))}
        {/* tiny glasses (designer!) */}
        <mesh position={[0, 0.12, 0.48]}>
          <boxGeometry args={[0.1, 0.02, 0.02]} />
          <Mat color="#232946" />
        </mesh>
        {[-0.16, 0.16].map((x) => (
          <mesh key={x} position={[x, 0.12, 0.46]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.135, 0.015, 6, 14]} />
            <Mat color="#232946" />
          </mesh>
        ))}
        {/* antenna */}
        <group ref={antenna} position={[0, 0.45, 0]}>
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.02, 0.03, 0.3, 5]} />
            <Mat color="#232946" />
          </mesh>
          <mesh castShadow position={[0, 0.34, 0]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#f5c451" emissive="#f5c451" emissiveIntensity={0.6} flatShading />
          </mesh>
        </group>
        {/* scarf */}
        <mesh position={[0, -0.28, 0]} rotation={[0.1, 0, 0]}>
          <torusGeometry args={[0.42, 0.09, 6, 12]} />
          <Mat color="#7fd8be" />
        </mesh>
        <mesh castShadow position={[0.28, -0.42, -0.25]} rotation={[0.3, 0, 0.4]}>
          <boxGeometry args={[0.14, 0.3, 0.08]} />
          <Mat color="#7fd8be" />
        </mesh>
      </group>

      {/* speech bubble */}
      <Html position={[0, 2.1, 0]} center zIndexRange={[50, 10]} style={{ pointerEvents: "none" }}>
        <div className="flex flex-col items-center" style={{ transform: "translateY(-50%)" }}>
          <SpeechBubble station={near} lang={lang} />
        </div>
      </Html>
    </group>
  );
}
