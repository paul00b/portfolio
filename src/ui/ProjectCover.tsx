import type { ReactNode } from "react";
import type { Landmark, Project } from "../data/projects";

/**
 * Project covers, drawn in the same low-poly isometric language as the game.
 * Each cover mirrors the 3D pavilion of its project, so the card in the classic
 * view and the building on the island read as one and the same thing.
 */

const INK = "#1f2233";
const K = 0.866;
/* One shared isometric camera for every cover (viewBox 400 × 220). */
const OX = 200;
const OY = 146;
const S = 26.5;

type V3 = [number, number, number];

/** Project a 3D point (y up) onto the cover. */
const pt = ([x, y, z]: V3) => ({ x: OX + (x - z) * K * S, y: OY + (x + z) * 0.5 * S - y * S });
const P = (v: V3) => {
  const p = pt(v);
  return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
};

function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `#${((1 << 24) | (c((n >> 16) & 255) << 16) | (c((n >> 8) & 255) << 8) | c(n & 255)).toString(16).slice(1)}`;
}

function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (sh: number) => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t);
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
}

const stroke = { stroke: INK, strokeWidth: 2, strokeLinejoin: "round" as const };

/* ---------- primitives ---------- */

function Poly({ pts, fill, opacity }: { pts: V3[]; fill: string; opacity?: number }) {
  return <polygon points={pts.map(P).join(" ")} fill={fill} opacity={opacity} {...stroke} />;
}

/** Axis-aligned box from its min corner. Faces: top, +z (left-front), +x (right-front). */
function Box({ x, y, z, w, h, d, c, top }: { x: number; y: number; z: number; w: number; h: number; d: number; c: string; top?: string }) {
  return (
    <g>
      <Poly pts={[[x, y, z + d], [x + w, y, z + d], [x + w, y + h, z + d], [x, y + h, z + d]]} fill={shade(c, 0.88)} />
      <Poly pts={[[x + w, y, z], [x + w, y, z + d], [x + w, y + h, z + d], [x + w, y + h, z]]} fill={shade(c, 0.72)} />
      <Poly pts={[[x, y + h, z], [x + w, y + h, z], [x + w, y + h, z + d], [x, y + h, z + d]]} fill={top ?? c} />
    </g>
  );
}

/** Vertical cylinder. */
function Cyl({ cx, y, cz, r, h, c }: { cx: number; y: number; cz: number; r: number; h: number; c: string }) {
  const rx = r * Math.SQRT2 * K * S;
  const ry = r * Math.SQRT2 * 0.5 * S;
  const t = pt([cx, y + h, cz]);
  const b = pt([cx, y, cz]);
  const body = `M ${t.x - rx},${t.y} L ${b.x - rx},${b.y} A ${rx},${ry} 0 0 0 ${b.x + rx},${b.y} L ${t.x + rx},${t.y} A ${rx},${ry} 0 0 1 ${t.x - rx},${t.y} Z`;
  return (
    <g>
      <path d={body} fill={shade(c, 0.8)} {...stroke} />
      <ellipse cx={t.x} cy={t.y} rx={rx} ry={ry} fill={c} {...stroke} />
    </g>
  );
}

/** Flat horizontal disc (no thickness). */
function Disc({ cx, y, cz, r, c }: { cx: number; y: number; cz: number; r: number; c: string }) {
  const p = pt([cx, y, cz]);
  return <ellipse cx={p.x} cy={p.y} rx={r * Math.SQRT2 * K * S} ry={r * Math.SQRT2 * 0.5 * S} fill={c} {...stroke} />;
}

/** Four-sided pyramid over a rectangular footprint. */
function Roof({ x, y, z, w, d, h, c }: { x: number; y: number; z: number; w: number; d: number; h: number; c: string }) {
  const a: V3 = [x + w / 2, y + h, z + d / 2];
  return (
    <g>
      <Poly pts={[[x, y, z + d], [x + w, y, z + d], a]} fill={shade(c, 0.88)} />
      <Poly pts={[[x + w, y, z], [x + w, y, z + d], a]} fill={shade(c, 0.72)} />
    </g>
  );
}

function Sph({ at, r, c }: { at: V3; r: number; c: string }) {
  const p = pt(at);
  return (
    <g>
      <circle cx={p.x} cy={p.y} r={r * S} fill={c} {...stroke} />
      <circle cx={p.x - r * S * 0.35} cy={p.y - r * S * 0.35} r={r * S * 0.22} fill="#ffffff" opacity={0.55} />
    </g>
  );
}

