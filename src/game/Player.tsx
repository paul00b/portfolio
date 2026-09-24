import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { controls, onJump } from "./useControls";
import { obstacles, stations, type Station } from "./stations";
import { Character, type Motion } from "./Character";
import { fx } from "./Effects";
import { edgeRadius, FOUNTAIN_R, isWater, nav, player } from "./layout";
import { treeColliders } from "./scatter";
import { ui } from "../data/ui";
import { tr, type Lang } from "../i18n/lang";

const CAM_OFFSET = new THREE.Vector3(18, 18, 18);
const SCREEN_UP = new THREE.Vector3(-1, 0, -1).normalize();
const SCREEN_RIGHT = new THREE.Vector3(1, 0, -1).normalize();

const SPEED = 6.2;
const GRAVITY = -30;
const JUMP_V = 10;

const solids = [...obstacles, { x: 0, z: 0, r: FOUNTAIN_R + 0.05 }, ...treeColliders];

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
  if (isWater(x, z)) return -0.11;
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
    <div key={station.id} className="animate-pop relative w-[240px] select-none sm:w-[280px]">
      <div className="rounded-2xl border-2 border-ink bg-white px-4 py-3 shadow-hard">
        <div className="mb-1 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider" style={{ color: station.kind === "project" ? station.color : "#ff6b5b" }}>
          <span className="relative inline-flex h-1.5 w-1.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-60" />
            <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-current" />
          </span>
          Paul
        </div>
        <p className="text-[13px] font-medium leading-snug text-ink">
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
      <div className="absolute -bottom-[9px] left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-ink bg-white" />
    </div>
  );
}

