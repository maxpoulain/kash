---
---

# Création de Catégories Personnalisées

## Objectif

Permettre à l'utilisateur de créer des catégories totalement libres en dehors des suggestions, avec un nom et une icône au choix.

## Périmètre

- Backend : `POST /categories` accepte un nom libre, une icône choisie parmi une liste prédéfinie, et optionnellement un `group_id`
- Backend : `GET /categories` retourne uniquement les catégories créées pour ce foyer (pas les suggestions du code — le merge se fait côté frontend)
- Frontend : bouton "Nouvelle catégorie" dans le formulaire de transaction (ou via un select dédié)
- Frontend : saisie du nom + picker d'icône + select de groupe optionnel
- Validation : pas de doublon de nom pour le même foyer (insensible à la casse, trimé)
- Les catégories perso sont liées au foyer (`household_id`) et n'ont pas de notion de global

## Critères de validation

- [x] Créer une catégorie "Courses Bio" avec une icône, elle apparaît immédiatement dans l'autocomplete — ✅ vérifié E2E (cf. `screenshots/03-category-created.png`)
- [x] Essayer de créer "courses bio" quand "Courses Bio" existe → erreur doublon — ✅ vérifié E2E, message « Une catégorie avec ce nom existe déjà » (`screenshots/04-duplicate-error.png`)
- [x] Une catégorie perso créée par le foyer A n'est pas visible du foyer B — ✅ couvert par test backend `test_create_category_isolated_per_household` (POST du foyer B filtre sur `household_id`)
- [x] Les catégories perso fonctionnent dans les transactions, les objectifs de dépenses et le dashboard — ✅ `mergeCategories()` appliqué aux 3 consommateurs (`transaction-form`, `transaction-list`, `create-goal-modal`) ; `goal-card` résout l'icône via lookup statique

## Plan d'implémentation

> Décision de scope : `group_id` est explicitement **hors périmètre** — il appartient à `00053-category-groups`. Le POST n'accepte donc que `name`, `icon`, `type`.

### État actuel (inventaire)

- Backlog : `chore: start` poussé sur `origin/main` ; branche `00052-custom-categories-creation` créée (à jour de main).
- `frontend/components/categories/create-category-modal.tsx` existe déjà mais est **incomplet/non fonctionnel** : il importe `createCategory` (absent de `lib/api.ts`), `ALLOWED_CATEGORY_ICONS` + `resolveCategoryIcon` (absents de `lib/category-icons.ts`), et des clés i18n `categories.form.*` (absentes). Aucun consommateur ne l'utilise encore.
- Backend `GET /api/categories` merge les suggestions côté serveur (renvoie suggestions + foyer).
- Backend `POST /api/categories` prend `name/icon/type` en **query params** (pas de body JSON), **sans contrôle de doublon**. La contrainte unique `categories_household_name_unique` est **sensible à la casse** (Postgres) → ne bloque pas "courses bio" vs "Courses Bio".
- Frontend : `getCategories()` consommé par `transaction-form.tsx`, `transaction-list.tsx`, `goals/create-goal-modal.tsx`. Aucune notion de suggestions côté frontend aujourd'hui.

### Phase 1 — Backend : validation doublon + body JSON

1. Créer `backend/app/schemas/categories.py` : `CategoryCreate(BaseModel)` avec `name: str` (min 1, max 50), `icon: str | None = None`, `type: TransactionType = expense`. (Rendre `name`/`icon`/`type` cohérents avec la zone 50 du frontend.)
2. Réécrire `POST /api/categories` : accepter un **body JSON** (`category: CategoryCreate`), trim+lower le nom pour la comparaison, interroger `categories` par foyer et filtrer `name.ilike(trim)` ; si doublon → `409` `{"detail": "duplicate"}`. Sinon insérer et renvoyer `201 CategoryOut`.
3. Ajouter helper `_find_duplicate_category(household_id, name) -> bool` dans `app/core/categories.py` (réutilisable, testable).
4. Laisser `GET /api/categories` **inchangé pour l'instant** (voir Phase 3) — il continue de renvoyer suggestions + foyer pour ne pas casser les consommateurs existants avant le merge frontend.

> Note : la spec dit « GET retourne uniquement les catégories du foyer, merge côté frontend ». C'est un changement cassant pour 3 consommateurs frontend. On le fait en Phase 3 une fois le frontend prêt à merger lui-même.

### Phase 2 — Frontend : fondations manquantes (rendre la modale fonctionnelle)

