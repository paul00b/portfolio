import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import { World } from "./World";
import { Player } from "./Player";
import { stations, type Station } from "./stations";
import { controls, emitInteract, emitJump, onInteract, useKeyboardControls } from "./useControls";
import { AboutModal, ContactModal, ProjectModal } from "../ui/Modals";
import { profile, projects } from "../data/projects";
import { ui } from "../data/ui";
import { useT } from "../i18n/lang";

/* ---------- Minimap (DOM, updated by rAF without React re-renders) ---------- */
function Minimap({ posRef, visited, near }: { posRef: React.MutableRefObject<{ x: number; z: number; angle: number }>; visited: Set<string>; near: Station | null }) {
  const { t } = useT();
  const dot = useRef<HTMLDivElement>(null);
  const R = 19;
  const S = 56; // px radius
  const toMap = (x: number, z: number) => {
    const mx = (x - z) / Math.SQRT2;
    const my = (-x - z) / Math.SQRT2;
    return { left: S + (mx / R) * S * 0.92, top: S - (my / R) * S * 0.92 };
  };
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (dot.current) {
        const { left, top } = toMap(posRef.current.x, posRef.current.z);
        dot.current.style.transform = `translate(${left - 5}px, ${top - 5}px)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [posRef]);

  return (
    <div className="relative h-28 w-28 rounded-full border-2 border-ink bg-mint/40 shadow-hard-sm backdrop-blur-sm" style={{ backgroundImage: "radial-gradient(circle, #a7e6c5 0 60%, #7fd8be 60% 100%)" }}>
      {stations
        .filter((s) => s.kind !== "home")
        .map((s) => {
          const { left, top } = toMap(s.position[0], s.position[1]);
          const active = near?.id === s.id;
          return (
            <div
              key={s.id}
              className={`absolute h-2.5 w-2.5 rounded-sm border border-ink transition-transform ${active ? "scale-150" : ""}`}
              style={{ left: left - 5, top: top - 5, background: visited.has(s.id) ? s.color : "#ffffff", transform: `rotate(45deg) ${active ? "scale(1.4)" : ""}` }}
              title={t(s.label)}
            />
          );
        })}
      <div ref={dot} className="absolute left-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-coral shadow" />
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
function Loader() {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-cream">
      <div className="animate-float h-10 w-10 rounded-full border-2 border-ink bg-coral shadow-hard-sm" />
      <div className="mt-6 font-mono text-xs text-ink-soft">
        loading world<span className="animate-blink">_</span>
      </div>
    </div>
  );
}

export function GameScene() {
  const { lang, t } = useT();
  const [near, setNear] = useState<Station | null>(null);
  const [active, setActive] = useState<Station | null>(null);
  const [visited, setVisited] = useState<Set<string>>(() => new Set());
  const [ready, setReady] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  const posRef = useRef({ x: 0, z: 3, angle: 0 });

  const enabled = !active;
  useKeyboardControls(enabled);

  const handleNear = useCallback((s: Station | null) => {
    setNear(s);
    if (s && s.kind !== "home") {
      setVisited((v) => {
        if (v.has(s.id)) return v;
        const n = new Set(v);
        n.add(s.id);
        return n;
      });
    }
  }, []);

  // E → open the modal for the nearby station
  useEffect(() => {
    return onInteract(() => {
      setActive((current) => {
        if (current) return current; // modal handles closing itself
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
    <div className="relative h-full w-full overflow-hidden" style={{ background: "linear-gradient(180deg,#bfe3ff 0%,#e8f4ff 55%,#fff3e6 100%)" }}>
      {!ready && <Loader />}
      <Canvas
        shadows
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={() => setTimeout(() => setReady(true), 300)}
      >
        <OrthographicCamera makeDefault position={[18, 18, 18]} zoom={40} near={-50} far={200} />
        <ambientLight intensity={0.75} color="#e8f0ff" />
        <hemisphereLight args={["#bfe3ff", "#f5c451", 0.45]} />
        <directionalLight
          castShadow
          position={[14, 24, 8]}
          intensity={1.9}
          color="#fff4e0"
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-26}
          shadow-camera-right={26}
          shadow-camera-top={26}
          shadow-camera-bottom={-26}
          shadow-camera-near={1}
          shadow-camera-far={80}
          shadow-bias={-0.0006}
        />
        <Suspense fallback={null}>
          <World nearId={near?.id ?? null} lang={lang} />
          <Player enabled={enabled} onNearChange={handleNear} posRef={posRef} near={near} lang={lang} />
        </Suspense>
      </Canvas>

      {/* ---------- HUD ---------- */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
        {/* top bar */}
        <div className="flex items-start justify-between p-4 sm:p-5">
          <div className="animate-rise flex items-center gap-3 rounded-2xl border-2 border-ink bg-white/90 p-2 pr-4 shadow-hard backdrop-blur">
            <img src="/images/paul.jpg" alt="" className="h-11 w-11 rounded-xl border-2 border-ink object-cover" />
            <div>
              <div className="text-sm font-extrabold leading-none">{profile.name}</div>
              <div className="mt-1 font-mono text-[10px] text-ink-soft">
                LVL {profile.years} · {t(profile.title)} @ {profile.company}
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <div className="h-1.5 w-24 overflow-hidden rounded-full border border-ink bg-cream-dark">
                  <div className="h-full bg-mint transition-all duration-500" style={{ width: `${(discovered / projectCount) * 100}%` }} />
                </div>
                <span className="font-mono text-[10px] font-bold">
                  {discovered}/{projectCount}
                </span>
              </div>
            </div>
          </div>
          {/* right side reserved for the mode toggle rendered by App */}
        </div>

        {/* bottom */}
        <div className="flex flex-col gap-3">
          <div className="flex items-end justify-between px-4 pb-4 sm:px-5 sm:pb-5">
            {/* controls legend */}
            <div className={`hidden rounded-2xl border-2 border-ink bg-white/90 p-3 shadow-hard backdrop-blur transition-all duration-500 sm:block ${showHelp ? "opacity-100" : "opacity-70 hover:opacity-100"}`}>
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

        {/* first-time hint */}
        {showHelp && ready && (
          <div className="animate-rise absolute left-1/2 top-24 -translate-x-1/2 rounded-full border-2 border-ink bg-ink px-4 py-2 font-mono text-xs text-white shadow-hard-sm sm:top-28">
            <span className="text-mustard">{t(ui.tip)}</span> {t(ui.walkWith)} <span className="kbd mx-0.5">Z</span>
            <span className="kbd">Q</span>
            <span className="kbd">S</span>
            <span className="kbd">D</span> — {t(ui.tipText)}
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
