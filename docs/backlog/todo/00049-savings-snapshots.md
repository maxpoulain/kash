---
feature: 00011-suivi-epargne-par-poste
depends_on: 00048
---

# Savings snapshots — historique et courbe d'évolution

## Objectif
Permettre de visualiser l'évolution du patrimoine dans le temps via une courbe sur la page Assets, en enregistrant un snapshot daté à chaque modification de solde.

## Périmètre
- Migration : table `savings_snapshots` (id, account_id, balance, recorded_at)
- Backend : créer un snapshot automatiquement à chaque POST/PUT sur `/savings-accounts`
- Frontend : endpoint GET `/savings-accounts/history` pour récupérer l'évolution du total net worth
- Frontend : remplacer la sparkline statique par une courbe réelle basée sur les snapshots

## Critères de validation
- [ ] Chaque ajout ou modification de compte crée un snapshot en base
- [ ] La courbe sur la page Patrimoine reflète l'évolution réelle du net worth
- [ ] Avec un seul point de données, la courbe est masquée ou affiche un état vide
- [ ] `just check` passe
