import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera, PerformanceMonitor } from "@react-three/drei";
import { Bloom, EffectComposer, SMAA, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { World } from "./World";
import { Player } from "./Player";
import { fx } from "./Effects";
import { player } from "./layout";
import { stations, type Station } from "./stations";
import { controls, emitInteract, emitJump, onInteract, useKeyboardControls } from "./useControls";
import { AboutModal, ContactModal, ProjectModal } from "../ui/Modals";
import { profile, projects } from "../data/projects";
import { ui } from "../data/ui";
import { useT } from "../i18n/lang";

/* ---------- Sun: its shadow camera follows the player for crisp shadows ---------- */
function Sun() {
  const light = useRef<THREE.DirectionalLight>(null);
  const { scene } = useThree();
  useEffect(() => {
    if (light.current) scene.add(light.current.target);
  }, [scene]);
  useFrame(() => {
    const l = light.current;
    if (!l) return;
    l.position.set(player.x + 12, 22, player.z + 7);
    l.target.position.set(player.x, 0, player.z);
  });
  return (
    <directionalLight
      ref={light}
      castShadow
      intensity={2.3}
      color="#fff1dc"
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-left={-17}
      shadow-camera-right={17}
      shadow-camera-top={17}
      shadow-camera-bottom={-17}
      shadow-camera-near={1}
      shadow-camera-far={60}
      shadow-bias={-0.0004}
      shadow-normalBias={0.02}
      shadow-radius={3}
    />
  );
}

/* ---------- Minimap (DOM, updated by rAF without React re-renders) ---------- */
function Minimap({ posRef, visited, near }: { posRef: React.MutableRefObject<{ x: number; z: number; angle: number }>; visited: Set<string>; near: Station | null }) {
  const { t } = useT();
  const dot = useRef<HTMLDivElement>(null);
  const R = 20;
  const S = 60;
  const toMap = (x: number, z: number) => {
    const mx = (x - z) / Math.SQRT2;
    const my = (-x - z) / Math.SQRT2;
    return { left: S + (mx / R) * S * 0.9, top: S - (my / R) * S * 0.9 };
  };
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (dot.current) {
        const { left, top } = toMap(posRef.current.x, posRef.current.z);
        // world facing → screen angle on the rotated map
        const a = posRef.current.angle;
        const sx = (Math.sin(a) - Math.cos(a)) / Math.SQRT2;
        const sy = (Math.sin(a) + Math.cos(a)) / Math.SQRT2;
        const deg = (Math.atan2(sx, sy) * 180) / Math.PI;
        dot.current.style.transform = `translate(${left - 7}px, ${top - 7}px) rotate(${deg}deg)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [posRef]);

  return (
    <div
      className="relative h-[120px] w-[120px] rounded-full border-2 border-ink shadow-hard-sm"
      style={{ background: "radial-gradient(circle at 50% 45%, #b9ecc6 0 45%, #8fd6a8 45% 72%, #6fc293 72% 100%)" }}
    >
      <div className="absolute inset-[38%] rounded-full border border-ink/20 bg-[#efe3c9]" />
      {stations
        .filter((s) => s.kind !== "home")
        .map((s) => {
          const { left, top } = toMap(s.position[0], s.position[1]);
          const active = near?.id === s.id;
          const seen = visited.has(s.id);
          return (
            <div key={s.id} className="absolute" style={{ left: left - 6, top: top - 6 }} title={t(s.label)}>
              {active && <span className="absolute -inset-1 animate-ping rounded-full" style={{ background: s.color, opacity: 0.5 }} />}
              <div
                className="relative h-3 w-3 rounded-[3px] border-[1.5px] border-ink transition-all duration-300"
                style={{ background: seen ? s.color : "#ffffff", transform: `rotate(45deg) scale(${active ? 1.35 : 1})` }}
              />
            </div>
          );
        })}
      <div ref={dot} className="absolute left-0 top-0 h-3.5 w-3.5">
        <svg viewBox="0 0 14 14" className="h-full w-full drop-shadow">
          <path d="M7 1 L12 12 L7 9.5 L2 12 Z" fill="#ff6b5b" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border-2 border-ink bg-white px-1.5 font-mono text-[9px] font-bold">{t(ui.map)}</div>
    </div>
  );
}

/* ---------- Touch controls ---------- */
function TouchControls() {
  const bind = (key: "up" | "down" | "left" | "right") => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      controls[key] = true;
    },
    onPointerUp: () => (controls[key] = false),
    onPointerCancel: () => (controls[key] = false),
    onPointerLeave: () => (controls[key] = false),
  });
  const btn = "flex h-12 w-12 items-center justify-center rounded-xl border-2 border-ink bg-white/90 text-lg font-bold text-ink shadow-hard-sm active:translate-y-0.5 active:shadow-none select-none touch-none";
  return (
    <div className="pointer-events-auto hidden w-full items-end justify-between px-4 pb-4 pointer-coarse:flex">
      <div className="grid grid-cols-3 gap-1.5">
        <div />
        <button className={btn} {...bind("up")} aria-label="Up">
          ▲
        </button>
        <div />
        <button className={btn} {...bind("left")} aria-label="Left">
          ◀
        </button>
        <button className={btn} {...bind("down")} aria-label="Down">
          ▼
        </button>
        <button className={btn} {...bind("right")} aria-label="Right">
          ▶
        </button>
      </div>
      <div className="flex gap-2">
        <button className={`${btn} h-14 w-14 rounded-full bg-mint`} onPointerDown={(e) => { e.preventDefault(); emitJump(); }} aria-label="Jump">
          ⤒
        </button>
        <button className={`${btn} h-14 w-14 rounded-full bg-coral text-white`} onPointerDown={(e) => { e.preventDefault(); emitInteract(); }} aria-label="Interact">
          E
        </button>
      </div>
    </div>
  );
}

/* ---------- Loading overlay ---------- */
function Loader({ hidden }: { hidden: boolean }) {
  const { t } = useT();
  return (
    <div
      className={`absolute inset-0 z-20 flex flex-col items-center justify-center transition-opacity duration-700 ${hidden ? "pointer-events-none opacity-0" : "opacity-100"}`}
      style={{ background: "linear-gradient(180deg,#bfe3ff 0%,#e8f4ff 55%,#fff3e6 100%)" }}
    >
      <div className="relative h-16 w-16">
        <div className="loader-gem absolute inset-0" />
        <div className="absolute -bottom-4 left-1/2 h-2 w-10 -translate-x-1/2 rounded-full bg-ink/15 loader-shadow" />
      </div>
      <div className="mt-8 font-mono text-xs text-ink-soft">
        {t(ui.loadingWorld)}
        <span className="animate-blink">_</span>
      </div>
    </div>
  );
}

/* ---------- Toast when a project is discovered ---------- */
function DiscoveryToast({ toast }: { toast: { id: number; label: string; color: string; all: boolean } | null }) {
  const { t } = useT();
  if (!toast) return null;
  return (
    <div key={toast.id} className="toast-in absolute left-1/2 top-20 z-30 -translate-x-1/2 sm:top-6">
      <div className="flex items-center gap-3 rounded-2xl border-2 border-ink bg-white py-2 pl-2 pr-4 shadow-hard">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-ink text-lg" style={{ background: toast.color }}>
          <span className="toast-star">{toast.all ? "🏆" : "✦"}</span>
        </div>
        <div>
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-soft">{t(toast.all ? ui.allDiscovered : ui.discovered)}</div>
          <div className="text-sm font-extrabold leading-tight">{toast.label}</div>
        </div>
      </div>
    </div>
  );
}

export function GameScene() {
  const { lang, t } = useT();
  const [near, setNear] = useState<Station | null>(null);
  const [active, setActive] = useState<Station | null>(null);
  const [visited, setVisited] = useState<Set<string>>(() => new Set());
  const visitedRef = useRef(visited);
  const [ready, setReady] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  const [hq, setHq] = useState(true);
  const [toast, setToast] = useState<{ id: number; label: string; color: string; all: boolean } | null>(null);
  const [xpPulse, setXpPulse] = useState(0);
  const posRef = useRef({ x: 0, z: 3, angle: 0 });

  const enabled = !active;
  useKeyboardControls(enabled);

  const handleNear = useCallback(
    (s: Station | null) => {
      setNear(s);
      if (!s || s.kind === "home" || visitedRef.current.has(s.id)) return;
      const n = new Set(visitedRef.current);
      n.add(s.id);
      visitedRef.current = n;
      setVisited(n);
      if (s.kind === "project") {
        const all = projects.every((p) => n.has(p.id));
        fx.confetti(s.position[0], 2.2, s.position[1], [s.color, "#f5c451", "#ff6b5b", "#7fd8be", "#ffffff", "#b9a7ff"]);
        if (all) window.setTimeout(() => fx.confetti(player.x, 2.5, player.z, ["#f5c451", "#ff6b5b", "#7fd8be", "#b9a7ff", "#8fc7ff"]), 450);
        setToast({ id: Date.now(), label: t(s.label), color: s.color, all });
        setXpPulse((k) => k + 1);
      }
    },
    [t],
  );

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  // E → open the modal for the nearby station
  useEffect(() => {
    return onInteract(() => {
      setActive((current) => {
        if (current) return current;
        if (near && near.kind !== "home") return near;
        return current;
      });
    });
  }, [near]);

  // hide help once the player moves
  useEffect(() => {
    const id = window.setInterval(() => {
      if (Math.hypot(posRef.current.x, posRef.current.z - 3) > 2) {
        setShowHelp(false);
        window.clearInterval(id);
      }
    }, 300);
    return () => window.clearInterval(id);
  }, []);

  const close = useCallback(() => setActive(null), []);
  const projectCount = projects.length;
  const discovered = projects.filter((p) => visited.has(p.id)).length;

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: "linear-gradient(180deg,#a9d8ff 0%,#dcefff 45%,#fff1e0 100%)" }}>
      <div className="sky-glow pointer-events-none absolute inset-0" />
      <Loader hidden={ready} />
      <Canvas
        shadows="soft"
        dpr={hq ? [1, 1.75] : [0.8, 1.25]}
        gl={{ antialias: false, powerPreference: "high-performance", stencil: false }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NeutralToneMapping;
          gl.toneMappingExposure = 1.02;
          setTimeout(() => setReady(true), 500);
        }}
      >
        <PerformanceMonitor onDecline={() => setHq(false)} flipflops={2} onFallback={() => setHq(false)} />
        <OrthographicCamera makeDefault position={[18, 18, 18]} zoom={30} near={-60} far={220} />
        <ambientLight intensity={0.55} color="#eaf1ff" />
        <hemisphereLight args={["#cfe8ff", "#9bd48d", 0.9]} />
        <directionalLight position={[-10, 8, -14]} intensity={0.45} color="#b9d4ff" />
        <Sun />
        <Suspense fallback={null}>
          <World nearId={near?.id ?? null} lang={lang} visited={visited} />
          <Player enabled={enabled} onNearChange={handleNear} posRef={posRef} near={near} lang={lang} />
        </Suspense>
        {hq ? (
          <EffectComposer multisampling={0}>
            <SMAA />
            <Bloom mipmapBlur intensity={0.55} luminanceThreshold={0.92} luminanceSmoothing={0.2} radius={0.6} />
            <Vignette offset={0.32} darkness={0.42} eskil={false} />
          </EffectComposer>
        ) : (
          <></>
        )}
      </Canvas>

      {/* ---------- HUD ---------- */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
        <div className="flex items-start justify-between p-4 sm:p-5">
          <div className="animate-rise flex items-center gap-3 rounded-2xl border-2 border-ink bg-white/90 p-2 pr-4 shadow-hard backdrop-blur">
            <div className="relative">
              <img src="/images/paul.jpg" alt="" className="h-11 w-11 rounded-xl border-2 border-ink object-cover" />
              <span className="absolute -bottom-1 -right-1 rounded-md border-2 border-ink bg-mustard px-1 font-mono text-[9px] font-extrabold leading-tight">{profile.years}</span>
            </div>
            <div>
              <div className="text-sm font-extrabold leading-none">{profile.name}</div>
              <div className="mt-1 font-mono text-[10px] text-ink-soft">
                LVL {profile.years} · {t(profile.title)} @ {profile.company}
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <div key={xpPulse} className={`xp-bar relative h-2 w-28 overflow-hidden rounded-full border border-ink bg-cream-dark ${xpPulse ? "xp-pulse" : ""}`}>
                  <div className="xp-fill h-full bg-mint transition-all duration-700 ease-out" style={{ width: `${(discovered / projectCount) * 100}%` }} />
                </div>
                <span className="font-mono text-[10px] font-bold tabular-nums">
                  {discovered}/{projectCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DiscoveryToast toast={toast} />

        <div className="flex flex-col gap-3">
          <div className="flex items-end justify-between px-4 pb-4 sm:px-5 sm:pb-5">
            <div className={`hidden rounded-2xl border-2 border-ink bg-white/90 p-3 shadow-hard backdrop-blur transition-all duration-500 sm:block ${showHelp ? "opacity-100" : "opacity-60 hover:opacity-100"}`}>
              <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-soft">{t(ui.controls)}</div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="grid grid-cols-3 gap-0.5">
                    <span />
                    <span className="kbd">Z</span>
                    <span />
                    <span className="kbd">Q</span>
                    <span className="kbd">S</span>
                    <span className="kbd">D</span>
                  </div>
                  <span className="text-ink-soft">
                    {t(ui.or)} <span className="kbd">↑</span>
                    <span className="kbd ml-0.5">←</span>
                    <span className="kbd ml-0.5">↓</span>
                    <span className="kbd ml-0.5">→</span>
                    <br />
                    <span className="font-semibold text-ink">{t(ui.move)}</span>
                  </span>
                </div>
                <div className="h-8 w-px bg-ink/15" />
                <div className="flex items-center gap-2">
                  <span className="kbd px-4">space</span>
                  <span className="font-semibold">{t(ui.jump)}</span>
                </div>
                <div className="h-8 w-px bg-ink/15" />
                <div className="flex items-center gap-2">
                  <span className="kbd">E</span>
                  <span className="font-semibold">{t(ui.enter)}</span>
                </div>
              </div>
            </div>
            <div className="ml-auto flex items-end gap-3">
              <Minimap posRef={posRef} visited={visited} near={near} />
            </div>
          </div>
          <TouchControls />
        </div>

        {showHelp && ready && (
          <div className="animate-rise absolute left-1/2 top-24 w-max max-w-[92vw] -translate-x-1/2 rounded-2xl text-center sm:whitespace-nowrap sm:rounded-full border-2 border-ink bg-ink px-4 py-2 font-mono text-xs text-white shadow-hard-sm sm:top-28">
            <span className="text-mustard">{t(ui.tip)}</span> {t(ui.walkWith)} <span className="kbd mx-0.5">Z</span>
            <span className="kbd">Q</span>
            <span className="kbd">S</span>
            <span className="kbd">D</span> {t(ui.orClick)} — {t(ui.tipText)}
          </div>
        )}
      </div>

      {/* ---------- Modals ---------- */}
      {active?.kind === "project" && active.project && (
        <ProjectModal
          project={active.project}
          onClose={close}
          onNext={() => {
            const idx = projects.findIndex((p) => p.id === active.project!.id);
            const next = projects[(idx + 1) % projects.length];
            const st = stations.find((s) => s.id === next.id) ?? null;
            setActive(st);
          }}
        />
      )}
      {active?.kind === "about" && <AboutModal onClose={close} />}
      {active?.kind === "contact" && <ContactModal onClose={close} />}
    </div>
  );
}
