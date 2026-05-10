/**
 * Constantes centrales du système d’enchantement.
 *
 * Responsabilités :
 * - déclarer les types d’items pouvant recevoir des enchantements ;
 * - déclarer les familles d’entrées d’enchantement : affixe ou malédiction ;
 * - déclarer les positions d’entrées : préfixe ou suffixe ;
 * - déclarer les qualités de base d’enchantement et leurs capacités ;
 * - fournir des helpers pour vérifier si un type ou un item est enchantable.
 *
 * Ce fichier doit rester un référentiel de constantes.
 * Il ne doit pas contenir la logique d’application des enchantements,
 * de génération d’affixes, de rendu de fiche ou de dialogue.
 */

export const ENCHANTABLE_ITEM_TYPES = Object.freeze([
  "weapon",
  "armor",
  "shield",
  "gear",
  "object",
  "tool",
  "consumable"
]);

export const ENCHANTMENT_ENTRY_FAMILIES = Object.freeze({
  affix: "affix",
  curse: "curse"
});

export const ENCHANTMENT_ENTRY_SIDES = Object.freeze({
  prefix: "prefix",
  suffix: "suffix"
});

export const ENCHANTMENT_BASE_QUALITIES = Object.freeze({
  base: Object.freeze({
    prefixMax: 1,
    suffixMax: 1,
    labelKey: "ETERN.ENCHANTING.BASE_QUALITY.BASE"
  }),

  silver: Object.freeze({
    prefixMax: 2,
    suffixMax: 1,
    labelKey: "ETERN.ENCHANTING.BASE_QUALITY.SILVER"
  }),

  gold: Object.freeze({
    prefixMax: 1,
    suffixMax: 2,
    labelKey: "ETERN.ENCHANTING.BASE_QUALITY.GOLD"
  }),

  platinum: Object.freeze({
    prefixMax: 2,
    suffixMax: 2,
    labelKey: "ETERN.ENCHANTING.BASE_QUALITY.PLATINUM"
  }),

  custom: Object.freeze({
    prefixMax: 1,
    suffixMax: 1,
    labelKey: "ETERN.ENCHANTING.BASE_QUALITY.CUSTOM"
  })
});

/**
 * Vérifie si un type d’item peut recevoir des enchantements.
 *
 * Cette fonction ne regarde que le type d’item.
 * Pour vérifier un item complet, utiliser `isEnchantableItem()`.
 *
 * @param {unknown} type - Type d’item brut.
 * @returns {boolean} `true` si le type est enchantable.
 */
export function isEnchantableItemType(type) {
  return ENCHANTABLE_ITEM_TYPES.includes(String(type ?? ""));
}

/**
 * Vérifie si un item peut recevoir des enchantements.
 *
 * Tous les types présents dans `ENCHANTABLE_ITEM_TYPES` sont enchantables,
 * sauf les consommables de catégorie `enchantmentCatalyst`.
 *
 * Les catalyseurs d’enchantement servent à créer ou modifier des enchantements,
 * mais ne doivent pas eux-mêmes recevoir d’enchantements.
 *
 * @param {Item|null} item - Item à vérifier.
 * @returns {boolean} `true` si l’item peut être enchanté.
 */
export function isEnchantableItem(item) {
  if (!isEnchantableItemType(item?.type)) return false;

  if (String(item?.type ?? "") !== "consumable") return true;

  return String(item?.system?.category ?? "").trim() !== "enchantmentCatalyst";
}