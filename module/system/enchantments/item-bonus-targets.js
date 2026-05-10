/**
 * Gestion des bonus d’enchantement appliqués aux items.
 *
 * Responsabilités :
 * - déclarer les cibles de bonus disponibles pour les items ;
 * - construire les choix de cibles affichés dans l’interface d’enchantement ;
 * - appliquer les bonus numériques d’enchantement sur les données système d’un item ;
 * - mettre à jour les données dérivées d’enchantement utilisées par le résumé ;
 * - gérer les bonus spécifiques aux armes, armures, boucliers et sauvegardes.
 *
 * Ce fichier doit rester dédié aux bonus d’item.
 * Il ne doit pas gérer les bonus d’acteur, la génération d’enchantements,
 * le rendu de fiche ou la définition des affixes.
 */

import {
  ITEM_SAVE_KEYS,
  ITEM_SAVE_LABEL_KEYS
} from "../constants/save-keys.js";
import { isSupportedEnchantmentItemTarget } from "./supported-targets.js";

const COMMON_ITEM_BONUS_TARGETS = Object.freeze([
  {
    value: "weight",
    labelKey: "ETERN.ENCHANTING.ITEM_TARGET.WEIGHT"
  },
  {
    value: "special.requirementReduction",
    labelKey: "ETERN.ENCHANTING.ITEM_TARGET.REQUIREMENT_REDUCTION"
  }
]);

const TYPE_ITEM_BONUS_TARGETS = Object.freeze({
  weapon: Object.freeze([
    {
      value: "precisionBonus",
      labelKey: "ETERN.ENCHANTING.ITEM_TARGET.PRECISION_BONUS"
    },
    {
      value: "damageDiceBonus",
      labelKey: "ETERN.ENCHANTING.ITEM_TARGET.DAMAGE_DICE_BONUS"
    },
    {
      value: "rangeMeters",
      labelKey: "ETERN.ENCHANTING.ITEM_TARGET.RANGE_METERS"
    },
    {
      value: "zoneRangeMeters",
      labelKey: "ETERN.ENCHANTING.ITEM_TARGET.ZONE_RANGE_METERS"
    }
  ]),

  armor: Object.freeze([
    {
      value: "defBonus",
      labelKey: "ETERN.ENCHANTING.ITEM_TARGET.DEF_BONUS"
    }
  ]),

  shield: Object.freeze([
    {
      value: "defBonus",
      labelKey: "ETERN.ENCHANTING.ITEM_TARGET.DEF_BONUS"
    }
  ]),

  gear: Object.freeze([]),
  object: Object.freeze([]),
  tool: Object.freeze([]),
  consumable: Object.freeze([])
});

/**
 * Ajoute un bonus en mètres à une valeur textuelle.
 *
 * La fonction ne modifie que les valeurs au format :
 * - `6m`
 * - `6.5m`
 * - `6,5m`
 *
 * Si la valeur ne correspond pas à ce format, elle est renvoyée telle quelle.
 *
 * @param {unknown} rawValue - Valeur de portée brute.
 * @param {number} numericValue - Bonus numérique en mètres.
 * @returns {string} Portée ajustée ou valeur d’origine.
 */
function addMeterBonus(rawValue, numericValue) {
  const normalized = String(rawValue ?? "").trim();

  if (!normalized) return normalized;

  const match = normalized.match(/^(\d+(?:[\.,]\d+)?)\s*m$/i);

  if (!match) return normalized;

  const current = Number(String(match[1]).replace(",", "."));

  if (!Number.isFinite(current)) return normalized;

  const next = current + numericValue;

  return `${formatNumber(next)}m`;
}

/**
 * Ajoute un bonus de dés de dégâts à une formule textuelle.
 *
 * Exemple :
 * - `3d6` avec `1` devient `3d6 + 1d6`
 * - `3d6` avec `-1` devient `3d6 - 1d6`
 *
 * @param {unknown} rawValue - Formule de dégâts brute.
 * @param {number} numericValue - Nombre de dés à ajouter ou retirer.
 * @returns {string} Formule de dégâts ajustée.
 */