/** Small four-point spark, drawn in screen space. */
function Spark({ at, r, c }: { at: V3; r: number; c: string }) {
  const p = pt(at);
  const s = r * S;
  const d = `M ${p.x},${p.y - s} Q ${p.x},${p.y} ${p.x + s},${p.y} Q ${p.x},${p.y} ${p.x},${p.y + s} Q ${p.x},${p.y} ${p.x - s},${p.y} Q ${p.x},${p.y} ${p.x},${p.y - s} Z`;
  return <path d={d} fill={c} {...stroke} />;
}

/** The pavilion platform every scene stands on. */
function Plate({ c }: { c: string }) {
  return (
    <g>
      <Cyl cx={0} y={-0.22} cz={0} r={3.0} h={0.22} c="#fffaf1" />
      <Disc cx={0} y={0.005} cz={0} r={2.55} c={c} />
    </g>
  );
}

/* ---------- scenes ---------- */

const PRUNE = "#4a2545";
const PRUNE_SOFT = "#8e3f7a";
const JONQUILLE = "#f5c451";

/* AMIA — the warm practice with a floating conversation */
function AssistantScene() {
  return (
    <>
      <Plate c={PRUNE} />
      <Box x={-1.05} y={0} z={-0.8} w={2.1} h={1.6} d={1.6} c="#fff3e6" />
      <Box x={-1.08} y={0} z={-0.83} w={2.16} h={0.3} d={1.66} c="#a9754c" />
      {/* windows + door on the two visible faces */}
      <Poly pts={[[0.45, 0.85, 0.81], [0.92, 0.85, 0.81], [0.92, 1.3, 0.81], [0.45, 1.3, 0.81]]} fill="#ffeec2" />
      <Poly pts={[[-0.27, 0.3, 0.81], [0.22, 0.3, 0.81], [0.22, 1.25, 0.81], [-0.27, 1.25, 0.81]]} fill={JONQUILLE} />
      <Poly pts={[[1.06, 0.85, -0.55], [1.06, 0.85, -0.1], [1.06, 1.3, -0.1], [1.06, 1.3, -0.55]]} fill="#f3dfa6" />
      <Box x={-1.2} y={1.6} z={-0.95} w={2.4} h={0.26} d={1.9} c={PRUNE} />
      {/* conversation bubble */}
      <Box x={-1.0} y={2.75} z={-0.14} w={2.0} h={1.05} d={0.28} c="#ffffff" />
      <Poly pts={[[-0.55, 2.75, 0.145], [-0.05, 2.75, 0.145], [-0.42, 2.32, 0.145]]} fill={shade("#ffffff", 0.88)} />
      {[-0.5, 0, 0.5].map((x) => {
        const p = pt([x, 3.27, 0.15]);
        return <circle key={x} cx={p.x} cy={p.y} r={0.11 * S} fill={PRUNE} {...stroke} />;
      })}
      <Spark at={[1.5, 4.05, 0.3]} r={0.28} c={JONQUILLE} />
    </>
  );
}

/* Primary — foundations: a tower of tokens & components */
function SystemScene() {
  return (
    <>
      <Plate c={JONQUILLE} />
      <Box x={-1.75} y={0} z={0.45} w={0.5} h={0.24} d={0.5} c={PRUNE_SOFT} />
      <Box x={-1.58} y={0.24} z={0.53} w={0.34} h={0.2} d={0.34} c="#fff3e6" />
      <Box x={-0.95} y={0} z={-0.95} w={1.9} h={0.5} d={1.9} c={PRUNE} />
      <Box x={-0.955} y={0.5} z={-0.475} w={1.35} h={0.5} d={1.35} c="#fff3e6" />
      <Box x={-0.35} y={1.0} z={-0.75} w={1.1} h={0.5} d={1.1} c={PRUNE_SOFT} />
      <Box x={-0.425} y={1.5} z={-0.325} w={0.85} h={0.5} d={0.85} c={JONQUILLE} />
      <Box x={-0.22} y={2.0} z={-0.38} w={0.6} h={0.5} d={0.6} c="#fff3e6" />
      {/* a toggle, because every system has one */}
      <Box x={1.1} y={0} z={0.65} w={0.75} h={0.36} d={0.36} c={JONQUILLE} />
      <Sph at={[1.7, 0.2, 0.83]} r={0.17} c="#ffffff" />
      {/* floating design token */}
      <Cyl cx={0} y={3.05} cz={0} r={0.46} h={0.16} c={JONQUILLE} />
      <Cyl cx={0} y={3.21} cz={0} r={0.22} h={0.06} c={PRUNE} />
    </>
  );
}

