---
---

# Groupes de Catégories

## Objectif

Permettre de regrouper les catégories par foyer pour créer des enveloppes mentales (ex : "Sorties" = Restaurants + Bars + Cinéma).

## Périmètre

- Migration : table `category_groups` (`id`, `household_id`, `name`, `created_at`)
- Migration : ajouter `group_id` nullable sur `categories` avec FK
- Backend : CRUD `GET/POST/PUT/DELETE /category-groups`
- Backend : adapter `GET /categories` pour inclure le `group` dans la réponse
- Frontend : dans le formulaire de création de catégorie, permettre de choisir un groupe existant ou d'en créer un
- Une catégorie appartient à 0 ou 1 groupe (pas plusieurs)
- Pas de doublon de nom de groupe au sein d'un même foyer

## Critères de validation

- [ ] Créer un groupe "Sorties" dans le foyer
- [ ] Créer une catégorie "Bars" et l'assigner au groupe "Sorties"
- [ ] L'API retourne la catégorie avec son groupe
- [ ] Impossible de créer deux groupes "Sorties" dans le même foyer
- [ ] Supprimer un groupe ne supprime pas les catégories (elles deviennent sans groupe)