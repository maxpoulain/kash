---
---

# Cadrage : que doit vraiment mesurer « l'épargne » sur Analyse ?

> **Ticket de décision / cadrage** (pas encore prêt à coder). À trancher avant d'implémenter quoi que ce soit.
> Issu d'une question soulevée pendant `00064` : « on considère que tout ce qui n'est pas une dépense, c'est du saving ? »

## Le problème

Aujourd'hui, sur la page Analyse, **« Épargne » = `revenus − dépenses`** (le `net`), et **« Taux d'épargne » = `net / revenus`** (`backend/app/routers/summary.py`).

Cette définition comptable classique (« épargne = revenu non consommé ») **conflate deux choses différentes** :
- de l'argent **réellement placé** (transfert `courant → epargne`, ex. vers un PEA)
- de l'argent **juste pas encore dépensé**, resté liquide sur le compte courant

## L'incohérence introduite par 00064

`00064` a décomposé le **Sankey** : la part transférée vers le patrimoine devient « Épargne PEA », le reste devient « Resté liquide » (`net − Σ contributions`). Mais **les KPI n'ont pas bougé** : la carte « Épargne » affiche toujours le `net` brut.

Résultat, sur le même écran le mot « Épargne » désigne deux choses :
- KPI **« Épargne » = 1 322,62 €** (tout le non-dépensé)
- Sankey : **« Épargne PEA » 500 €** + **« Resté liquide » 822,62 €**

## Questions à trancher

- Le **« Taux d'épargne »** doit-il rester `net / revenus`, ou devenir `Σ contributions patrimoine / revenus` (= taux d'épargne « réel », ce qui part effectivement se placer) ?
- Faut-il **renommer** le KPI brut (« Épargne » → « Reste » / « Non dépensé ») pour lever l'ambiguïté avec le Sankey ?
- Veut-on **deux métriques** distinctes (ex. « Reste à vivre » vs « Effort d'épargne ») plutôt qu'une seule ?
- Cohérence avec la définition utilisée ailleurs (dashboard, objectifs) ?

## Sortie attendue

Une décision écrite sur la (les) définition(s) retenue(s) et les libellés, qui débouche sur un ou plusieurs tickets d'implémentation. **Aucun code tant que ce n'est pas tranché.**

## Hors scope

- L'implémentation elle-même (sera un ticket dédié une fois la définition fixée).
- La décomposition du Sankey (déjà livrée par `00064`).
