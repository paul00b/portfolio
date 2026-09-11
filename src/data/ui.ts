import type { Loc } from "../i18n/lang";

/** Every string of the interface itself (the content lives in projects.ts). */
export const ui = {
  // --- global toggle -------------------------------------------------------
  modeGame: { fr: "jeu", en: "game" },
  modeRegular: { fr: "classique", en: "regular" },

  // --- intro screen --------------------------------------------------------
  pressStart: { fr: "Appuie sur start", en: "Press start" },
  introPitch: {
    fr: "Promène une version miniature de moi sur une île flottante pour découvrir mes projets. Tu préfères un bon vieux portfolio qui scrolle ? Passe en mode classique quand tu veux.",
    en: "Walk a tiny version of me around a floating island to discover my projects. Prefer a good old scrolling portfolio? Switch to regular mode anytime.",
  },
  move: { fr: "bouger", en: "move" },
  jump: { fr: "sauter", en: "jump" },
  enter: { fr: "entrer", en: "enter" },
  startExploring: { fr: "▶ Commencer la visite", en: "▶ Start exploring" },
  regularMode: { fr: "Mode classique", en: "Regular mode" },
  pressEnter: { fr: "appuie sur", en: "press" },
  toStart: { fr: "pour démarrer", en: "to start" },

  // --- HUD -----------------------------------------------------------------
  controls: { fr: "Commandes", en: "Controls" },
  or: { fr: "ou", en: "or" },
  tip: { fr: "astuce :", en: "tip:" },
  tipText: {
    fr: "les chemins mènent aux projets",
    en: "paths lead to projects",
  },
  walkWith: { fr: "marche avec", en: "walk with" },
  map: { fr: "CARTE", en: "MAP" },

  // --- speech bubble -------------------------------------------------------
  openProject: { fr: "ouvrir le projet", en: "open project" },
  aboutMe: { fr: "à propos de moi", en: "about me" },
  contactHint: { fr: "me contacter", en: "contact me" },

  // --- modals --------------------------------------------------------------
  closeHint: { fr: "ou", en: "or" },
  toClose: { fr: "pour fermer", en: "to close" },
  whatIDid: { fr: "Ce que j'ai fait", en: "What I did" },
  whatILearned: { fr: "Ce que j'en retiens", en: "What I took away" },
  nextProject: { fr: "Projet suivant →", en: "Next project →" },
  favourite: { fr: "★ préféré", en: "★ favourite" },
  fav: { fr: "★ préf", en: "★ fav" },
  confidentialNote: {
    fr: "Démarche uniquement : par respect de la confidentialité, je ne publie ni chiffres, ni verbatims, ni données internes sur ce projet. J'en parle volontiers de vive voix.",
    en: "Method only: out of respect for confidentiality I don't publish figures, verbatims or internal data about this project. Happy to talk it through in person.",
  },

  // --- player profile modal ------------------------------------------------
  playerProfile: { fr: "Fiche de perso", en: "Player profile" },
  yearsXp: { fr: "ans d'XP", en: "years XP" },
  skillTree: { fr: "Arbre de compétences", en: "Skill tree" },
  toolbox: { fr: "Boîte à outils", en: "Toolbox" },
  education: { fr: "Formation", en: "Education" },
  hobbies: { fr: "En dehors du travail", en: "Outside work" },
  achievements: { fr: "Hauts faits", en: "Achievements" },

  // --- contact modal -------------------------------------------------------
  newMessage: { fr: "Nouveau message", en: "New message" },
  contactTitle: {
    fr: "On construit quelque chose ensemble ?",
    en: "Let's build something together.",
  },
  contactPitch: {
    fr: "Je suis Founding Designer chez Primary et j'y suis très bien. Mais je réponds toujours à un bon échange sur le design santé, les design systems ou le design conversationnel.",
    en: "I'm Founding Designer at Primary and happy there. But I always answer a good conversation about health design, design systems or conversational design.",
  },
  email: { fr: "Email", en: "Email" },
  based: { fr: "Basé à", en: "Based in" },
  statusLine: { fr: "statut", en: "status" },

  // --- classic portfolio ---------------------------------------------------
  navWork: { fr: "./projets", en: "./work" },
  navAbout: { fr: "./à-propos", en: "./about" },
  navExperience: { fr: "./parcours", en: "./experience" },
  navContact: { fr: "./contact", en: "./contact" },

  heroTitleA: { fr: "Je conçois des produits de santé", en: "I design health products" },
  heroTitleHighlight1: { fr: "utiles", en: "genuinely useful" },
  heroTitleB: { fr: "et", en: "and" },
  heroTitleHighlight2: { fr: "dignes de confiance", en: "worth trusting" },
  heroTitleC: { fr: ".", en: "." },

  seeWork: { fr: "Voir les projets ↓", en: "See the work ↓" },
  playPortfolio: { fr: "🕹️ Jouer le portfolio", en: "🕹️ Play the portfolio" },

  statYears: { fr: "d'expérience", en: "of experience" },
  statProjects: { fr: "projets", en: "projects" },
  statSystems: { fr: "design systems", en: "design systems" },
  statDesigners: { fr: "designer chez Primary", en: "designer at Primary" },

  sectionWork: { fr: "projets choisis", en: "selected work" },
  sectionWorkSub: {
    fr: "Sept projets, neuf ans, une obsession : rendre simple ce qui est complexe.",
    en: "Seven projects, nine years, one obsession: making complex things feel simple.",
  },
  sectionAbout: { fr: "à propos", en: "about" },
  sectionAboutSub: {
    fr: "Psycho cognitive, sport, puis du code. Un chemin bizarre qui explique bien ma façon de designer.",
    en: "Cognitive psychology, sport, then code. An odd path that explains a lot about how I design.",
  },
  sectionExperience: { fr: "parcours", en: "experience" },
  sectionExperienceSub: { fr: "Progression du personnage.", en: "Level progression." },
  sectionContact: { fr: "contact", en: "contact" },

  openProfile: { fr: "Ouvrir la fiche de perso →", en: "Open player profile →" },
  allLinks: { fr: "Tous les liens", en: "All the links" },
  contactHeadline: {
    fr: "Parlons design santé, systèmes et IA.",
    en: "Let's talk health design, systems and AI.",
  },
  contactSub: {
    fr: "Une question, un retour sur ce portfolio, ou juste un café du côté de Paris — ma boîte mail est ouverte.",
    en: "A question, feedback on this portfolio, or just a coffee around Paris — my inbox is open.",
  },
  switchToGame: { fr: "↳ passer en mode jeu", en: "↳ switch to game mode" },
  builtWith: {
    fr: "conçu et codé avec React, Three.js et beaucoup trop de café.",
    en: "designed and coded with React, Three.js and far too much coffee.",
  },
} satisfies Record<string, Loc>;

export type UiKey = keyof typeof ui;
