/**
 * Prépare les listes de sélection localisées utilisées par les feuilles du système.
 *
 * Responsabilités :
 * - regrouper les référentiels affichés dans les formulaires d’acteur ou d’item ;
 * - transformer les clés i18n en libellés lisibles ;
 * - fournir un objet prêt à être injecté dans le contexte Handlebars.
 *
 * Ce fichier ne doit pas contenir de logique métier.
 * Il sert uniquement de pont entre les constantes système et l’affichage des formulaires.
 */

import { ETERNAME_SPECIES } from "./species.js";
import { ETERNAME_PROFILES } from "./profiles.js";
import { ETERNAME_KNOWLEDGES } from "./knowledges.js";
import { ETERNAME_SIZES } from "./sizes.js";

/**
 * Construit les listes localisées utilisées par les champs `<select>` des feuilles.
 *
 * Chaque propriété retournée est un objet sous la forme :
 *
 * ```js
 * {
 *   key: "Libellé localisé"
 * }
 * ```
 *
 * Cette fonction dépend de `game.i18n`.
 * Elle doit donc être appelée depuis un contexte où Foundry est déjà initialisé,
 * par exemple pendant la préparation du contexte d’une feuille.
 *
 * @returns {{
 *   species: Record<string, string>,
 *   profiles: Record<string, string>,
 *   knowledges: Record<string, string>,
 *   sizes: Record<string, string>
 * }} Listes localisées pour les templates.
 */
export function getLocalizedSelects() {
  return {
    species: localizeMap(ETERNAME_SPECIES),
    profiles: localizeMap(ETERNAME_PROFILES),
    knowledges: localizeMap(ETERNAME_KNOWLEDGES),
    sizes: localizeMap(ETERNAME_SIZES)
  };
}

/**
 * Transforme une table de clés i18n en table de libellés localisés.
 *
 * Exemple :
 *
 * ```js
 * {
 *   human: "ETERN.SPECIES.HUMAN"
 * }
 * ```
 *
 * devient :
 *
 * ```js
 * {
 *   human: "Humain"
 * }
 * ```
 *
 * @param {Record<string, string>} source - Table de clés internes vers clés i18n.
 * @returns {Record<string, string>} Table de clés internes vers libellés localisés.
 */
function localizeMap(source) {
  const out = {};

  for (const [key, label] of Object.entries(source ?? {})) {
    out[key] = game.i18n.localize(label);
  }

  return out;
}