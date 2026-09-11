import { useEffect, type ReactNode } from "react";
import { profile, type Project } from "../data/projects";
import { ui } from "../data/ui";
import { useT } from "../i18n/lang";
import { ProjectCover } from "./ProjectCover";

function ModalShell({ onClose, children, wide = false }: { onClose: () => void; children: ReactNode; wide?: boolean }) {
  const { t } = useT();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape" || e.code === "KeyE") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/50 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div
        className={`animate-pop relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border-2 border-ink bg-cream shadow-hard sm:rounded-3xl ${wide ? "sm:max-w-4xl" : "sm:max-w-2xl"}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-white text-ink shadow-hard-sm transition hover:-translate-y-0.5 hover:bg-coral hover:text-white"
          aria-label="Close"
        >
          ✕
        </button>
        {children}
        <div className="flex items-center justify-between border-t-2 border-ink/10 px-6 py-3 font-mono text-[11px] text-ink-soft">
          <span className="flex items-center gap-2">
            <span className="kbd">Esc</span> {t(ui.closeHint)} <span className="kbd">E</span> {t(ui.toClose)}
          </span>
          <span className="hidden sm:inline">{profile.name.toLowerCase().replace(" ", "")}</span>
        </div>
      </div>
    </div>
  );
}

export function ProjectModal({ project, onClose, onNext }: { project: Project; onClose: () => void; onNext?: () => void }) {
  const { t, tl } = useT();
  return (
    <ModalShell onClose={onClose} wide>
      <div className="grid md:grid-cols-5">
        <div className="relative md:col-span-2">
          {project.image ? (
            <img src={project.image} alt={project.title} className="h-56 w-full object-cover md:h-full" />
          ) : (
            <ProjectCover project={project} className="h-56 w-full object-cover md:h-full" />
          )}
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <span className="rounded-full border-2 border-ink bg-white px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider shadow-hard-sm">{t(project.period)}</span>
            {project.favorite && <span className="rounded-full border-2 border-ink bg-mustard px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider shadow-hard-sm">{t(ui.favourite)}</span>}
          </div>
        </div>
        <div className="p-6 md:col-span-3 md:p-8">
          <div className="mb-1 font-mono text-xs font-bold uppercase tracking-wider" style={{ color: project.accent }}>
            {t(project.company)} · {t(project.role)}
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">{project.title}</h2>
          <p className="mt-1 text-lg font-medium text-ink-soft">{t(project.tagline)}</p>

          <p className="mt-5 leading-relaxed text-ink">{t(project.description)}</p>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {project.facts.map((f) => (
              <div key={f.label.fr} className="rounded-xl border-2 border-ink bg-white p-3 shadow-hard-sm">
                <div className="text-[13px] font-bold leading-tight" style={{ color: project.accent }}>
                  {t(f.value)}
                </div>
                <div className="mt-1.5 font-mono text-[10px] uppercase leading-tight tracking-wider text-ink-soft">{t(f.label)}</div>
              </div>
            ))}
          </div>

          <div className="mt-7">
            <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-soft">{t(ui.whatIDid)}</div>
            <ul className="space-y-2">
              {tl(project.contribution).map((c) => (
                <li key={c} className="flex gap-2.5 text-sm leading-relaxed text-ink">
                  <span className="mt-[7px] h-2 w-2 shrink-0 rotate-45 border border-ink" style={{ background: project.color }} />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 rounded-2xl border-2 border-ink bg-white p-4 shadow-hard-sm">
            <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-wider" style={{ color: project.accent }}>
              {t(ui.whatILearned)}
            </div>
            <p className="text-sm leading-relaxed text-ink">{t(project.learning)}</p>
          </div>

          {project.confidential && (
            <div className="mt-4 flex gap-2.5 rounded-2xl border-2 border-dashed border-ink/30 p-4 text-[12px] leading-relaxed text-ink-soft">
              <span className="text-base leading-none">🔒</span>
              <span>{t(ui.confidentialNote)}</span>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            {tl(project.tags).map((tag) => (
              <span key={tag} className="rounded-md border border-ink/20 bg-cream-dark px-2 py-1 font-mono text-[11px] text-ink-soft">
                #{tag.toLowerCase().replace(/\s+/g, "-")}
              </span>
            ))}
          </div>

          {onNext && (
            <button onClick={onNext} className="mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-ink px-4 py-2 text-sm font-bold text-white shadow-hard-sm transition hover:-translate-y-0.5 hover:bg-coral">
              {t(ui.nextProject)}
            </button>
          )}
        </div>
      </div>
    </ModalShell>
  );
}

export function AboutModal({ onClose }: { onClose: () => void }) {
  const { t, tl } = useT();
  return (
    <ModalShell onClose={onClose} wide>
      <div className="p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <img src="/images/paul.jpg" alt={profile.name} className="h-28 w-28 shrink-0 rounded-2xl border-2 border-ink object-cover shadow-hard-sm" />
          <div>
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-coral">{t(ui.playerProfile)}</div>
            <h2 className="text-3xl font-extrabold tracking-tight">{profile.name}</h2>
            <p className="text-ink-soft">
              {t(profile.title)} @ {profile.company} · {profile.years} {t(ui.yearsXp)} · {t(profile.location)}
            </p>
            <p className="mt-2 font-mono text-xs font-bold" style={{ color: "#8e3f7a" }}>
              « {t(profile.northStar)} »
            </p>
          </div>
        </div>

        <p className="mt-6 leading-relaxed">{t(profile.intro)}</p>
        {tl(profile.bio).map((p) => (
          <p key={p} className="mt-3 leading-relaxed text-ink-soft">
            {p}
          </p>
        ))}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div>
            <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-soft">{t(ui.skillTree)}</div>
            <div className="space-y-2">
              {profile.skills.map((s, i) => (
                <div key={s.name.fr}>
                  <div className="flex justify-between text-xs font-semibold">
                    <span>{t(s.name)}</span>
                    <span className="font-mono text-ink-soft">{s.level}</span>
                  </div>
                  <div className="mt-1 h-2.5 overflow-hidden rounded-full border border-ink bg-white">
                    <div className="h-full" style={{ width: `${s.level}%`, background: ["#8e3f7a", "#f5c451", "#7fd8be", "#ff6b5b", "#b9a7ff", "#8fc7ff"][i % 6] }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mb-2 mt-6 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-soft">{t(ui.toolbox)}</div>
            <div className="flex flex-wrap gap-1.5">
              {profile.tools.map((tool) => (
                <span key={tool} className="rounded-lg border-2 border-ink bg-white px-2 py-0.5 font-mono text-[11px] font-semibold shadow-hard-sm">
                  {tool}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-soft">{t(ui.education)}</div>
            <ol className="space-y-3">
              {profile.education.map((e) => (
                <li key={e.period} className="rounded-xl border-2 border-ink bg-white p-3 shadow-hard-sm">
                  <div className="font-mono text-[10px] font-bold text-coral">{e.period}</div>
                  <div className="text-sm font-bold leading-tight">{t(e.title)}</div>
                  <div className="mt-0.5 text-[12px] leading-snug text-ink-soft">{t(e.detail)}</div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-soft">{t(ui.hobbies)}</div>
          <div className="grid gap-2 sm:grid-cols-3">
            {profile.hobbies.map((h) => (
              <div key={h.label.fr} className="rounded-xl border-2 border-ink bg-white p-3 shadow-hard-sm">
                <div className="text-xl">{h.icon}</div>
                <div className="mt-1 text-sm font-bold">{t(h.label)}</div>
                <div className="mt-0.5 text-[12px] leading-snug text-ink-soft">{t(h.detail)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-soft">{t(ui.achievements)}</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {profile.achievements.map((a) => (
              <div key={a.label.fr} className="flex items-center gap-2 rounded-xl border-2 border-ink bg-white px-3 py-2 text-xs font-semibold shadow-hard-sm">
                <span className="text-lg">{a.icon}</span> {t(a.label)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

export function ContactModal({ onClose }: { onClose: () => void }) {
  const { t } = useT();
  return (
    <ModalShell onClose={onClose}>
      <div className="p-6 sm:p-8">
        <div className="font-mono text-xs font-bold uppercase tracking-wider text-coral">{t(ui.newMessage)}</div>
        <h2 className="text-3xl font-extrabold tracking-tight">{t(ui.contactTitle)}</h2>
        <p className="mt-2 text-ink-soft">{t(ui.contactPitch)}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <a href={`mailto:${profile.email}`} className="group rounded-2xl border-2 border-ink bg-white p-4 shadow-hard-sm transition hover:-translate-y-0.5 hover:shadow-hard">
            <div className="text-2xl">✉️</div>
            <div className="mt-2 font-bold">{t(ui.email)}</div>
            <div className="font-mono text-xs text-ink-soft group-hover:text-coral">{profile.email}</div>
          </a>
          <a href={profile.linkedin} target="_blank" rel="noreferrer" className="group rounded-2xl border-2 border-ink bg-white p-4 shadow-hard-sm transition hover:-translate-y-0.5 hover:shadow-hard">
            <div className="text-2xl">💼</div>
            <div className="mt-2 font-bold">LinkedIn</div>
            <div className="font-mono text-xs text-ink-soft group-hover:text-coral">{profile.linkedinLabel}</div>
          </a>
          <div className="rounded-2xl border-2 border-ink bg-white p-4 shadow-hard-sm">
            <div className="text-2xl">📍</div>
            <div className="mt-2 font-bold">{t(ui.based)}</div>
            <div className="font-mono text-xs text-ink-soft">{t(profile.location)}</div>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border-2 border-ink bg-ink p-4 font-mono text-xs text-mint shadow-hard-sm">
          <div className="text-white/50">$ paul --{t(ui.statusLine)}</div>
          <div>
            → <span className="text-mustard">{t(profile.status)}</span>
          </div>
          <div>
            → timezone <span className="text-mustard">Europe/Paris</span> · {t(ui.coffee)} <span className="text-mustard">{t(ui.yes)}</span>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
