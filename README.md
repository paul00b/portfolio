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
