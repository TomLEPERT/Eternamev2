/**
 * Helpers communs de préparation des données dérivées des items.
 *
 * Responsabilités :
 * - appliquer les valeurs communes aux items : quantité, emplacement, légalité, description, poids ;
 * - déterminer si un item doit garder son nom de preset localisé ;
 * - préparer les données d’enchantement et appliquer leurs bonus dérivés ;
 * - normaliser les sauvegardes d’un item dans un format stable.
 *
 * Ce fichier doit rester réservé aux données communes des items.
 * Les règles propres aux armes, armures, boucliers, techniques ou invocations
 * doivent rester dans leurs fichiers dérivés spécialisés.
 */

import { asArray } from '../../../utils/arrays.js';
import { normalizeItemLegality } from "../../constants/item-legality.js";
import { ITEM_SAVE_KEYS } from "../../constants/save-keys.js";
import { localizePresetName } from "../../i18n/preset-localization.js";
import { isEnchantableItem } from "../../enchantments/constants.js";
import { applyEnchantmentItemBonusRows } from "../../enchantments/item-bonus-targets.js";
import { normalizeEnchantingData } from "../../enchantments/services/entry-service.js";

/**
 * Applique les valeurs communes par défaut à un système d’item.
 *
 * La fonction privilégie les valeurs de `item._source.system` quand elles existent,
 * afin de conserver les données brutes d’origine pendant la préparation dérivée.
 *
 * Champs normalisés :
 * - quantité ;
 * - emplacement ;
 * - légalité ;
 * - description ;
 * - poids.
 *
 * @param {object} system - Données système préparées de l’item.
 * @param {Item|null} [item=null] - Item source, utilisé pour lire `_source.system`.
 * @returns {void}
 */
export function applyCommonItemDefaults(system, item = null) {
  const source = item?._source?.system ?? {};

  system.quantity = Math.max(
    1,
    Math.floor(Number(source.quantity ?? system.quantity ?? 1) || 1)
  );

  system.location = String(source.location ?? system.location ?? "backpack");
  system.legality = normalizeItemLegality(source.legality ?? system.legality ?? "legal");
  system.description = String(source.description ?? system.description ?? "");

  system.weight = toFiniteNumber(source.weight ?? system.weight, 1);
}

/**
 * Détermine si le nom actuel de l’item correspond encore au nom de son preset.
 *
 * La fonction renvoie `true` si :
 * - le nom est vide ;
 * - le nom correspond au nom localisé du preset ;
 * - le nom correspond directement à l’id de base du preset.
 *
 * Cela permet ensuite de savoir si le système peut remplacer le nom automatiquement
 * sans écraser un nom personnalisé.
 *
 * @param {string} itemType - Type d’item : weapon, armor, shield, etc.
 * @param {string} currentName - Nom actuel de l’item.
 * @param {string} baseName - Base du preset.
 * @returns {boolean} `true` si le nom peut être considéré comme un nom de preset.
 */
export function shouldUsePresetName(itemType, currentName, baseName) {
  const name = String(currentName ?? "").trim();

  if (!name) return true;

  const localizedName = localizePresetName(itemType, baseName, baseName);

  return name === localizedName || name === String(baseName ?? "");
}

/**
 * Prépare les données d’enchantement d’un item.
 *
 * Si l’item n’est pas enchantable, la fonction ne fait rien.
 *
 * Pour les items enchantables :
 * - normalise le champ `system.enchanting` ;
 * - initialise les bonus dérivés d’enchantement ;
 * - applique chaque ligne de bonus d’item issue des enchantements.
 *
 * @param {Item} item - Item à préparer.
 * @param {object} system - Données système de l’item.
 * @returns {void}
 */
export function prepareEnchantingData(item, system) {
  if (!isEnchantableItem(item)) return;

  if (Object.prototype.hasOwnProperty.call(system, "equipped")) {
    system.equipped = Boolean(system.equipped);
  }

  system.enchanting = normalizeEnchantingData(system.enchanting);

  system.derived ??= {};
  system.derived.enchanting = {
    damageDiceBonus: 0,
    rangeMetersBonus: 0,
    zoneRangeMetersBonus: 0,
    requirementReduction: 0
  };

  for (const entry of asArray(system.enchanting.entries)) {
    applyEnchantmentItemBonusRows(item, system, entry.itemBonuses);
  }
}

/**
 * Normalise les sauvegardes d’un item.
 *
 * La fonction accepte deux formats :
 *
 * ```js
 * [{ key: "armor", value: 2 }]
 * ```
 *
 * ou :
 *
 * ```js
 * { armor: 2, fire: 1 }
 * ```
 *
 * Les valeurs de `fallbackSaves` sont appliquées d’abord.
 * Les valeurs de `currentSaves` les remplacent ensuite si elles existent.
 *
 * @param {Array<object>|object|null} currentSaves - Sauvegardes actuelles prioritaires.
 * @param {Array<object>|object} [fallbackSaves=[]] - Sauvegardes de fallback.
 * @returns {Record<string, number>} Sauvegardes normalisées.
 */
export function normalizeItemSaveMap(currentSaves, fallbackSaves = []) {
  const result = Object.fromEntries(
    ITEM_SAVE_KEYS.map((key) => [key, 0])
  );

  applySaveValues(result, fallbackSaves);
  applySaveValues(result, currentSaves);

  return result;
}

/**
 * Applique des valeurs de sauvegarde à une table cible.
 *
 * Les clés inconnues sont ignorées.
 *
 * @param {Record<string, number>} target - Table de sauvegardes à modifier.
 * @param {Array<object>|object|null} saves - Sauvegardes brutes à appliquer.
 * @returns {void}
 */
function applySaveValues(target, saves) {
  if (Array.isArray(saves)) {
    for (const entry of saves) {
      const key = String(entry?.key ?? entry?.type ?? "");

      if (!key || !(key in target)) continue;

      target[key] = toFiniteNumber(entry?.value, 0);
    }

    return;
  }

  if (saves && typeof saves === "object") {
    for (const key of Object.keys(target)) {
      if (!(key in saves)) continue;

      target[key] = toFiniteNumber(saves[key], target[key]);
    }
  }
}

/**
 * Convertit une valeur en nombre fini.
 *
 * @param {unknown} value - Valeur brute.
 * @param {number} [fallback=0] - Valeur utilisée si la donnée est invalide.
 * @returns {number} Nombre fini.
 */
function toFiniteNumber(value, fallback = 0) {
  const numericValue = Number(value ?? fallback);

  return Number.isFinite(numericValue)
    ? numericValue
    : fallback;
}

