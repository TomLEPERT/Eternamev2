/**
 * Service de calcul du rang d’enchantement.
 *
 * Responsabilités :
 * - définir les bonus de réussite accordés par les qualités d’essence ;
 * - borner le rang final d’un enchantement ;
 * - calculer le total de réussites après bonus d’essence et de catalyseur ;
 * - produire un résultat complet utilisable par la génération d’enchantement.
 *
 * Ce fichier doit rester dédié au calcul du rang.
 * Il ne doit pas choisir les affixes, appliquer les enchantements,
 * modifier les items ou gérer l’interface.
 */

import { toPositiveInteger } from '../../../utils/numbers.js';
import { normalizeEssenceQuality } from "../../constants/consumables.js";
import { getEnchantmentCatalystRule } from "../catalysts.js";

const MIN_ENCHANTMENT_RANK = 1;
const MAX_ENCHANTMENT_RANK = 7;

const QUALITY_SUCCESS_BONUS = Object.freeze({
  none: 0,
  common: 0,
  superior: 1,
  major: 2,
  perfect: 3
});

/**
 * Borne un rang d’enchantement entre le minimum et le maximum autorisés.
 *
 * Les valeurs invalides deviennent 0 avant d’être remontées au rang minimum.
 *
 * @param {unknown} value - Rang brut à normaliser.
 * @returns {number} Rang borné entre 1 et 7.
 */
export function clampEnchantmentRank(value) {
  const numericValue = Math.floor(Number(value) || 0);

  return Math.max(
    MIN_ENCHANTMENT_RANK,
    Math.min(MAX_ENCHANTMENT_RANK, numericValue)
  );
}

/**
 * Récupère le bonus de réussites accordé par une qualité d’essence.
 *
 * Les qualités reconnues sont normalisées avant lecture :
 * - none ;
 * - common ;
 * - superior ;
 * - major ;
 * - perfect.
 *
 * @param {unknown} quality - Qualité d’essence brute.
 * @returns {number} Bonus de réussites.
 */
export function getEssenceQualityBonus(quality) {
  return QUALITY_SUCCESS_BONUS[normalizeEssenceQuality(quality)] ?? 0;
}

/**
 * Calcule le résultat de rang d’un enchantement.
 *
 * Le rang final dépend :
 * - du nombre de réussites brutes ;
 * - du bonus de qualité d’essence ;
 * - du bonus éventuel du catalyseur.
 *
 * Le rang minimum reste 1, même avec 0 réussite totale.
 *
 * @param {object} [options={}] - Options de calcul.
 * @param {string} [options.catalystBase="brutal_shard"] - Base du catalyseur utilisé.
 * @param {number} [options.successCount=0] - Nombre de réussites brutes.
 * @param {string} [options.essenceQuality="none"] - Qualité d’essence utilisée.
 * @returns {{
 *   successCount: number,
 *   qualityBonus: number,
 *   catalystBonus: number,
 *   totalSuccesses: number,
 *   rank: number
 * }} Résultat complet du calcul de rang.
 */
export function buildEnchantmentRankResult({
  catalystBase = "brutal_shard",
  successCount = 0,
  essenceQuality = "none"
} = {}) {
  const catalystRule = getEnchantmentCatalystRule(catalystBase);
  const rawSuccessCount = toPositiveInteger(successCount);
  const qualityBonus = getEssenceQualityBonus(essenceQuality);
  const catalystBonus = toPositiveInteger(catalystRule.extraSuccesses);
  const totalSuccesses = rawSuccessCount + qualityBonus + catalystBonus;

  return {
    successCount: rawSuccessCount,
    qualityBonus,
    catalystBonus,
    totalSuccesses,
    rank: clampEnchantmentRank(totalSuccesses || MIN_ENCHANTMENT_RANK)
  };
}

