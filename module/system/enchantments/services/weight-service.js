/**
 * Calcul des totaux d’enchantement.
 *
 * Responsabilités :
 * - compter les préfixes et suffixes utilisés ;
 * - compter les affixes et les malédictions ;
 * - calculer les emplacements encore disponibles ;
 * - additionner le poids magique total des entrées ;
 * - normaliser les capacités d’enchantement.
 *
 * Ce fichier doit rester dédié aux calculs de résumé.
 * Il ne doit pas modifier les entrées, appliquer les bonus ou gérer le rendu de fiche.
 */

import { toPositiveInteger } from '../../../utils/numbers.js';
/**
 * Calcule les totaux d’enchantement à partir d’une liste d’entrées.
 *
 * La capacité indique le nombre maximal de préfixes et suffixes autorisés.
 *
 * Par défaut :
 * - 1 préfixe maximum ;
 * - 1 suffixe maximum.
 *
 * @param {Array<object>} [entries=[]] - Entrées d’enchantement à analyser.
 * @param {{prefixMax?: number, suffixMax?: number}} [capacity={ prefixMax: 1, suffixMax: 1 }] - Capacité d’enchantement.
 * @returns {{
 *   prefixUsed: number,
 *   suffixUsed: number,
 *   prefixMax: number,
 *   suffixMax: number,
 *   prefixAvailable: number,
 *   suffixAvailable: number,
 *   affixCount: number,
 *   curseCount: number,
 *   totalMagicWeight: number
 * }} Résumé des totaux d’enchantement.
 */
export function computeEnchantingTotals(
  entries = [],
  capacity = {
    prefixMax: 1,
    suffixMax: 1
  }
) {
  const normalizedEntries = Array.isArray(entries) ? entries : [];

  const affixEntries = normalizedEntries.filter((entry) => {
    return normalizeEntryFamily(entry?.family) === "affix";
  });

  const curseEntries = normalizedEntries.filter((entry) => {
    return normalizeEntryFamily(entry?.family) === "curse";
  });

  const slotEntries = normalizedEntries.filter((entry) => {
    return ["prefix", "suffix"].includes(normalizeEntrySide(entry?.side));
  });

  const prefixEntries = slotEntries.filter((entry) => {
    return normalizeEntrySide(entry?.side) === "prefix";
  });

  const suffixEntries = slotEntries.filter((entry) => {
    return normalizeEntrySide(entry?.side) === "suffix";
  });

  const prefixUsed = prefixEntries.length;
  const suffixUsed = suffixEntries.length;
  const prefixMax = toPositiveInteger(capacity?.prefixMax);
  const suffixMax = toPositiveInteger(capacity?.suffixMax);
  const totalMagicWeight = roundToTwoDecimals(sumMagicWeight(normalizedEntries));

  return {
    prefixUsed,
    suffixUsed,
    prefixMax,
    suffixMax,
    prefixAvailable: Math.max(0, prefixMax - prefixUsed),
    suffixAvailable: Math.max(0, suffixMax - suffixUsed),
    affixCount: affixEntries.length,
    curseCount: curseEntries.length,
    totalMagicWeight
  };
}

/**
 * Normalise la famille d’une entrée d’enchantement.
 *
 * Toute valeur différente de `curse` est considérée comme `affix`.
 *
 * @param {unknown} value - Famille brute.
 * @returns {"affix"|"curse"} Famille normalisée.
 */
function normalizeEntryFamily(value) {
  return String(value ?? "affix") === "curse"
    ? "curse"
    : "affix";
}

/**
 * Normalise le côté d’une entrée d’enchantement.
 *
 * Toute valeur différente de `suffix` est considérée comme `prefix`.
 *
 * @param {unknown} value - Côté brut.
 * @returns {"prefix"|"suffix"} Côté normalisé.
 */
function normalizeEntrySide(value) {
  return String(value ?? "prefix") === "suffix"
    ? "suffix"
    : "prefix";
}

/**
 * Additionne le poids magique de toutes les entrées.
 *
 * Les valeurs invalides sont ignorées.
 *
 * @param {Array<object>} entries - Entrées d’enchantement.
 * @returns {number} Poids magique total.
 */
function sumMagicWeight(entries) {
  return entries.reduce((total, entry) => {
    const value = Number(entry?.magicWeight ?? 0);

    return total + (Number.isFinite(value) ? value : 0);
  }, 0);
}


/**
 * Arrondit un nombre à deux décimales.
 *
 * @param {number} value - Valeur à arrondir.
 * @returns {number} Valeur arrondie.
 */
function roundToTwoDecimals(value) {
  return Math.round(value * 100) / 100;
}