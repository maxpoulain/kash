---
feature: dashboard-transactions-redesign
---

# Dashboard / Transactions page redesign

## Objectif

Refondre la page Dashboard (qui est en réalité la page Transactions) pour qu'elle corresponde au design system — desktop et mobile — en s'appuyant sur les mockups `docs/Design-System-reference/mockups/desktop-transactions.html`.

## Périmètre

**Desktop (`lg:` breakpoint)**
- Titre de page "Transactions" avec sous-titre (nombre de transactions du mois, nb non catégorisées)
- Ligne de filtres : pills type (Tout, Dépenses, Revenus, Virements, Remboursements) + bouton Filtres + bouton Export
- En-têtes de colonnes : Date · Marchand · Catégorie · Jar · Montant
- Lignes de tableau : icône catégorie, date + heure, marchand, badge catégorie, badge jar, montant mono avec couleur (dépense = foreground, revenu = success)
- Bouton "+ Ajouter" dans le topbar (header de la DesktopShell)

**Mobile**
- Header compact : titre + mois navigable (← mois →)
- Résumé mensuel en 2 cards (Dépenses / Revenus) — existant à conserver
- Liste de transactions groupées par date (section sticky "Aujourd'hui", "Hier", "12 avr." …)
- Chaque item : icône catégorie à gauche, marchand + catégorie + heure au centre, montant à droite
- FAB "+" en bas à droite pour ajouter une transaction (ouvre la TransactionSheet existante)
- Supprimer le hero card "Piggy total" (remplacé par le résumé mensuel)

**Hors périmètre**
- Fonctionnalité Export (bouton présent, disabled)
- Filtres avancés (bouton présent, disabled)
- Pagination / infinite scroll

## Critères de validation

- [ ] La page desktop affiche la grille avec colonnes Date / Marchand / Catégorie / Jar / Montant
- [ ] Les filtres de type (pills) filtrent correctement la liste
- [ ] La page mobile groupe les transactions par date
- [ ] Le hero "Piggy" a été retiré sur mobile
- [ ] Le FAB "+" ouvre bien la `TransactionSheet` existante
- [ ] `just check` passe (lint + typecheck + tests)
- [ ] Testé visuellement dans le navigateur sur viewport mobile et desktop
