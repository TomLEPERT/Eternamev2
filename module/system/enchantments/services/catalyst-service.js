/**
 * Service d’application des catalyseurs d’enchantement.
 *
 * Responsabilités :
 * - appliquer une règle de catalyseur à un item enchantable ;
 * - ajouter, retirer, relancer, verrouiller ou améliorer des entrées d’enchantement ;
 * - générer des affixes compatibles avec l’item ;
 * - générer une malédiction si la règle ou le résultat l’exige ;
 * - consommer le catalyseur utilisé ;
 * - persister les nouvelles entrées d’enchantement sur l’item.
 *
 * Ce fichier orchestre plusieurs services d’enchantement.
 * Il ne doit pas contenir les définitions d’affixes, les règles de capacité,
 * les templates de dialogue ou l’application finale des bonus dérivés.
 */

import { asArray } from '../../../utils/arrays.js';
import { toPositiveInteger } from '../../../utils/numbers.js';
import {
  getCatalystDefinition,
  normalizeCatalystBase,
  normalizeEssenceQuality
} from "../../constants/consumables.js";

import { isEnchantableItem } from "../constants.js";
import { getEnchantmentCatalystRule } from "../catalysts.js";
import { splitTags } from "../definition-helpers.js";
import { getEnchantmentDefinition } from "../registry.js";
import { createEnchantmentEntryFromDefinition } from "./generation-service.js";
import { normalizeEnchantingData } from "./entry-service.js";
import { buildAffixPool } from "./pool-service.js";
import { buildEnchantmentRankResult } from "./rank-service.js";
import { buildRandomCurseEntry } from "./curse-service.js";
import { localize } from "../../i18n/localization.js";

const DEFAULT_CATALYST_BASE = "brutal_shard";
const DEFAULT_ESSENCE_QUALITY = "none";
const DEFAULT_SIDE = "random";

const ENCHANTMENT_SIDES = Object.freeze({
  PREFIX: "prefix",
  SUFFIX: "suffix",
  RANDOM: "random"
});

/**
 * Sélectionne un élément aléatoire dans une liste.
 *
 * @param {Array} [entries=[]] - Liste de candidats.
 * @returns {*|null} Élément aléatoire ou `null`.
 */
function randomElement(entries = []) {
  if (!Array.isArray(entries) || !entries.length) return null;

  return entries[Math.floor(Math.random() * entries.length)] ?? null;
}

/**
 * Récupère une copie des entrées d’enchantement actuelles d’un item.
 *
 * La copie évite de modifier directement les données source avant validation
 * et persistance finale.
 *
 * @param {Item} item - Item enchanté.
 * @returns {object[]} Entrées clonées.
 */
function getEnchantingEntries(item) {
  return foundry.utils.deepClone(
    Array.isArray(item?.system?.enchanting?.entries)
      ? item.system.enchanting.entries
      : []
  );
}

/**
 * Normalise la configuration d’application du catalyseur.
 *
 * Cette étape évite de propager des valeurs brutes dans les calculs de rang,
 * la génération d’affixes ou les données de source.
 *
 * @param {object} [config={}] - Configuration brute.
 * @returns {object} Configuration normalisée.
 */
function normalizeCatalystApplicationConfig(config = {}) {
  return {
    ...config,
    catalystBase: normalizeCatalystBase(config.catalystBase ?? DEFAULT_CATALYST_BASE),
    essenceQuality: normalizeEssenceQuality(config.essenceQuality ?? DEFAULT_ESSENCE_QUALITY),
    essenceTag: String(config.essenceTag ?? "").trim(),
    preferredSide: normalizeSide(config.preferredSide ?? DEFAULT_SIDE),
    successCount: toPositiveInteger(config.successCount),
    failureMargin: toPositiveInteger(config.failureMargin),
    naturalOne: Boolean(config.naturalOne),
    catalystItemId: String(config.catalystItemId ?? "").trim()
  };
}

