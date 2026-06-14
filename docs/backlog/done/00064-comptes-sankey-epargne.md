---
---

# Sankey enrichi — destinations d'épargne (T5a de 00058)

> Premier sous-ticket du découpage de **T5** (épopée `00058-comptes-multiples`).
> Aucune décision ouverte : les règles sont déjà tranchées (décisions 8 & 10 du feature).

## Objectif

Le Sankey ment aujourd'hui sur l'épargne : le « reste » est un nœud abstrait. Le décomposer
par **destination patrimoine** à partir des transferts `compte → patrimoine` du mois, et ajouter
une source synthétique **« Solde antérieur »** quand les contributions dépassent le net.

## Périmètre

- **Décomposition du nœud épargne** : chaque transfert `compte → patrimoine` du mois devient un
  flux d'épargne nommé (« Épargne PEA » +500, « Livret » +200). Le reste = « Resté liquide ».
- **Transferts `compte → compte` invisibles** (internes — ni revenu ni dépense, déjà exclus en T3).
- **Drawdown** : quand `Σ contributions patrimoine > net`, ajouter une source income synthétique
  **« Solde antérieur »** pour équilibrer le diagramme (`sankey.ts` doit accepter un nœud income synthétique).
- Périmètre **combiné** sur tous les comptes *visibles* (helper `visible_account_ids`).

## Critères de validation

- [x] Un transfert commun → PEA apparaît comme nœud d'épargne nommé « Épargne PEA » dans le Sankey
- [x] Les transferts commun → perso (`compte → compte`) n'apparaissent **pas** (internes)
- [x] Quand contributions > net, une source « Solde antérieur » équilibre le diagramme
- [x] Les totaux income/expense/net du summary restent **inchangés** (régression T3)

> Vérifié : tests automatisés (back + front) verts + vérif visuelle navigateur sur la page Analyse (scénarios PEA, exclusion perso, drawdown « Solde antérieur »).

## Hors scope (autres sous-tickets de T5)

- Back-fill historique net worth / sparkline → `00065`
- Filtre par compte sur la page Analyse → `00066`

---

## Implementation Plan

### Modèle mental & maths

Les transferts ne touchent jamais `transactions` → totaux `income/expense/net` déjà inchangés (acquis T3). On **enrichit seulement le Sankey**, sans toucher aux totaux.

Soit `D = Σ` des transferts `courant → epargne` du mois (contributions d'épargne, scopés aux comptes visibles), `net = income − expense`.

- **Côté sortie (droite)** : dépenses + un nœud nommé par destination patrimoine (somme par `to_id`) + **« Resté liquide » = max(net − D, 0)**.
- **Côté entrée (gauche)** : revenus + **« Solde antérieur » = max(D − net, 0)** (source synthétique, drawdown).

Vérif d'équilibre : si `D ≤ net` → droite = `expense + D + (net−D) = income`, gauche = `income` ✓. Si `D > net` → droite = `expense + D`, gauche = `income + (D−net) = expense + D` ✓.

`courant → courant` (interne) et `epargne → courant` (retrait) sont **exclus** de `D`.

### Phase 1 — Backend : exposer les destinations d'épargne

`GET /api/summary` renvoie un nouveau champ `savings_destinations`.

- `backend/app/schemas/summary.py` : ajouter `class SavingsDestination(account_id: UUID, name: str|None, amount: float)` + `savings_destinations: list[SavingsDestination]` sur `SummaryOut`.
- `backend/app/routers/summary.py` : après l'agrégation txns, requêter `transfers` du mois où `from_kind='courant'` ET `to_kind='epargne'` ET `from_id in visible account_ids` ET `date ∈ [start, end)`. Grouper par `to_id`, sommer `amount`. Résoudre les noms via `savings_accounts` (select `id,name` sur les `to_id`). Trier desc. Totaux/net **inchangés**.

**Tests backend** (`backend/tests/test_summary.py`, étendre le mock pour la requête `transfers` + `savings_accounts`) :
- [ ] `courant → epargne` du mois → apparaît dans `savings_destinations` avec le nom du patrimoine et le montant sommé (2 transferts vers le même PEA → 1 entrée cumulée)
- [ ] `courant → courant` **exclu** de `savings_destinations`
- [ ] `epargne → courant` (retrait) **exclu**
- [ ] transfert hors du mois **exclu**
- [ ] transfert depuis un compte non visible **exclu** (scope helper)
- [ ] régression : `total_income/total_expense/net` **inchangés** en présence de transferts

### Phase 2 — Sankey : plusieurs nœuds d'épargne (géométrie pure)

Généraliser `computeSankeyLayout` pour accepter plusieurs nœuds de sortie « épargne ».

- `frontend/lib/sankey.ts` : remplacer `savings: number` + `savingsColor`/`savingsLabel` par `savings: SankeyItem[]` (liste de nœuds de sortie déjà nommés/colorés par l'appelant). Le marquage `side: "savings"` se fait sur ces items. Le reste de la géométrie est inchangé.
- `frontend/components/analyse/sankey-flow.tsx` : adapter les props (`savings: SankeyItem[]`).

**Tests** (`frontend/__tests__/sankey.test.ts`) :
- [ ] plusieurs items `savings` → plusieurs nœuds `side: "savings"` empilés à droite, sous les dépenses
- [ ] `savings` vide → aucun nœud savings (cas déficit)
- [ ] régression layout existant (un seul item) inchangé

### Phase 3 — Analyse client : construire les nœuds + source synthétique

- `frontend/types/api.ts` : ajouter `savings_destinations` au type `Summary`.
- `frontend/app/[locale]/analyse/analyse-client.tsx` : extraire un helper pur `buildFlowNodes(summary)` →
  - `income[]` = revenus + (`D > net` ? nœud « Solde antérieur » = `D − net`)
  - `savings[]` = un nœud par destination + (`net > D` ? nœud « Resté liquide » = `net − D`)
  - cas sans transfert (`D = 0`) : `savings = [{ Épargne, net }]` si `net > 0` → **comportement actuel préservé** (label « Épargne »).
- `frontend/messages/{fr,en}.json` : `analyse.flowRemainedLiquid` (« Resté liquide ») + `analyse.flowPriorBalance` (« Solde antérieur »).

**Tests** (`frontend/__tests__/`, unit sur `buildFlowNodes`) :
- [ ] `D ≤ net` → « Resté liquide » = `net − D`, pas de « Solde antérieur »
- [ ] `D > net` → « Solde antérieur » = `D − net` côté income, pas de « Resté liquide »
- [ ] `D = 0`, `net > 0` → un seul nœud « Épargne » = net (régression)
- [ ] `D = 0`, `net ≤ 0` → aucun nœud savings

### Vérif finale

- `just check` vert (back + front)
- Vérif manuelle sur Analyse : créer un transfert commun → PEA, voir « Épargne PEA » nommé ; commun → perso reste invisible.
