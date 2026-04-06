# Définir contrat API (OpenAPI)

**Source:** [Linear PER-22](https://linear.app/personal-max-and-maria/issue/PER-22/definir-contrat-api-openapi)

**Priority:** Medium
**Labels:** Backend

## Description

Documenter le contrat d'API (OpenAPI/Swagger) pour que frontend et backend puissent travailler en parallèle.

## Endpoints MVP à spécifier

### Transactions

- `GET /api/transactions` — liste des transactions
- `POST /api/transactions` — créer une transaction
- `PUT /api/transactions/{id}` — modifier
- `DELETE /api/transactions/{id}` — supprimer

### Categories

- `GET /api/categories`
- `POST /api/categories`

### Budgets

- `GET /api/budgets` — budget du mois courant
- `PUT /api/budgets/{id}` — mettre à jour les montants alloués

### Accounts

- `GET /api/accounts` — comptes d'épargne
- `POST /api/accounts`
- `PUT /api/accounts/{id}`

## Critères d'acceptance

- [ ] Schémas Pydantic définis (Transaction, Category, Budget, Account)
- [ ] Routes documentées avec docstrings
- [ ] Swagger UI accessible sur `/docs`
- [ ] Contrat validé avec le frontend (review)