function appendDamageDice(rawValue, numericValue) {
  const base = String(rawValue ?? "").trim();
  const diceCount = toInteger(numericValue);

  if (!diceCount) return base;

  const sign = diceCount >= 0 ? "+" : "-";
  const amount = Math.abs(diceCount);
  const suffix = `${amount}d6`;

  if (!base) {
    return diceCount >= 0 ? suffix : `-${suffix}`;
  }

  return `${base} ${sign} ${suffix}`;
}

/**
 * Garantit l’existence de `system.derived.enchanting`.
 *
 * Cette fonction initialise aussi chaque propriété numérique manquante.
 * Cela évite les `NaN` lors des additions avec `+=`.
 *
 * @param {object} system - Données système de l’item.
 * @returns {{damageDiceBonus: number, rangeMetersBonus: number, zoneRangeMetersBonus: number, requirementReduction: number}} Données dérivées d’enchantement.
 */
function ensureEnchantingDerived(system) {
  system.derived ??= {};
  system.derived.enchanting ??= {};

  const derived = system.derived.enchanting;

  derived.damageDiceBonus = toInteger(derived.damageDiceBonus);
  derived.rangeMetersBonus = toFiniteNumber(derived.rangeMetersBonus, 0);
  derived.zoneRangeMetersBonus = toFiniteNumber(derived.zoneRangeMetersBonus, 0);
  derived.requirementReduction = toInteger(derived.requirementReduction);

  return derived;
}

/**
 * Construit les choix de cibles de bonus d’item pour l’interface d’enchantement.
 *
 * Les choix incluent :
 * - les cibles communes à tous les items enchantables ;
 * - les cibles spécifiques au type d’item ;
 * - les sauvegardes pour les armures et boucliers.
 *
 * @param {string} itemType - Type d’item.
 * @param {string} [selected=""] - Cible actuellement sélectionnée.
 * @returns {{value: string, label: string, selected: boolean}[]} Choix de cibles.
 */
export function getEnchantmentItemBonusTargetChoices(itemType, selected = "") {
  const current = String(selected ?? "").trim();
  const targets = getItemBonusTargetsForType(itemType);

  return [
    {
      value: "",
      label: game.i18n.localize("ETERN.ENCHANTING.ITEM_TARGET.EMPTY"),
      selected: current === ""
    },
    ...targets.map((target) => ({
      value: target.value,
      label: game.i18n.localize(target.labelKey),
      selected: current === target.value
    }))
  ];
}

/**
 * Applique une liste de bonus d’enchantement sur un item.
 *
 * La fonction ignore :
 * - les lignes invalides ;
 * - les cibles non supportées ;
 * - les cibles non disponibles pour le type d’item ;
 * - les valeurs non numériques ;
 * - les valeurs égales à 0.
 *
 * @param {Item} item - Item enchanté.
 * @param {object} system - Données système mutables de l’item.
 * @param {Array<object>} [rows=[]] - Lignes de bonus à appliquer.
 * @returns {void}
 */
export function applyEnchantmentItemBonusRows(item, system, rows = []) {
  if (!Array.isArray(rows)) return;

  const itemType = String(item?.type ?? "");

  for (const row of rows) {
    const targetKey = String(row?.targetKey ?? "").trim();

    if (!targetKey) continue;
    if (!isSupportedEnchantmentItemTarget(targetKey)) continue;
    if (!isAllowedItemBonusTargetForType(itemType, targetKey)) continue;

    const numericValue = Number(row?.value ?? 0);

    if (!Number.isFinite(numericValue) || numericValue === 0) continue;

    applyEnchantmentItemBonus(system, targetKey, numericValue);
  }
}

/**
 * Applique un bonus unique sur les données système d’un item.
 *
 * @param {object} system - Données système de l’item.
 * @param {string} targetKey - Cible du bonus.
 * @param {number} numericValue - Valeur numérique du bonus.
 * @returns {void}
 */
