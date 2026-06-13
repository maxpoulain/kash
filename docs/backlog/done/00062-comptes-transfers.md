---
feature: 00058-comptes-multiples
depends_on: 00061-comptes-crud-tab
---

# T3 — Transferts entre comptes

## Objectif

Permettre de déplacer de l'argent entre comptes (commun ↔ perso) et d'**alimenter
l'épargne/patrimoine** (Compte courant → PEA, retrait PEA → Compte courant), via un
modèle de transfert **symétrique** et **polymorphe** (une jambe peut être un compte
ou un actif patrimoine). C'est le cœur du cas couple + contributions d'épargne.

## Périmètre

**Backend**
- Migration : table `transfers` (endpoints polymorphes `{kind, id}`, contrainte
  « ≥ 1 jambe = compte »).
- `POST /transfers` + `DELETE /transfers/{id}`.
- Le **solde calculé** d'un compte intègre les jambes de transfert :
  `initial_balance + Σ income − Σ expense + Σ transfer-in − Σ transfer-out`.
- Jambe **patrimoine** : enregistrée pour l'historique/flux mais **sans effet
  programmatique** sur la valeur de l'actif (reste manuelle/snapshot).
- **Correctness analytics** : `summary`, goals, budgets **ignorent** les transferts
  (ni revenu ni dépense — income/expense/net inchangés). La richesse d'affichage
  (Sankey, etc.) est repoussée à T5.

**Frontend**
- Mode « Transfert » dans la modale de transaction (toggle, comme « Récurrent ») :
  from / to (compte ou patrimoine) / montant / date.
- Validation : refuse patrimoine → patrimoine (≥ 1 jambe compte).

**Hors périmètre** (T5) : affichage des transferts dans les listes, Sankey enrichi,
net worth détaillé.

## Critères de validation

- [ ] Un transfert commun → perso **baisse** le solde commun et **monte** le perso
- [ ] Un transfert perso → commun fait l'inverse (modèle symétrique)
- [ ] Un transfert commun → PEA baisse le solde commun ; la **valeur du PEA reste inchangée**
- [ ] La modale **refuse** un transfert patrimoine → patrimoine
- [ ] Le transfert **n'apparaît pas** dans les revenus/dépenses du `summary` (totaux inchangés)
- [ ] **Supprimer** un transfert annule les effets de solde
- [ ] Foyer B ne peut ni créer ni voir les transferts du foyer A
- [ ] Tests écrits et passants (`just check` passe)

## Plan d'implémentation

Ordre TDD : backend d'abord (données → soldes), puis frontend.

### Phase 1 — Backend : modèle `transfers` + endpoints
- Migration `create_transfers` : table polymorphe (`from_kind`/`from_id`, `to_kind`/`to_id`),
  `amount > 0`, contrainte `from_kind='compte' OR to_kind='compte'`, scope `household_id`.
- Schémas Pydantic : `TransferCreate` ({from_kind, from_id, to_kind, to_id, amount, date, note?}),
  `TransferOut`.
- Router `transfers.py` (`/api/transfers`) : `POST` + `DELETE /{id}` + `GET` (liste foyer).
  - Validation en code : ≥1 jambe compte ; refuse patrimoine→patrimoine ; chaque `{kind,id}`
    appartient au foyer (compte via `accounts`, patrimoine via `savings_accounts`).
- `include_router` dans `main.py`.

**Tests (Phase 1)**
- [ ] POST compte→compte 201 ; compte→patrimoine 201 ; patrimoine→compte 201
- [ ] POST patrimoine→patrimoine → 422
- [ ] POST avec jambe d'un autre foyer → 404/403
- [ ] DELETE retire le transfert ; GET ne liste que le foyer courant

### Phase 2 — Backend : intégration au solde calculé
- `_compute_balances` (routers/accounts.py) ajoute les jambes de transfert des comptes :
  `+ Σ transfer-in (to_kind=compte) − Σ transfer-out (from_kind=compte)`.
- Patrimoine : aucune incidence sur la valeur de l'actif (rien à changer côté savings).
- Les transferts ne touchent **pas** `transactions` → `summary`/goals/budgets inchangés par construction.

**Tests (Phase 2)**
- [ ] Solde compte = initial + txns + transfer-in − transfer-out
- [ ] `summary` : un transfert ne modifie ni income ni expense ni net (non-régression)

### Phase 3 — Frontend : types + client API
- `types/api.ts` : `Transfer`, `TransferCreate` (kinds `compte|patrimoine`).
- `lib/api.ts` : `createTransfer`, `deleteTransfer`.

### Phase 4 — Frontend : mode « Transfert » dans la modale
- Toggle « Transfert » dans `transaction-form` (à côté de Dépense/Revenu, façon « Récurrent »).
- Corps transfert : `from` (compte), `to` (compte **ou** patrimoine), montant, date.
- Validation client : ≥1 jambe compte (refuse patrimoine→patrimoine).
- Submit → `createTransfer` ; i18n fr/en.

**Tests (Phase 4)**
- [ ] Vitest : le mode transfert valide ≥1 compte et appelle `createTransfer`

### Phase 5 — Vérification
- `just check` (back + front) vert ; vérif e2e manuelle des 6 critères de validation.
