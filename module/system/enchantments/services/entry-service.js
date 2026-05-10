/**
 * Service de création et de normalisation des entrées d’enchantement.
 *
 * Responsabilités :
 * - créer les bonus acteur et item par défaut ;
 * - créer les informations de source d’enchantement par défaut ;
 * - créer une entrée d’enchantement personnalisée ;
 * - normaliser les entrées d’enchantement existantes ;
 * - filtrer les cibles de bonus non supportées ;
 * - normaliser les données globales d’enchantement d’un item ;
 * - calculer les données dérivées liées aux capacités, slots et poids magique.
 *
 * Ce fichier doit rester dédié à la structure des données d’enchantement.
 * Il ne doit pas appliquer les bonus sur les items ou acteurs,
 * choisir les affixes, consommer les catalyseurs ou gérer l’interface.
 */

import {
  ENCHANTMENT_ENTRY_FAMILIES,
  ENCHANTMENT_ENTRY_SIDES
} from "../constants.js";
import { getEnchantmentCapacity } from "./capacity-service.js";
import { computeEnchantingTotals } from "./weight-service.js";
import {
  isSupportedEnchantmentActorTarget,
  isSupportedEnchantmentItemTarget
} from "../supported-targets.js";

const MIN_ENCHANTMENT_RANK = 1;
const MAX_ENCHANTMENT_RANK = 7;

const ENCHANTMENT_SOURCE_TYPES = Object.freeze({
  custom: "custom",
  registry: "registry"
});

/**
 * Crée une ligne de bonus acteur par défaut.
 *
 * @returns {{id: string, targetKey: string, value: number, notes: string}} Bonus acteur vide.
 */
export function createDefaultEnchantmentActorBonus() {
  return {
    id: foundry.utils.randomID(),
    targetKey: "",
    value: 0,
    notes: ""
  };
}

/**
 * Crée une ligne de bonus item par défaut.
 *
 * @returns {{id: string, targetKey: string, value: number, notes: string}} Bonus item vide.
 */
export function createDefaultEnchantmentItemBonus() {
  return {
    id: foundry.utils.randomID(),
    targetKey: "",
    value: 0,
    notes: ""
  };
}

/**
 * Crée les données de source par défaut d’une entrée d’enchantement.
 *
 * La source permet de savoir avec quel catalyseur, quelle essence
 * et quelle opération une entrée a été créée.
 *
 * @returns {{catalystBase: string, essenceQuality: string, essenceTag: string, operation: string}} Source vide.
 */
export function createDefaultEnchantmentSource() {
  return {
    catalystBase: "",
    essenceQuality: "none",
    essenceTag: "",
    operation: ""
  };
}

/**
 * Crée une entrée d’enchantement personnalisée.
 *
 * Une entrée personnalisée n’est pas liée au registre d’affixes ou de malédictions.
 * Elle peut ensuite être remplie manuellement depuis l’interface.
 *
 * @param {object} [options={}] - Options de création.
 * @param {string} [options.family="affix"] - Famille : affix ou curse.
 * @param {string} [options.side="prefix"] - Côté : prefix ou suffix.
 * @returns {object} Entrée d’enchantement vide.
 */
export function createCustomEnchantmentEntry({
  family = "affix",
  side = "prefix"
} = {}) {
  return {
    id: foundry.utils.randomID(),
    sourceType: "custom",
    definitionId: "",
    family: normalizeEntryFamily(family),
    side: normalizeEntrySide(side),
    label: "",
    description: "",
    tagsText: "",
    rank: MIN_ENCHANTMENT_RANK,
    magicWeight: 0,
    locked: false,
    source: createDefaultEnchantmentSource(),
    actorBonuses: [],
    itemBonuses: []
  };
}

/**
 * Normalise les bonus acteur d’une entrée d’enchantement.
 *
 * Les bonus sans cible sont conservés pour permettre l’édition depuis l’interface.
 * Les bonus avec une cible inconnue sont supprimés.
 *
 * @param {Array<object>} [entries=[]] - Bonus acteur bruts.
 * @returns {object[]} Bonus acteur normalisés.
 */
function normalizeActorBonuses(entries = []) {
  return asArray(entries)
    .map((entry) => ({
      id: String(entry?.id ?? foundry.utils.randomID()),
      targetKey: String(entry?.targetKey ?? "").trim(),
      value: toInteger(entry?.value),
      notes: String(entry?.notes ?? "")
    }))
    .filter((entry) => {
      return !entry.targetKey || isSupportedEnchantmentActorTarget(entry.targetKey);
    });
}

/**
 * Normalise les bonus item d’une entrée d’enchantement.
 *
 * Les bonus sans cible sont conservés pour permettre l’édition depuis l’interface.
 * Les bonus avec une cible inconnue sont supprimés.
 *
 * @param {Array<object>} [entries=[]] - Bonus item bruts.
 * @returns {object[]} Bonus item normalisés.
 */
function normalizeItemBonuses(entries = []) {
  return asArray(entries)
    .map((entry) => ({
      id: String(entry?.id ?? foundry.utils.randomID()),
      targetKey: String(entry?.targetKey ?? "").trim(),
      value: toFiniteNumber(entry?.value, 0),
      notes: String(entry?.notes ?? "")
    }))
    .filter((entry) => {
      return !entry.targetKey || isSupportedEnchantmentItemTarget(entry.targetKey);
    });
}

/**
 * Normalise les données de source d’une entrée d’enchantement.
 *
 * @param {object} [source={}] - Source brute.
 * @returns {{catalystBase: string, essenceQuality: string, essenceTag: string, operation: string}} Source normalisée.
 */