/* Gymlib × Wellpass — a club and a floating dumbbell */
function GymScene() {
  const w = (x: number, wide: boolean, c: string) =>
    wide ? <Box x={x} y={2.62} z={-0.36} w={0.28} h={0.72} d={0.72} c={c} /> : <Box x={x} y={2.72} z={-0.26} w={0.22} h={0.52} d={0.52} c={c} />;
  return (
    <>
      <Plate c="#7fd8be" />
      <Box x={-1.15} y={0} z={-0.85} w={2.3} h={1.5} d={1.7} c="#ffffff" />
      <Poly pts={[[-0.95, 0.4, 0.86], [0.95, 0.4, 0.86], [0.95, 1.35, 0.86], [-0.95, 1.35, 0.86]]} fill="#d8f6ec" />
      <Poly pts={[[-1.15, 0.05, 0.86], [1.15, 0.05, 0.86], [1.15, 0.4, 0.86], [-1.15, 0.4, 0.86]]} fill="#2f9c7c" />
      <Poly pts={[[1.16, 0.55, -0.6], [1.16, 0.55, -0.05], [1.16, 1.3, -0.05], [1.16, 1.3, -0.6]]} fill="#d8f6ec" />
      <Box x={-1.28} y={1.5} z={-0.98} w={2.55} h={0.24} d={1.95} c="#3fb994" />
      {/* rolled mats by the entrance */}
      <Box x={-1.7} y={0} z={0.1} w={0.32} h={0.32} d={0.85} c="#ff6b5b" />
      <Box x={-1.68} y={0.32} z={0.12} w={0.3} h={0.3} d={0.8} c={JONQUILLE} />
      {/* dumbbell */}
      {w(-1.02, false, "#7fd8be")}
      {w(-0.8, true, "#2f9c7c")}
      <Box x={-0.55} y={2.9} z={-0.07} w={1.1} h={0.14} d={0.14} c="#c9d2e0" />
      {w(0.52, true, "#2f9c7c")}
      {w(0.8, false, "#7fd8be")}
    </>
  );
}

/* Mangopay — the bank and its coins */
function BankScene() {
  return (
    <>
      <Plate c="#ff6b5b" />
      <Box x={-1.1} y={0} z={-0.8} w={2.2} h={1.8} d={1.6} c="#fff4f0" />
      <Roof x={-1.28} y={1.8} z={-0.98} w={2.56} d={1.96} h={0.75} c="#ff6b5b" />
      <Box x={-1.2} y={0} z={0.8} w={2.4} h={0.2} d={0.55} c="#e4d4cf" />
      {[-0.72, -0.24, 0.24, 0.72].map((x) => (
        <Cyl key={x} cx={x} y={0.2} cz={0.95} r={0.1} h={1.6} c="#ffd3cc" />
      ))}
      {/* coin stack */}
      {[0, 1, 2].map((i) => (
        <Cyl key={i} cx={1.75} y={0.12 * i} cz={0.55} r={0.3} h={0.12} c={i % 2 ? "#e0a929" : JONQUILLE} />
      ))}
      {/* the floating coin, face on */}
      {(() => {
        const p = pt([0, 3.3, 0]);
        return (
          <g>
            <circle cx={p.x - 4} cy={p.y + 3} r={0.5 * S} fill="#e0a929" {...stroke} />
            <circle cx={p.x} cy={p.y} r={0.5 * S} fill={JONQUILLE} {...stroke} />
            <circle cx={p.x} cy={p.y} r={0.3 * S} fill="none" stroke="#e0a929" strokeWidth={2.5} />
          </g>
        );
      })()}
    </>
  );
}

