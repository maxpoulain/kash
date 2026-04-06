# Budget zéro-based par catégories

**Source:** [Linear PER-6](https://linear.app/personal-max-and-maria/issue/PER-6/budget-zero-based-par-categories)

**Priority:** Urgent

## Description

Implémenter la méthode zero-based budgeting : chaque euro du revenu mensuel est assigné à une catégorie. Le solde non alloué doit toujours tendre vers 0.

## Fonctionnement attendu

- Création de catégories personnalisées (charges fixes, variables, épargne, projets)
- Saisie du revenu mensuel du foyer
- Allocation de montants par catégorie avec indicateur de progression
- Solde restant à allouer visible en permanence (doit atteindre 0)

## Critères d'acceptance

- [ ] On peut créer/modifier/supprimer des catégories
- [ ] Le total alloué ne peut pas dépasser le revenu
- [ ] Indicateur visuel quand budget non équilibré
- [ ] Persistance mensuelle (le budget se réinitialise chaque mois)
