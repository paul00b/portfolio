import { projects, stationCopy, type Project } from "../data/projects";
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
    ...stationCopy.home,
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
    ...stationCopy.about,
    position: [-12.8, 2.3],
    radius: 3.4,
    color: "#fbe7c6",
  },
  {
    id: "contact",
    kind: "contact",
    ...stationCopy.contact,
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
