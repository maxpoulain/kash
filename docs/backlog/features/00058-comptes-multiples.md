# Comptes multiples & transferts

**Priority:** High

> **Statut :** plan affiné lors de deux sessions de grilling (modèle de données + analytics).
> Trois corrections majeures vs. la première version : (1) **pas de fusion** `savings_accounts → accounts`,
> (2) transferts à **endpoints polymorphes**, (3) visibilité gérée **en code applicatif**, pas en RLS.

## Description

Introduire le **compte** comme objet de premier rang : chaque transaction appartient à un compte (commun, perso, épargne…), avec confidentialité par compte et **transferts neutres** entre comptes — y compris vers le patrimoine.

C'est la brique fondamentale qui débloque trois features déjà définies :

- `00013` mode foyer partagé (a besoin de comptes `shared` / `private`)
- `00014` net worth tracker (comptes courants = actifs liquides, aujourd'hui absents du net worth)
- `00057` Sankey — devient un vrai flux, avec destinations d'épargne nommées
- `00059` import CSV — a besoin d'un **compte cible** (dépend de T1+T2)

Aujourd'hui les transactions pendent directement du `household` et n'ont aucune notion de compte. Le cas central d'un couple — *salaire → compte commun → répartition vers comptes perso*, ou l'inverse — n'a donc nulle part où exister.

## Rappel de scope : « foyer » ≠ feature de partage

`household` est l'unité de scope **toujours présente** (1 foyer = 1 user par défaut, créé au signup). Ce n'est pas la feature de partage `00013`. Toute cette feature fonctionne identiquement pour un utilisateur solo ; le partage n'entre en jeu qu'à T4 (visibilité) combiné à `00013`.

---

## Décision fondatrice : deux concepts, deux tables, jamais fusionnés

Le mot « compte » est revendiqué par deux notions aux **modèles de solde incompatibles** :

| | **Comptes** (nouveau, `accounts`) | **Patrimoine** (existant, `savings_accounts`) |
|---|---|---|
| Nature | Conteneurs de flux (le cash transite) | Actifs / valeurs détenues |
| Exemples | Compte commun, Revolut Max, Livret (cash) | PEA, Assurance vie, Crypto, Livret A |
| Solde | **Calculé** = `initial_balance + Σ txns ± transferts` | **Manuel + snapshots** (l'utilisateur saisit « PEA = 8 200 € ») |
| Transactions ? | Oui, les txns y vivent | Non — valeur saisie à la main |

On **ne fusionne pas** `savings_accounts` dans `accounts` : on ne peut pas plier un PEA valorisé par snapshot (qui intègre déjà les gains de marché) dans un solde dérivé de transactions sans forcer la saisie de fausses txns. L'ancien « Increment 4 — unification net worth » est **supprimé**.

### Surface unique, deux onglets

Une seule page (l'actuelle `/assets`) avec **deux onglets** : `Comptes` | `Patrimoine`. Le **net worth combiné** (Σ comptes + Σ patrimoine) s'affiche dans l'en-tête, au-dessus des onglets, et reste visible quel que soit l'onglet. Cela corrige une omission actuelle : **aujourd'hui le cash des comptes courants n'entre pas du tout dans le net worth**, seuls les placements comptent.

Le CRUD des comptes réutilise le pattern existant (`AccountSheet` / `account-form`). La modale d'ajout de transaction reçoit un sélecteur **listant uniquement les comptes** (pas le patrimoine), pré-rempli sur le compte principal.

---

## Cas d'usage cibles

Le modèle de transfert est **symétrique** (`from` / `to`, sans direction privilégiée) :

| Salaire sur le commun | Salaire sur le perso |
|---|---|
| `income` sur Compte commun | `income` sur Perso Max |
| transfert commun → perso | transfert perso → commun |

Et surtout, un transfert peut **traverser vers le patrimoine** : `Compte commun → PEA` (contribution d'épargne), `PEA → Compte commun` (retrait).

---

## Modèle de données cible

```
accounts                              -- "Comptes" : conteneurs de flux
  id              uuid pk
  household_id    uuid not null → households
  owner_id        uuid null → users          -- null = compte du foyer
  name            text not null              -- "Compte commun", "Revolut Max"
  type            text not null              -- checking | savings | cash
  visibility      text not null default 'shared'  -- shared | private
  initial_balance numeric(14,2) not null default 0
  archived_at     timestamptz null
  created_at / updated_at

transactions  (+ 1 colonne)
  account_id   uuid → accounts   -- nullable en T1, NOT NULL en fin de T1

transfers
  id            uuid pk
  household_id  uuid not null → households
  from_kind     text not null check (from_kind in ('compte','patrimoine'))
  from_id       uuid not null    -- → accounts OU savings_accounts selon from_kind
  to_kind       text not null check (to_kind in ('compte','patrimoine'))
  to_id         uuid not null
  amount        numeric(12,2) not null check (amount > 0)
  date          date not null
  note          text
  created_by    uuid not null → users
  -- contrainte : au moins une jambe doit être un compte
  check (from_kind = 'compte' or to_kind = 'compte')
```

**Endpoints polymorphes** (`{kind, id}`) : une jambe peut être un compte *ou* un actif patrimoine.

Solde d'un compte = `initial_balance + Σ income − Σ expense + Σ transfer-in − Σ transfer-out`. **Calculé, jamais stocké.**

### Effet d'un transfert sur les soldes

- **Jambe compte** → effet réel sur le solde calculé (débit / crédit).
- **Jambe patrimoine** → **aucun effet programmatique** sur la valeur de l'actif (elle reste manuelle/snapshot). Le transfert est seulement enregistré pour l'historique et le flux. Évite le double-comptage avec les gains de marché que l'utilisateur saisit déjà.

### Directions autorisées

| | autorisé |
|---|---|
| compte → compte | ✓ (cas couple) |
| compte → patrimoine | ✓ (contribution d'épargne) |
| patrimoine → compte | ✓ (retrait) |
| patrimoine → patrimoine | ✗ (pur réagencement de net worth → snapshots) |

Garanti par la contrainte « au moins une jambe = compte ».

---

## Visibilité : code applicatif, PAS RLS

⚠️ **Le backend utilise la clé `service_role`** (`core/supabase.py`) qui **bypasse toute RLS**. Le scope se fait à la main en code (`.eq("household_id", …)`). Les policies RLS des migrations sont du code mort sur le chemin de données.

Donc la confidentialité `private` **ne peut pas** être appliquée par une policy. Elle s'implémente via un **helper applicatif central** :

```python
visible_account_ids(user)  # comptes du foyer dont visibility='shared' OU owner_id=user
```

Toute lecture sensible aux comptes (liste de txns, summary, sankey, goals, budgets, calcul de solde, historique de transferts) passe par ce helper.

**Stratégie :** le helper est introduit **dès T1** comme **no-op** (tous les comptes sont `shared` → équivaut au scope foyer actuel). T4 ne fait que **basculer le comportement** (exclure les comptes privés des autres) en un seul point de code, au lieu de retrofiter un `WHERE` dans six endpoints (risque de fuite si on en oublie un).

---

## Décomposition en tâches

Cinq tâches, chacune *shippable* indépendamment. Ordre : **T1 → T2 → T3 → T4 → T5**, puis `00059` (import).

### T1 — `accounts` socle (données) — *invisible, isole la migration risquée*

**Scope**
- Migration : table `accounts` (+ `visibility` default `shared`, `initial_balance`) + RLS de forme (cohérence, même si bypassée).
- `transactions.account_id` **nullable** → **migration de données** : pour chaque `household`, créer un compte `"Compte principal"` (`visibility='shared'`, `owner_id=null`) et y rattacher toutes ses txns → passer `account_id` en **NOT NULL**.
- Helper `visible_account_ids(user)` en **no-op**.
- POST `/transactions` : `account_id` par défaut = compte principal du foyer si omis (pas d'UI requise).

**Critères de validation**
- [ ] Migration : chaque foyer a 1 compte « Compte principal », toutes ses txns y sont rattachées
- [ ] `account_id` est NOT NULL après migration ; un POST sans `account_id` tombe sur le principal
- [ ] Comportement de lecture identique à avant (helper no-op)

### T2 — Comptes CRUD + onglet — *les utilisateurs obtiennent le multi-compte*

**Scope**
- Backend : `GET/POST/PATCH/DELETE /accounts` avec **solde calculé** (via le helper).
- Frontend : onglet `Comptes` sur la page assets (réutilise `AccountSheet`/`account-form`) ; net worth combiné dans l'en-tête (les comptes comptent dans le total **courant**).
- Modale d'ajout : sélecteur de compte (pré-rempli sur le principal).

**Critères de validation**
- [ ] POST crée un compte ; GET retourne le solde = `initial_balance` + txns
- [ ] Une txn créée avec `account_id` apparaît dans le solde du bon compte
- [ ] L'en-tête net worth = Σ comptes + Σ patrimoine
- [ ] Foyer B ne voit pas les comptes du foyer A

### T3 — Transferts — *le cœur du cas couple + contributions d'épargne*

**Scope**
- Migration : table `transfers` (endpoints polymorphes, contrainte « ≥1 jambe compte »).
- Backend : `POST /transfers` + `DELETE /transfers/{id}` ; calcul de solde des comptes intègre les jambes de transfert.
- **Correctness analytics uniquement** : `summary`, goals, budgets **ignorent** les transferts (ni revenu ni dépense — les totaux income/expense/net restent inchangés). *La richesse d'affichage est en T5.*
- Frontend : mode « Transfert » dans la modale (toggle, comme « Récurrent ») → from / to (compte ou patrimoine) / montant / date, validant « ≥1 compte ».

**Critères de validation**
- [ ] Un transfert commun → perso baisse le solde commun et monte le perso
- [ ] Un transfert perso → commun fait l'inverse (modèle symétrique)
- [ ] Un transfert commun → PEA baisse le solde commun ; la valeur du PEA reste inchangée
- [ ] La modale refuse un transfert patrimoine → patrimoine
- [ ] Le transfert n'apparaît **pas** dans les revenus/dépenses du `summary` (totaux inchangés)
- [ ] Supprimer un transfert annule les effets de solde

### T4 — Visibilité privée — *la confidentialité*

**Scope**
- Basculer le helper : exclut les comptes `private` dont `owner_id ≠ user`.
- Frontend : toggle « Compte perso (privé) » à la création.
- **Règle d'affichage des transferts traversant privé ↔ partagé** (décision (b), ci-dessous).

**Critères de validation**
- [ ] Un compte `private` n'est visible que par son `owner_id`
- [ ] Les txns d'un compte privé n'apparaissent pas pour l'autre membre (ni dans summary/sankey)
- [ ] Un compte `shared` reste visible des deux membres
- [ ] Transfert Revolut(privé Max) → Commun(partagé) : le partenaire voit « Transfert depuis un compte de Max » (nom du compte masqué) ; Max voit les deux jambes
- [ ] Pleinement testable une fois `00013` livré, mais correct dès un foyer de 1

### T5 — Net worth + enrichissement Sankey (plus tard) — *toute la richesse analytics*

> Plus gros que l'ancien one-liner « Sankey enrichi » : c'est le foyer de toutes les décisions analytics ci-dessous.
>
> **Décomposé en 3 sous-tickets shippables** (ordre `00064 → 00065 → 00066`) :
> - `00064-comptes-sankey-epargne` (T5a) — décomposition du nœud épargne + source « Solde antérieur ». Aucune décision ouverte.
> - `00065-comptes-networth-backfill` (T5b) — back-fill historique net worth (sparkline). *Décision ouverte : stratégie de back-fill.*
> - `00066-comptes-filtre-analyse` (T5c) — filtre par compte sur Analyse. *Décision ouverte : UX du sélecteur + transferts inter-comptes.*
>
> **T4 (visibilité privée) est différé** : non testable tant que `00013` (foyer à 2) n'est pas livré ; T5 passe devant.

**Scope**
- **Décomposition du nœud « épargne »** du Sankey par destination patrimoine (voir section Analytics).
- Source synthétique **« Solde antérieur »** quand les contributions dépassent le net.
- **Back-fill** des comptes dans l'historique net worth (sparkline) — calcul du solde de chaque compte *à une date passée* depuis les txns.
- Filtre optionnel par compte sur la page Analyse.

**Critères de validation**
- [ ] Un transfert commun → PEA apparaît comme nœud d'épargne nommé « Épargne PEA » dans le Sankey
- [ ] Les transferts commun → perso n'apparaissent pas (internes)
- [ ] Quand contributions > net, une source « Solde antérieur » équilibre le diagramme
- [ ] La sparkline net worth inclut l'historique des soldes de comptes

---

## Analytics : règles détaillées

Issu de la 2ᵉ session. Distinction clé : un transfert **compte → patrimoine** quitte le pool de dépense vers l'épargne ; un transfert **compte → compte** reste interne.

| Surface | Règle |
|---|---|
| **Totaux summary** (income / expense / net / savings_rate) | Les transferts ne sont **jamais** comptés. Les 500 € vers le PEA étaient déjà dans `net` (argent non dépensé) → totaux **inchangés**. *(T3)* |
| **Sankey** | Le nœud « reste/épargne » abstrait se **décompose par destination** : chaque transfert `compte → patrimoine` du mois = un flux d'épargne nommé (Épargne PEA +500, Livret +200), le reste = « Resté liquide ». `compte → compte` reste **invisible** (interne). *(T5)* |
| **Périmètre** | **Combiné** sur tous les comptes *visibles* (scopé par utilisateur via le helper). Le patrimoine n'est jamais dans le périmètre income/expense — seulement comme destination d'épargne. Filtre par compte optionnel plus tard ; scoper à un seul compte rend les transferts inter-comptes visibles comme flux. *(T5)* |
| **Drawdown** | Quand les contributions patrimoine > net (financées en partie sur le solde existant), ajouter une source synthétique **« Solde antérieur »** côté revenus pour équilibrer le Sankey (nécessite que `sankey.ts` accepte un nœud income synthétique). *(T5)* |
| **Goals / budgets** | Excluent les transferts (orientés dépense). *(T3)* |

Exemple (income 1000, expense 800, transfert 500 → PEA) :

```
Salaire        1000 ─┬─> Loyer        800
Solde antérieur 300 ─┘   Épargne PEA   500
(deux côtés = 1300, équilibré)
```

---

## Dépendances

- `00059` import CSV : nécessite **T1 + T2** (un compte cible).
- `00013` foyer à 2 : rend **T4** pleinement testable.
- `00057` Sankey (déjà livré) : **T3** doit l'éditer pour exclure les transferts des income/expense ; **T5** l'enrichit (destinations d'épargne, source synthétique).

---

## Décisions tranchées

1. **Deux concepts, deux tables, jamais fusionnés** — comptes (solde calculé) vs patrimoine (manuel/snapshot). L'ancien Inc.4 « migrate savings_accounts → accounts » est supprimé.
2. **Surface unifiée, deux onglets** (`Comptes` | `Patrimoine`), net worth combiné dans l'en-tête.
3. **Transfert = 1 row, endpoints polymorphes** `{kind, id}`, contrainte « ≥1 jambe compte ». Pas 2 transactions liées (évite le double-comptage à filtrer partout).
4. **Jambe patrimoine d'un transfert** : débite seulement le compte ; la valeur de l'actif reste manuelle.
5. **Directions** : compte↔compte, compte↔patrimoine ; patrimoine↔patrimoine interdit.
6. **Visibilité en code applicatif** via `visible_account_ids()`, no-op dès T1, bascule en T4. Pas de RLS (service role).
7. **Transfert traversant privé → partagé** : option **(b)** « Transfert depuis un compte de Max » — propriétaire révélé, nom du compte masqué. L'auteur voit toujours les deux jambes.
8. **Transferts dans analytics** : exclus des totaux ; `compte → patrimoine` affiché comme destination d'épargne nommée dans le Sankey ; `compte → compte` invisible.
9. **Périmètre Analyse** : combiné sur tous les comptes visibles par défaut ; filtre par compte optionnel (T5).
10. **Drawdown Sankey** : source synthétique « Solde antérieur » quand contributions > net.

## Décisions ouvertes

- **Filtre par compte sur Analyse (T5)** — confirmer l'UX du sélecteur et le comportement « transferts inter-comptes deviennent visibles quand on scope à un compte ».
- **Back-fill historique net worth (T5)** — coût de recalcul des soldes de comptes à des dates passées ; stratégie (à la volée vs snapshots de comptes).