/* Redpill — a studio with three client screens and one very large red pill */
function AgencyScene() {
  const teeth = [-1.1, -0.37, 0.36];
  const p = pt([0, 3.35, 0]);
  const W = 1.7 * S;
  const H = 0.72 * S;
  const r = H / 2;
  return (
    <>
      <Plate c="#b9a7ff" />
      <Box x={-1.1} y={0} z={-0.8} w={2.2} h={1.6} d={1.6} c="#f2eefe" />
      {teeth.map((x0) => (
        <g key={x0}>
          <Poly pts={[[x0, 2.1, -0.8], [x0 + 0.73, 1.6, -0.8], [x0 + 0.73, 1.6, 0.8], [x0, 2.1, 0.8]]} fill={shade("#b9a7ff", 0.8)} />
          <Poly pts={[[x0, 1.6, 0.8], [x0 + 0.73, 1.6, 0.8], [x0, 2.1, 0.8]]} fill={shade("#b9a7ff", 0.92)} />
        </g>
      ))}
      {[
        { x: -0.85, c: "#ff6b5b" },
        { x: -0.23, c: JONQUILLE },
        { x: 0.39, c: "#8fc7ff" },
      ].map((s) => (
        <Poly key={s.x} pts={[[s.x, 0.7, 0.81], [s.x + 0.46, 0.7, 0.81], [s.x + 0.46, 1.3, 0.81], [s.x, 1.3, 0.81]]} fill={s.c} />
      ))}
      <Poly pts={[[1.11, 0.6, -0.55], [1.11, 0.6, -0.1], [1.11, 1.3, -0.1], [1.11, 1.3, -0.55]]} fill="#7358f5" />
      <Cyl cx={1.6} y={0} cz={0.75} r={0.22} h={0.42} c="#b9a7ff" />
      {/* the red pill */}
      <g transform={`translate(${p.x - W / 2} ${p.y - H / 2}) rotate(-32 ${W / 2} ${H / 2})`}>
        <rect width={W} height={H} rx={r} fill="#fff6f4" {...stroke} />
        <path d={`M ${W / 2},0 L ${r},0 A ${r},${r} 0 0 0 ${r},${H} L ${W / 2},${H} Z`} fill="#e4503f" {...stroke} />
        <rect x={r * 0.6} y={r * 0.45} width={W * 0.28} height={r * 0.36} rx={r * 0.18} fill="#ffffff" opacity={0.45} />
      </g>
    </>
  );
}

/* The Hacking Project — a desk, a terminal, a graduation cap */
function SchoolScene() {
  return (
    <>
      <Plate c="#8fc7ff" />
      <Box x={-1.12} y={0} z={-0.68} w={0.14} h={0.66} d={0.14} c="#a9754c" />
      <Box x={0.98} y={0} z={-0.68} w={0.14} h={0.66} d={0.14} c="#a9754c" />
      <Box x={-1.2} y={0.66} z={-0.75} w={2.4} h={0.14} d={1.5} c="#c98f5f" />
      <Box x={-1.12} y={0} z={0.54} w={0.14} h={0.66} d={0.14} c="#a9754c" />
      <Box x={0.98} y={0} z={0.54} w={0.14} h={0.66} d={0.14} c="#a9754c" />
      {/* laptop */}
      <Box x={-0.85} y={0.86} z={-0.38} w={1.1} h={0.76} d={0.06} c="#2f7fd6" />
      <Poly pts={[[-0.77, 0.94, -0.315], [0.17, 0.94, -0.315], [0.17, 1.54, -0.315], [-0.77, 1.54, -0.315]]} fill="#0f1a2e" />
      <Poly pts={[[-0.68, 1.38, -0.31], [-0.25, 1.38, -0.31], [-0.25, 1.44, -0.31], [-0.68, 1.44, -0.31]]} fill="#8fc7ff" />
      <Poly pts={[[-0.62, 1.26, -0.31], [-0.34, 1.26, -0.31], [-0.34, 1.32, -0.31], [-0.62, 1.32, -0.31]]} fill="#7fd8be" />
      <Poly pts={[[-0.68, 1.14, -0.31], [-0.45, 1.14, -0.31], [-0.45, 1.2, -0.31], [-0.68, 1.2, -0.31]]} fill={JONQUILLE} />
      <Poly pts={[[-0.38, 1.1, -0.31], [-0.32, 1.1, -0.31], [-0.32, 1.22, -0.31], [-0.38, 1.22, -0.31]]} fill="#ffffff" />
      <Box x={-0.85} y={0.8} z={-0.32} w={1.1} h={0.06} d={0.72} c="#e3e8f2" />
      {/* books */}
      <Box x={0.5} y={0.8} z={-0.55} w={0.55} h={0.12} d={0.7} c="#ff6b5b" />
      <Box x={0.54} y={0.92} z={-0.52} w={0.55} h={0.12} d={0.7} c={JONQUILLE} />
      <Box x={0.47} y={1.04} z={-0.57} w={0.55} h={0.12} d={0.7} c="#b9a7ff" />
      {/* graduation cap */}
      <Cyl cx={0} y={2.5} cz={0} r={0.28} h={0.26} c="#232946" />
      <Box x={-0.5} y={2.76} z={-0.5} w={1.0} h={0.08} d={1.0} c="#232946" top="#2f3555" />
      <Sph at={[0, 2.9, 0]} r={0.08} c={JONQUILLE} />
      <Box x={0.42} y={2.42} z={0.42} w={0.05} h={0.34} d={0.05} c={JONQUILLE} />
    </>
  );
}

