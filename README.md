# Portfolio — Paul Broussolle

Mon portfolio de product designer, en deux modes : un **petit jeu isométrique** où l'on promène
un personnage sur une île pour découvrir mes projets, et un **portfolio classique** qui scrolle.
Bilingue FR / EN.

> Founding Designer chez Primary — *Haute Technologie. Haute Humanité. Haute Confiance.*

## Démarrer

```bash
npm install
npm run dev
```

Puis `npm run build` pour produire `dist/`.

## Liens de partage

Le mode est dans l'URL : le lien affiché dans la barre d'adresse est toujours celui à partager.

| Lien | Ouvre |
|---|---|
| `/` | le mode jeu (défaut) |
| `/#jeu` | **le jeu isométrique** |
| `/#cv` | **le portfolio classique** |
| `/#jeu/en` · `/#cv/en` | le même, en anglais |
| `/#jeu/fr` · `/#cv/fr` | le même, forcé en français |

Un lien partagé passe devant ce que le visiteur avait choisi la dernière fois. Sans segment de
langue, on garde la détection habituelle (navigateur, puis `localStorage`) — la langue ne
s'ajoute à l'URL qu'une fois le bouton FR/EN utilisé, pour que `/#jeu` et `/#cv` restent courts.

Les alias `#game`, `#play`, `#classic`, `#classique`, `#regular`, `#portfolio` sont acceptés et
réécrits vers la forme canonique, dans n'importe quel ordre (`#en/cv` → `#cv/en`). Basculer de
mode ajoute une entrée d'historique : le bouton retour du navigateur annule le changement.

C'est un hash et pas un vrai chemin parce que le build est un `index.html` unique — ça marche
sur n'importe quel hébergeur statique sans une seule règle de redirection, et même en `file://`.

## Modifier les textes

Aucune chaîne visible n'est écrite dans les composants : tout est dans `src/data/`, en FR et EN
côte à côte. Pour changer un texte, il n'y a qu'un seul endroit à ouvrir.

| Fichier | Ce qu'on y modifie |
|---|---|
| `src/data/projects.ts` | `projects` — les 7 projets : titre, pitch, description, contributions, apprentissage, réplique du perso, tags, chiffres clés |
| | `profile` — nom, poste, email, LinkedIn, bio, compétences, outils, parcours, formation, loisirs, hauts faits |
| | `stationCopy` — le label et la réplique des 3 stations qui ne sont pas des projets (départ, à propos, contact) |
| `src/data/ui.ts` | toutes les chaînes de l'interface : boutons, titres de section, libellés, légendes |

```ts
// src/data/ui.ts — chaque entrée est une paire FR / EN
seeWork: { fr: "Voir les projets ↓", en: "See the work ↓" },
```

Deux règles pour ne rien casser :

- **toujours remplir `fr` *et* `en`.** `ui.ts` est typé `satisfies Record<string, Loc>` : oublier
  une langue fait échouer `npx tsc --noEmit`.
- **ajouter un projet = ajouter un objet à `projects`.** Les stations de l'île, la minimap, les
  modales et le mode classique en dérivent tous — il n'y a rien d'autre à toucher, sauf
  `position: [x, z]` pour le placer sur la carte (anneau de rayon ~13).

## Ce qu'il y a dedans

| | |
|---|---|
| **Stack** | React 19, TypeScript, Vite 7, Tailwind 4 |
| **3D** | Three.js via react-three-fiber + drei, caméra orthographique |
| **Bâtiments** | 9 modèles low-poly écrits à la main en R3F, aucun asset externe |
| **Covers** | SVG isométriques générés en React, une par projet |
| **Avatar** | portrait low-poly généré depuis une photo (voir plus bas) |
| **i18n** | contexte React maison, FR par défaut, mémorisé en `localStorage` |

## Architecture

`src/data/projects.ts` est la **source de vérité unique**. Les stations de l'île, la minimap,
les modales et le mode classique en dérivent tous — ajouter un projet, c'est ajouter un objet.

```
src/
├── data/projects.ts      projets, profil, parcours, formation  ← tout le contenu
├── data/ui.ts            chaînes d'interface (FR/EN)
├── i18n/lang.tsx         contexte de langue + helper `tr()`
├── game/
│   ├── GameScene.tsx     canvas, HUD, minimap, modales
│   ├── World.tsx         île, chemins, plateformes, décor
│   ├── Landmarks.tsx     les 9 bâtiments low-poly
│   ├── Player.tsx        personnage, caméra, collisions, bulle de dialogue
│   └── stations.ts       position des pavillons (anneau à 40°)
├── lib/route.ts          mode + langue dans l'URL (liens partageables)
├── classic/              le portfolio qui scrolle
└── ui/                   modales + covers de projets
```

### Deux pièges à connaître

**Le contexte React ne traverse pas le `<Canvas>`** de react-three-fiber : la scène 3D vit dans
un autre réconciliateur. Tout ce qui est rendu à l'intérieur reçoit donc `lang` en prop et
résout ses chaînes avec `tr()` plutôt qu'avec le hook `useT()`.

**Le build est en fichier unique** (`vite-plugin-singlefile`), mais les fichiers de `public/`
ne sont pas inlinés. `dist/index.html` a donc besoin de son dossier `images/` à côté.

## L'avatar low-poly

`tools/lowpoly-avatar/main.swift` transforme une photo de portrait en illustration à facettes :
détourage et repères du visage via Apple Vision, puis triangulation de Delaunay guidée par les
contours, plus dense sur le visage. Chaque facette prend la couleur moyenne de ses pixels.

```bash
swiftc -O -o lowpoly tools/lowpoly-avatar/main.swift
./lowpoly <ta-photo>.jpg out.png out.svg 1100 efe7d8 1000
sips -s format jpeg -s formatOptions 90 out.png --out public/images/paul.jpg
```

Les arguments : photo, sortie PNG, sortie SVG, nombre de sommets, couleur de fond, hauteur de
recadrage. La photo d'origine n'est pas versionnée — seul l'avatar généré l'est.

## Commandes du jeu

`ZQSD` / `WASD` / flèches pour se déplacer · `espace` pour sauter · `E` pour entrer dans un
pavillon. Contrôles tactiles sur mobile.

---

Conçu et codé avec React, Three.js et beaucoup trop de café.
