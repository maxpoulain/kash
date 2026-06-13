# T2 — Comptes CRUD + onglet

**Épopée :** `00058-comptes-multiples` · **Tâche :** T2 / 5 · **Priority:** High

Deuxième brique de [comptes multiples](../features/00058-comptes-multiples.md). Rend le multi-compte **utilisable** : API CRUD avec solde calculé, onglet « Comptes » sur la page assets, sélecteur dans la modale d'ajout. S'appuie sur le socle T1 (table `accounts`, helper `visible_account_ids`).

## Scope

### Backend
- `GET /accounts` — liste les comptes **visibles** (via `visible_account_ids`) avec **solde calculé** = `initial_balance + Σ income − Σ expense` (transferts en T3).
- `POST /accounts` — créer un compte (`name`, `type`, `initial_balance`).
- `PATCH /accounts/{id}` — renommer, changer type/initial_balance, **archiver** (`archived_at`).
- `DELETE /accounts/{id}` — refuser (409) si le compte porte des transactions (`on delete restrict`) ; sinon supprimer. Archive = soft-delete recommandé.
- Schémas `AccountCreate` / `AccountUpdate` / `AccountOut` (+ `balance`).

### Frontend
- Onglet `Comptes` | `Patrimoine` sur la page assets (`/assets`). L'existant devient l'onglet `Patrimoine`.
- Onglet `Comptes` : liste des comptes + soldes calculés, create/edit/archive (réutilise le pattern `AccountSheet`/`account-form`).
- **Net worth combiné dans l'en-tête** (au-dessus des onglets) = Σ soldes comptes + Σ patrimoine.
- Sélecteur de compte dans la modale d'ajout de transaction, pré-rempli sur le compte principal.
- `lib/api.ts` + `types/api.ts` : endpoints et types `Account`.

## Hors scope (→ T3+)

- Transferts (solde intègre les transferts) → **T3**
- Toggle « Compte privé » / bascule visibilité → **T4**
- Back-fill historique net worth, filtre Analyse par compte → **T5**

## Critères de validation

- [ ] `POST /accounts` crée un compte ; `GET /accounts` retourne le solde = `initial_balance` + txns
- [ ] Une txn rattachée à un compte se reflète dans son solde
- [ ] `DELETE` d'un compte avec des transactions renvoie 409 (pas de perte de données)
- [ ] L'archivage masque le compte des listes actives sans supprimer ses txns
- [ ] L'en-tête net worth = Σ comptes + Σ patrimoine
- [ ] Le sélecteur de la modale liste les comptes, pré-rempli sur le principal
- [ ] Le foyer B ne voit pas les comptes du foyer A
- [ ] Tests : endpoints CRUD + calcul de solde (backend) ; rendu onglet (frontend)

## Plan d'implémentation

**Phase 1 — Backend CRUD + solde (TDD).**
1. `schemas/accounts.py` : `AccountCreate`, `AccountUpdate`, `AccountOut` (avec `balance`).
2. `routers/accounts.py` : CRUD ; `GET` calcule le solde (agrège les txns par `account_id`). Scope via `visible_account_ids`.
3. `DELETE` → 409 si txns présentes. `PATCH` → archivage.
4. Enregistrer le routeur dans `main.py`. Tests `tests/test_accounts_api.py`.

**Phase 2 — Frontend onglet + sélecteur.**
5. Lire `node_modules/next/dist/docs/` avant tout code frontend (cf. `frontend/AGENTS.md`).
6. `lib/api.ts` + `types/api.ts` : `Account`, `getAccounts`, `createAccount`, etc.
7. Onglets `Comptes | Patrimoine` sur `/assets` ; net worth combiné dans l'en-tête.
8. Onglet Comptes : liste + soldes + create/edit/archive (réutilise `AccountSheet`).
9. Sélecteur de compte dans la modale d'ajout de transaction.

## Assomptions à confirmer

- **Archivage vs suppression** : `PATCH archived_at` (soft) par défaut ; `DELETE` dur seulement si zéro txn.
- Le solde dans `GET /accounts` est calculé côté backend (une requête d'agrégation), pas côté frontend.

## Dépendances

Dépend de **T1** (livré). Débloque **T3** (transferts) et `00059` (import : compte cible).