function normalizeSource(source = {}) {
  return {
    catalystBase: String(source?.catalystBase ?? "").trim(),
    essenceQuality: String(source?.essenceQuality ?? "none").trim() || "none",
    essenceTag: String(source?.essenceTag ?? "").trim(),
    operation: String(source?.operation ?? "").trim()
  };
}

/**
 * Normalise une entrée d’enchantement.
 *
 * La fonction garantit une structure stable pour :
 * - l’identité de l’entrée ;
 * - la source ;
 * - la famille ;
 * - le côté ;
 * - le rang ;
 * - le poids magique ;
 * - les bonus acteur ;
 * - les bonus item.
 *
 * @param {object} [entry={}] - Entrée brute.
 * @param {object} [fallback={}] - Valeurs de fallback.
 * @returns {object} Entrée normalisée.
 */
export function normalizeEnchantmentEntry(entry = {}, fallback = {}) {
  const family = entry?.family ?? fallback.family ?? "affix";
  const side = entry?.side ?? fallback.side ?? "prefix";

  return {
    id: String(entry?.id ?? foundry.utils.randomID()),
    sourceType: normalizeSourceType(entry?.sourceType),
    definitionId: String(entry?.definitionId ?? "").trim(),
    family: normalizeEntryFamily(family),
    side: normalizeEntrySide(side),
    label: String(entry?.label ?? ""),
    description: String(entry?.description ?? ""),
    tagsText: String(entry?.tagsText ?? ""),
    rank: clampEnchantmentRank(entry?.rank),
    magicWeight: toFiniteNumber(entry?.magicWeight, 0),
    locked: Boolean(entry?.locked),
    source: normalizeSource(entry?.source),
    actorBonuses: normalizeActorBonuses(entry?.actorBonuses),
    itemBonuses: normalizeItemBonuses(entry?.itemBonuses)
  };
}

/**
 * Normalise les données globales d’enchantement d’un item.
 *
 * La fonction :
 * - calcule la capacité selon la qualité de base ;
 * - normalise toutes les entrées ;
 * - calcule les totaux de préfixes, suffixes, affixes, malédictions et poids magique ;
 * - renvoie une structure stable prête à être stockée dans `system.enchanting`.
 *
 * Important :
 * `derived` ici concerne les capacités et le résumé structurel de l’enchantement.
 * Les bonus appliqués à l’item peuvent rester dans `system.derived.enchanting`.
 *
 * @param {object} [enchanting={}] - Données d’enchantement brutes.
 * @returns {object} Données d’enchantement normalisées.
 */
export function normalizeEnchantingData(enchanting = {}) {
  const capacity = getEnchantmentCapacity(
    enchanting?.baseQuality ?? "base",
    enchanting?.customPrefixMax ?? 1,
    enchanting?.customSuffixMax ?? 1
  );

  const entries = asArray(enchanting?.entries).map((entry) => {
    return normalizeEnchantmentEntry(entry);
  });

  const totals = computeEnchantingTotals(entries, capacity);

  return {
    baseQuality: capacity.baseQuality,
    customPrefixMax: capacity.prefixMax,
    customSuffixMax: capacity.suffixMax,
    notes: String(enchanting?.notes ?? ""),
    entries,
    derived: {
      prefixMax: totals.prefixMax,
      suffixMax: totals.suffixMax,
      prefixUsed: totals.prefixUsed,
      suffixUsed: totals.suffixUsed,
      prefixAvailable: totals.prefixAvailable,
      suffixAvailable: totals.suffixAvailable,
      affixCount: totals.affixCount,
      curseCount: totals.curseCount,
      totalMagicWeight: totals.totalMagicWeight
    }
  };
}

/**
 * Normalise une famille d’entrée.
 *
 * @param {unknown} value - Famille brute.
 * @returns {"affix"|"curse"} Famille normalisée.
 */
function normalizeEntryFamily(value) {
  const family = String(value ?? "affix").trim();

  return Object.hasOwn(ENCHANTMENT_ENTRY_FAMILIES, family)
    ? family
    : "affix";
}

/**
 * Normalise un côté d’entrée.
 *
 * @param {unknown} value - Côté brut.
 * @returns {"prefix"|"suffix"} Côté normalisé.
 */
function normalizeEntrySide(value) {
  const side = String(value ?? "prefix").trim();

  return Object.hasOwn(ENCHANTMENT_ENTRY_SIDES, side)
    ? side
    : "prefix";
}

/**
 * Normalise le type de source d’une entrée.
 *
 * @param {unknown} value - Type de source brut.
 * @returns {"custom"|"registry"} Type de source normalisé.
 */
function normalizeSourceType(value) {
  const sourceType = String(value ?? "custom").trim();

  return Object.hasOwn(ENCHANTMENT_SOURCE_TYPES, sourceType)
    ? sourceType
    : "custom";
}

/**
 * Borne un rang d’enchantement entre 1 et 7.
 *
 * @param {unknown} value - Rang brut.
 * @returns {number} Rang borné.
 */
function clampEnchantmentRank(value) {
  const numericValue = Math.floor(Number(value) || MIN_ENCHANTMENT_RANK);

  return Math.max(
    MIN_ENCHANTMENT_RANK,
    Math.min(MAX_ENCHANTMENT_RANK, numericValue)
  );
}

/**
 * Convertit une valeur en tableau.
 *
 * @param {unknown} value - Valeur brute.
 * @returns {Array} Tableau valide ou tableau vide.
 */
function asArray(value) {
  return Array.isArray(value) ? value : [];
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
 * @param {number} [fallback=0] - Fallback utilisé si la valeur est invalide.
 * @returns {number} Nombre fini.
 */
function toFiniteNumber(value, fallback = 0) {
  const numericValue = Number(value ?? fallback);

  return Number.isFinite(numericValue)
    ? numericValue
    : fallback;
}