1. `lib/category-icons.ts` : ajouter `ALLOWED_CATEGORY_ICONS` (liste `{ key, label, icon }` — reprendre les 12 icônes lucide existantes, clés stables) et `resolveCategoryIcon(nameOrKey)` (retourne `LucideIcon`, fallback `Package`). Garder `CATEGORY_ICONS` (nom→icône) pour les suggestions.
2. `lib/api.ts` : ajouter `createCategory({ name, icon, type }): Promise<Category>` (POST JSON `/api/categories`). En cas de `409`, propager une erreur `.message === "duplicate"` pour que la modale l'affiche.
3. i18n : ajouter la section `categories.form` dans `messages/en.json` et `messages/fr.json` (title, name, namePlaceholder, nameRequired, nameTooLong, icon, iconRequired, type, expense, income, cancel, create, success, duplicate, submitError).
4. Brancher `CreateCategoryModal` dans `transaction-form.tsx` : bouton « Nouvelle catégorie » en pied de grille (mobile + desktop) ; au `onCategoryCreated`, ajouter la catégorie à l'état local et la sélectionner.

### Phase 3 — Merge suggestions côté frontend (alignement spec)

1. Définir les suggestions côté frontend (`lib/category-icons.ts` ou nouveau `lib/suggested-categories.ts`) — miroir de `SUGGESTED_CATEGORIES` (même IDs/UUIDs, noms, icônes, type).
2. Adapter `GET /api/categories` : renvoyer **uniquement** les catégories du foyer (plus de merge serveur, plus de `household_id: null`).
3. `getCategories()` (ou un hook) merge : suggestions non déjà créées + catégories du foyer. Mettre à jour `transaction-form.tsx`, `transaction-list.tsx`, `goals/create-goal-modal.tsx`.
4. Vérifier que `transaction-list.tsx` et le dashboard (`summary.py`) résolvent toujours l'icône par nom (pas par id) — inchangé.

### Phase 4 — Tests

1. Backend : test `POST /api/categories` cas de doublon insensible à la casse → 409 ; test création nominale → 201 ; test isolation foyer (A ne voit pas B). Mettre à jour le test `list_categories` si Phase 3 change le contrat.
2. Frontend : étendre `__tests__/api.test.ts` — `createCategory` envoie le bon body, propage "duplicate" sur 409.
3. `just check` passe (lint + typecheck + tests front + ruff + pyright + pytest).

### Assomptions à valider

- [a] `group_id` reste hors scope (tâche 00053). ✅ confirmé par lecture de 00053.
- [b] L'utilisateur crée la catégorie **depuis le formulaire de transaction** (bouton dans la grille), pas depuis une page dédiée — cohérent avec le périmètre « bouton dans le formulaire ».
- [c] Pas de suppression/édition de catégorie perso dans cette tâche (non listé dans le périmètre).
- [d] Le dashboard continue de fonctionner car `summary.py` lit déjà `categories` par foyer.

## Vérification E2E

Testé via `agent-browser` contre le dev local (backend :8000, frontend :3000), utilisateur `test@example.com`. Captures dans `screenshots/` :

1. **`01-transaction-form.png`** — bouton « Nouvelle catégorie » présent dans la grille du formulaire de transaction (bordure pointillée).
2. **`02-create-modal.png`** — modale de création ouverte : saisie du nom + picker d'icônes (18 icônes) + toggle expense/income.
3. **`03-category-created.png`** — création de « Courses Bio » (icône ShoppingCart) → toast de succès + la catégorie apparaît immédiatement dans la grille d'autocomplete du formulaire.
4. **`04-duplicate-error.png`** — tentative de créer « courses bio » (minuscules) alors que « Courses Bio » existe → erreur « Une catégorie avec ce nom existe déjà », modale reste ouverte.

`just check` passe (lint + typecheck + 31 tests frontend / ruff + pyright + 67 tests backend).

## Retours UX (itération 2)

Retours utilisateur après la première implémentation :

1. **Tuiles surdimensionnées** — le libellé « Nouvelle catégorie » sur deux lignes agrandissait toute la dernière rangée de la grille. → Libellé raccourci en « Créer » (une ligne), toutes les tuiles ont la même hauteur.
2. **Double popup** — la création ouvrait une seconde modale par-dessus le formulaire de transaction. → Remplacé par un **inline panel swap** : la section CATÉGORIE du panneau droit est remplacée en place par le formulaire (nom + icônes) avec une flèche retour. Échap ferme d'abord le formulaire inline, puis la modale.
3. **Type hérité** — le toggle Dépense/Revenu redondant est supprimé : la catégorie hérite du type sélectionné dans le formulaire de transaction (desktop et mobile).

Vérifié E2E via `agent-browser` :

5. **`05-uniform-grid.png`** — tuile « Créer » sur une ligne, rangées uniformes.
6. **`06-inline-create-form.png`** — panneau droit remplacé en place (flèche retour, nom, icônes, Annuler/Créer), pas de seconde modale, pas de toggle de type.
7. **`07-inline-created.png`** — création de « Voyages » → toast, retour à la grille, catégorie ajoutée et sélectionnée.