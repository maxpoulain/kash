# Taux d'épargne mensuel — indicateur clé du foyer

**Source:** [Linear PER-14](https://linear.app/personal-max-and-maria/issue/PER-14/taux-depargne-mensuel-indicateur-cle-du-foyer)

**Priority:** Medium

## Description

Afficher le taux d'épargne mensuel du foyer comme indicateur clé de santé financière.

## Calcul

Taux d'épargne = (Revenus − Dépenses) / Revenus × 100

## Fonctionnement attendu

- Indicateur affiché en gros sur le dashboard ou la page récap
- Comparaison vs l'objectif de taux d'épargne défini par le foyer
- Historique du taux mois par mois (sparkline ou courbe)
- Code couleur : vert si au-dessus de l'objectif, orange si en dessous

## Critères d'acceptance

- [ ] Calcul correct et automatique
- [ ] Objectif paramétrable (défaut: 20%)
- [ ] Historique visible sur 12 mois
- [ ] Affichage immédiat après saisie de transaction
