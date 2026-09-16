# FutureKawa — Frontend

Interface web du siège : la vue de pilotage consolidée sur les stocks de café vert,
les entrepôts, les alertes et les exploitations des trois pays. Lecture seule — le
frontend n'écrit rien, il affiche ce que le siège consolide.

## Place dans la chaîne

Le frontend ne parle qu'au **backend siège**, via HTTP, à l'URL donnée par
`NEXT_PUBLIC_API_URL`. Il ne connaît ni le MQTT, ni les backends pays, ni la base :
tout transite par le siège.

## Prérequis

- Node 22

## Lancement

```bash
npm ci
npm run dev      # développement, http://localhost:3000
```

Production :

```bash
npm run build
npm start
```

## Configuration

| Variable | Rôle | Défaut |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL de base de l'API du siège | `http://localhost:8000` |

> **Important.** Le défaut intégré (`http://localhost:8000`) pointe le port d'un
> backend **pays**, pas le siège. Pour une stack complète, renseignez explicitement
> l'URL du siège :
>
> ```bash
> NEXT_PUBLIC_API_URL=http://localhost:8080/api npm run dev
> ```
>
> Sans backend joignable à cette URL, les pages affichent leur état d'erreur de
> chargement — il n'existe pas de mode « données de démonstration » côté frontend.

## Internationalisation

Trois langues : français, anglais, espagnol, via `LanguageContext`. Le sélecteur est
en haut à droite (topbar) ; le choix est mémorisé dans le navigateur.

## Documentation utilisateur intégrée

- **Centre d'aide** : route `/aide`, sommaire des six sections + article. Entrée
  « Aide » en bas de la sidebar.
- **Aide contextuelle** : un bouton « ? » dans la topbar ouvre, en tiroir, l'article
  de la page où l'on se trouve, avec un lien vers le centre d'aide.
- Le contenu vit dans `src/content/help/` : un module TypeScript typé par section,
  chaque article portant ses variantes fr/en/es. Les captures d'écran sont sous
  `public/help/{section}/{langue}/`.

## Tests

```bash
npm test              # suite Jest + Testing Library
npm run test:coverage # avec couverture
npm run lint          # ESLint
```

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, framer-motion.
