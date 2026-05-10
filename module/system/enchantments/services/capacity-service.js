/**
 * Service de capacité d’enchantement.
 *
 * Responsabilités :
 * - normaliser la qualité de base d’un enchantement ;
 * - déterminer la capacité maximale en préfixes et suffixes ;
 * - gérer les capacités personnalisées ;
 * - exposer les règles de capacité utilisées par les données d’enchantement.
 *
 * Ce fichier doit rester dédié au calcul des capacités.
 * Il ne doit pas gérer les entrées d’enchantement, les catalyseurs,
 * l’application des bonus ou le rendu de fiche.
 */

import { ENCHANTMENT_BASE_QUALITIES } from "../constants.js";

/**
 * Normalise une qualité de base d’enchantement.
 *
 * Si la valeur fournie ne correspond à aucune qualité connue,
 * la qualité `base` est utilisée.
 *
 * @param {unknown} value - Qualité brute.
 * @returns {string} Qualité normalisée.
 */
export function normalizeEnchantmentBaseQuality(value = "base") {
  const normalized = String(value ?? "").trim();

  return Object.hasOwn(ENCHANTMENT_BASE_QUALITIES, normalized)
    ? normalized
    : "base";
}

/**
 * Calcule la capacité d’enchantement selon la qualité de base.
 *
 * Pour les qualités standards, les limites viennent directement
 * de `ENCHANTMENT_BASE_QUALITIES`.
 *
 * Pour la qualité `custom`, les valeurs personnalisées sont utilisées,
 * puis normalisées en entiers positifs.
 *
 * @param {string} [baseQuality="base"] - Qualité de base.
 * @param {number} [customPrefixMax=1] - Nombre personnalisé de préfixes.
 * @param {number} [customSuffixMax=1] - Nombre personnalisé de suffixes.
 * @returns {{baseQuality: string, prefixMax: number, suffixMax: number}} Capacité d’enchantement.
 */
export function getEnchantmentCapacity(
  baseQuality = "base",
  customPrefixMax = 1,
  customSuffixMax = 1
) {
  const quality = normalizeEnchantmentBaseQuality(baseQuality);
  const definition = ENCHANTMENT_BASE_QUALITIES[quality]
    ?? ENCHANTMENT_BASE_QUALITIES.base;

  if (quality !== "custom") {
    return {
      baseQuality: quality,
      prefixMax: definition.prefixMax,
      suffixMax: definition.suffixMax
    };
  }

  return {
    baseQuality: quality,
    prefixMax: toPositiveInteger(customPrefixMax, definition.prefixMax),
    suffixMax: toPositiveInteger(customSuffixMax, definition.suffixMax)
  };
}

/**
 * Convertit une valeur en entier positif.
 *
 * Les valeurs invalides utilisent le fallback fourni.
 * Les valeurs négatives deviennent 0.
 *
 * @param {unknown} value - Valeur brute.
 * @param {number} [fallback=0] - Valeur de secours.
 * @returns {number} Entier positif.
 */
function toPositiveInteger(value, fallback = 0) {
  const numericValue = Number(value ?? fallback);

  if (!Number.isFinite(numericValue)) {
    return Math.max(0, Math.floor(Number(fallback) || 0));
  }

  return Math.max(0, Math.floor(numericValue));
}