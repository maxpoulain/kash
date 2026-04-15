---
feature: 00010-saisie-manuelle-transactions
depends_on: 00031
---

# Transactions History Frontend

## Objectif

Afficher la liste des transactions filtrée par mois avec la possibilité de naviguer entre les mois.

## Périmètre

- Composant `TransactionList` affichant les transactions du mois courant
- Navigation mois précédent / mois suivant
- Affichage par transaction : montant, catégorie (icone + nom), date, note
- Distinction visuelle dépense (primary) / revenu (accent)
- Résumé en haut : total dépenses, total revenus du mois
- Intégration dans la page principale (home ou dashboard)
- Chargement des transactions via `GET /transactions?month=YYYY-MM`

## Critères de validation

- [ ] La liste affiche les transactions du mois courant au chargement
- [ ] Navigation mois précédent / suivant fonctionne
- [ ] Les dépenses et revenus sont visuellement distincts
- [ ] Le résumé mensuel (total dépenses / revenus) est affiché
- [ ] La catégorie est affichée avec son icône et son nom
- [ ] Ajout d'une nouvelle transaction via le form rafraîchit la liste
- [ ] Tests écrits et passants (`just check` passe)
