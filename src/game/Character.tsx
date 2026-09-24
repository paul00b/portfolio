import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cached, facet, mat } from "./lowpoly";
import { fx } from "./Effects";
import { player } from "./layout";

/** What Player tells the rig each frame. */
export interface Motion {
  speed01: number; // 0 idle → 1 full run
  grounded: boolean;
  vy: number;
  turn: number; // angular velocity, for banking
  landed: number; // impulse set on landing, consumed here
  waveT: number; // seconds of waving left
  happy: boolean; // near a station → smile
}

const C = {
  skin: "#f6c7a4",
  skinShade: "#eaa988",
  blush: "#f4a595",
  hair: "#f0cf6e",
  hairLight: "#f8e08f",
  hairDark: "#d6ac48",
  brow: "#c79a3a",
  eyeWhite: "#ffffff",
  iris: "#3f8ee0",
  pupil: "#1c2440",
  lip: "#c0645a",
  shirt: "#2b6a4b",
  shirtDark: "#1f5139",
  jeans: "#4a74b0",
  jeansDark: "#3c6299",
  cuff: "#7a9fd3",
  shoe: "#f7f4ee",
  sole: "#d3cdbf",
  lace: "#ff6b5b",
};

const RUN_CADENCE = 3.4; // radians of cycle per unit of distance

