---
feature: 00020-monthly-spending-goals
---

# Goals View

## Objectif
Permettre de visualiser les objectifs de dépenses mensuels avec leur progression (lecture seule).

## Périmètre

### Database
- Table `spending_goals`:
  - `id` uuid primary key
  - `household_id` uuid not null → households(id) on delete cascade
  - `created_by` uuid not null → users(id)  -- qui a créé l'objectif
  - `category_id` uuid not null → categories(id) on delete cascade
  - `month` date not null  -- premier jour du mois (ex: 2025-04-01)
  - `amount` numeric(12,2) not null check (amount > 0)
  - `created_at` / `updated_at` timestamptz
- Contrainte unique sur `(household_id, category_id, month)`
- RLS: foyer ne peut lire/écrire que ses propres objectifs

### API
- `GET /api/spending-goals?month=2025-04` — retourne la liste des objectifs du mois avec :
  - `category_id`, `category_name`
  - `goal_amount` (montant objectif)
  - `spent_amount` (somme des transactions expense de la catégorie sur le mois)
  - `progress_percent` (spent / goal * 100)
  - `remaining` (goal - spent)
- Query param `month` requis, format `YYYY-MM`

### UI

**Maquette :** Design system "Jars" adapté pour les objectifs de dépenses — cartes avec icône de catégorie, barre de progression, et montants. Voir capture d'écran dans la conversation.

**Page `/goals`** :
- En-tête avec titre "Objectifs" et montant total des objectifs du mois
- Sélecteur de mois (navigation mois précédent/suivant)
- Bouton "+" pour ajouter un objectif (ouvre modal — voir 00043)

**Carte d'objectif** (par catégorie) :
- **Gauche :** Avatar/icône de la catégorie avec pourcentage de progression en overlay
- **Centre :**
  - Nom de la catégorie
  - Barre de progression horizontale (remplissage = % dépensé)
  - Couleur : neutre si < 80%, orange si 80-100%, rouge si > 100%
- **Droite :**
  - Montant dépensé (ex: "450€")
  - Objectif (ex: "/ 500€") en plus petit
  - En dessous : montant restant ou "Dépassé de X€" si over budget

**État vide :** Message "Aucun objectif défini pour ce mois" avec CTA pour créer

**Responsive :** 
- Mobile : cartes empilées verticalement (comme maquette)
- Desktop : grille 2 colonnes ou liste selon préférence

## Critères de validation
- [ ] Migration DB appliquée avec RLS
- [ ] GET retourne les bonnes valeurs spent calculées depuis les transactions
- [ ] Page affiche correctement les progressions
- [ ] Gestion du cas "aucun objectif" (état vide)
- [ ] Responsive desktop + mobile
- [ ] Tests écrits et passants (`just check` passe)
