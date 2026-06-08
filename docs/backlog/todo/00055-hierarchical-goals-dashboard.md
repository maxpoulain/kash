---
---

# Dashboard Objectifs Hiérarchique

## Objectif

Visualiser les objectifs de dépense de manière hiérarchique : un objectif sur un groupe affiche la progression globale et le détail par catégorie du groupe. Un objectif sur une catégorie simple conserve son affichage actuel.

## Périmètre

- Frontend : nouveau composant `GoalCard` adaptatif
  - Si le goal cible un **groupe** : afficher le nom du groupe, le total, la barre de progression, et en dessous la liste des catégories du groupe avec leur contribution (montant dépensé, sous-barre)
  - Si le goal cible une **catégorie** : affichage actuel inchangé
- Frontend : adapter `GET /spending-goals` (ou un nouvel endpoint) pour inclure le détail par catégorie quand c'est un goal de groupe
- Responsive : à minima le total du groupe visible, détail dépliable ou scrollable

## Critères de validation

- [ ] Goal sur groupe "Sorties" affiche : titre "Sorties", montant 300€, progression 250€, barre principale
- [ ] En dessous : sous-sections Restaurants 120€, Bars 80€, Cinéma 50€ avec sous-barres proportionnelles
- [ ] Goal sur catégorie "Courses" conserve l'affichage exact actuel
- [ ] Affichage cohérent sur desktop et mobile