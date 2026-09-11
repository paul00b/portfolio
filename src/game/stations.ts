import { projects, homeQuote, type Project } from "../data/projects";
import type { Loc } from "../i18n/lang";

export type StationKind = "project" | "about" | "contact" | "home";

export interface Station {
  id: string;
  kind: StationKind;
  label: Loc;
  quote: Loc;
  position: [number, number];
  radius: number; // trigger radius
  color: string;
  project?: Project;
}

export const stations: Station[] = [
  {
    id: "home",
    kind: "home",
    label: { fr: "Départ", en: "Start" },
    quote: homeQuote,
    position: [0, 0],
    radius: 3,
    color: "#ffffff",
  },
  ...projects.map<Station>((p) => ({
    id: p.id,
    kind: "project",
    label: { fr: p.title, en: p.title },
    quote: p.quote,
    position: p.position,
    radius: 3.6,
    color: p.color,
    project: p,
  })),
  {
    id: "about",
    kind: "about",
    label: { fr: "Qui je suis", en: "About me" },
    quote: {
      fr: "Ça, c'est chez moi — enfin, une version low-poly. Psycho cognitive, STAPS, un bootcamp Rails : appuie sur E pour le parcours complet.",
      en: "That's my place — well, a low-poly version of it. Cognitive psychology, sport science, a Rails bootcamp: press E for the whole story.",
    },
    position: [-12.8, 2.3],
    radius: 3.4,
    color: "#fbe7c6",
  },
  {
    id: "contact",
    kind: "contact",
    label: { fr: "Contact", en: "Contact" },
    quote: {
      fr: "Une question, un projet, ou juste envie d'échanger ? Glisse une lettre dans la boîte (E). Je réponds vite, promis.",
      en: "A question, a project, or just want to talk? Drop a letter in the mailbox (E). I answer fast, promise.",
    },
    position: [-8.4, 10],
    radius: 3,
    color: "#f5c451",
  },
];

/** Solid circular obstacles the character can't walk through. */
export const obstacles: { x: number; z: number; r: number }[] = [
  ...projects.map((p) => ({ x: p.position[0], z: p.position[1], r: 1.6 })),
  { x: -12.8, z: 2.3, r: 1.5 },
  { x: -8.4, z: 10, r: 0.6 },
];

export const WORLD_RADIUS = 19;
