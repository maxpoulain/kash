---
depends_on: 00053-category-groups
---

# Dashboard Objectifs groupés (rollup par groupe)

## Objectif

Visualiser les objectifs de dépense regroupés par groupe de catégories. Les goals restent par catégorie (pas de goals de groupe — ex-00054 abandonné) : le groupe est un **rollup d'affichage** qui somme les goals de ses catégories.

## Périmètre

- Backend : `GET /spending-goals` inclut le `group` (id, name) de chaque catégorie de goal (via la jointure categories)
- Frontend : sur la page goals, regrouper les cartes sous un en-tête de groupe
  - En-tête : nom du groupe, total goal = somme des goals des catégories, total dépensé, barre de progression agrégée
  - En dessous : les `GoalCard` par catégorie, affichage actuel inchangé
  - Les goals de catégories sans groupe restent affichés comme aujourd'hui (section "Sans groupe" ou à plat)
- Pas de double comptage possible : chaque transaction ne compte que dans le goal de sa catégorie ; le rollup est une simple somme
- Responsive : à minima le total du groupe visible, détail dépliable ou scrollable

## Critères de validation

- [ ] Goals Restaurants 120€ + Bars 80€ + Cinéma 100€ (groupe "Sorties") → en-tête "Sorties" avec total 300€ et progression agrégée
- [ ] Sous l'en-tête : les cartes par catégorie avec leur affichage actuel
- [ ] Goal sur catégorie "Courses" (sans groupe) conserve l'affichage exact actuel
- [ ] `total_goal`/`total_spent` de la page inchangés (pas de double comptage)
- [ ] Affichage cohérent sur desktop et mobile
- [ ] Vérification E2E agent-browser avec screenshots attachés
