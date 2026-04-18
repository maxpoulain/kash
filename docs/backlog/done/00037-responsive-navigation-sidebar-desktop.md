# Responsive Navigation — Sidebar Desktop

## Objectif

Adapter la navigation pour les grands écrans : sidebar collapsible sur desktop (≥ md), bottom nav conservée sur mobile (< md).

## Périmètre

- Intégrer le composant sidebar du design system (`/Users/maxime.poulain/Downloads/b_c0IlgvAyeIY`)
- Layout responsive dans `app/layout.tsx` :
  - `<aside className="hidden md:flex">` → sidebar desktop
  - `<BottomNav className="md:hidden">` → mobile uniquement
- Sidebar collapsible (expanded ↔ icons-only) avec état local
- Même items de navigation que le bottom nav actuel (Dashboard, Budget, Transactions…)
- Contenu principal avec `md:ml-64` (expanded) / `md:ml-20` (collapsed)

## Critères de validation

- [ ] Sur mobile (< 768px) : bottom nav visible, sidebar absente
- [ ] Sur desktop (≥ 768px) : sidebar visible, bottom nav absent
- [ ] Toggle expand/collapse fonctionne sur desktop
- [ ] Navigation active state cohérent entre les deux modes
- [ ] `just check` passe
