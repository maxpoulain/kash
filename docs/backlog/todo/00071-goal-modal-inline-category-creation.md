---
feature: 00020-monthly-spending-goals
depends_on: 00070-goal-lazy-create-category
---

# Création de catégorie inline dans le modal de goal

## Objectif

Permettre de créer une catégorie custom directement depuis le modal de création de spending goal, sans passer par le formulaire de transaction. Réutilise le panneau inline de création de catégorie livré en 00052 (icon picker + validation de doublon).

## Périmètre

- Frontend : ajouter une entrée "Nouvelle catégorie" dans le sélecteur de catégories du modal de goal (`create-goal-modal.tsx`)
- Réutiliser le composant/panneau de 00052 (`create-category-modal.tsx`) en mode inline swap (pas de double popup — cf. fix 4dd2725)
- Après création : la nouvelle catégorie est sélectionnée automatiquement dans le formulaire de goal
- Desktop et mobile

## Critères de validation

- [ ] Depuis le modal de goal, créer une catégorie "Piscine" avec icône → elle apparaît sélectionnée
- [ ] Soumettre crée le goal sur cette nouvelle catégorie
- [ ] Validation de doublon de nom fonctionne comme en 00052
- [ ] Pas de double popup (swap inline)
- [ ] Vérification E2E agent-browser avec screenshots attachés
- [ ] Tests écrits et passants (`just check` passe)
