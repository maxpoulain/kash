---
feature: 00011-suivi-epargne-par-poste
---

# Assets Page — View

## Objectif
Créer la page `/assets` desktop et mobile avec données mockées : hero net worth, sparkline, et grille des comptes d'épargne.

## Périmètre

### Desktop
- Hero card : total net worth + badge delta 30j + sparkline
- Card "Allocation" : breakdown par type (Livret A, LEP, PEL, etc.) en barres de progression
- Table des comptes : icône colorée, nom du compte, type, solde (rouge si négatif)

### Mobile
- Header "Net worth" avec total en grand + badge delta 30j
- Sparkline dans une card
- Grille 2 colonnes de cards par compte (icône, nom, type, solde)

### Données
- Données mockées en dur (pas d'appel API)
- Pas de numéros de compte (saisie manuelle, pas de connexion bancaire)
- Types : Livret A, LEP, CEL, PEL, Fonds euros, Autre

### Navigation
- Ajout de l'entrée "Assets" dans la nav

## Critères de validation
- [ ] Page `/assets` accessible et fidèle aux maquettes desktop et mobile
- [ ] Responsive desktop + mobile
- [ ] Pas de numéros de compte affichés
- [ ] `just check` passe
