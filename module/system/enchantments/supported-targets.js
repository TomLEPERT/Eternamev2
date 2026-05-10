/**
 * Référentiel des cibles supportées par les enchantements.
 *
 * Responsabilités :
 * - déclarer les cibles d’acteur modifiables par un enchantement ;
 * - déclarer les cibles d’item modifiables par un enchantement ;
 * - inclure automatiquement les attributs et sauvegardes système ;
 * - fournir des helpers de validation pour vérifier qu’une cible est autorisée.
 *
 * Ce fichier doit rester un référentiel de cibles supportées.
 * Il ne doit pas appliquer les bonus, modifier les acteurs ou modifier les items.
 */

import { ITEM_SAVE_KEYS } from "../constants/save-keys.js";
import { ETERNAME_ATTRIBUTES } from "../constants/attributes.js";

/**
 * Cibles d’acteur supportées par les enchantements.
 *
 * Ces clés correspondent aux chemins ou identifiants utilisés par le système
 * pour appliquer des bonus sur un acteur.
 *
 * Elles incluent :
 * - les valeurs, index et dés des attributs ;
 * - les ressources principales ;
 * - les statistiques de combat ;
 * - les sauvegardes.
 */
export const SUPPORTED_ENCHANTMENT_ACTOR_TARGETS = Object.freeze([
  ...Object.keys(ETERNAME_ATTRIBUTES).flatMap((attributeKey) => [
    `attributesValue.${attributeKey}`,
    `attributesIndex.${attributeKey}`,
    `attributesDice.${attributeKey}`
  ]),

  "hpMax",
  "initiative",
  "destinyDice",
  "fatigueMax",
  "explorationPassive",
  "spellSlotsMax",
  "psMax",
  "power",

  "combat.prc",
  "combat.prd",
  "combat.prm",
  "combat.def",

  ...ITEM_SAVE_KEYS.map((saveKey) => `saves.${saveKey}`)
]);

/**
 * Cibles d’item supportées par les enchantements.
 *
 * Ces clés correspondent aux champs d’item ou aux bonus dérivés que les
 * enchantements peuvent modifier.
 *
 * Elles incluent :
 * - le poids ;
 * - les prérequis spéciaux ;
 * - la précision ;
 * - les dégâts ;
 * - les portées ;
 * - la défense ;
 * - les sauvegardes.
 */
export const SUPPORTED_ENCHANTMENT_ITEM_TARGETS = Object.freeze([
  "weight",
  "special.requirementReduction",
  "precisionBonus",
  "damageDiceBonus",
  "rangeMeters",
  "zoneRangeMeters",
  "defBonus",

  ...ITEM_SAVE_KEYS.map((saveKey) => `saves.${saveKey}`)
]);

const ACTOR_TARGET_SET = new Set(SUPPORTED_ENCHANTMENT_ACTOR_TARGETS);
const ITEM_TARGET_SET = new Set(SUPPORTED_ENCHANTMENT_ITEM_TARGETS);

/**
 * Vérifie si une cible d’acteur est supportée par les enchantements.
 *
 * La valeur est normalisée en chaîne nettoyée avant vérification.
 *
 * @param {unknown} targetKey - Clé de cible à vérifier.
 * @returns {boolean} `true` si la cible d’acteur est autorisée.
 */
export function isSupportedEnchantmentActorTarget(targetKey = "") {
  return ACTOR_TARGET_SET.has(String(targetKey ?? "").trim());
}

/**
 * Vérifie si une cible d’item est supportée par les enchantements.
 *
 * La valeur est normalisée en chaîne nettoyée avant vérification.
 *
 * @param {unknown} targetKey - Clé de cible à vérifier.
 * @returns {boolean} `true` si la cible d’item est autorisée.
 */
export function isSupportedEnchantmentItemTarget(targetKey = "") {
  return ITEM_TARGET_SET.has(String(targetKey ?? "").trim());
}