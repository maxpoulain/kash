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
