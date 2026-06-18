---
---

# Régression Catégories en Production

## Contexte

Suite à la livraison de l'US 00051 (suggestions de catégories en code), la modale "Nouvelle transaction" affiche une section CATÉGORIE vide en production. Il est impossible de créer une transaction avec une catégorie.

## Diagnostic

Le bug n'est **pas** dans la logique catégories, ni dans les migrations. La base de production est à jour (`type` présent, catégories locales par foyer).

La console navigateur montre un blocage **CORS** sur `/api/categories`, `/api/accounts` et `/api/savings-accounts` : l'origine `https://kash-pi-ten.vercel.app` n'est pas autorisée par le backend Railway.

Racine : `backend/app/main.py` hardcode `allow_origins=["https://kash.vercel.app"]` en production. Le frontend prod est déployé sur `https://kash-pi-ten.vercel.app`, donc toutes les requêtes API échouent silencieusement et le frontend affiche des listes vides.

## Objectif

Rendre la configuration CORS du backend pilotable par variable d'environnement, avec une valeur par défaut sûre, pour que le frontend de production puisse appeler l'API.

## Périmètre

- Backend : `backend/app/config.py` (ajouter `frontend_url`)
- Backend : `backend/app/main.py` (utiliser `settings.frontend_url` pour CORS, garder `*` en dev)
- Documentation : indiquer la variable d'environnement `FRONTEND_URL` à renseigner en production.

## Plan d'implémentation

### Phase 1 — Config
- [ ] Ajouter `frontend_url: str = "https://kash.vercel.app"` dans `Settings`.
- [ ] Utiliser `settings.frontend_url` dans `CORSMiddleware` au lieu de l'URL en dur.
- [ ] Conserver `allow_origins=["*"]` quand `environment == "development"`.

### Phase 2 — Déploiement
- [ ] Mettre à jour la variable d'environnement `FRONTEND_URL` côté Railway avec `https://kash-pi-ten.vercel.app`.
- [ ] Redéployer le backend.

### Phase 3 — Vérification
- [ ] Ouvrir la modale Transaction en prod.
- [ ] Vérifier que `/api/categories`, `/api/accounts`, `/api/savings-accounts` ne sont plus bloqués par CORS.
- [ ] Créer une transaction avec une catégorie suggérée.

## Critères de validation

- [ ] Les appels API depuis `https://kash-pi-ten.vercel.app` ne génèrent plus d'erreur CORS.
- [ ] Les catégories apparaissent dans la modale de transaction en production.
- [ ] Une transaction peut être créée avec une catégorie en production.