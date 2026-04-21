---
feature: 00011-suivi-epargne-par-poste
depends_on: 00046
---

# Assets — Gestion des comptes

## Objectif
Permettre à l'utilisateur de créer, modifier et supprimer un compte d'épargne, et de mettre à jour son solde — sur données mockées.

## Périmètre

### Modal création / édition
- Champs : nom, type (liste complète des types), institution (optionnel), solde actuel
- Validation : nom requis, solde ≥ 0
- Bouton "Ajouter un compte" sur la page assets

### Mise à jour du solde
- Bouton ou action sur chaque compte pour mettre à jour le solde
- Champ montant + confirmation

### Suppression
- Action de suppression avec confirmation

### État
- État local React (pas d'appel API) — les données mockées du 00046 deviennent un état mutable

## Critères de validation
- [ ] On peut créer un compte, il apparaît dans la liste
- [ ] On peut modifier le nom, le type, l'institution d'un compte
- [ ] On peut mettre à jour le solde d'un compte
- [ ] On peut supprimer un compte avec confirmation
- [ ] Le total net worth se recalcule après chaque action
- [ ] Responsive desktop + mobile
- [ ] `just check` passe
