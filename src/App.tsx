import { useEffect, useState } from "react";
import { GameScene } from "./game/GameScene";
import { ClassicPortfolio } from "./classic/ClassicPortfolio";
import { profile } from "./data/projects";
import { ui } from "./data/ui";
import { LangProvider, LangToggle, useT } from "./i18n/lang";

type Mode = "game" | "regular";

function TopControls({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const { t } = useT();
  return (
    <div className="pointer-events-auto fixed right-4 top-4 z-[60] flex items-center gap-2 sm:right-5 sm:top-5">
      <LangToggle />
      <div className="relative flex rounded-2xl border-2 border-ink bg-white p-1 font-mono text-xs font-bold shadow-hard" role="tablist" aria-label="Portfolio mode">
        <span
          className="absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-xl bg-ink transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)]"
          style={{ transform: mode === "game" ? "translateX(0)" : "translateX(100%)" }}
        />
        <button
          role="tab"
          aria-selected={mode === "game"}
          onClick={() => onChange("game")}
          className={`relative z-10 flex h-9 w-[86px] items-center justify-center gap-1.5 rounded-xl transition-colors ${mode === "game" ? "text-white" : "text-ink-soft hover:text-ink"}`}
        >
          🕹️ {t(ui.modeGame)}
        </button>
        <button
          role="tab"
          aria-selected={mode === "regular"}
          onClick={() => onChange("regular")}
          className={`relative z-10 flex h-9 w-[86px] items-center justify-center gap-1.5 rounded-xl transition-colors ${mode === "regular" ? "text-white" : "text-ink-soft hover:text-ink"}`}
        >
          📄 {t(ui.modeRegular)}
        </button>
      </div>
    </div>
  );
}

function Intro({ onStart, onRegular }: { onStart: () => void; onRegular: () => void }) {
  const { t } = useT();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Enter" || e.code === "Space" || e.code === "KeyE") {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onStart]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/60 p-5 backdrop-blur-sm">
      <div className="animate-pop w-full max-w-md rounded-3xl border-2 border-ink bg-cream p-7 text-center shadow-hard">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-ink bg-coral text-3xl shadow-hard-sm animate-float">🕹️</div>
        <div className="font-mono text-xs font-bold uppercase tracking-wider text-coral">{t(ui.pressStart)}</div>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{profile.name}</h1>
        <p className="mt-1 text-ink-soft">
          {t(profile.title)} @ {profile.company} · {profile.years} {t(ui.yearsXp)} · {t(profile.location)}
        </p>
        <p className="mt-4 text-sm text-ink-soft">{t(ui.introPitch)}</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-mono text-[11px] text-ink-soft">
          <span className="flex items-center gap-1">
            <span className="kbd">Z</span>
            <span className="kbd">Q</span>
            <span className="kbd">S</span>
            <span className="kbd">D</span> {t(ui.move)}
          </span>
          <span className="flex items-center gap-1">
            <span className="kbd px-3">␣</span> {t(ui.jump)}
          </span>
          <span className="flex items-center gap-1">
            <span className="kbd">E</span> {t(ui.enter)}
          </span>
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button onClick={onStart} className="flex-1 rounded-xl border-2 border-ink bg-ink px-5 py-3 text-sm font-bold text-white shadow-hard-sm transition hover:-translate-y-0.5 hover:bg-coral">
            {t(ui.startExploring)}
          </button>
          <button onClick={onRegular} className="flex-1 rounded-xl border-2 border-ink bg-white px-5 py-3 text-sm font-bold shadow-hard-sm transition hover:-translate-y-0.5 hover:bg-mustard">
            {t(ui.regularMode)}
          </button>
        </div>
        <div className="mt-3 font-mono text-[10px] text-ink-soft">
          {t(ui.pressEnter)} <span className="kbd">enter</span> {t(ui.toStart)}
        </div>
      </div>
    </div>
  );
}

function Portfolio() {
  const [mode, setMode] = useState<Mode>(() => (localStorage.getItem("pb-mode") as Mode) || "game");
  const [started, setStarted] = useState(() => localStorage.getItem("pb-started") === "1");

  useEffect(() => {
    localStorage.setItem("pb-mode", mode);
  }, [mode]);

  const start = () => {
    setStarted(true);
    localStorage.setItem("pb-started", "1");
  };
  const goRegular = () => {
    setMode("regular");
    start();
  };

  return (
    <div className="h-full w-full">
      <TopControls mode={mode} onChange={setMode} />
      {mode === "game" ? (
        <>
          <GameScene />
          {!started && <Intro onStart={start} onRegular={goRegular} />}
        </>
      ) : (
        <ClassicPortfolio onSwitchToGame={() => setMode("game")} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <LangProvider>
      <Portfolio />
    </LangProvider>
  );
}
