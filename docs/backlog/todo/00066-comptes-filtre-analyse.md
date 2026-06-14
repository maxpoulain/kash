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

- [ ] Par défaut, Analyse = combiné sur tous les comptes visibles (comportement actuel inchangé)
- [ ] Scoper sur « Compte commun » filtre summary + Sankey à ce compte
- [ ] Un transfert commun → perso apparaît comme flux quand on scope sur l'un des deux comptes
- [ ] Un compte privé d'un autre membre n'est pas sélectionnable (helper visibilité)

## Hors scope

- Décomposition Sankey épargne → `00064`
- Back-fill historique net worth → `00065`
