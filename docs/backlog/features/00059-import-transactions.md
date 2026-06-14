# Import de transactions (CSV / OFX)

**Priority:** High

## Description

Importer des transactions en masse depuis un fichier exporté par sa banque (CSV en premier, OFX/QIF ensuite), au lieu de tout saisir à la main. C'est le **80/20 de l'agrégation bancaire** : l'essentiel du bénéfice (ne plus tout taper) sans le coût ni la régulation d'un agrégateur PSD2.

Plus gros réducteur de friction du produit aujourd'hui, où la saisie est 100% manuelle.

## Dépendance

Dépend de `00058-comptes-multiples` : un import vise **un compte cible**. Sans la notion de compte, l'import n'a pas de destination claire.

## Problème central : les CSV bancaires ne sont pas standardisés

Chaque banque a ses colonnes, son format de date, sa convention de signe (colonne débit/crédit séparées **ou** montant signé), son séparateur. Le cœur de la feature est donc une étape de **mapping de colonnes** + un **aperçu avant validation**.

## Fonctionnement attendu

1. L'utilisateur choisit un **compte cible** et dépose un fichier CSV.
2. **Mapping** : l'app détecte les colonnes et laisse l'utilisateur associer `date`, `montant`, `libellé` (et la convention de signe). Mapping mémorisable par banque pour les imports suivants.
3. **Aperçu** : tableau des lignes parsées, avec montant/type/date, lignes dé-sélectionnables.
4. **Déduplication** : ne pas réimporter une transaction déjà présente (empreinte `date + montant + libellé + compte`), pour gérer les exports qui se chevauchent.
5. **Catégorisation auto** : réutiliser la suggestion de catégorie existante (`00051`) sur le libellé.
6. Validation → création des transactions dans le compte cible.

## Increment 1 — Import CSV avec mapping + aperçu + dédup

**Scope**

- Backend : `POST /imports/preview` (parse + mapping → lignes normalisées, sans persister) puis `POST /imports/commit` (crée les transactions non dupliquées dans le compte).
- Déduplication par empreinte ; les lignes déjà présentes sont marquées et exclues par défaut.
- Frontend : écran d'import (upload → mapping colonnes → aperçu éditable → confirmer).
- Mémoriser le mapping par banque (réutilisé au prochain import).

**Critères de validation**

- [ ] Importer un CSV de 50 lignes crée 50 transactions dans le compte cible
- [ ] Réimporter le même fichier ne crée aucun doublon
- [ ] Une colonne débit/crédit séparée est correctement convertie en `income`/`expense`
- [ ] Les lignes dé-sélectionnées dans l'aperçu ne sont pas créées
- [ ] Le mapping d'une banque est proposé automatiquement au 2ᵉ import

## Increment 2 — OFX/QIF + catégorisation auto à l'import

**Scope**

- Support des formats OFX et QIF (structurés, moins de mapping nécessaire).
- Suggestion de catégorie par libellé (réutilise `00051`) appliquée dans l'aperçu, modifiable.

**Critères de validation**

- [ ] Un fichier OFX est importé sans étape de mapping manuel
- [ ] Chaque ligne arrive avec une catégorie suggérée, éditable avant validation

## Décisions ouvertes

1. **Taille max / format** — limiter la taille d'upload et valider l'encodage (UTF-8 / Latin-1, séparateur `,` vs `;` fréquent en FR).
2. **Empreinte de dédup** — `date + montant + libellé` suffit-il, ou ajouter un hash de ligne pour les libellés identiques le même jour ?
3. **Transferts détectés** — un virement entre deux comptes importés apparaîtra deux fois (sortie + entrée) : faut-il proposer de les apparier en `transfer` (`00058`) ? *(probablement un Increment 3 plus tard.)*
