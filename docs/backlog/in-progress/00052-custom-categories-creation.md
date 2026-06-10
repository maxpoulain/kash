---
---

# Création de Catégories Personnalisées

## Objectif

Permettre à l'utilisateur de créer des catégories totalement libres en dehors des suggestions, avec un nom et une icône au choix.

## Périmètre

- Backend : `POST /categories` accepte un nom libre, une icône choisie parmi une liste prédéfinie, et optionnellement un `group_id`
- Backend : `GET /categories` retourne uniquement les catégories créées pour ce foyer (pas les suggestions du code — le merge se fait côté frontend)
- Frontend : bouton "Nouvelle catégorie" dans le formulaire de transaction (ou via un select dédié)
- Frontend : saisie du nom + picker d'icône + select de groupe optionnel
- Validation : pas de doublon de nom pour le même foyer (insensible à la casse, trimé)
- Les catégories perso sont liées au foyer (`household_id`) et n'ont pas de notion de global

## Critères de validation

- [ ] Créer une catégorie "Courses Bio" avec une icône, elle apparaît immédiatement dans l'autocomplete
- [ ] Essayer de créer "courses bio" quand "Courses Bio" existe → erreur doublon
- [ ] Une catégorie perso créée par le foyer A n'est pas visible du foyer B
- [ ] Les catégories perso fonctionnent dans les transactions, les objectifs de dépenses et le dashboard