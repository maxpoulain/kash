---
feature: 00016-transactions-recurrentes
---

# Recurring Transactions — Schema + API + Lazy Generation

Backend slice of epic [00016](../features/00016-transactions-recurrentes.md). UI lives in a follow-up ticket (00052).

## Objectif

Permettre de définir des **règles** de transactions récurrentes (loyer, abonnements, salaire) qui **génèrent automatiquement de vraies transactions** à chaque échéance, sans saisie manuelle.

Décisions produit actées :
- **Génération lazy** : à chaque `GET /transactions`, le backend matérialise les transactions dues (rattrapage jusqu'à aujourd'hui). Aucune infra cron.
- **Notifications hors périmètre** (ticket futur).

> Note : l'epic mentionne « apparaissent dans le budget » — caduc (budget supprimé en 00050). Les récurrences créent désormais de vraies lignes `transactions`.

## Modèle de données

### Table `recurring_transactions` (la règle / template)

| Colonne | Type | Note |
|---------|------|------|
| `id` | uuid PK | |
| `household_id` | uuid NOT NULL FK households | RLS |
| `created_by` | uuid NOT NULL FK users | |
| `category_id` | uuid FK categories (set null) | |
| `amount` | numeric(12,2) > 0 | |
| `type` | text in (income, expense) | |
| `note` | text | label de la règle (ex: "Loyer", "Spotify") |
| `frequency` | text in (weekly, monthly) | extensible plus tard |
| `anchor_day` | int | monthly: jour du mois 1–31 (clampé à la fin du mois) · weekly: jour de semaine 0–6 |
| `start_date` | date NOT NULL | première échéance |
| `end_date` | date NULL | optionnel, borne la série |
| `next_run_date` | date NOT NULL | prochaine échéance à matérialiser |
| `active` | boolean NOT NULL default true | pause sans suppression |
| `created_at` / `updated_at` | timestamptz | |

RLS : mêmes 4 policies que `transactions` (select/insert/update/delete = `household_id = current_household_id()`).

### Lien de provenance sur `transactions`

Ajouter `recurring_id uuid REFERENCES recurring_transactions(id) ON DELETE SET NULL` (nullable) pour tracer l'origine d'une transaction générée. Supprimer une règle ne supprime pas l'historique déjà généré.

## Logique de génération (lazy)

À l'appel de `GET /transactions` (et idéalement aussi `GET /dashboard` si pertinent) :

```
pour chaque règle active du household où next_run_date <= today et (end_date is null ou next_run_date <= end_date):
    INSERT transaction (montant, type, category, date=next_run_date, note, created_by, recurring_id)
    next_run_date = avance d'une période (monthly: +1 mois sur anchor_day clampé · weekly: +7j)
    répéter tant que next_run_date <= today  (rattrapage)
    UPDATE recurring_transactions.next_run_date
```

- **Idempotent** : l'avance de `next_run_date` empêche tout doublon, même si l'app est ouverte plusieurs fois le même jour.
- **Clamp fin de mois** : anchor_day=31 → 28/29/30 selon le mois.
- Extraire la logique dans une fonction pure testable (`materialize_due(rules, today) -> (new_transactions, updated_rules)`).

## API

| Méthode | Route | Rôle |
|---------|-------|------|
| `GET` | `/recurring-transactions` | Liste les règles du household |
| `POST` | `/recurring-transactions` | Crée une règle (calcule `next_run_date` initial depuis start_date/frequency/anchor_day) |
| `PATCH` | `/recurring-transactions/{id}` | Modifie une règle (montant, catégorie, fréquence, anchor, active…) |
| `DELETE` | `/recurring-transactions/{id}` | Supprime une règle (historique conservé via SET NULL) |

Schemas Pydantic : `RecurringTransactionCreate`, `RecurringTransactionUpdate`, `RecurringTransactionOut` (calqués sur `schemas/transactions.py`).

## Implementation Plan

### Phase 1 — DB
- [ ] Migration `create_recurring_transactions.sql` : table + RLS + `alter table transactions add recurring_id`
- [ ] `supabase db reset` local OK

### Phase 2 — Backend schemas + router
- [ ] `schemas/recurring_transactions.py`
- [ ] `routers/recurring_transactions.py` (CRUD) + enregistrement dans `main.py`
- [ ] Calcul `next_run_date` initial à la création

### Phase 3 — Génération lazy
- [ ] Fonction pure `materialize_due(rules, today)` + branchement dans le service transactions (GET)
- [ ] Avance/clamp de période

### Phase 4 — Tests
- [ ] Unitaires `materialize_due` : mensuel, hebdo, clamp 31, rattrapage multi-périodes, end_date, idempotence (2 appels même jour → 0 doublon), règle inactive ignorée
- [ ] API : CRUD règles + isolation household (RLS)
- [ ] `just check` passe

## Critères de validation

- [x] On peut créer/lister/modifier/supprimer une règle récurrente via l'API
- [x] `GET /transactions` matérialise les échéances dues (rattrapage) et avance `next_run_date`
- [x] Aucun doublon si l'endpoint est appelé plusieurs fois le même jour
- [x] Une règle inactive ne génère rien (filtrée par `eq("active", True)`)
- [x] Supprimer une règle conserve les transactions déjà générées (`recurring_id ON DELETE SET NULL`)
- [x] Tests unitaires + API verts (20 nouveaux, 57 backend au total) — `just check` backend OK ⚠️ voir note

> ⚠️ **Note CI** : `just check` échoue sur 2 erreurs lint **frontend pré-existantes** (`goals-client.tsx`, `transaction-list.tsx`, règle `react-hooks/set-state-in-effect`), sans rapport avec ce ticket backend. Les checks backend (ruff, pyright, pytest) passent tous.