/**
 * Construit les données de source stockées dans une entrée d’enchantement.
 *
 * `operation` doit décrire l’opération mécanique du catalyseur,
 * par exemple `addRandomAffix`, `rerollSameTag`, `upgrade` ou `curse`.
 *
 * @param {object} [config={}] - Configuration normalisée.
 * @param {string} [operation=""] - Opération source.
 * @returns {{catalystBase: string, essenceQuality: string, essenceTag: string, operation: string}} Source.
 */
function buildSourcePayload(config = {}, operation = "") {
  return {
    catalystBase: normalizeCatalystBase(config.catalystBase ?? DEFAULT_CATALYST_BASE),
    essenceQuality: normalizeEssenceQuality(config.essenceQuality ?? DEFAULT_ESSENCE_QUALITY),
    essenceTag: String(config.essenceTag ?? "").trim(),
    operation: String(operation ?? "").trim()
  };
}

/**
 * Normalise temporairement les données d’enchantement avec une liste d’entrées donnée.
 *
 * Utile pour recalculer les slots disponibles avant de persister les modifications.
 *
 * @param {Item} item - Item enchanté.
 * @param {object[]} [entries=[]] - Entrées candidates.
 * @returns {object} Données d’enchantement normalisées.
 */
function getNormalizedEnchantingWithEntries(item, entries = []) {
  return normalizeEnchantingData({
    ...(item?.system?.enchanting ?? {}),
    entries
  });
}

/**
 * Vérifie qu’un côté dispose d’un slot libre et retourne le côté résolu.
 *
 * Si le côté demandé est `random`, la fonction choisit :
 * - le seul côté disponible ;
 * - sinon le côté le moins rempli ;
 * - sinon `prefix`.
 *
 * @param {Item} item - Item enchanté.
 * @param {object[]} entries - Entrées actuelles.
 * @param {string} preferredSide - Côté demandé.
 * @returns {"prefix"|"suffix"} Côté résolu.
 * @throws {Error} Si aucun slot du côté résolu n’est disponible.
 */
function ensureSideAvailability(item, entries, preferredSide) {
  const enchanting = getNormalizedEnchantingWithEntries(item, entries);
  const resolvedSide = chooseAvailableSide(enchanting, entries, preferredSide);

  if (
    resolvedSide === ENCHANTMENT_SIDES.PREFIX
    && Number(enchanting?.derived?.prefixAvailable ?? 0) <= 0
  ) {
    throw new Error(localize("ETERN.ENCHANTING.ERROR.NO_PREFIX_SLOT"));
  }

  if (
    resolvedSide === ENCHANTMENT_SIDES.SUFFIX
    && Number(enchanting?.derived?.suffixAvailable ?? 0) <= 0
  ) {
    throw new Error(localize("ETERN.ENCHANTING.ERROR.NO_SUFFIX_SLOT"));
  }

  return resolvedSide;
}

/**
 * Choisit un côté disponible selon la capacité actuelle.
 *
 * @param {object} enchanting - Données d’enchantement normalisées.
 * @param {object[]} entries - Entrées actuelles.
 * @param {string} preferredSide - Côté préféré.
 * @returns {"prefix"|"suffix"} Côté choisi.
 */
function chooseAvailableSide(enchanting, entries = [], preferredSide = DEFAULT_SIDE) {
  const side = normalizeSide(preferredSide);

  if (side !== ENCHANTMENT_SIDES.RANDOM) {
    return side;
  }

  const prefixAvailable = Number(enchanting?.derived?.prefixAvailable ?? 0) || 0;
  const suffixAvailable = Number(enchanting?.derived?.suffixAvailable ?? 0) || 0;

  if (prefixAvailable > 0 && suffixAvailable <= 0) return ENCHANTMENT_SIDES.PREFIX;
  if (suffixAvailable > 0 && prefixAvailable <= 0) return ENCHANTMENT_SIDES.SUFFIX;

  const prefixCount = countAffixesOnSide(entries, ENCHANTMENT_SIDES.PREFIX);
  const suffixCount = countAffixesOnSide(entries, ENCHANTMENT_SIDES.SUFFIX);

  return prefixCount <= suffixCount
    ? ENCHANTMENT_SIDES.PREFIX
    : ENCHANTMENT_SIDES.SUFFIX;
}

