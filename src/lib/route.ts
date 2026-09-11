import type { Lang } from "../i18n/lang";

export type Mode = "game" | "regular";

/**
 * Shareable links.
 *
 * The mode — and the language once it has been chosen explicitly — live in the
 * URL hash, so whatever is on screen can be copy-pasted and reopened as is:
 *
 *   /#jeu       the isometric game
 *   /#cv        the scrolling portfolio
 *   /#cv/en     …in English
 *
 * The hash rather than a real path: the production build is a single
 * `index.html` (vite-plugin-singlefile), so this works on any static host with
 * zero redirect config, and straight from `file://` too.
 */

/** What gets written to the URL. */
const MODE_SLUG: Record<Mode, string> = { game: "jeu", regular: "cv" };

/** What gets accepted from it — generous on purpose, links get retyped. */
const MODE_ALIASES: Record<string, Mode> = {
  jeu: "game",
  game: "game",
  play: "game",
  cv: "regular",
  classique: "regular",
  classic: "regular",
  regular: "regular",
  portfolio: "regular",
};

const LANGS: readonly string[] = ["fr", "en"];

export interface Route {
  mode?: Mode;
  lang?: Lang;
}

/** `#/jeu/en` → `["jeu", "en"]` */
function segments(hash: string): string[] {
  return hash.replace(/^#\/?/, "").toLowerCase().split("/").filter(Boolean);
}

/** Order-insensitive: `#en/jeu` reads the same as `#jeu/en`. */
export function readRoute(hash: string = window.location.hash): Route {
  const route: Route = {};
  for (const seg of segments(hash)) {
    const mode = MODE_ALIASES[seg];
    if (mode) route.mode ??= mode;
    else if (LANGS.includes(seg)) route.lang ??= seg as Lang;
  }
  return route;
}

function serialize({ mode, lang }: Route): string {
  const parts = [MODE_SLUG[mode ?? "game"]];
  if (lang) parts.push(lang);
  return `#${parts.join("/")}`;
}

/**
 * Merges `patch` into the hash. Mode and language are written by two different
 * components, so the current hash is always re-read first — neither can wipe
 * out the other's segment. `replace` is for the initial normalisation, which
 * should not add a history entry.
 */
export function updateRoute(patch: Route, { replace = false } = {}) {
  const next = serialize({ ...readRoute(), ...patch });
  if (next === window.location.hash) return;
  if (replace) window.history.replaceState(null, "", next);
  else window.location.hash = next; // pushes history: back undoes a toggle
}

/** Back / forward button, or a link pasted into the address bar. */
export function onRouteChange(fn: () => void) {
  window.addEventListener("hashchange", fn);
  return () => window.removeEventListener("hashchange", fn);
}
