/**
 * Service de sélection des affixes d’enchantement.
 *
 * Responsabilités :
 * - normaliser le côté demandé : préfixe, suffixe ou aléatoire ;
 * - choisir automatiquement le côté le plus adapté selon les slots disponibles ;
 * - exclure les affixes déjà présents sur l’item ;
 * - exclure des définitions explicitement interdites ;
 * - filtrer les affixes selon le type, la catégorie, la base et les tags de l’item ;
 * - construire le pool final d’affixes compatibles.
 *
 * Ce fichier doit rester dédié à la sélection des définitions d’affixes.
 * Il ne doit pas créer d’entrée d’enchantement, modifier l’item,
 * appliquer les bonus ou gérer le dialogue.
 */

import { asArray } from '../../../utils/arrays.js';
import { isEnchantableItem } from "../constants.js";
import { getRegisteredAffixesForItemType } from "../registry.js";
import {
  hasAnySharedTag,
  itemMatchesEnchantmentDefinition,
  splitTags
} from "../definition-helpers.js";

const ENCHANTMENT_SIDES = Object.freeze({
  PREFIX: "prefix",
  SUFFIX: "suffix",
  RANDOM: "random"
});

/**
 * Normalise un côté d’enchantement.
 *
 * Les valeurs acceptées sont :
 * - `prefix` ;
 * - `suffix` ;
 * - `random`.
 *
 * Toute valeur inconnue revient à `random`.
 *
 * @param {unknown} value - Côté brut.
 * @returns {"prefix"|"suffix"|"random"} Côté normalisé.
 */
function normalizeSide(value = ENCHANTMENT_SIDES.RANDOM) {
  const normalized = String(value ?? ENCHANTMENT_SIDES.RANDOM).trim().toLowerCase();

  return Object.values(ENCHANTMENT_SIDES).includes(normalized)
    ? normalized
    : ENCHANTMENT_SIDES.RANDOM;
}

/**
 * Récupère les ids de définitions d’affixes déjà utilisés.
 *
 * Seules les entrées de famille `affix` sont prises en compte.
 * Les malédictions ne bloquent donc pas les ids d’affixes.
 *
 * @param {Array<object>} [entries=[]] - Entrées d’enchantement actuelles.
 * @returns {Set<string>} Ensemble des ids d’affixes déjà utilisés.
 */
function getUsedDefinitionIds(entries = []) {
  return new Set(
    asArray(entries)
      .filter((entry) => String(entry?.family ?? "affix") === "affix")
      .map((entry) => String(entry?.definitionId ?? "").trim())
      .filter(Boolean)
  );
}

/**
 * Choisit le côté préféré pour un nouvel affixe.
 *
 * Si le côté demandé est `prefix` ou `suffix`, il est utilisé directement.
 *
 * Si le côté demandé est `random`, la fonction :
 * - privilégie le côté qui a encore des slots disponibles ;
 * - sinon équilibre selon le nombre d’entrées déjà présentes ;
 * - en cas d’égalité, choisit `prefix`.
 *
 * La fonction lit les données dérivées depuis :
 * - `item.system.derived.enchanting` ;
 * - fallback ancien : `item.system.enchanting.derived`.
 *
 * @param {Item} item - Item enchanté.
 * @param {Array<object>} [entries=[]] - Entrées d’enchantement actuelles.
 * @param {string} [preferredSide="random"] - Côté demandé.
 * @returns {"prefix"|"suffix"} Côté choisi.
 */
