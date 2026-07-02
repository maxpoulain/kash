---
---

# Groupes de Catégories

## Objectif

Permettre de regrouper les catégories par foyer pour créer des enveloppes mentales (ex : "Sorties" = Restaurants + Bars + Cinéma).

**Rescope 2026-07** : les groupes sont une couche de **présentation/rollup uniquement**. Les spending goals restent strictement par catégorie (aucun changement de schéma sur `spending_goals` — l'ex-00054 est abandonné). L'affichage agrégé par groupe est traité en 00055.

## Périmètre

- Migration : table `category_groups` (`id`, `household_id`, `name`, `created_at`)
- Migration : ajouter `group_id` nullable sur `categories` avec FK
- Backend : CRUD `GET/POST/PUT/DELETE /category-groups`
- Backend : adapter `GET /categories` pour inclure le `group` dans la réponse
- Frontend : dans le formulaire de création/édition de catégorie, permettre de choisir un groupe existant ou d'en créer un
- Une catégorie appartient à 0 ou 1 groupe (pas plusieurs)
- Pas de doublon de nom de groupe au sein d'un même foyer
- **Catégories suggérées** : elles sont globales (`household_id` null) tant qu'elles ne sont pas matérialisées. Assigner une catégorie suggérée à un groupe déclenche sa matérialisation lazy pour le foyer (via `_ensure_category_exists`), puis pose le `group_id` sur la ligne du foyer. Jamais de `group_id` sur une ligne globale.

## Critères de validation

- [ ] Créer un groupe "Sorties" dans le foyer
- [ ] Créer une catégorie "Bars" et l'assigner au groupe "Sorties"
- [ ] Assigner la catégorie suggérée "Restaurants" (non matérialisée) au groupe → elle est matérialisée pour le foyer avec le groupe
- [ ] L'API retourne la catégorie avec son groupe
- [ ] Impossible de créer deux groupes "Sorties" dans le même foyer
- [ ] Supprimer un groupe ne supprime pas les catégories (elles deviennent sans groupe)
- [ ] Aucun changement de schéma ni d'API sur `spending_goals`
