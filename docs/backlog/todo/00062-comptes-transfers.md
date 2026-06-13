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
