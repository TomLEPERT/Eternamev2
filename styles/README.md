# Organisation CSS Etername v2

Le point d'entrée Foundry reste `styles/etername.css`.

## Structure

- `core/` : design tokens, variables globales et overrides Foundry minimaux.
- `actor/` : styles des fiches acteur.
  - `actor/stats/` : découpage par sous-bloc de l'onglet Statistiques.
  - `actor/techniques/` : base de l'onglet Techniques + couche polish.
- `item/` : styles des fiches item.
  - `item/techniques/` : styles spécifiques au builder de technique, invocation et modules de métier.
- `chat/` : cartes de chat du système.

## Règles de maintenance

- Un fichier CSS ne doit pas dépasser 500 lignes.
- Les nouvelles couleurs, espacements, rayons et ombres passent par `core/tokens.css`.
- Les imports d'un domaine passent par son `index.css`; éviter d'importer un fichier profond depuis `etername.css`.
- Garder les sélecteurs scopés avec `.etername-sheet`, `.eternamev2-item-sheet`, `.eternamev2-merchant-sheet` ou une classe de carte de chat.
- Ne pas mettre de logique de correction visuelle globale Foundry ailleurs que dans `core/foundry-overrides.css`.
