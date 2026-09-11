import { useState } from "react";
import { profile, projects, type Project } from "../data/projects";
import { ui } from "../data/ui";
import { useT } from "../i18n/lang";
import { AboutModal, ContactModal, ProjectModal } from "../ui/Modals";
import { ProjectCover } from "../ui/ProjectCover";

/* ---------- Isometric low-poly SVG cube ---------- */
function IsoCube({ size = 60, top, left, right, className = "", style }: { size?: number; top: string; left: string; right: string; className?: string; style?: React.CSSProperties }) {
  const h = size;
  const w = size * 0.866;
  return (
    <svg width={w * 2} height={h * 2} viewBox="0 0 100 116" className={className} style={style} aria-hidden>
      <polygon points="50,0 100,29 50,58 0,29" fill={top} stroke="#1f2233" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="0,29 50,58 50,116 0,87" fill={left} stroke="#1f2233" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="50,58 100,29 100,87 50,116" fill={right} stroke="#1f2233" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

function SectionTitle({ index, title, sub }: { index: string; title: string; sub?: string }) {
  return (
    <div className="mb-10 flex items-end justify-between gap-6">
      <div>
        <div className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-coral">
          {index} <span className="text-ink/30">//</span> {title}
        </div>
        {sub && <h2 className="max-w-xl text-3xl font-extrabold tracking-tight sm:text-4xl">{sub}</h2>}
      </div>
    </div>
  );
}

function ProjectCard({ project, onOpen, big = false }: { project: Project; onOpen: () => void; big?: boolean }) {
  const { t, tl } = useT();
  return (
    <button
      onClick={onOpen}
      className={`group relative flex w-full flex-col overflow-hidden rounded-3xl border-2 border-ink bg-white text-left shadow-hard-sm transition duration-300 hover:-translate-y-1 hover:shadow-hard ${big ? "md:col-span-2 md:flex-row" : ""}`}
    >
      <div className={`relative overflow-hidden ${big ? "md:w-1/2" : ""}`}>
        {project.image ? (
          <img src={project.image} alt={project.title} className={`w-full object-cover transition duration-500 group-hover:scale-105 ${big ? "h-64 md:h-full" : "h-52"}`} />
        ) : (
          <ProjectCover project={project} className={`w-full object-cover transition duration-500 group-hover:scale-105 ${big ? "h-64 md:h-full" : "h-52"}`} />
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          <span className="rounded-full border-2 border-ink bg-white px-2 py-0.5 font-mono text-[10px] font-bold">{t(project.period)}</span>
          {project.favorite && <span className="rounded-full border-2 border-ink bg-mustard px-2 py-0.5 font-mono text-[10px] font-bold">{t(ui.fav)}</span>}
        </div>
      </div>
      <div className={`flex flex-1 flex-col p-5 ${big ? "md:p-8" : ""}`}>
        <div className="mb-1 font-mono text-[11px] font-bold uppercase tracking-wider" style={{ color: project.accent }}>
          {t(project.company)} · {t(project.role)}
        </div>
        <h3 className={`font-extrabold tracking-tight ${big ? "text-2xl md:text-3xl" : "text-xl"}`}>{project.title}</h3>
        <p className="mt-1 text-sm text-ink-soft">{t(project.tagline)}</p>
        {big && <p className="mt-4 hidden text-sm leading-relaxed text-ink md:block">{t(project.description)}</p>}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {tl(project.tags).slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-md border border-ink/15 bg-cream px-1.5 py-0.5 font-mono text-[10px] text-ink-soft">
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <div className="flex gap-4">
            {project.facts.slice(0, 2).map((f) => (
              <div key={f.label.fr}>
                <div className="text-[13px] font-bold leading-tight" style={{ color: project.accent }}>
                  {t(f.value)}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">{t(f.label)}</div>
              </div>
            ))}
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-white transition group-hover:bg-ink group-hover:text-white">→</span>
        </div>
      </div>
    </button>
  );
}

export function ClassicPortfolio({ onSwitchToGame }: { onSwitchToGame: () => void }) {
  const { t, tl } = useT();
  const [openProject, setOpenProject] = useState<Project | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showContact, setShowContact] = useState(false);

  return (
    <div className="bg-grid min-h-full overflow-y-auto">
      {/* NAV */}
      <header className="sticky top-0 z-40 border-b-2 border-ink/10 bg-cream/85 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <a href="#top" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-ink bg-coral font-mono text-sm font-bold text-white shadow-hard-sm">PB</span>
            <span className="hidden font-bold sm:block">{profile.name}</span>
          </a>
          <div className="hidden items-center gap-6 font-mono text-xs font-semibold text-ink-soft lg:flex">
            <a href="#work" className="hover:text-coral">{t(ui.navWork)}</a>
            <a href="#about" className="hover:text-coral">{t(ui.navAbout)}</a>
            <a href="#experience" className="hover:text-coral">{t(ui.navExperience)}</a>
            <a href="#contact" className="hover:text-coral">{t(ui.navContact)}</a>
          </div>
          <div className="w-[248px]" /> {/* space for the global language + mode toggles */}
        </nav>
      </header>

      {/* HERO */}
      <section id="top" className="relative mx-auto max-w-6xl overflow-hidden px-5 pb-20 pt-16 sm:pt-24">
        <IsoCube size={44} top="#c78bb6" left="#8e3f7a" right="#4a2545" className="animate-float absolute right-[8%] top-10 hidden md:block" />
        <IsoCube size={30} top="#c9f2e3" left="#7fd8be" right="#3fb994" className="animate-float absolute right-[26%] top-40 hidden md:block" style={{ animationDelay: "0.8s" }} />
        <IsoCube size={36} top="#e0d8ff" left="#b9a7ff" right="#8b74ff" className="animate-float absolute right-[14%] top-64 hidden md:block" style={{ animationDelay: "1.6s" }} />
        <IsoCube size={24} top="#ffe9a8" left="#f5c451" right="#e0a929" className="animate-float absolute left-[55%] top-8 hidden lg:block" style={{ animationDelay: "0.4s" }} />

        <div className="grid items-center gap-12 md:grid-cols-5">
          <div className="animate-rise md:col-span-3">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white px-3 py-1 font-mono text-xs font-bold shadow-hard-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-mint-dark" /> {t(profile.status)}
            </div>
            <h1 className="text-5xl font-extrabold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
              {t(ui.heroTitleA)} <span className="text-coral">{t(ui.heroTitleHighlight1)}</span> {t(ui.heroTitleB)}{" "}
              <span className="text-mint-dark">{t(ui.heroTitleHighlight2)}</span>
              {t(ui.heroTitleC)}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink-soft">{t(profile.intro)}</p>
            <div className="mt-6 inline-block rounded-xl border-2 border-dashed border-ink/25 px-3 py-1.5 font-mono text-xs font-bold" style={{ color: "#8e3f7a" }}>
              « {t(profile.northStar)} »
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#work" className="rounded-xl border-2 border-ink bg-ink px-5 py-3 text-sm font-bold text-white shadow-hard transition hover:-translate-y-0.5 hover:bg-coral">
                {t(ui.seeWork)}
              </a>
              <button onClick={onSwitchToGame} className="rounded-xl border-2 border-ink bg-white px-5 py-3 text-sm font-bold shadow-hard transition hover:-translate-y-0.5 hover:bg-mustard">
                {t(ui.playPortfolio)}
              </button>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 font-mono text-xs text-ink-soft">
              <div>
                <div className="text-2xl font-bold text-ink">{profile.years}{t(ui.yearsShort)}</div>
                {t(ui.statYears)}
              </div>
              <div>
                <div className="text-2xl font-bold text-ink">{projects.length}</div>
                {t(ui.statProjects)}
              </div>
              <div>
                <div className="text-2xl font-bold text-ink">3</div>
                {t(ui.statSystems)}
              </div>
              <div>
                <div className="text-2xl font-bold text-ink">1</div>
                {t(ui.statDesigners)}
              </div>
            </div>
          </div>

          <div className="animate-rise relative md:col-span-2" style={{ animationDelay: "0.15s" }}>
            <div className="relative mx-auto max-w-sm">
              <div className="overflow-hidden rounded-3xl border-2 border-ink shadow-hard">
                <img src="/images/paul.jpg" alt={profile.name} className="aspect-[4/5] w-full object-cover" />
              </div>
              <div className="absolute -bottom-5 -left-4 rounded-2xl border-2 border-ink bg-ink p-3 font-mono text-[11px] text-mint shadow-hard sm:-left-8">
                <div className="text-white/50">$ paul --whoami</div>
                <div>name: "{profile.name}"</div>
                <div>role: "{t(profile.title)}"</div>
                <div>at: "{profile.company}"</div>
                <div>
                  xp: {profile.years} <span className="text-mustard">// {t(ui.andCounting)}</span>
                </div>
              </div>
              <div className="absolute -right-3 -top-4 rounded-full border-2 border-ink bg-mustard px-3 py-1 font-mono text-xs font-bold shadow-hard-sm sm:-right-6">LVL {profile.years}</div>
            </div>
          </div>
        </div>
      </section>

      {/* WORK */}
      <section id="work" className="mx-auto max-w-6xl px-5 py-20">
        <SectionTitle index="01" title={t(ui.sectionWork)} sub={t(ui.sectionWorkSub)} />
        <div className="grid gap-6 md:grid-cols-2">
          {projects.map((p, i) => (
            <ProjectCard key={p.id} project={p} big={i === 0} onOpen={() => setOpenProject(p)} />
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="border-y-2 border-ink/10 bg-white/60">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-2">
          <div>
            <SectionTitle index="02" title={t(ui.sectionAbout)} sub={t(ui.sectionAboutSub)} />
            {tl(profile.bio).map((p) => (
              <p key={p} className="mb-4 leading-relaxed text-ink-soft">
                {p}
              </p>
            ))}
            <div className="mt-6 flex flex-wrap gap-2">
              {profile.tools.map((tool) => (
                <span key={tool} className="rounded-lg border-2 border-ink bg-white px-2.5 py-1 font-mono text-xs font-semibold shadow-hard-sm">
                  {tool}
                </span>
              ))}
            </div>

            <div className="mt-8">
              <div className="mb-3 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-soft">{t(ui.education)}</div>
              <ol className="space-y-2">
                {profile.education.map((e) => (
                  <li key={e.period} className="rounded-2xl border-2 border-ink bg-white p-4 shadow-hard-sm">
                    <div className="font-mono text-[10px] font-bold text-coral">{e.period}</div>
                    <div className="font-bold leading-tight">{t(e.title)}</div>
                    <div className="mt-1 text-sm leading-snug text-ink-soft">{t(e.detail)}</div>
                  </li>
                ))}
              </ol>
            </div>

            <button onClick={() => setShowAbout(true)} className="mt-8 rounded-xl border-2 border-ink bg-white px-4 py-2 text-sm font-bold shadow-hard-sm transition hover:-translate-y-0.5 hover:bg-lavender">
              {t(ui.openProfile)}
            </button>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border-2 border-ink bg-white p-6 shadow-hard">
              <div className="mb-4 flex items-center justify-between">
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-ink-soft">{t(ui.skillTree)}</div>
              </div>
              <div className="space-y-3">
                {profile.skills.map((s, i) => (
                  <div key={s.name.fr}>
                    <div className="flex justify-between text-xs font-semibold">
                      <span>{t(s.name)}</span>
                      <span className="font-mono text-ink-soft">{s.level}</span>
                    </div>
                    <div className="mt-1 h-3 overflow-hidden rounded-full border-2 border-ink bg-cream">
                      <div className="h-full rounded-full" style={{ width: `${s.level}%`, background: ["#8e3f7a", "#f5c451", "#7fd8be", "#ff6b5b", "#b9a7ff", "#8fc7ff"][i % 6] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {profile.achievements.map((a) => (
                <div key={a.label.fr} className="flex items-start gap-2 rounded-2xl border-2 border-ink bg-white p-3 text-xs font-semibold shadow-hard-sm">
                  <span className="text-xl">{a.icon}</span>
                  <span>{t(a.label)}</span>
                </div>
              ))}
            </div>

            <div>
              <div className="mb-3 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-soft">{t(ui.hobbies)}</div>
              <div className="space-y-2">
                {profile.hobbies.map((h) => (
                  <div key={h.label.fr} className="flex gap-3 rounded-2xl border-2 border-ink bg-white p-3 shadow-hard-sm">
                    <span className="text-xl leading-none">{h.icon}</span>
                    <div>
                      <div className="text-sm font-bold">{t(h.label)}</div>
                      <div className="text-[12px] leading-snug text-ink-soft">{t(h.detail)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EXPERIENCE */}
      <section id="experience" className="mx-auto max-w-6xl px-5 py-20">
        <SectionTitle index="03" title={t(ui.sectionExperience)} sub={t(ui.sectionExperienceSub)} />
        <ol className="relative border-l-2 border-ink/20 pl-8">
          {profile.timeline.map((entry, i) => (
            <li key={entry.company} className="relative mb-8 last:mb-0">
              <span className="absolute -left-[41px] flex h-5 w-5 items-center justify-center rounded-full border-2 border-ink bg-white">
                <span className="h-2 w-2 rounded-full" style={{ background: ["#8e3f7a", "#7fd8be", "#ff6b5b", "#b9a7ff", "#8fc7ff"][i] }} />
              </span>
              <div className="rounded-2xl border-2 border-ink bg-white p-5 shadow-hard-sm">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-bold">
                      {t(entry.title)} <span className="text-ink-soft">@ {entry.company}</span>
                    </div>
                    <div className="font-mono text-xs text-ink-soft">{t(entry.where)}</div>
                  </div>
                  <div className="w-fit shrink-0 rounded-full border-2 border-ink bg-cream px-3 py-1 font-mono text-xs font-bold">{t(entry.period)}</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {entry.tags.map((tag) => (
                    <span key={tag} className="font-mono text-[10px] text-ink-soft">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* CONTACT */}
      <section id="contact" className="mx-auto max-w-6xl px-5 pb-24">
        <div className="relative overflow-hidden rounded-3xl border-2 border-ink bg-ink p-8 text-white shadow-hard sm:p-14">
          <IsoCube size={50} top="#c78bb6" left="#8e3f7a" right="#4a2545" className="animate-float absolute -right-4 -top-6 opacity-90" />
          <IsoCube size={30} top="#ffe9a8" left="#f5c451" right="#e0a929" className="animate-float absolute bottom-4 right-32 opacity-90" style={{ animationDelay: "1s" }} />
          <div className="font-mono text-xs font-bold uppercase tracking-wider text-mint">04 // {t(ui.sectionContact)}</div>
          <h2 className="mt-2 max-w-xl text-3xl font-extrabold tracking-tight sm:text-5xl">{t(ui.contactHeadline)}</h2>
          <p className="mt-4 max-w-lg text-white/70">{t(ui.contactSub)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={`mailto:${profile.email}`} className="rounded-xl border-2 border-white bg-white px-5 py-3 text-sm font-bold text-ink transition hover:-translate-y-0.5 hover:bg-coral hover:text-white">
              {profile.email}
            </a>
            <button onClick={() => setShowContact(true)} className="rounded-xl border-2 border-white/40 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:border-white">
              {t(ui.allLinks)}
            </button>
          </div>
        </div>
        <footer className="mt-10 flex flex-col items-center justify-between gap-3 font-mono text-xs text-ink-soft sm:flex-row">
          <span>
            © {new Date().getFullYear()} {profile.name} — {t(ui.builtWith)}
          </span>
          <button onClick={onSwitchToGame} className="hover:text-coral">
            {t(ui.switchToGame)}
          </button>
        </footer>
      </section>

      {openProject && (
        <ProjectModal
          project={openProject}
          onClose={() => setOpenProject(null)}
          onNext={() => {
            const idx = projects.findIndex((p) => p.id === openProject.id);
            setOpenProject(projects[(idx + 1) % projects.length]);
          }}
        />
      )}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
    </div>
  );
}
