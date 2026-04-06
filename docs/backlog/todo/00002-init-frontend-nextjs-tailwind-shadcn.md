# Init frontend Next.js + Tailwind + shadcn

**Source:** [Linear PER-17](https://linear.app/personal-max-and-maria/issue/PER-17/init-frontend-nextjs-tailwind-shadcn)

**Priority:** High
**Labels:** Frontend

## Description

Initialiser le projet Next.js avec la stack frontend définie.

## Stack

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- next-pwa (PWA support)

## Critères d'acceptance

- [ ] `npx create-next-app@latest` avec TypeScript + Tailwind
- [ ] shadcn/ui initialisé (`npx shadcn-ui@latest init`)
- [ ] next-pwa configuré
- [ ] Structure de dossiers :
  ```
  frontend/
  ├── app/
  │   ├── (auth)/
  │   ├── (dashboard)/
  │   └── layout.tsx
  ├── components/
  └── lib/
  ```
- [ ] Page d'accueil basique affichée

## Implementation Plan

### Phase 1: Setup Next.js
- [ ] Créer le projet avec `npx create-next-app@latest frontend`
- [ ] Configurer TypeScript strict
- [ ] Vérifier Tailwind CSS est bien configuré

### Phase 2: shadcn/ui
- [ ] Initialiser shadcn/ui
- [ ] Installer les composants de base (button, card, input)
- [ ] Vérifier le thème fonctionne

### Phase 3: PWA
- [ ] Installer et configurer next-pwa
- [ ] Ajouter manifest.json
- [ ] Ajouter icons PWA

### Phase 4: Structure
- [ ] Créer les dossiers (auth), (dashboard)
- [ ] Créer layout.tsx de base
- [ ] Créer page d'accueil basique

### Tests
- [ ] `npm run build` passe sans erreur
- [ ] `npm run dev` démarre correctement
- [ ] Page d'accueil accessible sur localhost:3000
- [ ] PWA manifest détectable (Chrome DevTools)
