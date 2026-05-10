/**
 * Prépare le contexte d’affichage des attributs pour l’onglet Statistiques.
 *
 * Responsabilités :
 * - lire les attributs de base depuis les données système de l’acteur ;
 * - lire les valeurs dérivées calculées par les règles ;
 * - appliquer les bornes de sécurité des attributs ;
 * - enrichir chaque attribut avec ses métadonnées d’affichage ;
 * - construire les ticks de progression utilisés par le template.
 *
 * Ce fichier sert de pont entre les données acteur et le template de fiche.
 * Il ne doit pas contenir les règles de calcul des attributs dérivés.
 */

import { ETERNAME_ATTRIBUTES, ETERNAME_ATTRIBUTE_MAX_VALUE } from "./attributes.js";
import { valueToIndex, buildAttributeTicks } from "../../rules/derived/attributes.js";

/**
 * Convertit une valeur en nombre borné.
 *
 * Cette fonction évite que des valeurs invalides comme `NaN`, `null`,
 * une chaîne vide ou un texte libre se propagent dans le contexte de fiche.
 *
 * @param {unknown} value - Valeur brute à convertir.
 * @param {number} fallback - Valeur utilisée si l’entrée est invalide.
 * @param {number} min - Valeur minimale autorisée.
 * @param {number} max - Valeur maximale autorisée.
 * @returns {number} Nombre valide et borné.
 */
function clampNumber(value, fallback, min, max) {
  const numericValue = Number(value);

  const safeValue = Number.isFinite(numericValue)
    ? numericValue
    : fallback;

  return Math.max(min, Math.min(max, safeValue));
}

/**
 * Prépare la liste des attributs affichables dans l’onglet Statistiques.
 *
 * Pour chaque attribut déclaré dans `ETERNAME_ATTRIBUTES`, la fonction renvoie :
 * - sa clé interne ;
 * - son abréviation ;
 * - son label localisé ;
 * - son icône ;
 * - sa couleur ;
 * - sa valeur de base ;
 * - sa valeur totale dérivée ;
 * - son index de progression ;
 * - ses ticks de progression.
 *
 * Les valeurs de base viennent de `system.attributes`.
 * Les valeurs calculées viennent de `system.derived.attributes`.
 *
 * @param {object} system - Données système de l’acteur.
 * @returns {{
 *   key: string,
 *   abbr: string,
 *   label: string,
 *   icon: string,
 *   color: string,
 *   value: number,
 *   baseValue: number,
 *   total: number,
 *   index: number,
 *   ticks: object[]
 * }[]} Liste des attributs prête pour le template.
 */
export function getStatsAttributes(system) {
  const source = system?.attributes ?? {};
  const derived = system?.derived?.attributes ?? {};
  const list = [];

  for (const [key, meta] of Object.entries(ETERNAME_ATTRIBUTES)) {
    const data = source[key] ?? {};
    const derivedData = derived[key] ?? {};

    const value = clampNumber(
      data.value ?? 5,
      5,
      0,
      ETERNAME_ATTRIBUTE_MAX_VALUE
    );

    const total = clampNumber(
      derivedData.total ?? value,
      value,
      0,
      ETERNAME_ATTRIBUTE_MAX_VALUE
    );

    const ticks = Math.max(0, Number(data.ticks ?? 0) || 0);

    list.push({
      key,
      abbr: data.abbr ?? meta.abbr,
      label: game.i18n.localize(data.label ?? meta.label),
      icon: meta.icon,
      color: meta.color,
      value,
      baseValue: value,
      total,
      index: derivedData.index ?? valueToIndex(total),
      ticks: buildAttributeTicks(ticks)
    });
  }

  return list;
}