export function choosePreferredSide(
  item,
  entries = [],
  preferredSide = ENCHANTMENT_SIDES.RANDOM
) {
  const side = normalizeSide(preferredSide);

  if (side !== ENCHANTMENT_SIDES.RANDOM) {
    return side;
  }

  const derived = getEnchantingDerivedData(item);
  const prefixAvailable = Number(derived?.prefixAvailable ?? 0) || 0;
  const suffixAvailable = Number(derived?.suffixAvailable ?? 0) || 0;

  if (prefixAvailable > 0 && suffixAvailable <= 0) {
    return ENCHANTMENT_SIDES.PREFIX;
  }

  if (suffixAvailable > 0 && prefixAvailable <= 0) {
    return ENCHANTMENT_SIDES.SUFFIX;
  }

  const affixEntries = asArray(entries).filter((entry) => {
    return String(entry?.family ?? "affix") === "affix";
  });

  const prefixCount = affixEntries.filter((entry) => {
    return String(entry?.side ?? ENCHANTMENT_SIDES.PREFIX) === ENCHANTMENT_SIDES.PREFIX;
  }).length;

  const suffixCount = affixEntries.filter((entry) => {
    return String(entry?.side ?? ENCHANTMENT_SIDES.PREFIX) === ENCHANTMENT_SIDES.SUFFIX;
  }).length;

  return prefixCount <= suffixCount
    ? ENCHANTMENT_SIDES.PREFIX
    : ENCHANTMENT_SIDES.SUFFIX;
}

/**
 * Construit le pool d’affixes compatibles avec un item.
 *
 * La fonction filtre les affixes selon :
 * - le type d’item ;
 * - le côté choisi ;
 * - les définitions déjà utilisées ;
 * - les définitions explicitement exclues ;
 * - les contraintes de compatibilité de la définition ;
 * - les tags requis ou les tags partagés avec une entrée existante.
 *
 * @param {Item} item - Item à enchanter.
 * @param {Array<object>} [entries=[]] - Entrées d’enchantement déjà présentes.
 * @param {object} [options={}] - Options de filtrage.
 * @param {string} [options.preferredSide="random"] - Côté souhaité.
 * @param {Array<string>|string} [options.requiredTags=[]] - Tags requis.
 * @param {object|null} [options.sameTagAsEntry=null] - Entrée utilisée comme référence de tags.
 * @param {Array<string>} [options.excludedDefinitionIds=[]] - Définitions à exclure.
 * @returns {object[]} Pool d’affixes compatibles.
 */
export function buildAffixPool(
  item,
  entries = [],
  {
    preferredSide = ENCHANTMENT_SIDES.RANDOM,
    requiredTags = [],
    sameTagAsEntry = null,
    excludedDefinitionIds = []
  } = {}
) {
  if (!isEnchantableItem(item)) return [];

  const itemType = String(item?.type ?? "").trim();
  const usedDefinitionIds = getUsedDefinitionIds(entries);

  for (const definitionId of asArray(excludedDefinitionIds)) {
    const normalizedId = String(definitionId ?? "").trim();

    if (normalizedId) {
      usedDefinitionIds.add(normalizedId);
    }
  }

  const side = choosePreferredSide(item, entries, preferredSide);
  const tagRequirement = sameTagAsEntry
    ? splitTags(sameTagAsEntry?.tagsText ?? sameTagAsEntry?.tags ?? [])
    : requiredTags;

  return getRegisteredAffixesForItemType(itemType).filter((definition) => {
    if (String(definition?.side ?? "") !== side) return false;
    if (usedDefinitionIds.has(String(definition?.id ?? ""))) return false;
    if (!itemMatchesEnchantmentDefinition(item, definition)) return false;
    if (!hasAnySharedTag(definition?.tags ?? [], tagRequirement)) return false;

    return true;
  });
}

/**
 * Récupère les données dérivées d’enchantement d’un item.
 *
 * Le chemin principal attendu est :
 *
 * ```js
 * item.system.derived.enchanting
 * ```
 *
 * Un fallback est conservé vers :
 *
 * ```js
 * item.system.enchanting.derived
 * ```
 *
 * @param {Item} item - Item enchanté.
 * @returns {object} Données dérivées d’enchantement.
 */
function getEnchantingDerivedData(item) {
  return item?.system?.derived?.enchanting
    ?? item?.system?.enchanting?.derived
    ?? {};
}

