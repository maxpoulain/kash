---
---

# Suggestions de Catégories en Code

## Objectif

Supprimer le seed SQL des catégories par défaut et les remplacer par un fichier de **suggestions pures en code** (`SUGGESTED_CATEGORIES`). Les catégories n'existent en base que si l'utilisateur les utilise réellement (création lazy au premier usage).

## Périmètre

- Définir `SUGGESTED_CATEGORIES` en code versionné (nom, icône, type revenu/dépense)
- Supprimer les `INSERT INTO categories` des migrations SQL (ne garder que `CREATE TABLE`)
- Supprimer toutes les catégories globales (`household_id IS NULL`) existantes en base : elles deviennent obsolètes
- Lorsqu'un utilisateur crée/édite une transaction avec une catégorie inconnue pour son foyer, si elle correspond à une suggestion, la créer automatiquement (`household_id = <foyer>`)
- L'autocomplete des catégories est alimenté par : suggestions en code + catégories déjà créées pour ce foyer
- Supprimer ou ignorer la colonne `is_default`

## Plan d'implémentation

### Phase 1 — Backend core
1. Créer `backend/app/core/categories.py` avec `SUGGESTED_CATEGORIES` (liste de dicts : `id`, `name`, `icon`, `type`)
2. Modifier `CategoryOut` : ajouter `type: TransactionType`, supprimer `is_default`
3. Modifier `list_categories()` : retourner suggestions (avec IDs fixes) + catégories du foyer sans doublons
4. Modifier `create_transaction()` / `update_transaction()` : si `category_id` est un ID de suggestion inconnu pour ce foyer, auto-créer la catégorie
5. Modifier `recurring_transactions.py` : même logique d'auto-création sur POST/PATCH
6. Modifier `create_category()` : accepter `type`, supprimer `is_default`

### Phase 2 — Migration SQL
1. Créer migration : supprimer catégories `household_id IS NULL`, ajouter colonne `type`, supprimer `is_default`
2. Modifier migrations existantes pour enlever les `INSERT INTO categories`

### Phase 3 — Frontend
1. `types/api.ts` : ajouter `type` à `Category`, supprimer `is_default`
2. `transaction-form.tsx` : filtrer avec `c.type === selectedType` au lieu de `is_default` + `INCOME_CATEGORIES`
3. Mettre à jour `__tests__/api.test.ts`

### Phase 4 — Tests
1. Mettre à jour mocks backend (`is_default` → `type`)
2. Ajouter test : transaction avec suggestion crée la catégorie automatiquement
3. Ajouter test : `list_categories` retourne bien suggestions + catégories foyer
4. Vérifier `just check`

## Critères de validation

- [ ] `SUGGESTED_CATEGORIES` existe en versionné, identique sur tous les envs
- [ ] Les migrations SQL ne contiennent plus de seed de catégories
- [ ] Aucune catégorie `household_id IS NULL` n'existe en base
- [ ] Créer une transaction "Loyer" sur un nouveau foyer crée automatiquement la catégorie "Loyer" pour ce foyer
- [ ] L'autocomplete suggère toujours les mêmes catégories partout (déterministe)
- [ ] Les objectifs de dépenses et les transactions historiques continuent de fonctionner