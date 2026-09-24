import type { Loc, LocList } from "../i18n/lang";

export type Landmark = "assistant" | "system" | "gym" | "bank" | "agency" | "school" | "rocket";

/** Same wording in both languages (brand names, dates, stacks…). */
const same = (s: string): Loc => ({ fr: s, en: s });

export interface Fact {
  label: Loc;
  value: Loc;
}

export interface Project {
  id: string;
  /** Brand names are not translated. */
  title: string;
  company: Loc;
  role: Loc;
  period: Loc;
  tagline: Loc;
  description: Loc;
  /** Bullets: what I actually did. */
  contribution: LocList;
  /** One sentence: what I take away from it. */
  learning: Loc;
  /** What the tiny character says in front of the pavilion. */
  quote: Loc;
  tags: LocList;
  color: string; // hex used for the platform / accents
  accent: string; // darker variant, readable on cream
  /** Cover image. Absent → a generated isometric cover is drawn instead. */
  image?: string;
  landmark: Landmark;
  position: [number, number]; // x, z on the map
  facts: Fact[];
  favorite?: boolean;
  /** Shows the "method only, no figures" note in the modal. */
  confidential?: boolean;
}

export const projects: Project[] = [
  {
    id: "amia",
    title: "AMIA",
    company: same("Primary"),
    role: { fr: "Founding Designer", en: "Founding Designer" },
    period: same("2025 — 2026"),
    tagline: {
      fr: "AMIA prend le relais du médecin quand il n'est pas là, pour une santé proactive et non curative",
      en: "AMIA steps in for the doctor when they're not around, for proactive rather than reactive care.",
    },
    description: {
      fr: "AMIA, c'est l'assistant conversationnel santé de Primary. L'enjeu : donner au patient une première réponse fiable et immédiate sur sa santé ou son parcours de soin, puis l'orienter vers le bon niveau de prise en charge. AMIA est présente à plusieurs endroits clef, pour permettre à l'utilisateur une expérience de soin qualitative et continue. Elle ne remplace pas le médecin ou l'assistant médical : l'humain reste dans la boucle, toujours.",
      en: "AMIA is Primary's conversational health assistant. The goal: give patients an immediate, reliable first answer about their health or their care pathway, then route them to the right level of care. AMIA shows up at several key touchpoints, giving patients a consistent, high-quality care experience. She doesn't replace the doctor or medical assistant: a human stays in the loop, always.",
    },
    contribution: {
      fr: [
        "Cadrage produit et parcours patient / soignant, du premier atelier à la mise en production",
        "Écriture des 5 principes de design IA de Primary : explicabilité, contrôle, transparence, intégration, échec gracieux",
        "Création de l'IA, design conversationnel d'AMIA : comment doit-elle se comporter ?",
        "Boucle de validation humaine : la conversation ne remonte dans la console qu'une fois la synthèse générée",
        "Bêta encadrée par un protocole écrit de supervision humaine, dans trois cabinets",
        "Tests utilisateurs et synthèse de recherche, puis itérations constantes",
      ],
      en: [
        "Product framing and patient / clinician journeys, from the first workshop to production",
        "Wrote Primary's 5 AI design principles: explicability, control, transparency, integration, graceful failure",
        "Designing the AI itself — AMIA's conversational design: how should she behave?",
        "Human validation loop: a conversation only reaches the console once a synthesis is generated",
        "Beta framed by a written human-supervision protocol, across three practices",
        "User testing and research synthesis, then constant iteration",
      ],
    },
    learning: {
      fr: "La confiance ne vient pas de la performance du modèle, mais de son appartenance : « c'est l'IA de mon médecin ». Et le vrai point de blocage n'est pas ce que l'IA répond - c'est ce qu'elle partage avec le médecin.",
      en: "Trust didn't come from the model's capability but from who it belongs to: \"it's my doctor's AI\". And the real blocker was never what the AI answers — it's what it shares with the doctor.",
    },
    quote: {
      fr: "Mon projet phare ! Une IA dans un cabinet médical, intégrée, aidante. C'est 10 % de modèle et 90 % de confiance. Appuie sur E.",
      en: "My flagship project! An AI in a doctor's practice, integrated, helpful. It's 10% model and 90% trust. Press E.",
    },
    tags: {
      fr: ["Design conversationnel", "IA", "Santé", "Recherche utilisateur"],
      en: ["Conversational design", "AI", "Healthcare", "User research"],
    },
    color: "#4a2545",
    accent: "#8e3f7a",
    landmark: "assistant",
    position: [0, 13],
    facts: [
      { label: { fr: "Rôle", en: "Role" }, value: { fr: "Founding Designer", en: "Founding Designer" } },
      { label: { fr: "Terrain", en: "Field" }, value: { fr: "3 cabinets en bêta", en: "3 practices in beta" } },
      { label: { fr: "Statut", en: "Status" }, value: { fr: "En production", en: "Shipped" } },
    ],
    favorite: true,
    confidential: true,
  },
  {
    id: "primary",
    title: "Primary — Fondations design",
    company: same("Primary"),
    role: { fr: "Founding Designer", en: "Founding Designer" },
    period: { fr: "2025 — aujourd'hui", en: "2025 — now" },
    tagline: {
      fr: "Construire la fonction design d'une startup santé, seul, à partir de zéro.",
      en: "Building the design function of a health startup, solo, from nothing.",
    },
    description: {
      fr: "Primary reconstruit la médecine générale autour de l'expérience patient, avec un cap à 1000 cabinets. Premier designer, je porte la vision design, le design system et la pratique quotidienne des équipes. La ligne directrice que j'ai posée tient en trois mots — Haute Technologie. Haute Humanité. Haute Confiance. Chaque décision se juge sur deux critères : la confiance, et la qualité de la communication médecin-patient.",
      en: "Primary is rebuilding general medicine around patient experience, aiming at 1000 practices. I'm its first and only designer: I own the design vision, the design system, and the day-to-day practice of the teams. The north star I set holds in three words — High Technology. High Humanity. High Trust. Every decision is judged on two things: trust, and the quality of doctor–patient communication.",
    },
    contribution: {
      fr: [
        "Vision & stratégie design 2026, articulée en trois piliers : Identité (« Hospitalité Numérique »), Intelligence, Écosystème (« Le Savoir Partagé »)",
        "Design System × Claude Code : couche de tokens, CLAUDE.md, golden components et Figma MCP — le design contribue à la prod au lieu de livrer des maquettes",
        "Direction artistique produit : Prune et Jonquille plutôt que le bleu médical, typographie Brockmann. Le cabinet est pensé comme un lieu de vie, l'app le prolonge",
        "Nouveau processus de pré-cadrage, et ateliers de conception avec le comité médical",
        "Évangélisation du métier de product designer en interne, et cadrage d'une vision brand avec le marketing",
      ],
      en: [
        "2026 design vision & strategy, built on three pillars: Identity (\"Digital Hospitality\"), Intelligence, Ecosystem (\"Shared Knowledge\")",
        "Design System × Claude Code: token layer, CLAUDE.md, golden components and Figma MCP — design contributes to production instead of handing off mockups",
        "Product art direction: Plum and Daffodil instead of medical blue, Brockmann as the typeface. The practice is designed as a living space; the app extends that feeling",
        "A new pre-framing process, and design workshops with the medical committee",
        "Evangelising the product-designer craft internally, and shaping a brand design vision with marketing",
      ],
    },
    learning: {
      fr: "Designer seul dans une boîte, c'est autant construire la fonction que livrer des écrans. Mon plus gros levier n'a pas été une maquette : c'est d'avoir branché le design directement sur la production.",
      en: "Being the only designer means building the function as much as shipping screens. My biggest lever wasn't a mockup — it was wiring design straight into production.",
    },
    quote: {
      fr: "Ici je ne dessine pas que des écrans : je construis la fonction design de zéro. Système, rituels, direction artistique. E pour la visite.",
      en: "Here I don't just draw screens — I'm building the design function from scratch. System, rituals, art direction. Press E for the tour.",
    },
    tags: {
      fr: ["Design system", "Design ops", "Stratégie", "Figma MCP"],
      en: ["Design system", "Design ops", "Strategy", "Figma MCP"],
    },
    color: "#f5c451",
    accent: "#b07d12",
    landmark: "system",
    position: [8.4, 10],
    facts: [
      { label: { fr: "Rôle", en: "Role" }, value: { fr: "Founding Designer", en: "Founding Designer" } },
      { label: { fr: "Équipe design", en: "Design team" }, value: { fr: "1 — moi", en: "1 — me" } },
      { label: { fr: "Depuis", en: "Since" }, value: { fr: "Juin 2025", en: "June 2025" } },
    ],
  },
  {
    id: "gymlib",
    title: "Gymlib × Wellpass",
    company: same("Gymlib + Wellpass"),
    role: { fr: "Lead Product Designer", en: "Lead Product Designer" },
    period: same("2022 — 2025"),
    tagline: {
      fr: "Fusionner deux équipes design, deux produits, deux cultures.",
      en: "Merging two design teams, two products, two cultures.",
    },
    description: {
      fr: "Après le rapprochement de Gymlib et de Wellpass, j'ai pris le lead sur la fusion des deux équipes design — en plus de mes missions produit. Mise en place des processus communs, création d'un design system partagé, et remboursement d'une dette design accumulée sur plusieurs années. J'ai aussi mentoré chaque designer de l'équipe, au quotidien sur sa mission et sur le plus long terme, sur son objectif de carrière.",
      en: "After Gymlib and Wellpass came together, I led the merger of the two design teams — on top of my product work. Shared processes, a common design system, and paying down years of accumulated design debt. I also mentored every designer on the team, day to day on their work and further out, on their own career goals.",
    },
    contribution: {
      fr: [
        "Fusion de deux équipes design : rituels, processus de revue, répartition des périmètres",
        "Création d'un design system commun aux deux produits",
        "Remboursement d'une dette design accumulée sur plusieurs années",
        "Mentorat individuel de chaque designer, sur la mission et sur le plan de carrière",
        "Design produit sur un modèle B2B2C : l'entreprise cliente, le salarié, la salle de sport",
      ],
      en: [
        "Merging two design teams: rituals, review process, ownership boundaries",
        "Built a design system shared by both products",
        "Paid down design debt accumulated over several years",
        "One-to-one mentoring for every designer, on their work and on their career plan",
        "Product design on a B2B2C model: the client company, the employee, the gym",
      ],
    },
    learning: {
      fr: "Fusionner deux équipes, ce n'est pas choisir le meilleur des deux process : c'est en écrire un troisième que personne ne vit comme une défaite.",
      en: "Merging two teams isn't picking the better of two processes — it's writing a third one that nobody experiences as a defeat.",
    },
    quote: {
      fr: "Deux équipes, deux produits, une seule culture à écrire. Le projet le plus humain de ma carrière. E pour la suite.",
      en: "Two teams, two products, one culture to write. The most human project of my career. Press E.",
    },
    tags: {
      fr: ["Design system", "Organisation design", "Mentorat", "B2B2C"],
      en: ["Design system", "Design org", "Mentoring", "B2B2C"],
    },
    color: "#7fd8be",
    accent: "#2f9c7c",
    landmark: "gym",
    position: [12.8, 2.3],
    facts: [
      { label: { fr: "Rôle", en: "Role" }, value: { fr: "Lead Product Designer", en: "Lead Product Designer" } },
      { label: { fr: "Modèle", en: "Model" }, value: { fr: "B2B2C · sport", en: "B2B2C · sport" } },
      { label: { fr: "Durée", en: "Length" }, value: { fr: "3 ans", en: "3 years" } },
    ],
  },
  {
    id: "mangopay",
    title: "Mangopay",
    company: same("Mangopay"),
    role: { fr: "Senior Product Designer", en: "Senior Product Designer" },
    period: same("2019 — 2022"),
    tagline: {
      fr: "Trois produits fintech refondus, et le test utilisateur devenu un réflexe d'équipe.",
      en: "Three fintech products rebuilt, and user testing turned into a team reflex.",
    },
    description: {
      fr: "Chez Mangopay, j'ai mené la refonte complète de trois produits, mis en place un design system et de nouveaux processus de travail pour l'équipe. Mais la transformation dont je suis le plus fier n'est pas visuelle : j'ai banalisé les tests utilisateurs pour toutes les équipes, jusqu'à ce que ce soit une habitude et non plus un projet qu'il faut défendre.",
      en: "At Mangopay I led the full redesign of three products, set up a design system and new ways of working for the team. The change I'm proudest of isn't visual though: I made user testing routine for every team, until it became a habit instead of a project you have to defend.",
    },
    contribution: {
      fr: [
        "Refonte complète de trois produits, de la recherche à la livraison",
        "Mise en place d'un design system",
        "Nouveaux processus de travail pour l'équipe design",
        "Tests utilisateurs outillés et banalisés pour toutes les équipes",
        "Gestion de projet sur des sujets fintech réglementés",
      ],
      en: [
        "Full redesign of three products, from research to delivery",
        "Set up a design system",
        "New ways of working for the design team",
        "User testing tooled up and made routine across every team",
        "Project management on regulated fintech topics",
      ],
    },
    learning: {
      fr: "Dans la fintech, la contrainte réglementaire n'est pas l'ennemie du design : c'est elle qui oblige enfin à être clair.",
      en: "In fintech, regulation isn't design's enemy — it's the thing that finally forces you to be clear.",
    },
    quote: {
      fr: "Trois ans de fintech. J'y ai appris qu'une contrainte réglementaire bien lue vaut trois ateliers d'idéation. E pour voir.",
      en: "Three years of fintech. I learnt that a well-read regulation beats three ideation workshops. Press E.",
    },
    tags: {
      fr: ["Fintech", "Design system", "Recherche", "Gestion de projet"],
      en: ["Fintech", "Design system", "Research", "Project management"],
    },
    color: "#ff6b5b",
    accent: "#e4503f",
    landmark: "bank",
    position: [11.3, -6.5],
    facts: [
      { label: { fr: "Rôle", en: "Role" }, value: { fr: "Senior Product Designer", en: "Senior Product Designer" } },
      { label: { fr: "Produits refondus", en: "Products rebuilt" }, value: { fr: "3", en: "3" } },
      { label: { fr: "Durée", en: "Length" }, value: { fr: "3 ans", en: "3 years" } },
    ],
  },
  {
    id: "redpill",
    title: "Redpill",
    company: same("Redpill"),
    role: { fr: "UI / UX Designer", en: "UI / UX Designer" },
    period: same("2018 — 2019"),
    tagline: {
      fr: "Une agence, beaucoup de marques, un rythme qui ne redescend jamais.",
      en: "One agency, a lot of brands, a rhythm that never settles.",
    },
    description: {
      fr: "Un an en agence, à enchaîner recherche UX, interfaces et prototypes pour La FDJ, Orange, Quidol et quelques autres. C'est là que j'ai appris à entrer vite dans un métier que je ne connaissais pas le lundi, à défendre un parti pris devant un client, et à livrer proprement même quand le brief bouge en cours de route.",
      en: "A year in an agency, running UX research, interfaces and prototypes back to back for La FDJ, Orange, Quidol and a few others. That's where I learnt to get up to speed on a business I'd never heard of by Monday, defend a point of view in front of a client, and still ship cleanly when the brief moves mid-project.",
    },
    contribution: {
      fr: [
        "Recherche UX et cadrage sur des projets clients successifs",
        "Conception d'interfaces sur des univers très différents : jeu, télécom, média",
        "Prototypage et présentation client",
      ],
      en: [
        "UX research and framing across back-to-back client projects",
        "Interface design across very different worlds: gaming, telecom, media",
        "Prototyping and client presentation",
      ],
    },
    learning: {
      fr: "L'agence, c'est un entraînement : on apprend à être utile en trois jours sur un métier qu'on découvre le lundi matin.",
      en: "Agency work is training: you learn to be useful within three days on a business you discovered on Monday morning.",
    },
    quote: {
      fr: "L'agence : FDJ, Orange, Quidol… un nouveau métier tous les deux mois. Formateur, et fatigant. E pour la suite.",
      en: "Agency life: FDJ, Orange, Quidol… a new industry every couple of months. Great training, exhausting. Press E.",
    },
    tags: {
      fr: ["Agence", "UI", "UX", "Multi-clients"],
      en: ["Agency", "UI", "UX", "Multi-client"],
    },
    color: "#b9a7ff",
    accent: "#7358f5",
    landmark: "agency",
    position: [4.4, -12.2],
    facts: [
      { label: { fr: "Rôle", en: "Role" }, value: { fr: "UI / UX Designer", en: "UI / UX Designer" } },
      { label: { fr: "Clients", en: "Clients" }, value: { fr: "La FDJ, Orange, Quidol", en: "La FDJ, Orange, Quidol" } },
      { label: { fr: "Durée", en: "Length" }, value: { fr: "1 an", en: "1 year" } },
    ],
  },
  {
    id: "thp",
    title: "The Hacking Project",
    company: same("The Hacking Project"),
    role: { fr: "UI / UX Designer + Dev front", en: "UI / UX Designer + Front dev" },
    period: same("2017 — 2018"),
    tagline: {
      fr: "Une plateforme d'enseignement conçue, maquettée et codée de bout en bout.",
      en: "A teaching platform designed, mocked up and coded end to end.",
    },
    description: {
      fr: "Mon point de départ. J'ai conçu et développé la plateforme d'enseignement de The Hacking Project : recherche UX menée directement avec les étudiants, design complet des maquettes, puis développement du front en React et Ruby on Rails. Designer et développer le même produit, ça change définitivement la façon dont on dessine.",
      en: "My starting point. I designed and built The Hacking Project's teaching platform: UX research run directly with the students, the full set of mockups, then the front-end in React and Ruby on Rails. Designing and building the same product changes the way you draw, permanently.",
    },
    contribution: {
      fr: [
        "Recherche UX conduite avec les étudiants eux-mêmes",
        "Design complet des maquettes de la plateforme",
        "Développement front-end en React et Ruby on Rails",
      ],
      en: [
        "UX research run with the students themselves",
        "The full set of mockups for the platform",
        "Front-end development in React and Ruby on Rails",
      ],
    },
    learning: {
      fr: "Coder ce que je dessine reste la meilleure école que j'ai eue. Neuf ans plus tard, c'est encore ce qui me permet de livrer avec Claude Code et le Figma MCP.",
      en: "Coding what I draw is still the best school I've had. Nine years on, it's still what lets me ship with Claude Code and the Figma MCP.",
    },
    quote: {
      fr: "Le tout premier. Maquettes le matin, React et Rails l'après-midi. Tout est parti de là. E pour l'histoire.",
      en: "The very first one. Mockups in the morning, React and Rails in the afternoon. It all started here. Press E.",
    },
    tags: {
      fr: ["Enseignement", "UI", "UX", "Dev front"],
      en: ["Education", "UI", "UX", "Front-end"],
    },
    color: "#8fc7ff",
    accent: "#2f7fd6",
    landmark: "school",
    position: [-4.4, -12.2],
    facts: [
      { label: { fr: "Rôle", en: "Role" }, value: { fr: "Design + dev front", en: "Design + front-end" } },
      { label: { fr: "Stack", en: "Stack" }, value: { fr: "React, Ruby on Rails", en: "React, Ruby on Rails" } },
      { label: { fr: "Durée", en: "Length" }, value: { fr: "1 an", en: "1 year" } },
    ],
  },
  {
    id: "labo",
    title: "Le Labo",
    company: { fr: "Projets perso", en: "Side projects" },
    role: { fr: "Designer & développeur", en: "Designer & developer" },
    period: { fr: "2017 — aujourd'hui", en: "2017 — now" },
    tagline: {
      fr: "Là où je teste des idées, en code, pour moi.",
      en: "Where I test ideas, in code, for myself.",
    },
    description: {
      fr: "Un coin de l'île réservé aux projets que je fais pour moi. Je les conçois et je les code, avec Claude Code et le Figma MCP — c'est mon terrain d'entraînement sur le design conversationnel, la 3D, et tout ce qui n'entre pas dans une journée de travail. Ce portfolio en fait partie : React, Three.js, et un petit personnage qui marche.",
      en: "A corner of the island for the projects I build for myself. I design them and I code them, with Claude Code and the Figma MCP — my training ground for conversational design, 3D, and everything that doesn't fit inside a working day. This portfolio is one of them: React, Three.js, and a tiny character who walks.",
    },
    contribution: {
      fr: [
        "Ce portfolio : React 19, Three.js et react-three-fiber, en deux modes — jeu et classique",
        "Des prototypes d'applications personnelles, conçus puis codés de bout en bout",
        "Un terrain d'essai pour le duo Figma MCP × Claude Code que je réutilise ensuite au travail",
      ],
      en: [
        "This portfolio: React 19, Three.js and react-three-fiber, in two modes — game and classic",
        "Personal app prototypes, designed and then coded end to end",
        "A test bed for the Figma MCP × Claude Code pairing I then reuse at work",
      ],
    },
    learning: {
      fr: "Ce que je casse sur mes projets perso, je ne le casse pas au travail.",
      en: "What I break on my own projects, I don't break at work.",
    },
    quote: {
      fr: "Mon bac à sable. C'est ici que j'apprends les outils avant de les amener au bureau — ce portfolio compris. E !",
      en: "My sandbox. This is where I learn the tools before bringing them to work — this portfolio included. Press E!",
    },
    tags: {
      fr: ["Side projects", "React", "Three.js", "Claude Code"],
      en: ["Side projects", "React", "Three.js", "Claude Code"],
    },
    color: "#232946",
    accent: "#3d4680",
    landmark: "rocket",
    position: [-11.3, -6.5],
    facts: [
      { label: { fr: "Rôle", en: "Role" }, value: { fr: "Designer & dev", en: "Designer & dev" } },
      { label: { fr: "Stack", en: "Stack" }, value: { fr: "React, Three.js", en: "React, Three.js" } },
      { label: { fr: "Outils", en: "Tools" }, value: { fr: "Claude Code, Figma MCP", en: "Claude Code, Figma MCP" } },
    ],
  },
];

