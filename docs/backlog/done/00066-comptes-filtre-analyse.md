---
---

# Filtre par compte sur la page Analyse (T5c de 00058)

> Troisième sous-ticket du découpage de **T5** (épopée `00058-comptes-multiples`).
> ⚠️ **Décision ouverte à trancher avant de coder** : UX du sélecteur + comportement des transferts inter-comptes.

## Objectif

Permettre de scoper la page Analyse à un compte donné (par défaut : combiné sur tous les comptes
visibles). Scoper à un seul compte rend les transferts inter-comptes **visibles** comme flux
(ils ne sont plus internes au périmètre).

## Décision ouverte

- **UX du sélecteur** (emplacement, « Tous les comptes » par défaut, persistance).
- **Comportement transferts inter-comptes** quand on scope à un compte : un `compte A → compte B`
  devient un flux sortant/entrant visible sur le diagramme du compte concerné.

## Périmètre

- Sélecteur de compte sur la page Analyse, défaut = combiné (tous comptes visibles).
- Recalcul summary / Sankey scopé au compte sélectionné.
- Quand scopé : les transferts `compte ↔ compte` impliquant ce compte deviennent des flux visibles.

## Critères de validation

- [x] Par défaut, Analyse = combiné sur tous les comptes visibles (comportement actuel inchangé) — vérifié : `account_transfers == []`
- [x] Scoper sur un compte filtre summary + Sankey à ce compte — vérifié live (Perso : dépenses 111,08 vs 1199 combiné)
- [x] Un transfert commun → perso apparaît comme flux quand on scope — vérifié : « Vers Compte principal 100 € » / « Depuis Perso 100 € »
- [x] Un compte privé d'un autre membre n'est pas sélectionnable — le sélecteur liste `getAccounts` (passe par `visible_account_ids`) ; pleinement testable avec `00013`

> Vérifié : tests back (scoping + `_account_transfers`) + front (`buildFlowNodes` généralisé) + vérif visuelle navigateur (scope Perso → Sankey « Vers Compte principal » + « Solde antérieur », équilibré).

## Hors scope

- Décomposition Sankey épargne → `00064`
- Back-fill historique net worth → `00065`

---

## Implementation Plan

### Décisions ouvertes tranchées

1. **Sélecteur UX** : dropdown sur Analyse à côté du `MonthSwitcher`. Défaut **« Tous les comptes »**. Options = comptes visibles **non archivés**. État local React (pas de persistance URL/localStorage pour le MVP).
2. **Totaux jamais affectés par les transferts** : `total_income / total_expense / net / savings_rate` = txns pures du périmètre. Le scope filtre seulement *quel* compte. (Cohérent avec `00064`.)
3. **Transferts comme flux — uniquement en vue scopée** : combiné = aucun flux transfert (interne, inchangé). Scopé sur un compte = les transferts touchant ce compte deviennent des flux Sankey nommés (« Depuis X » en entrée, « Vers X » en sortie). `courant→epargne` reste « Épargne X » (déjà géré par `00064`).
4. **Équilibrage Sankey généralisé** : `reste = net + Σ entrées_transfert − Σ destinations_épargne − Σ sorties_transfert`. `reste > 0` → « Resté liquide » ; `reste < 0` → « Solde antérieur » (= −reste) côté revenus. (Généralise la formule de `00064` où Σentrées = Σsorties = 0.)

### Maths (vue scopée sur un compte A)

- Côté revenus : `income (txns de A)` + chaque **transfert entrant** vers A (« Depuis B », depuis un courant ou epargne) + éventuel « Solde antérieur ».
- Côté sortie : `dépenses (txns de A)` + chaque **destination épargne** (`A → epargne`) + chaque **transfert sortant** (`A → autre courant`, « Vers B ») + éventuel « Resté liquide ».
- Équilibre : gauche = `income + Σin (+prior)` ; droite = `expense + Σdest + Σout (+liquide)`. Avec `reste = net + Σin − Σdest − Σout`, les deux côtés s'égalisent.

### Phase 1 — Backend

- `routers/summary.py` : nouveau query param `account_id: str | None`.
  - Scope : `account_ids = [account_id]` si fourni **et** présent dans `visible_account_ids`, sinon tous les visibles. Si fourni mais non visible → 404.
  - `savings_destinations` (déjà là) suit le scope (devient « épargne depuis A »).
- `schemas/summary.py` : ajouter `AccountTransferFlow {direction: 'in'|'out', counterpart_name: str|None, amount: float}` + `account_transfers: list[AccountTransferFlow]` sur `SummaryOut` (vide si pas de scope).
- Quand `account_id` scopé : requêter les transferts du mois touchant A :
  - **out** : `from_id = A`, `to_kind = courant` (vers un autre compte) → nom = compte cible.
  - **in** : `to_id = A` (depuis un `courant` *ou* `epargne`) → nom = source.
  - (`from_id = A, to_kind = epargne` est déjà dans `savings_destinations`, pas redoublé ici.)
  - Résoudre les noms via `accounts` / `savings_accounts`.

**Tests backend** (`test_summary.py`) :
- [ ] `account_id` scope les totaux à ce compte (txns d'un autre compte exclues)
- [ ] sans `account_id` → `account_transfers == []` (combiné inchangé)
- [ ] scopé : transfert `A → B` (courant) → `account_transfers` out « B » ; `B → A` → in « B »
- [ ] scopé : `A → PEA` apparaît dans `savings_destinations`, **pas** dans `account_transfers`
- [ ] `account_id` non visible → 404

### Phase 2 — Frontend

- `types/api.ts` : `AccountTransferFlow` + `account_transfers` sur `Summary`.
- `lib/api.ts` : `getSummary(month?, accountId?)`.
- `lib/analyse-flow.ts` : étendre `buildFlowNodes` avec `transfersIn` / `transfersOut` → ajoute les sources/sorties et applique l'équilibrage généralisé.
- `analyse-client.tsx` : sélecteur de compte (charge `getAccounts`), défaut « Tous les comptes », passe `accountId` à `getSummary`, reconstruit les flux.
- i18n : `analyse.allAccounts` (« Tous les comptes »), `analyse.flowTransferFrom` (« Depuis {name} »), `analyse.flowTransferTo` (« Vers {name} »).

**Tests** (`analyse-flow.test.ts`) :
- [ ] `transfersIn`/`transfersOut` → nœuds source/sortie nommés + équilibrage (`reste = net + Σin − Σdest − Σout`)
- [ ] sans transferts → comportement `00064` inchangé (régression)

### Phase 3 — Vérif

- `just check` vert + vérif visuelle : sélectionner « Compte principal » filtre les totaux ; un transfert commun→perso apparaît comme flux « Vers/Depuis ».