/* Le Labo — a tiny planet and a rocket */
function RocketScene() {
  const nose = pt([0, 3.0, 0]);
  const apex = pt([0, 3.55, 0]);
  const rx = 0.3 * Math.SQRT2 * K * S;
  const stars: [number, number, number][] = [[42, 30, 2], [88, 64, 1.5], [150, 22, 1.2], [330, 40, 2], [372, 92, 1.4], [300, 18, 1.2], [60, 130, 1.2], [350, 150, 1.6]];
  return (
    <>
      {stars.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#ffffff" opacity={0.85} />
      ))}
      <Plate c="#3d4680" />
      <Sph at={[0, 1.0, 0]} r={1.0} c="#3d4680" />
      {[
        [0.55, 1.45, 0.5],
        [-0.55, 1.25, 0.65],
        [0.15, 0.6, 0.9],
      ].map((c, i) => {
        const p = pt(c as V3);
        return <circle key={i} cx={p.x} cy={p.y} r={0.15 * S} fill="#2a3160" {...stroke} />;
      })}
      {/* rocket */}
      <Poly pts={[[-0.55, 1.9, 0.1], [-0.3, 2.35, 0.1], [-0.3, 1.95, 0.1]]} fill="#ff6b5b" />
      <Poly pts={[[0.3, 1.95, 0.1], [0.3, 2.35, 0.1], [0.55, 1.9, 0.1]]} fill="#ff6b5b" />
      <Cyl cx={0} y={2.0} cz={0} r={0.3} h={1.0} c="#ffffff" />
      <polygon points={`${nose.x - rx},${nose.y} ${nose.x + rx},${nose.y} ${apex.x},${apex.y}`} fill="#ff6b5b" {...stroke} />
      <Sph at={[0, 2.55, 0.3]} r={0.11} c="#8fc7ff" />
      {/* satellite */}
      <Box x={1.2} y={1.55} z={-0.12} w={0.85} h={0.04} d={0.3} c="#8fc7ff" />
      <Box x={1.5} y={1.45} z={-0.22} w={0.26} h={0.26} d={0.26} c={JONQUILLE} />
    </>
  );
}

const SCENES: Record<Landmark, () => ReactNode> = {
  assistant: AssistantScene,
  system: SystemScene,
  gym: GymScene,
  bank: BankScene,
  agency: AgencyScene,
  school: SchoolScene,
  rocket: RocketScene,
};

/** Sky colour per project: a soft tint of its colour, except the Labo's night sky. */
function sky(project: Project) {
  if (project.landmark === "rocket") return "#232946";
  return mix(project.color, "#f7f2e8", 0.74);
}

export function ProjectCover({ project, className = "" }: { project: Project; className?: string }) {
  const Scene = SCENES[project.landmark];
  const bg = sky(project);
  return (
    <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label={project.title}>
      <rect width="400" height="220" fill={bg} />
      <defs>
        <pattern id={`dots-${project.id}`} width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.3" fill={project.landmark === "rocket" ? "#ffffff" : INK} opacity={project.landmark === "rocket" ? 0.08 : 0.1} />
        </pattern>
      </defs>
      <rect width="400" height="220" fill={`url(#dots-${project.id})`} />
      {/* ground shadow under the plate */}
      <ellipse cx={OX} cy={OY + 13} rx={130} ry={33} fill={INK} opacity={0.12} />
      <Scene />
    </svg>
  );
}