export interface TimelineEntry {
  period: Loc;
  title: Loc;
  company: string;
  where: Loc;
  tags: string[];
}

export interface EducationEntry {
  period: string;
  title: Loc;
  detail: Loc;
}

export const profile = {
  name: "Paul Broussolle",
  title: { fr: "Founding Designer", en: "Founding Designer" } as Loc,
  company: "Primary",
  location: { fr: "Paris", en: "Paris" } as Loc,
  years: 9,
  email: "broussolle.paul@gmail.com",
  linkedin: "https://www.linkedin.com/in/paul-broussolle/",
  linkedinLabel: "/in/paul-broussolle",

  status: {
    fr: "Founding Designer @ Primary · Paris",
    en: "Founding Designer @ Primary · Paris",
  } as Loc,

  northStar: {
    fr: "Apprendre, tester, partager",
    en: "Learn, test, share",
  } as Loc,

  intro: {
    fr: "Founding Designer avec 9 ans d'EXP, passionné de Product Design (oui oui, j'en fait même pour le plaisir). Ancien dev front, très à l'aise avec L'IA, j'adore résoudre des problèmes complexe, et monter des structures design solide.",
    en: "Founding Designer with 9 years of experience, passionate about Product Design (yes, I even do it for fun). Former front-end dev, very comfortable with AI, I love solving complex problems and building solid design structures.",
  } as Loc,

  bio: {
    fr: [
      "J'ai commencé par la psychologie cognitive et le sport, avant de passer par un bootcamp Ruby on Rails. J'y ai découvert que ce qui m'intéressait vraiment se trouvait pile entre les deux : comment les gens comprennent une interface, et comment on la construit.",
      "Depuis, j'ai fait de l'agence chez Redpill, de la fintech chez Mangopay, du B2B2C sport chez Gymlib × Wellpass, et je suis aujourd'hui le premier designer de Primary. À chaque fois le même fil rouge : construire la fonction design autant que les écrans — processus, design system, rituels, mentorat.",
      "Et je code assez pour livrer. Je pousse du front avec Claude Code et le Figma MCP plutôt que de m'arrêter à la maquette.",
    ],
    en: [
      "I started in cognitive psychology and sport, then went through a Ruby on Rails bootcamp. That's where I found what actually interests me, right between the two: how people understand an interface, and how you build one.",
      "Since then: agency work at Redpill, fintech at Mangopay, B2B2C sport at Gymlib × Wellpass, and today I'm Primary's first designer. Always the same thread — building the design function as much as the screens: process, design system, rituals, mentoring.",
      "And I code enough to ship. I push front-end with Claude Code and the Figma MCP rather than stopping at the mockup.",
    ],
  } as LocList,

  skills: [
    { name: { fr: "Design system", en: "Design systems" } as Loc, level: 95 },
    { name: { fr: "Design ops & organisation", en: "Design ops & org" } as Loc, level: 92 },
    { name: { fr: "Design conversationnel & IA", en: "Conversational & AI design" } as Loc, level: 88 },
    { name: { fr: "Stratégie produit", en: "Product strategy" } as Loc, level: 88 },
    { name: { fr: "Recherche utilisateur", en: "User research" } as Loc, level: 85 },
    { name: { fr: "Front-end (React, Three.js)", en: "Front-end (React, Three.js)" } as Loc, level: 72 },
  ],

  tools: ["Figma", "Notion", "Claude Code", "Figma MCP", "Photoshop", "React", "HTML / CSS", "Three.js"],

  timeline: [
    {
      period: { fr: "2025 - aujourd'hui", en: "2025 — now" },
      title: { fr: "Founding Designer", en: "Founding Designer" },
      company: "Primary",
      where: { fr: "Paris · santé", en: "Paris · healthcare" },
      tags: ["#Santé", "#IA", "#DesignSystem", "#Stratégie"],
    },
    {
      period: { fr: "2022 — 2025", en: "2022 — 2025" },
      title: { fr: "Lead Product Designer", en: "Lead Product Designer" },
      company: "Gymlib + Wellpass",
      where: { fr: "Paris · B2B2C", en: "Paris · B2B2C" },
      tags: ["#Sport", "#UI", "#UX", "#DesignSystem", "#OrganisationDesign"],
    },
    {
      period: { fr: "2019 — 2022", en: "2019 — 2022" },
      title: { fr: "Senior Product Designer", en: "Senior Product Designer" },
      company: "Mangopay",
      where: { fr: "Paris · B2C", en: "Paris · B2C" },
      tags: ["#Fintech", "#UI", "#UX", "#ProjectManagement"],
    },
    {
      period: { fr: "2018 — 2019", en: "2018 — 2019" },
      title: { fr: "UI / UX Designer", en: "UI / UX Designer" },
      company: "Redpill",
      where: { fr: "Paris · agence", en: "Paris · agency" },
      tags: ["#Agence", "#UI", "#UX", "#MultipleProjets"],
    },
    {
      period: { fr: "2017 — 2018", en: "2017 — 2018" },
      title: { fr: "UI / UX Designer + Dev front", en: "UI / UX Designer + Front dev" },
      company: "The Hacking Project",
      where: { fr: "Paris · B2B", en: "Paris · B2B" },
      tags: ["#Enseignement", "#UI", "#UX", "#DevFront"],
    },
  ] as TimelineEntry[],

  education: [
    {
      period: "2018",
      title: { fr: "Full stack Ruby on Rails", en: "Full-stack Ruby on Rails" },
      detail: {
        fr: "Formation courte et (très) intense pour apprendre l'art du développement web.",
        en: "A short and (very) intense bootcamp to learn the craft of web development.",
      },
    },
    {
      period: "2015 — 2017",
      title: { fr: "Master recherche en Psychologie cognitive", en: "Research Master in Cognitive Psychology" },
      detail: {
        fr: "Apprentissage approfondi du fonctionnement du cerveau humain, et de l'ergonomie.",
        en: "A deep dive into how the human brain works, and into ergonomics.",
      },
    },
    {
      period: "2012 — 2015",
      title: { fr: "Licence STAPS — Éducation & motricité", en: "BSc Sport Science — Education & motor skills" },
      detail: {
        fr: "Formation au métier d'enseignant d'EPS, spécialisé en gymnastique.",
        en: "Training to become a PE teacher, specialised in gymnastics.",
      },
    },
  ] as EducationEntry[],

  hobbies: [
    {
      icon: "🏕️",
      label: { fr: "Randonnée & bushcraft", en: "Hiking & bushcraft" } as Loc,
      detail: {
        fr: "Quoi de mieux qu'un grand bol d'air et l'odeur de la forêt ? En plus, j'ai appris à allumer un feu sans briquet.",
        en: "Nothing beats fresh air and the smell of the forest. Plus, I learnt to light a fire without a lighter.",
      } as Loc,
    },
    {
      icon: "🧵",
      label: { fr: "Maroquinerie", en: "Leatherwork" } as Loc,
      detail: {
        fr: "Vous ne l'aviez pas vu venir, avouez ! Pochettes d'ordinateur, portefeuilles. C'est très relaxant.",
        en: "You didn't see that one coming, admit it. Laptop sleeves, wallets — deeply relaxing.",
      } as Loc,
    },
    {
      icon: "🧗",
      label: { fr: "Escalade", en: "Climbing" } as Loc,
      detail: {
        fr: "Un bon moyen de se dépasser, et de faire des rencontres !",
        en: "A good way to push yourself, and meet people!",
      } as Loc,
    },
  ],

  achievements: [
    { icon: "🏥", label: { fr: "Fonction design de Primary construite de zéro", en: "Built Primary's design function from scratch" } as Loc },
    { icon: "🤖", label: { fr: "AMIA en production — une IA patient supervisée par le médecin", en: "AMIA shipped — a patient AI supervised by the doctor" } as Loc },
    { icon: "🧩", label: { fr: "Trois design systems livrés : Mangopay, Gymlib × Wellpass, Primary", en: "Three design systems shipped: Mangopay, Gymlib × Wellpass, Primary" } as Loc },
    { icon: "🔥", label: { fr: "Sait allumer un feu sans briquet", en: "Can light a fire without a lighter" } as Loc },
  ],
};