/**
 * Compte les affixes présents sur un côté.
 *
 * Les malédictions sont ignorées pour équilibrer uniquement les affixes.
 *
 * @param {object[]} entries - Entrées d’enchantement.
 * @param {"prefix"|"suffix"} side - Côté à compter.
 * @returns {number} Nombre d’affixes.
 */
function countAffixesOnSide(entries = [], side = ENCHANTMENT_SIDES.PREFIX) {
  return asArray(entries).filter((entry) => {
    return String(entry?.family ?? "affix") === "affix"
      && String(entry?.side ?? ENCHANTMENT_SIDES.PREFIX) === side;
  }).length;
}

/**
 * Récupère les indexes des affixes non verrouillés.
 *
 * @param {object[]} [entries=[]] - Entrées d’enchantement.
 * @returns {number[]} Indexes disponibles.
 */
function getUnlockedAffixIndexes(entries = []) {
  return asArray(entries)
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => String(entry?.family ?? "affix") === "affix" && !entry?.locked)
    .map(({ index }) => index);
}

/**
 * Récupère les indexes de toutes les entrées non verrouillées.
 *
 * @param {object[]} [entries=[]] - Entrées d’enchantement.
 * @returns {number[]} Indexes disponibles.
 */
function getUnlockedEntryIndexes(entries = []) {
  return asArray(entries)
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => !entry?.locked)
    .map(({ index }) => index);
}

/**
 * Récupère les tags déjà présents sur l’objet enchanté.
 *
 * Les tags viennent des entrées existantes, affixes ou malédictions.
 *
 * @param {object[]} [entries=[]] - Entrées d’enchantement.
 * @returns {string[]} Tags uniques.
 */
function getExistingObjectTags(entries = []) {
  return Array.from(new Set(
    asArray(entries).flatMap((entry) => splitTags(entry?.tagsText ?? ""))
  ));
}

/**
 * Construit un nouvel affixe compatible avec l’item.
 *
 * La fonction :
 * - vérifie la disponibilité du côté ;
 * - construit le pool d’affixes compatibles ;
 * - choisit une définition aléatoire ;
 * - calcule le rang final ;
 * - crée l’entrée depuis la définition.
 *
 * @param {Item} item - Item enchanté.
 * @param {object[]} entries - Entrées actuelles.
 * @param {object} config - Configuration normalisée.
 * @param {object} [options={}] - Options de filtrage.
 * @param {string} [options.preferredSide="random"] - Côté préféré.
 * @param {string[]} [options.requiredTags=[]] - Tags requis.
 * @param {object|null} [options.sameTagAsEntry=null] - Entrée servant de référence de tags.
 * @param {string[]} [options.excludedDefinitionIds=[]] - Définitions exclues.
 * @param {string} [options.operation=""] - Opération source.
 * @returns {{entry: object, rankResult: object, definition: object, side: string}} Résultat de génération.
 */
function buildAffixEntry(
  item,
  entries,
  config,
  {
    preferredSide = DEFAULT_SIDE,
    requiredTags = [],
    sameTagAsEntry = null,
    excludedDefinitionIds = [],
    operation = ""
  } = {}
) {
  const side = ensureSideAvailability(item, entries, preferredSide);

  const pool = buildAffixPool(item, entries, {
    preferredSide: side,
    requiredTags,
    sameTagAsEntry,
    excludedDefinitionIds
  });

  if (!pool.length) {
    throw new Error(localize("ETERN.ENCHANTING.ERROR.NO_AFFIX_AVAILABLE"));
  }

  const rankResult = buildEnchantmentRankResult(config);
  const definition = randomElement(pool);

  return {
    entry: createEnchantmentEntryFromDefinition(definition, {
      rank: rankResult.rank,
      source: buildSourcePayload(config, operation)
    }),
    rankResult,
    definition,
    side
  };
}