export function Player({ enabled, onNearChange, posRef, near, lang }: PlayerProps) {
  const group = useRef<THREE.Group>(null);
  const motion = useRef<Motion>({ speed01: 0, grounded: true, vy: 0, turn: 0, landed: 0, waveT: 0, happy: false });

  const state = useRef({
    pos: new THREE.Vector3(0, 0, 3),
    vel: new THREE.Vector3(),
    vy: 0,
    grounded: true,
    facing: Math.PI / 4,
    speed: 0,
    nearId: null as string | null,
    wantJump: false,
    wasInWater: false,
    zoom: 0,
    stuckT: 0,
    lastDist: Infinity,
    helloT: 1.2,
  });

  const { camera, size } = useThree();
  const camTarget = useMemo(() => new THREE.Vector3(0, 0, 3), []);
  const lookAhead = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    return onJump(() => {
      if (enabled) state.current.wantJump = true;
    });
  }, [enabled]);

  useEffect(() => {
    motion.current.happy = !!near;
    if (near && near.kind !== "home") motion.current.waveT = 1.3;
  }, [near]);

  useFrame(({ clock }, dt) => {
    const d = Math.min(dt, 0.05);
    const s = state.current;
    const m = motion.current;

    // --- input → direction (keyboard wins over click-to-walk)
    dir.set(0, 0, 0);
    if (enabled) {
      if (controls.up) dir.add(SCREEN_UP);
      if (controls.down) dir.sub(SCREEN_UP);
      if (controls.right) dir.add(SCREEN_RIGHT);
      if (controls.left) dir.sub(SCREEN_RIGHT);
    }
    if (dir.lengthSq() > 0) {
      nav.active = false;
    } else if (nav.active && enabled) {
      const dx = nav.x - s.pos.x;
      const dz = nav.z - s.pos.z;
      const dist = Math.hypot(dx, dz);
      const arrived = dist < 0.3 || (nav.stationId !== null && s.nearId === nav.stationId && dist < 2.6);
      // give up if an obstacle keeps us from getting closer
      s.stuckT = dist > s.lastDist - 0.002 ? s.stuckT + d : 0;
      s.lastDist = dist;
      if (arrived || s.stuckT > 0.4) {
        nav.active = false;
        s.stuckT = 0;
        s.lastDist = Infinity;
      } else dir.set(dx, 0, dz);
    }
    const moving = dir.lengthSq() > 0;
    if (moving) dir.normalize();

    const inWater = isWater(s.pos.x, s.pos.z) && s.pos.y < 0.1;
    const top = SPEED * (inWater ? 0.62 : 1);
    s.speed = THREE.MathUtils.lerp(s.speed, moving ? top : 0, d * (moving ? 10 : 14));
    const prevFacing = s.facing;
    if (moving) {
      const targetAngle = Math.atan2(dir.x, dir.z);
      let diff = targetAngle - s.facing;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      s.facing += diff * Math.min(1, d * 13);
    }
    const turn = Math.atan2(Math.sin(s.facing - prevFacing), Math.cos(s.facing - prevFacing)) / Math.max(d, 1e-4);
    const px = s.pos.x;
    const pz = s.pos.z;
    s.pos.x += Math.sin(s.facing) * s.speed * d;
    s.pos.z += Math.cos(s.facing) * s.speed * d;

    // --- solids
    for (const o of solids) {
      const dx = s.pos.x - o.x;
      const dz = s.pos.z - o.z;
      const dist = Math.hypot(dx, dz);
      const min = o.r + 0.32;
      if (dist < min && dist > 0.0001) {
        s.pos.x = o.x + (dx / dist) * min;
        s.pos.z = o.z + (dz / dist) * min;
      }
    }
    // --- island edge
    const r = Math.hypot(s.pos.x, s.pos.z);
    const maxR = edgeRadius(Math.atan2(s.pos.z, s.pos.x)) - 1.1;
    if (r > maxR) {
      s.pos.x = (s.pos.x / r) * maxR;
      s.pos.z = (s.pos.z / r) * maxR;
    }
    s.vel.set((s.pos.x - px) / Math.max(d, 1e-4), 0, (s.pos.z - pz) / Math.max(d, 1e-4));

    // --- vertical
    const ground = groundHeightAt(s.pos.x, s.pos.z);
    if (s.wantJump && s.grounded) {
      s.vy = JUMP_V;
      s.grounded = false;
      fx.dust(s.pos.x, s.pos.y, s.pos.z, 4);
      if (inWater) fx.splash(s.pos.x, s.pos.y + 0.1, s.pos.z, 8);
    }
    s.wantJump = false;
    s.vy += GRAVITY * d;
    s.pos.y += s.vy * d;
    if (s.pos.y <= ground) {
      if (!s.grounded && s.vy < -3) {
        m.landed = -s.vy;
        if (isWater(s.pos.x, s.pos.z)) fx.splash(s.pos.x, ground + 0.1, s.pos.z, 12);
        else fx.land(s.pos.x, ground, s.pos.z);
      }
      // step up onto a platform / down into water without "falling"
      if (s.grounded || s.pos.y > ground - 0.4) s.pos.y = ground;
      s.vy = 0;
      s.grounded = true;
    } else if (s.pos.y > ground + 0.02) {
      if (s.grounded && s.pos.y - ground < 0.4 && s.vy <= 0) {
        s.pos.y = THREE.MathUtils.lerp(s.pos.y, ground, d * 20);
        s.vy = 0;
      } else s.grounded = false;
    }

    // water entry
    const wet = isWater(s.pos.x, s.pos.z) && s.grounded;
    if (wet && !s.wasInWater) fx.splash(s.pos.x, 0.02, s.pos.z, 10);
    s.wasInWater = wet;

    // --- share state
    player.x = s.pos.x;
    player.y = s.pos.y;
    player.z = s.pos.z;
    player.speed = s.speed;
    player.inWater = wet;
    posRef.current.x = s.pos.x;
    posRef.current.z = s.pos.z;
    posRef.current.angle = s.facing;

    m.speed01 = s.speed / SPEED;
    m.grounded = s.grounded;
    m.vy = s.vy;
    m.turn = turn;
    if (s.helloT > 0) {
      s.helloT -= d;
      if (s.helloT <= 0 && s.speed < 0.5) m.waveT = 1.6;
    }

    if (group.current) {
      group.current.position.copy(s.pos);
      group.current.rotation.y = s.facing;
    }

    // --- camera: follow with a little look-ahead, zoom in near a station
    lookAhead.copy(s.pos).addScaledVector(s.vel, 0.22);
    lookAhead.y = 0;
    camTarget.lerp(lookAhead, 1 - Math.pow(0.0025, d));
    camera.position.copy(camTarget).add(CAM_OFFSET);
    camera.lookAt(camTarget);
    const cam = camera as THREE.OrthographicCamera;
    const base = THREE.MathUtils.clamp(Math.min(size.width, size.height) / 11, 36, 66);
    const want = base * (s.nearId && s.nearId !== "home" ? 1.1 : 1);
    if (s.zoom === 0) s.zoom = base * 0.55;
    s.zoom = THREE.MathUtils.lerp(s.zoom, want, 1 - Math.pow(clock.elapsedTime < 3 ? 0.25 : 0.12, d));
    if (Math.abs(cam.zoom - s.zoom) > 0.001) {
      cam.zoom = s.zoom;
      cam.updateProjectionMatrix();
    }

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
      <Character motion={motion} />
      <Html position={[0, 2.05, 0]} center zIndexRange={[50, 10]} style={{ pointerEvents: "none" }}>
        <div className="flex flex-col items-center" style={{ transform: "translateY(-50%)" }}>
          <SpeechBubble station={near} lang={lang} />
        </div>
      </Html>
    </group>
  );
}