/**
 * The three stations of the island that are not projects. Their pin label and
 * what the character says when you walk up to them — `stations.ts` only holds
 * where they sit on the map.
 */
export const stationCopy = {
  home: {
    label: { fr: "Départ", en: "Start" } as Loc,
    quote: {
      fr: "Salut ! Moi c'est Paul, Founding Designer. Promène-toi sur l'île pour découvrir mes projets — je te raconte chacun d'eux au passage.",
      en: "Hey! I'm Paul, Founding Designer. Walk around the island to discover my projects — I'll tell you about each one on the way.",
    } as Loc,
  },
  about: {
    label: { fr: "Qui je suis", en: "About me" } as Loc,
    quote: {
      fr: "Ça, c'est chez moi - enfin, une version low-poly. Psycho cognitive, STAPS, un bootcamp Rails : appuie sur E pour le parcours complet.",
      en: "That's my place — well, a low-poly version of it. Cognitive psychology, sport science, a Rails bootcamp: press E for the whole story.",
    } as Loc,
  },
  contact: {
    label: { fr: "Contact", en: "Contact" } as Loc,
    quote: {
      fr: "Une question, un projet, ou juste envie d'échanger ? Glisse une lettre dans la boîte (E). Je réponds vite, promis.",
      en: "A question, a project, or just want to talk? Drop a letter in the mailbox (E). I answer fast, promise.",
    } as Loc,
  },
};