/**
 * Ajoute une malédiction si la règle ou l’échec l’exige.
 *
 * Une malédiction est ajoutée si :
 * - le catalyseur force une malédiction ;
 * - la marge d’échec est supérieure à 1 ;
 * - un 1 naturel déclenche une malédiction.
 *
 * @param {Item} item - Item enchanté.
 * @param {object[]} entries - Entrées actuelles, modifiées sur place.
 * @param {object} config - Configuration normalisée.
 * @param {object} [options={}] - Options de malédiction.
 * @param {string} [options.side="prefix"] - Côté préféré.
 * @param {boolean} [options.forcedCurse=false] - Force une malédiction.
 * @param {boolean} [options.naturalOneCurse=false] - Malédiction sur 1 naturel.
 * @returns {object|null} Entrée de malédiction ajoutée ou `null`.
 */
function appendCurseIfNeeded(
  item,
  entries,
  config,
  {
    side = ENCHANTMENT_SIDES.PREFIX,
    forcedCurse = false,
    naturalOneCurse = false
  } = {}
) {
  const shouldAddCurse = forcedCurse
    || Number(config?.failureMargin ?? 0) > 1
    || naturalOneCurse;

  if (!shouldAddCurse) return null;

  const curseEntry = buildRandomCurseEntry(
    item,
    entries,
    side,
    buildSourcePayload(config, "curse")
  );

  if (!curseEntry) {
    throw new Error(localize("ETERN.ENCHANTING.ERROR.NO_CURSE_AVAILABLE"));
  }

  entries.push(curseEntry);

  return curseEntry;
}

/**
 * Consomme une unité du catalyseur utilisé.
 *
 * Le consommable n’est pas supprimé à 0 quantité, il est seulement mis à jour.
 *
 * @param {Item|null} catalystItem - Item catalyseur.
 * @returns {Promise<void>}
 */
async function consumeCatalystItem(catalystItem) {
  if (!catalystItem) return;

  const quantity = toPositiveInteger(catalystItem.system?.quantity);

  if (quantity <= 0) return;

  const nextQuantity = Math.max(0, quantity - 1);

  await catalystItem.update(
    { "system.quantity": nextQuantity },
    { render: false }
  );
}

/**
 * Persiste les entrées normalisées sur l’item.
 *
 * Les données dérivées seront recalculées lors du prochain cycle de préparation.
 *
 * @param {Item} item - Item enchanté.
 * @param {object[]} entries - Entrées à sauvegarder.
 * @returns {Promise<void>}
 */
async function persistEntries(item, entries) {
  const normalized = normalizeEnchantingData({
    ...(item.system?.enchanting ?? {}),
    entries
  });

  await item.update(
    { "system.enchanting.entries": normalized.entries },
    { render: false }
  );
}

/**
 * Construit le message de résultat affichable après application.
 *
 * @param {object} config - Configuration normalisée.
 * @param {object} rankResult - Résultat de rang.
 * @param {object|null} curseEntry - Malédiction éventuelle.
 * @returns {string} Message localisé.
 */
function buildResultMessage(config, rankResult, curseEntry) {
  return localize("ETERN.ENCHANTING.DIALOG.RESULT", {
    catalyst: game.i18n.localize(
      getCatalystDefinition(config.catalystBase).labelKey
    ),
    rank: rankResult.rank,
    curse: curseEntry
      ? localize("ETERN.UI.YES")
      : localize("ETERN.UI.NO")
  });
}

/**
 * Applique un catalyseur d’enchantement à un item.
 *
 * La fonction applique l’opération définie par le catalyseur :
 * - ajout d’affixe aléatoire ;
 * - suppression d’affixe ;
 * - nettoyage des entrées non verrouillées ;
 * - relance avec même tag ;
 * - verrouillage d’entrée ;
 * - ajout d’affixe selon un tag d’essence ;
 * - ajout d’affixe selon un tag déjà présent ;
 * - amélioration d’un affixe existant.
 *
 * @param {Item} item - Item à enchanter.
 * @param {object} [config={}] - Configuration d’application.
 * @returns {Promise<{catalystBase: string, resultDefinition: object|null, rank: number, curseApplied: boolean, message: string}>} Résultat.
 */
