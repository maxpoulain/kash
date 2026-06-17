---
related: 00058-comptes-multiples
---

# Éditer / supprimer une transaction (et transferts)

## Objectif

Permettre de **modifier** ou **supprimer** une entrée de la liste depuis l'UI, de
façon **unifiée** pour les **transactions** (dépense/revenu) **et les transferts**.
Aujourd'hui on ne peut que créer ; aucune action d'édition/suppression n'existe
côté liste.

> Contexte : on a volontairement retiré la suppression de transfert ajoutée en
> T3 (00062) pour la traiter ici de façon cohérente avec les transactions.

## Périmètre

**Frontend (le gros du travail)**
- Sur chaque ligne de la liste (transaction **et** transfert) : action éditer +
  supprimer (clic sur la ligne ou menu/actions).
- **Édition transaction** : montant, type, catégorie, compte, date, note
  (réutilise la modale d'ajout en mode édition).
- **Suppression** : confirmation (composant `Button` DS, façon popover/dialog) →
  recalcul des soldes.
- **Transfert** : suppression (et édition optionnelle). Mêmes affordances que les
  transactions.

**Backend (vérifier l'existant)**
- `PUT/DELETE /api/transactions/{id}` existent déjà (00010).
- `DELETE /api/transfers/{id}` existe déjà (00062). Édition transfert =
  `PATCH`/`PUT` à ajouter si on veut l'édition.

## Critères de validation

- [ ] Éditer une transaction met à jour montant/catégorie/compte/date/note dans la liste
- [ ] Supprimer une transaction la retire et recalcule le solde du compte concerné
- [ ] Supprimer un transfert le retire et recalcule les soldes des comptes courants
- [ ] Confirmation avant toute suppression (composant DS)
- [ ] Affordances cohérentes entre transactions et transferts
- [ ] Foyer B ne peut éditer/supprimer ni les transactions ni les transferts du foyer A
- [ ] Tests écrits et passants (`just check` passe)

## Décisions

- **Édition transfert : complète** → ajouter `PATCH /api/transfers/{id}` backend +
  réutiliser la modale en mode édition.
- **Affordance : menu d'actions (⋮) par ligne** avec Éditer / Supprimer (explicite,
  pas de clic accidentel), cohérent transactions et transferts.
