---
---

# Régression Catégories en Production

## Contexte

Suite à la livraison de l'US 00051 (suggestions de catégories en code), la modale "Nouvelle transaction" affiche une section CATÉGORIE vide en production. Il est impossible de créer une transaction avec une catégorie.

## Hypothèses de cause racine

1. **Collision d'IDs suggérés en base (bug de conception)** : `_ensure_category_exists` tente d'insérer les catégories suggérées avec leurs IDs fixes (`SUGGESTED_CATEGORIES.*.id`). Or `categories.id` est une primary key. Seul le premier foyer à utiliser une suggestion peut créer la ligne ; tous les autres foyers échoueront avec un conflit de clé.
2. **Schema mismatch possible** : si la migration `20260610130000_remove_global_categories.sql` n'est pas appliquée en production, `list_categories` lève une erreur Pydantic car `CategoryOut.type` est absent des lignes DB.

## Objectif

Corriger le backend pour que :
- l'ID public d'une suggestion (fixe) ne soit jamais utilisé comme clé primaire en DB ;
- chaque foyer ait ses propres lignes `categories` avec des UUID locaux ;
- `list_categories` soit résilient en cas de données incomplètes ;
- la création/édition de transaction et de récurrente fonctionne dans tous les foyers.

## Périmètre

- Backend : `backend/app/core/categories.py`
- Backend : `backend/app/routers/transactions.py` (`list_categories`, `_ensure_category_exists`, `create_transaction`, `update_transaction`)
- Backend : `backend/app/routers/recurring_transactions.py` (même logique d'auto-création)
- Tests backend : `backend/tests/test_transactions.py`, `backend/tests/test_recurring_transactions.py`
- Frontend : robustesse minimale pour `getCategories` et `filteredCategories`
- Migration SQL corrective si nécessaire

## Plan d'implémentation

### Phase 1 — Diagnostiquer
- [ ] Vérifier via Supabase/logs si `/api/categories` renvoie 500 en production et le message exact.
- [ ] Vérifier la structure de la table `categories` en production (colonne `type` présente ?, `household_id NOT NULL` ?, catégories globales restantes ?).

### Phase 2 — Corriger l'ID suggéré
- [ ] Mapper l'ID public d'une suggestion vers un UUID local unique par foyer (généré ou récupéré par nom).
- [ ] Conserver la correspondance nom/couleur/suggestion pour l'affichage.
- [ ] Insérer avec `ON CONFLICT (household_id, name) DO UPDATE ... RETURNING id` ou équivalent Supabase.
- [ ] Utiliser l'ID local ainsi obtenu dans les insert/update de transactions et récurrentes.

### Phase 3 — Résilience
- [ ] Rendre `list_categories` résilient aux lignes sans `type` (fallback `expense` + log/sentry).
- [ ] Rendre le frontend résilient si `category.type` est absent (afficher dans la liste et fallback vers le type courant).

### Phase 4 — Tests & migration
- [ ] Ajouter un test simulant deux foyers qui utilisent la même suggestion.
- [ ] Mettre à jour les mocks existants si besoin.
- [ ] Si la migration n'a pas été appliquée en production, créer une migration SQL corrective idempotente.
- [ ] Lancer `just check`.

## Critères de validation

- [ ] Un foyer A peut créer une transaction "Loyer".
- [ ] Un foyer B distinct peut ensuite créer une transaction "Loyer" sans erreur.
- [ ] La modale de transaction affiche les catégories (suggestions + perso) pour les deux foyers.
- [ ] `just check` passe.