export async function applyCatalystToItem(item, config = {}) {
  if (!isEnchantableItem(item)) {
    throw new Error(localize("ETERN.ENCHANTING.ERROR.NOT_ENCHANTABLE"));
  }

  const normalizedConfig = normalizeCatalystApplicationConfig(config);
  const catalystBase = normalizedConfig.catalystBase;
  const catalystRule = getEnchantmentCatalystRule(catalystBase);
  const operation = String(catalystRule.operation ?? "");
  const entries = getEnchantingEntries(item);
  const entryCount = entries.length;

  if (toPositiveInteger(catalystRule.minimumEntries) > entryCount) {
    throw new Error(
      localize("ETERN.ENCHANTING.ERROR.MINIMUM_ENTRIES", {
        count: catalystRule.minimumEntries
      })
    );
  }

  if (catalystRule.requiresEssenceTag && !normalizedConfig.essenceTag) {
    throw new Error(localize("ETERN.ENCHANTING.ERROR.ESSENCE_TAG_REQUIRED"));
  }

  let rankResult = buildEnchantmentRankResult(normalizedConfig);
  let curseEntry = null;
  let resultDefinition = null;

  switch (operation) {
    case "removeRandomAffix": {
      const removableIndexes = getUnlockedAffixIndexes(entries);
      const targetIndex = randomElement(removableIndexes);

      if (targetIndex === null || targetIndex === undefined) {
        throw new Error(localize("ETERN.ENCHANTING.ERROR.NO_REMOVABLE_AFFIX"));
      }

      entries.splice(targetIndex, 1);
      break;
    }

    case "clearUnlockedEntries": {
      const remainingEntries = entries.filter((entry) => Boolean(entry?.locked));

      if (remainingEntries.length === entries.length) {
        throw new Error(localize("ETERN.ENCHANTING.ERROR.NO_CLEARABLE_ENTRY"));
      }

      entries.splice(0, entries.length, ...remainingEntries);
      break;
    }

    case "rerollSameTag": {
      const targetIndex = randomElement(getUnlockedAffixIndexes(entries));

      if (targetIndex === null || targetIndex === undefined) {
        throw new Error(localize("ETERN.ENCHANTING.ERROR.NO_REROLL_TARGET"));
      }

      const targetEntry = entries[targetIndex];

      const built = buildAffixEntry(
        item,
        entries.filter((_entry, index) => index !== targetIndex),
        normalizedConfig,
        {
          preferredSide: targetEntry?.side ?? DEFAULT_SIDE,
          sameTagAsEntry: targetEntry,
          excludedDefinitionIds: [targetEntry?.definitionId],
          operation
        }
      );

      entries[targetIndex] = built.entry;
      rankResult = built.rankResult;
      resultDefinition = built.definition;

      curseEntry = appendCurseIfNeeded(item, entries, normalizedConfig, {
        side: built.side,
        forcedCurse: Boolean(catalystRule.forcedCurse),
        naturalOneCurse: Boolean(catalystRule.curseOnNaturalOne) && normalizedConfig.naturalOne
      });

      break;
    }

    case "lockRandomEntry": {
      const targetIndex = randomElement(getUnlockedEntryIndexes(entries));

      if (targetIndex === null || targetIndex === undefined) {
        throw new Error(localize("ETERN.ENCHANTING.ERROR.NO_LOCK_TARGET"));
      }

      entries[targetIndex].locked = true;
      break;
    }

    case "addForcedTagAffix": {
      const built = buildAffixEntry(item, entries, normalizedConfig, {
        preferredSide: normalizedConfig.preferredSide,
        requiredTags: [normalizedConfig.essenceTag],
        operation
      });

      entries.push(built.entry);
      rankResult = built.rankResult;
      resultDefinition = built.definition;

      curseEntry = appendCurseIfNeeded(item, entries, normalizedConfig, {
        side: built.side,
        forcedCurse: Boolean(catalystRule.forcedCurse),
        naturalOneCurse: Boolean(catalystRule.curseOnNaturalOne) && normalizedConfig.naturalOne
      });

      break;
    }

    case "addExistingTagAffix": {
      const existingTags = getExistingObjectTags(entries);

      if (!existingTags.length) {
        throw new Error(localize("ETERN.ENCHANTING.ERROR.NO_MATCHING_TAG"));
      }

      const built = buildAffixEntry(item, entries, normalizedConfig, {
        preferredSide: normalizedConfig.preferredSide,
        requiredTags: existingTags,
        operation
      });

      entries.push(built.entry);
      rankResult = built.rankResult;
      resultDefinition = built.definition;

      curseEntry = appendCurseIfNeeded(item, entries, normalizedConfig, {
        side: built.side,
        forcedCurse: Boolean(catalystRule.forcedCurse),
        naturalOneCurse: Boolean(catalystRule.curseOnNaturalOne) && normalizedConfig.naturalOne
      });

      break;
    }

    case "upgradeRandomAffix": {
      const targetIndex = randomElement(getUnlockedAffixIndexes(entries));

      if (targetIndex === null || targetIndex === undefined) {
        throw new Error(localize("ETERN.ENCHANTING.ERROR.NO_UPGRADE_TARGET"));
      }

      const targetEntry = entries[targetIndex];
      const definition = getEnchantmentDefinition(targetEntry?.definitionId);

      if (!definition) {
        throw new Error(localize("ETERN.ENCHANTING.ERROR.NO_UPGRADE_TARGET"));
      }

      const upgradedRank = clampEnchantmentRank(Number(targetEntry?.rank ?? 1) + 1);

      entries[targetIndex] = createEnchantmentEntryFromDefinition(definition, {
        rank: upgradedRank,
        source: {
          ...(targetEntry?.source ?? {}),
          ...buildSourcePayload(normalizedConfig, "upgrade")
        }
      });

      rankResult = {
        ...rankResult,
        rank: upgradedRank
      };

      resultDefinition = definition;
      break;
    }

    case "addRandomAffix":
    default: {
      const built = buildAffixEntry(item, entries, normalizedConfig, {
        preferredSide: normalizedConfig.preferredSide,
        operation
      });

      entries.push(built.entry);
      rankResult = built.rankResult;
      resultDefinition = built.definition;

      curseEntry = appendCurseIfNeeded(item, entries, normalizedConfig, {
        side: built.side,
        forcedCurse: Boolean(catalystRule.forcedCurse),
        naturalOneCurse: Boolean(catalystRule.curseOnNaturalOne) && normalizedConfig.naturalOne
      });

      break;
    }
  }

  await persistEntries(item, entries);

  if (normalizedConfig.catalystItemId && item.parent) {
    const catalystItem = item.parent.items.get(normalizedConfig.catalystItemId);

    if (catalystItem) {
      await consumeCatalystItem(catalystItem);
    }
  }

  return {
    catalystBase,
    resultDefinition,
    rank: rankResult.rank,
    curseApplied: Boolean(curseEntry),
    message: buildResultMessage(normalizedConfig, rankResult, curseEntry)
  };
}

/**
 * Normalise un côté d’enchantement.
 *
 * @param {unknown} value - Côté brut.
 * @returns {"prefix"|"suffix"|"random"} Côté normalisé.
 */
function normalizeSide(value) {
  const normalized = String(value ?? DEFAULT_SIDE).trim().toLowerCase();

  return Object.values(ENCHANTMENT_SIDES).includes(normalized)
    ? normalized
    : DEFAULT_SIDE;
}

/**
 * Borne un rang d’enchantement entre 1 et 7.
 *
 * @param {unknown} value - Rang brut.
 * @returns {number} Rang borné.
 */
function clampEnchantmentRank(value) {
  const numericValue = Math.floor(Number(value) || 1);

  return Math.max(1, Math.min(7, numericValue));
}


