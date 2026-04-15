---
feature: 00010-saisie-manuelle-transactions
depends_on: 00028-backend-transactions-categories-api
---

# Transaction Form — Frontend

## Objectif

Ajouter un formulaire mobile-first permettant de saisir une transaction (dépense ou revenu) en moins de 10 secondes, en appelant les endpoints `GET /api/categories` et `POST /api/transactions` du backend (00028).

## Périmètre

- Bouton flottant "+" sur le dashboard → ouvre un **Sheet** (bottom drawer) avec le formulaire
- Champs du formulaire :
  - **Type** : toggle `Dépense / Revenu` (income / expense) — premier champ, visible immédiatement
  - **Montant** : input numérique (positif, requis), clavier numérique sur mobile (`inputMode="decimal"`)
  - **Catégorie** : select chargé depuis `GET /api/categories`, filtré par type sélectionné
  - **Date** : date picker, pré-rempli à aujourd'hui
  - **Note** : textarea optionnelle, courte
- Soumission → `POST /api/transactions` via `apiFetch`
- État de chargement sur le bouton submit
- Feedback : toast succès / message d'erreur inline
- Fermeture automatique du sheet après succès

## Hors périmètre

- Modification / suppression de transaction (tâche séparée)
- Historique des transactions
- Validation côté serveur avancée (catégorie appartenant à l'utilisateur, etc.)

## Composants à créer

```
frontend/
  app/dashboard/
    page.tsx                        ← ajouter bouton FAB + <TransactionSheet>
  components/
    transactions/
      transaction-sheet.tsx         ← Sheet wrapper (open/close state)
      transaction-form.tsx          ← form logic (react-hook-form + zod)
    ui/
      select.tsx                    ← shadcn/ui Select (à ajouter via CLI)
      sheet.tsx                     ← shadcn/ui Sheet (à ajouter via CLI)
      textarea.tsx                  ← shadcn/ui Textarea (à ajouter via CLI)
      toast.tsx / use-toast.ts      ← shadcn/ui Toast (à ajouter via CLI)
```

## Types à définir (`types/`)

```ts
// types/api.ts
export type TransactionType = "income" | "expense";

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
}

export interface CreateTransactionPayload {
  amount: number;          // positif
  type: TransactionType;
  category_id: string;
  date: string;            // ISO 8601 YYYY-MM-DD
  note?: string;
}
```

## Appels API

```ts
// GET /api/categories
// Réponse : Category[]

// POST /api/transactions
// Body : CreateTransactionPayload
// Réponse : 201 + transaction créée
```

Utiliser `apiFetch` (lib/api.ts) — JWT injecté automatiquement.

## Validation (zod)

```ts
z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().positive(),
  category_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(200).optional(),
})
```

## Tests

Chaque phase se termine par des tests avant de passer à la suivante.

- **Helpers API** (`lib/api.ts`) : unit tests avec `fetch` mocké — `getCategories` retourne bien `Category[]`, `createTransaction` envoie le bon body et le bon header Authorization
- **TransactionForm** : tests avec React Testing Library — rendu initial, filtrage des catégories selon le type, soumission valide appelle `createTransaction`, erreur de validation bloque la soumission, état loading pendant l'appel
- **Intégration** : test que le FAB ouvre le sheet et que le formulaire complet soumet correctement (mock `apiFetch`)

`just check` doit passer avant chaque commit.

## Implementation Plan

### Phase 1 — Composants shadcn manquants
1. `npx shadcn@latest add select sheet textarea sonner` (ou toast selon le setup)
2. Vérifier que les composants sont bien dans `components/ui/`

### Phase 2 — Types et helpers API
1. Créer `types/api.ts` avec `Category`, `TransactionType`, `CreateTransactionPayload`
2. Ajouter dans `lib/api.ts` :
   - `getCategories(): Promise<Category[]>`
   - `createTransaction(payload): Promise<Response>`

### Phase 3 — TransactionForm
1. `components/transactions/transaction-form.tsx`
   - `react-hook-form` + `zodResolver`
   - `useEffect` pour charger les catégories au montage
   - Filtrer les catégories selon le `type` sélectionné
   - `onSubmit` appelle `createTransaction`, gère loading + erreurs
   - `onSuccess` callback pour fermer le sheet

### Phase 4 — TransactionSheet + intégration dashboard
1. `components/transactions/transaction-sheet.tsx` : wrapper Sheet avec état `open`
2. `app/dashboard/page.tsx` :
   - Convertir en Client Component ou extraire le FAB dans un client component
   - Ajouter bouton FAB fixe en bas à droite (`fixed bottom-6 right-6`)
   - Intégrer `<TransactionSheet />`

## Critères de validation

- [ ] Le bouton "+" s'affiche sur le dashboard (mobile et desktop)
- [ ] Le sheet s'ouvre depuis le bouton
- [ ] Les catégories se chargent depuis l'API et sont filtrées par type
- [ ] La soumission du formulaire crée bien une transaction (vérifier en DB Supabase)
- [ ] Un toast de succès s'affiche et le sheet se ferme
- [ ] Une erreur API s'affiche sans planter l'UI
- [ ] Le montant négatif ou zéro est bloqué par la validation
- [ ] Sur mobile (375px) : le sheet couvre l'écran, le clavier numérique s'ouvre sur le champ montant
- [ ] Tests unitaires des helpers API passent
- [ ] Tests React Testing Library du formulaire passent
- [ ] `just check` passe (lint + typecheck + tests)
