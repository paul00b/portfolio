import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { onRouteChange, readRoute, updateRoute } from "../lib/route";
import { readStored, writeStored } from "../lib/storage";

export type Lang = "fr" | "en";

/** A string that exists in both languages. */
export type Loc = Record<Lang, string>;
/** A list of strings that exists in both languages. */
export type LocList = Record<Lang, string[]>;

interface LangValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (v: Loc) => string;
  tl: (v: LocList) => string[];
}

const LangCtx = createContext<LangValue>({
  lang: "fr",
  setLang: () => {},
  t: (v) => v.fr,
  tl: (v) => v.fr,
});

function readInitial(): Lang {
  // A link that carries a language (`/#cv/en`) wins over this browser's history.
  const fromUrl = readRoute().lang;
  if (fromUrl) return fromUrl;
  const stored = readStored("pb-lang");
  if (stored === "fr" || stored === "en") return stored;
  return navigator.language?.toLowerCase().startsWith("en") ? "en" : "fr";
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitial);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    // Only an explicit choice is pinned to the URL, so the short `/#jeu` and
    // `/#cv` links stay short until a language is actually picked.
    updateRoute({ lang: l });
    writeStored("pb-lang", l);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Back / forward button, or a link pasted mid-visit.
  useEffect(
    () =>
      onRouteChange(() => {
        const { lang: next } = readRoute();
        if (next) setLangState(next);
      }),
    [],
  );

  const value = useMemo<LangValue>(
    () => ({ lang, setLang, t: (v) => v[lang], tl: (v) => v[lang] }),
    [lang, setLang],
  );

  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useT() {
  return useContext(LangCtx);
}

/**
 * Context-free lookup. React context does not cross the react-three-fiber
 * <Canvas> boundary, so everything rendered inside the 3D scene receives
 * `lang` as a prop and resolves its strings with this instead of `useT()`.
 */
export const tr = (v: Loc, lang: Lang) => v[lang];

/** FR / EN switch, styled like the rest of the HUD. */
export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useT();
  return (
    <div
      className={`relative flex rounded-2xl border-2 border-ink bg-white p-1 font-mono text-xs font-bold shadow-hard ${className}`}
      role="group"
      aria-label="Language / Langue"
    >
      <span
        className="absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-xl bg-ink transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)]"
        style={{ transform: lang === "fr" ? "translateX(0)" : "translateX(100%)" }}
      />
      {(["fr", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`relative z-10 flex h-9 w-10 items-center justify-center rounded-xl uppercase transition-colors ${
            lang === l ? "text-white" : "text-ink-soft hover:text-ink"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
