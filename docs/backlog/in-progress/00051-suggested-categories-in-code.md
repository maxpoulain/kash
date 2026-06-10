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

## Critères de validation

- [ ] `SUGGESTED_CATEGORIES` existe en versionné, identique sur tous les envs
- [ ] Les migrations SQL ne contiennent plus de seed de catégories
- [ ] Aucune catégorie `household_id IS NULL` n'existe en base
- [ ] Créer une transaction "Loyer" sur un nouveau foyer crée automatiquement la catégorie "Loyer" pour ce foyer
- [ ] L'autocomplete suggère toujours les mêmes catégories partout (déterministe)
- [ ] Les objectifs de dépenses et les transactions historiques continuent de fonctionner