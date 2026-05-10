/**
 * Registre central des enchantements.
 *
 * Responsabilités :
 * - agréger toutes les définitions d’affixes disponibles ;
 * - agréger toutes les définitions de malédictions disponibles ;
 * - construire les registres par type d’item enchantable ;
 * - construire les registres de malédictions par position : préfixe ou suffixe ;
 * - fournir des helpers de récupération par type d’item, côté ou id de définition.
 *
 * Ce fichier doit rester un registre de lecture.
 * Il ne doit pas modifier les enchantements, générer d’entrées, appliquer des bonus
 * ou gérer le contexte de fiche.
 */

import { ENCHANTABLE_ITEM_TYPES } from "./constants.js";

import { WEAPON_COMMON_AFFIXES } from "./affixes/weapon-common.js";
import { WEAPON_SIDEARM_AFFIXES } from "./affixes/weapon-sidearm.js";
import { WEAPON_WOODEN_AFFIXES } from "./affixes/weapon-wooden.js";
import { WEAPON_MECHANICAL_AFFIXES } from "./affixes/weapon-mechanical.js";

import { SHIELD_AFFIXES } from "./affixes/shields.js";
import { ARMOR_AFFIXES } from "./affixes/armors.js";
import { ACCESSORY_AFFIXES } from "./affixes/accessories.js";
import { CONSUMABLE_AFFIXES } from "./affixes/consumables.js";

import { PREFIX_CURSES } from "./curses/prefixes.js";
import { SUFFIX_CURSES } from "./curses/suffixes.js";

/**
 * Liste complète des affixes enregistrés.
 *
 * Les affixes sont regroupés par familles de fichiers pour garder les définitions
 * spécialisées dans des fichiers courts et lisibles.
 */
const AFFIX_LIST = Object.freeze([
  ...WEAPON_COMMON_AFFIXES,
  ...WEAPON_SIDEARM_AFFIXES,
  ...WEAPON_WOODEN_AFFIXES,
  ...WEAPON_MECHANICAL_AFFIXES,
  ...SHIELD_AFFIXES,
  ...ARMOR_AFFIXES,
  ...ACCESSORY_AFFIXES,
  ...CONSUMABLE_AFFIXES
]);

/**
 * Table d’accès rapide aux affixes par id.
 *
 * @type {Readonly<Record<string, object>>}
 */
const AFFIX_MAP = Object.freeze(
  Object.fromEntries(
    AFFIX_LIST.map((definition) => [definition.id, definition])
  )
);

/**
 * Liste complète des malédictions enregistrées.
 */
const CURSE_LIST = Object.freeze([
  ...PREFIX_CURSES,
  ...SUFFIX_CURSES
]);

/**
 * Table d’accès rapide aux malédictions par id.
 *
 * @type {Readonly<Record<string, object>>}
 */
const CURSE_MAP = Object.freeze(
  Object.fromEntries(
    CURSE_LIST.map((definition) => [definition.id, definition])
  )
);

/**
 * Registre des affixes disponibles par type d’item enchantable.
 *
 * Chaque type d’item reçoit uniquement les affixes dont `itemTypes`
 * contient ce type.
 */
export const ENCHANTMENT_AFFIX_REGISTRY = Object.freeze(
  Object.fromEntries(
    ENCHANTABLE_ITEM_TYPES.map((itemType) => [
      itemType,
      Object.freeze(
        AFFIX_LIST.filter((definition) => {
          return Array.isArray(definition.itemTypes)
            && definition.itemTypes.includes(itemType);
        })
      )
    ])
  )
);

/**
 * Registre des malédictions disponibles par côté.
 *
 * Les malédictions sont séparées entre :
 * - préfixes ;
 * - suffixes.
 */
export const ENCHANTMENT_CURSE_REGISTRY = Object.freeze({
  prefix: Object.freeze(PREFIX_CURSES),
  suffix: Object.freeze(SUFFIX_CURSES)
});

/**
 * Récupère les affixes enregistrés pour un type d’item.
 *
 * La fonction retourne toujours une copie de tableau afin d’éviter
 * qu’un appelant modifie le registre original.
 *
 * @param {unknown} itemType - Type d’item enchantable.
 * @returns {object[]} Affixes disponibles pour ce type d’item.
 */
export function getRegisteredAffixesForItemType(itemType) {
  return Array.from(
    ENCHANTMENT_AFFIX_REGISTRY[String(itemType ?? "")] ?? []
  );
}

/**
 * Récupère les malédictions enregistrées pour un côté donné.
 *
 * Côtés reconnus :
 * - `prefix` ;
 * - `suffix`.
 *
 * La fonction retourne toujours une copie de tableau.
 *
 * @param {unknown} side - Côté de la malédiction.
 * @returns {object[]} Malédictions disponibles pour ce côté.
 */
export function getRegisteredCursesForSide(side) {
  return Array.from(
    ENCHANTMENT_CURSE_REGISTRY[String(side ?? "")] ?? []
  );
}

/**
 * Récupère une définition d’affixe par son id.
 *
 * @param {unknown} definitionId - Id de définition.
 * @returns {object|null} Définition d’affixe, ou `null`.
 */
export function getEnchantmentAffixDefinition(definitionId) {
  return AFFIX_MAP[String(definitionId ?? "")] ?? null;
}

/**
 * Récupère une définition de malédiction par son id.
 *
 * @param {unknown} definitionId - Id de définition.
 * @returns {object|null} Définition de malédiction, ou `null`.
 */
export function getEnchantmentCurseDefinition(definitionId) {
  return CURSE_MAP[String(definitionId ?? "")] ?? null;
}

/**
 * Récupère une définition d’enchantement par son id.
 *
 * La fonction cherche d’abord dans les affixes, puis dans les malédictions.
 *
 * @param {unknown} definitionId - Id de définition.
 * @returns {object|null} Définition d’enchantement, ou `null`.
 */
export function getEnchantmentDefinition(definitionId) {
  return getEnchantmentAffixDefinition(definitionId)
    ?? getEnchantmentCurseDefinition(definitionId);
}