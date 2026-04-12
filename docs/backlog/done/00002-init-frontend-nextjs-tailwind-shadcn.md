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

- [x] `npx create-next-app@latest` avec TypeScript + Tailwind
- [x] shadcn/ui initialisé (`npx shadcn-ui@latest init`)
- [x] next-pwa configuré
- [x] Structure de dossiers :
  ```
  frontend/
  ├── app/
  │   ├── (auth)/
  │   ├── (dashboard)/
  │   └── layout.tsx
  ├── components/
  └── lib/
  ```
- [x] Page d'accueil basique affichée
- [x] Appliquer le design system "PiggyBank Finance"

## Design Reference

**PiggyBank Finance Design System v1.0**
- Warm coral primary evoking classic piggy bank
- Balances playfulness with professionalism
- Gamification at core (progress bars, achievements, streaks)
- Images cached at: `.claude/image-cache/4c1cf745-bcb6-473f-8ecc-0b752b17d0ee/`

## Implementation Plan

### Phase 1: Setup Next.js ✅
- [x] Créer le projet avec `npx create-next-app@latest frontend`
- [x] Configurer TypeScript strict
- [x] Vérifier Tailwind CSS est bien configuré

### Phase 2: shadcn/ui ✅
- [x] Initialiser shadcn/ui
- [x] Installer les composants de base (button, card, input)
- [x] Vérifier le thème fonctionne

### Phase 3: PWA ✅
- [x] Installer et configurer next-pwa
- [x] Ajouter manifest.json
- [x] Ajouter icons PWA

### Phase 4: Structure ✅
- [x] Créer les dossiers (auth), (dashboard)
- [x] Créer layout.tsx de base
- [x] Créer page d'accueil basique

### Phase 5: PiggyBank Finance Design System ✅
- [x] **Colors**: Update Tailwind theme with PiggyBank palette
  - Primary: Coral Pink (`--primary`) - Brand identity, CTAs
  - Secondary: Soft Mint (`--secondary`) - Success states, income
  - Accent: Golden Yellow (`--accent`) - Coins, rewards, achievements
  - Destructive: Warm Red (`--destructive`) - Expenses, warnings, errors
  - Gamification colors: Success (Emerald Green), XP (Indigo Purple), Coin (Rich Gold)
- [x] **Typography**: Configure fonts
  - Fredoka for display/headlines
  - Nunito for body/UI text
  - Geist Mono for monospace/data (financial figures)
- [x] **Iconography**: Use Lucide icons with rounded style
  - Finance & Money: Wallet, PiggyBank, CreditCard, Coins, etc.
  - Gamification & Rewards: Target, Trophy, Star, Sparkles, etc.
  - Navigation & UI: Home, Settings, Analytics, PieChart, etc.
- [x] **Update shadcn components** to match design system styling
  - Rounded corners (rounded-xl), soft shadows
  - Soft colored backgrounds for icon containers

### Tests
- [x] `npm run build` passe sans erreur
- [x] `npm run dev` démarre correctement
- [x] Page d'accueil accessible sur localhost:3000
- [ ] PWA manifest détectable (Chrome DevTools)

## Completed Work Summary

**Next.js Project:** Created with TypeScript, Tailwind CSS v4, App Router structure
**shadcn/ui:** Initialized with `style: base-nova`, components installed (button, card, input)
**PWA:** next-pwa configured with manifest.json, icons (192x192, 512x512), service worker generated
**Folder Structure:** app/(auth)/, app/(dashboard)/, components/ui/, lib/ all created
**Dev Environment:** Build and dev commands working, app running on localhost:3000