function applyEnchantmentItemBonus(system, targetKey, numericValue) {
  if (targetKey === "weight") {
    system.weight = Math.max(0, toFiniteNumber(system.weight, 0) + numericValue);
    return;
  }

  if (targetKey === "special.requirementReduction") {
    ensureEnchantingDerived(system).requirementReduction += toInteger(numericValue);
    return;
  }

  if (targetKey === "precisionBonus" && "precisionBonus" in system) {
    system.precisionBonus = toInteger(system.precisionBonus) + toInteger(numericValue);
    return;
  }

  if (targetKey === "damageDiceBonus" && "damage" in system) {
    system.damage = appendDamageDice(system.damage, numericValue);
    ensureEnchantingDerived(system).damageDiceBonus += toInteger(numericValue);
    return;
  }

  if (targetKey === "rangeMeters" && "range" in system) {
    system.range = addMeterBonus(system.range, numericValue);
    ensureEnchantingDerived(system).rangeMetersBonus += numericValue;
    return;
  }

  if (targetKey === "zoneRangeMeters") {
    ensureEnchantingDerived(system).zoneRangeMetersBonus += numericValue;
    return;
  }

  if (targetKey === "defBonus" && "defBonus" in system) {
    system.defBonus = toInteger(system.defBonus) + toInteger(numericValue);

    if ("defense" in system) {
      system.defense = system.defBonus;
    }

    return;
  }

  if (targetKey.startsWith("saves.")) {
    applySaveBonus(system, targetKey, numericValue);
  }
}

/**
 * Applique un bonus de sauvegarde sur un item.
 *
 * @param {object} system - Données système de l’item.
 * @param {string} targetKey - Cible au format `saves.<saveKey>`.
 * @param {number} numericValue - Valeur du bonus.
 * @returns {void}
 */
function applySaveBonus(system, targetKey, numericValue) {
  if (!system.saves || typeof system.saves !== "object") return;

  const saveKey = targetKey.slice("saves.".length);

  if (!(saveKey in system.saves)) return;

  system.saves[saveKey] = toInteger(system.saves[saveKey]) + toInteger(numericValue);
}

/**
 * Récupère les cibles disponibles pour un type d’item.
 *
 * @param {unknown} itemType - Type d’item.
 * @returns {{value: string, labelKey: string}[]} Cibles disponibles.
 */
function getItemBonusTargetsForType(itemType) {
  const normalizedType = String(itemType ?? "");
  const typeTargets = TYPE_ITEM_BONUS_TARGETS[normalizedType] ?? [];
  const saveTargets = ["armor", "shield"].includes(normalizedType)
    ? buildSaveTargets()
    : [];

  return [
    ...COMMON_ITEM_BONUS_TARGETS,
    ...typeTargets,
    ...saveTargets
  ];
}

/**
 * Vérifie si une cible est autorisée pour un type d’item.
 *
 * Cette vérification évite par exemple d’appliquer un bonus de défense
 * à une arme ou un bonus de précision à une armure.
 *
 * @param {unknown} itemType - Type d’item.
 * @param {string} targetKey - Cible à vérifier.
 * @returns {boolean} `true` si la cible est autorisée pour ce type.
 */
function isAllowedItemBonusTargetForType(itemType, targetKey) {
  return getItemBonusTargetsForType(itemType).some((target) => {
    return target.value === targetKey;
  });
}

/**
 * Construit les cibles de sauvegardes.
 *
 * @returns {{value: string, labelKey: string}[]} Cibles de sauvegardes.
 */
function buildSaveTargets() {
  return ITEM_SAVE_KEYS.map((saveKey) => ({
    value: `saves.${saveKey}`,
    labelKey: ITEM_SAVE_LABEL_KEYS[saveKey] ?? saveKey
  }));
}

/**
 * Convertit une valeur en entier.
 *
 * Les valeurs négatives sont conservées.
 *
 * @param {unknown} value - Valeur brute.
 * @returns {number} Entier normalisé.
 */
function toInteger(value) {
  const numericValue = Number(value ?? 0);

  if (!Number.isFinite(numericValue)) return 0;

  return Math.trunc(numericValue);
}

/**
 * Convertit une valeur en nombre fini.
 *
 * @param {unknown} value - Valeur brute.
 * @param {number} [fallback=0] - Valeur utilisée si la valeur est invalide.
 * @returns {number} Nombre fini.
 */
function toFiniteNumber(value, fallback = 0) {
  const numericValue = Number(value ?? fallback);

  return Number.isFinite(numericValue)
    ? numericValue
    : fallback;
}

/**
 * Formate un nombre pour une valeur textuelle.
 *
 * @param {number} value - Valeur numérique.
 * @returns {string} Nombre formaté.
 */
function formatNumber(value) {
  return Number.isInteger(value)
    ? String(Math.trunc(value))
    : String(Number(value.toFixed(2)));
}