export function Character({ motion }: { motion: React.MutableRefObject<Motion> }) {
  const root = useRef<THREE.Group>(null);
  const hips = useRef<THREE.Group>(null);
  const spine = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const thighL = useRef<THREE.Group>(null);
  const thighR = useRef<THREE.Group>(null);
  const kneeL = useRef<THREE.Group>(null);
  const kneeR = useRef<THREE.Group>(null);
  const footL = useRef<THREE.Group>(null);
  const footR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const elbowL = useRef<THREE.Group>(null);
  const elbowR = useRef<THREE.Group>(null);
  const lids = useRef<THREE.Group>(null);
  const mouth = useRef<THREE.Mesh>(null);
  const quiff = useRef<THREE.Group>(null);

  const s = useRef({
    phase: 0,
    step: 0,
    idleT: 0,
    blinkT: 2,
    lookT: 3,
    look: 0,
    lookTarget: 0,
    squash: 1,
    squashV: 0,
    air: 0,
    wave: 0,
    run: 0,
    smile: 0,
    bank: 0,
  });

  const geo = useMemo(
    () => ({
      head: facet("c-head", () => new THREE.SphereGeometry(0.25, 12, 9), 0.006, 3, [1, 1.04, 0.95]),
      hairCap: facet("c-hair", () => new THREE.SphereGeometry(0.272, 12, 7, 0, Math.PI * 2, 0, Math.PI * 0.52), 0.014, 5, [1.02, 0.95, 1.03]),
      tuft: facet("c-tuft", () => new THREE.IcosahedronGeometry(1, 0), 0.12, 9),
      torso: facet("c-torso", () => new THREE.CylinderGeometry(0.185, 0.16, 0.36, 9, 2), 0.006, 4, [1, 1, 0.74]),
      hem: cached("c-hem", () => new THREE.CylinderGeometry(0.166, 0.17, 0.05, 9).scale(1, 1, 0.76)),
      pelvis: facet("c-pelvis", () => new THREE.CylinderGeometry(0.165, 0.15, 0.13, 9), 0.004, 2, [1, 1, 0.76]),
      thigh: cached("c-thigh", () => new THREE.CylinderGeometry(0.074, 0.062, 0.22, 7)),
      shin: cached("c-shin", () => new THREE.CylinderGeometry(0.06, 0.054, 0.19, 7)),
      cuff: cached("c-cuff", () => new THREE.CylinderGeometry(0.066, 0.066, 0.04, 7)),
      sleeve: cached("c-sleeve", () => new THREE.CylinderGeometry(0.072, 0.066, 0.13, 7)),
      upper: cached("c-upper", () => new THREE.CylinderGeometry(0.048, 0.044, 0.16, 6)),
      fore: cached("c-fore", () => new THREE.CylinderGeometry(0.044, 0.038, 0.15, 6)),
      hand: facet("c-hand", () => new THREE.IcosahedronGeometry(0.052, 1), 0.004, 6, [0.85, 1, 0.9]),
      neck: cached("c-neck", () => new THREE.CylinderGeometry(0.056, 0.06, 0.09, 7)),
      collar: cached("c-collar", () => new THREE.TorusGeometry(0.068, 0.018, 4, 10)),
      ear: cached("c-ear", () => new THREE.SphereGeometry(0.05, 6, 5)),
      eye: cached("c-eye", () => new THREE.SphereGeometry(1, 10, 8)),
      nose: facet("c-nose", () => new THREE.ConeGeometry(0.03, 0.06, 5), 0.003, 2),
      mouth: cached("c-mouth", () => new THREE.TorusGeometry(0.04, 0.012, 4, 10, Math.PI)),
      brow: cached("c-brow", () => new THREE.BoxGeometry(0.075, 0.018, 0.02)),
      shoe: facet("c-shoe", () => new THREE.BoxGeometry(0.115, 0.075, 0.2, 2, 1, 2), 0.005, 8),
      toe: facet("c-toe", () => new THREE.SphereGeometry(0.058, 7, 5, 0, Math.PI * 2, 0, Math.PI / 2), 0.003, 8),
      sole: cached("c-sole", () => new THREE.BoxGeometry(0.125, 0.026, 0.235)),
      shadow: cached("c-shadow", () => new THREE.CircleGeometry(0.42, 20)),
    }),
    [],
  );

  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }, dt) => {
    const d = Math.min(dt, 0.05);
    const t = clock.elapsedTime;
    const m = motion.current;
    const st = s.current;

    // smoothed blend weights
    st.run = THREE.MathUtils.lerp(st.run, m.speed01, d * 10);
    st.air = THREE.MathUtils.lerp(st.air, m.grounded ? 0 : 1, d * (m.grounded ? 18 : 9));
    st.wave = THREE.MathUtils.lerp(st.wave, m.waveT > 0 && m.speed01 < 0.3 ? 1 : 0, d * 8);
    st.smile = THREE.MathUtils.lerp(st.smile, m.happy ? 1 : 0, d * 6);
    st.bank = THREE.MathUtils.lerp(st.bank, THREE.MathUtils.clamp(-m.turn * 0.05, -0.25, 0.25) * m.speed01, d * 8);
    m.waveT = Math.max(0, m.waveT - d);

    const run = st.run;
    const idle = 1 - run;
    const air = st.air;
    const ground = 1 - air;

    // cycle advances with distance travelled, so feet never skate
    st.phase += player.speed * d * RUN_CADENCE;
    const ph = st.phase;
    const sn = Math.sin(ph);
    const cs = Math.cos(ph);

    // footsteps: one puff of dust each time a foot plants
    const step = Math.floor((ph - Math.PI / 2) / Math.PI);
    if (step !== st.step) {
      st.step = step;
      if (m.grounded && m.speed01 > 0.35) {
        const foot = step % 2 === 0 ? footL.current : footR.current;
        if (foot) {
          foot.getWorldPosition(tmp);
          if (player.inWater) fx.splash(tmp.x, tmp.y, tmp.z, 4);
          else fx.dust(tmp.x, tmp.y, tmp.z, 2);
        }
      }
    }

    // landing squash (spring)
    if (m.landed > 0) {
      st.squashV -= Math.min(m.landed, 18) * 0.09;
      m.landed = 0;
    }
    const k = 220;
    const damp = 14;
    st.squashV += (-(st.squash - 1) * k - st.squashV * damp) * d;
    st.squash += st.squashV * d;
    const stretch = air * THREE.MathUtils.clamp(Math.abs(m.vy) * 0.012, 0, 0.1);
    const sy = st.squash + stretch;
    const sxz = 1 / Math.sqrt(Math.max(0.5, sy));

    // idle clocks
    st.blinkT -= d;
    if (st.blinkT < -0.14) st.blinkT = 2.2 + Math.random() * 3.5;
    st.lookT -= d;
    if (st.lookT <= 0) {
      st.lookT = 2.5 + Math.random() * 4;
      st.lookTarget = run > 0.2 ? 0 : (Math.random() - 0.5) * 1.2;
    }
    st.look = THREE.MathUtils.lerp(st.look, run > 0.2 ? 0 : st.lookTarget, d * 3);
    const breathe = Math.sin(t * 2.1);

    // ---------- root / hips
    const bob = ground * run * Math.abs(cs) * 0.07;
    if (root.current) {
      root.current.scale.set(sxz, sy, sxz);
      root.current.rotation.z = st.bank;
    }
    if (hips.current) {
      hips.current.position.y = 0.47 + bob - ground * run * 0.02 + idle * breathe * 0.004;
      hips.current.rotation.y = -sn * 0.14 * run * ground;
    }
    if (spine.current) {
      spine.current.rotation.x = run * 0.2 * ground + air * -0.08;
      spine.current.rotation.y = sn * 0.24 * run * ground;
      spine.current.scale.set(1 + idle * breathe * 0.012, 1 + idle * breathe * 0.018, 1 + idle * breathe * 0.012);
    }
    if (head.current) {
      head.current.rotation.y = -sn * 0.12 * run * ground + st.look * idle + st.wave * 0.25;
      head.current.rotation.x = -run * 0.14 * ground + idle * Math.sin(t * 0.7) * 0.03 - st.wave * 0.12 + air * -0.1;
      head.current.rotation.z = st.wave * Math.sin(t * 3) * 0.06;
    }
    if (quiff.current) {
      quiff.current.rotation.x = -run * 0.15 + air * THREE.MathUtils.clamp(m.vy * 0.03, -0.25, 0.25) + Math.sin(t * 9) * 0.02 * run;
    }

    // ---------- legs
    const legA = 0.95 * run * ground;
    const tL = -sn * legA;
    const tR = sn * legA;
    const kL = Math.max(0, cs) * 1.35 * run * ground + 0.06;
    const kR = Math.max(0, -cs) * 1.35 * run * ground + 0.06;
    if (thighL.current) thighL.current.rotation.x = tL + air * -0.95;
    if (thighR.current) thighR.current.rotation.x = tR + air * 0.35;
    if (kneeL.current) kneeL.current.rotation.x = kL * ground + air * 1.5;
    if (kneeR.current) kneeR.current.rotation.x = kR * ground + air * 0.55;
    if (footL.current) footL.current.rotation.x = -tL * 0.4 - kL * 0.3 * ground + air * -0.3;
    if (footR.current) footR.current.rotation.x = -tR * 0.4 - kR * 0.3 * ground;

    // ---------- arms
    const armA = 0.85 * run * ground;
    const waveK = st.wave;
    if (armL.current) {
      armL.current.rotation.x = sn * armA + idle * Math.sin(t * 2.1 + 1) * 0.03 + air * -0.5;
      armL.current.rotation.z = 0.1 + run * 0.08 + air * 1.35;
    }
    if (elbowL.current) elbowL.current.rotation.x = -(0.18 + run * 1.2) * ground - air * 0.4;
    if (armR.current) {
      armR.current.rotation.x = (-sn * armA + idle * Math.sin(t * 2.1) * 0.03 + air * -0.5) * (1 - waveK) + waveK * -0.2;
      armR.current.rotation.z = (-0.1 - run * 0.08 - air * 1.35) * (1 - waveK) + waveK * -2.55;
    }
    if (elbowR.current) {
      elbowR.current.rotation.x = (-(0.18 + run * 1.2) * ground - air * 0.4) * (1 - waveK) + waveK * -0.25;
      elbowR.current.rotation.z = waveK * Math.sin(t * 11) * 0.55;
    }

    // ---------- face
    if (lids.current) lids.current.scale.y = st.blinkT < 0 ? 0.12 : 1;
    if (mouth.current) {
      mouth.current.scale.set(0.85 + st.smile * 0.35, 0.45 + st.smile * 0.75, 1);
    }
  });

  const skin = mat(C.skin);
  const shirt = mat(C.shirt);
  const jeans = mat(C.jeans);

  const leg = (side: 1 | -1) => (
    <group ref={side === 1 ? thighL : thighR} position={[0.085 * side, -0.02, 0]}>
      <mesh geometry={geo.thigh} material={jeans} position={[0, -0.105, 0]} castShadow />
      <group ref={side === 1 ? kneeL : kneeR} position={[0, -0.21, 0]}>
        <mesh geometry={geo.shin} material={mat(C.jeansDark)} position={[0, -0.095, 0]} castShadow />
        <mesh geometry={geo.cuff} material={mat(C.cuff)} position={[0, -0.175, 0]} />
        <group ref={side === 1 ? footL : footR} position={[0, -0.2, 0]}>
          <mesh geometry={geo.shoe} material={mat(C.shoe)} position={[0, 0.0, 0.02]} castShadow />
          <mesh geometry={geo.toe} material={mat(C.shoe)} position={[0, -0.03, 0.115]} scale={[1, 0.95, 0.9]} />
          <mesh geometry={geo.sole} material={mat(C.sole)} position={[0, -0.036, 0.03]} />
          <mesh material={mat(C.lace)} position={[0.058 * side, 0.004, 0.02]}>
            <boxGeometry args={[0.006, 0.03, 0.1]} />
          </mesh>
        </group>
      </group>
    </group>
  );

  const arm = (side: 1 | -1) => (
    <group ref={side === 1 ? armL : armR} position={[0.205 * side, 0.335, 0]} rotation={[0, 0, 0.1 * side]}>
      <mesh geometry={geo.sleeve} material={shirt} position={[0, -0.045, 0]} castShadow />
      <mesh geometry={geo.upper} material={skin} position={[0, -0.1, 0]} />
      <group ref={side === 1 ? elbowL : elbowR} position={[0, -0.175, 0]}>
        <mesh geometry={geo.fore} material={skin} position={[0, -0.075, 0]} castShadow />
        <mesh geometry={geo.hand} material={skin} position={[0, -0.165, 0.005]} castShadow />
      </group>
    </group>
  );

  return (
    <group>
      {/* soft contact shadow under the real one */}
      <mesh geometry={geo.shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} renderOrder={1}>
        <meshBasicMaterial color="#223044" transparent opacity={0.18} depthWrite={false} />
      </mesh>

      <group ref={root}>
        <group ref={hips} position={[0, 0.47, 0]}>
          <mesh geometry={geo.pelvis} material={mat(C.jeansDark)} position={[0, 0.02, 0]} castShadow />
          {leg(1)}
          {leg(-1)}

          <group ref={spine} position={[0, 0.06, 0]}>
            <mesh geometry={geo.torso} material={shirt} position={[0, 0.19, 0]} castShadow />
            <mesh geometry={geo.hem} material={mat(C.shirtDark)} position={[0, 0.02, 0]} />
            <mesh geometry={geo.neck} material={skin} position={[0, 0.4, 0]} />
            <mesh geometry={geo.collar} material={mat(C.shirtDark)} position={[0, 0.37, 0.004]} rotation={[Math.PI / 2, 0, 0]} scale={[1.25, 1, 1]} />
            {arm(1)}
            {arm(-1)}

            {/* ---------- head ---------- */}
            <group ref={head} position={[0, 0.43, 0]}>
              <mesh geometry={geo.head} material={skin} position={[0, 0.23, 0]} castShadow />
              {[1, -1].map((x) => (
                <mesh key={x} geometry={geo.ear} material={mat(C.skinShade)} position={[0.245 * x, 0.21, -0.01]} scale={[0.5, 1, 0.8]} />
              ))}

              {/* hair: tilted cap + a swept-up quiff */}
              <mesh geometry={geo.hairCap} material={mat(C.hair)} position={[0, 0.26, -0.02]} rotation={[-0.55, 0, 0]} castShadow />
              <group ref={quiff} position={[0, 0.455, 0.07]}>
                <mesh geometry={geo.tuft} material={mat(C.hairLight)} position={[0.0, 0.02, 0.02]} scale={[0.15, 0.075, 0.11]} rotation={[-0.5, 0.2, 0]} />
                <mesh geometry={geo.tuft} material={mat(C.hair)} position={[0.09, 0.0, -0.01]} scale={[0.11, 0.065, 0.1]} rotation={[-0.3, -0.4, 0.3]} />
                <mesh geometry={geo.tuft} material={mat(C.hair)} position={[-0.09, 0.0, -0.02]} scale={[0.11, 0.06, 0.1]} rotation={[-0.3, 0.5, -0.3]} />
                <mesh geometry={geo.tuft} material={mat(C.hairDark)} position={[0.0, -0.01, -0.1]} scale={[0.13, 0.06, 0.1]} rotation={[0.2, 0, 0]} />
              </group>
              {[1, -1].map((x) => (
                <mesh key={x} material={mat(C.hairDark)} position={[0.238 * x, 0.25, 0.03]} rotation={[0, 0, -0.1 * x]}>
                  <boxGeometry args={[0.035, 0.1, 0.07]} />
                </mesh>
              ))}

              {/* face */}
              <group position={[0, 0.215, 0.212]}>
                <group ref={lids}>
                  {[1, -1].map((x) => (
                    <group key={x} position={[0.078 * x, 0, 0]}>
                      <mesh geometry={geo.eye} material={mat(C.eyeWhite, { roughness: 0.3 })} scale={[0.047, 0.055, 0.022]} />
                      <mesh geometry={geo.eye} material={mat(C.iris, { roughness: 0.25 })} position={[0, -0.004, 0.014]} scale={[0.034, 0.04, 0.014]} />
                      <mesh geometry={geo.eye} material={mat(C.pupil, { roughness: 0.2 })} position={[0, -0.004, 0.022]} scale={[0.016, 0.019, 0.008]} />
                      <mesh geometry={geo.eye} position={[0.012 * x, 0.012, 0.028]} scale={0.008}>
                        <meshBasicMaterial color="#ffffff" />
                      </mesh>
                    </group>
                  ))}
                </group>
                {[1, -1].map((x) => (
                  <mesh key={x} geometry={geo.brow} material={mat(C.brow)} position={[0.08 * x, 0.07, 0.014]} rotation={[0, 0, 0.12 * x]} />
                ))}
                <mesh geometry={geo.nose} material={mat(C.skinShade)} position={[0, -0.045, 0.035]} rotation={[0.35, 0, 0]} />
                {[1, -1].map((x) => (
                  <mesh key={x} geometry={geo.eye} material={mat(C.blush, { roughness: 1 })} position={[0.135 * x, -0.055, -0.004]} scale={[0.035, 0.018, 0.012]} />
                ))}
                <mesh ref={mouth} geometry={geo.mouth} material={mat(C.lip)} position={[0, -0.09, 0.022]} rotation={[0.3, 0, Math.PI]} />
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
