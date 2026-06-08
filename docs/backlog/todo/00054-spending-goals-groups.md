---
---

# Spending Goals par Groupe ou Catégorie

## Objectif

Permettre de définir un objectif de dépense soit sur une catégorie unique, soit sur un groupe de catégories (ex : 300€ pour toutes les "Sorties").

## Périmètre

- Migration : rendre `category_id` nullable sur `spending_goals`
- Migration : ajouter `group_id` nullable sur `spending_goals` avec FK vers `category_groups`
- Contrainte : `CHECK (category_id IS NOT NULL OR group_id IS NOT NULL)`
- Adapter l'unique constraint : un seul goal par `(household_id, category_id, month)` OU `(household_id, group_id, month)`
- Backend : adapter `POST/PUT` pour accepter soit `category_id` soit `group_id`
- Backend : adapter le calcul de progression : si `group_id`, sommer toutes les transactions des catégories du groupe pour le mois
- Backend : adapter `GET /spending-goals` pour retourner le `type` (catégorie vs groupe) et la progression
- Les goals existants (par catégorie) continuent de fonctionner sans modification

## Critères de validation

- [ ] Créer un goal de 300€ sur le groupe "Sorties" → progression = somme des transactions Restaurants + Bars + Cinéma
- [ ] Créer un goal de 400€ sur la catégorie "Courses" → comportement inchangé
- [ ] Impossible de créer un goal sans catégorie ni groupe
- [ ] Impossible d'avoir deux goals sur le même groupe pour le même mois