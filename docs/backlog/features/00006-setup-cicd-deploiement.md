# Setup CI/CD + déploiement (Vercel + Railway)

**Source:** [Linear PER-21](https://linear.app/personal-max-and-maria/issue/PER-21/setup-cicd-deploiement-vercel-railway)

**Priority:** Medium
**Labels:** Infra

## Description

Configurer le déploiement automatique pour le frontend et le backend.

## Cibles

- **Frontend** → Vercel (auto-deploy depuis GitHub)
- **Backend** → Railway ou Fly.io (Docker)

## Critères d'acceptance

- [ ] Frontend déployé sur Vercel avec preview branches
- [ ] Backend déployé sur Railway/Fly.io
- [ ] Variables d'environnement configurées (Supabase, etc.)
- [ ] CI/CD : push sur `main` → deploy auto
- [ ] URL de staging fonctionnelles pour les deux
