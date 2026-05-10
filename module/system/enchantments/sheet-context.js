/**
 * Contexte de fiche pour le panneau d’enchantement des items.
 *
 * Responsabilités :
 * - vérifier si un item est enchantable ;
 * - préparer les choix de qualité d’enchantement ;
 * - préparer les sections préfixes, suffixes et malédictions ;
 * - construire le contexte d’affichage de chaque entrée d’enchantement ;
 * - préparer les choix de bonus acteur et bonus item ;
 * - préparer les badges, tags et résumés d’enchantement ;
 * - exposer les données nécessaires aux templates de fiche.
 *
 * Ce fichier doit rester dédié à la préparation du contexte d’affichage.
 * Il ne doit pas appliquer les enchantements, modifier les items ou gérer les événements DOM.
 */

import { asArray } from '../../utils/arrays.js';
import { toInteger, toPositiveInteger } from '../../utils/numbers.js';
import { getCatalystDefinition } from "../constants/consumables.js";
import { getEnchantmentActorBonusTargetChoices } from "./actor-bonus-targets.js";
import { ENCHANTMENT_BASE_QUALITIES, isEnchantableItem } from "./constants.js";
import { getEnchantmentDefinition } from "./registry.js";
import { getEnchantmentItemBonusTargetChoices } from "./item-bonus-targets.js";
import { splitTags } from "./definition-helpers.js";
import { buildEnchantmentTagPills } from "./tags.js";

const ENTRY_FAMILIES = Object.freeze({
  AFFIX: "affix",
  CURSE: "curse"
});

const ENTRY_SIDES = Object.freeze({
  PREFIX: "prefix",
  SUFFIX: "suffix"
});

const ENTRY_SOURCE_TYPES = Object.freeze({
  CUSTOM: "custom",
  REGISTRY: "registry"
});

/**
 * Localise la famille d’une entrée d’enchantement.
 *
 * Une entrée peut être :
 * - un affixe ;
 * - une malédiction.
 *
 * @param {unknown} family - Famille brute.
 * @returns {string} Label localisé.
 */
function localizeEntryFamily(family) {
  const normalizedFamily = normalizeEntryFamily(family);

  return game.i18n.localize(
    normalizedFamily === ENTRY_FAMILIES.CURSE
      ? "ETERN.ENCHANTING.ENTRY.BADGE_CURSE"
      : "ETERN.ENCHANTING.ENTRY.BADGE_AFFIX"
  );
}

/**
 * Localise le côté d’un affixe.
 *
 * Un affixe peut être :
 * - préfixe ;
 * - suffixe.
 *
 * @param {unknown} side - Côté brut.
 * @returns {string} Label localisé.
 */
function localizeEntrySide(side) {
  const normalizedSide = normalizeEntrySide(side);

  return game.i18n.localize(
    normalizedSide === ENTRY_SIDES.SUFFIX
      ? "ETERN.ENCHANTING.ENTRY.BADGE_SUFFIX"
      : "ETERN.ENCHANTING.ENTRY.BADGE_PREFIX"
  );
}

/**
 * Localise le type de source d’une entrée.
 *
 * Une entrée peut venir :
 * - du registre ;
 * - d’une création personnalisée.
 *
 * @param {unknown} sourceType - Type de source brut.
 * @returns {string} Label localisé.
 */
function localizeEntrySource(sourceType) {
  const normalizedSourceType = normalizeEntrySourceType(sourceType);

  return game.i18n.localize(
    normalizedSourceType === ENTRY_SOURCE_TYPES.REGISTRY
      ? "ETERN.ENCHANTING.ENTRY.BADGE_REGISTERED"
      : "ETERN.ENCHANTING.ENTRY.BADGE_CUSTOM"
  );
}

/**
 * Construit le label de source d’une entrée d’enchantement.
 *
 * Le label utilise :
 * - la base de catalyseur ;
 * - éventuellement le tag d’essence.
 *
 * @param {object} entry - Entrée d’enchantement.
 * @returns {string} Label de source ou chaîne vide.
 */
function localizeEntrySourceLabel(entry) {
  const catalystBase = String(entry?.source?.catalystBase ?? "").trim();

  if (!catalystBase) return "";

  const catalystLabel = game.i18n.localize(
    getCatalystDefinition(catalystBase).labelKey
  );

  const essenceTag = String(entry?.source?.essenceTag ?? "").trim();

  return essenceTag
    ? `${catalystLabel} · ${essenceTag}`
    : catalystLabel;
}

/**
 * Construit le contexte d’une entrée d’enchantement.
 *
 * Une entrée contient :
 * - ses labels ;
 * - ses tags ;
 * - ses badges ;
 * - ses bonus acteur ;
 * - ses bonus item ;
 * - ses choix de famille et de côté ;
 * - ses informations de source.
 *
 * @param {Item} item - Item enchanté.
 * @param {object} entry - Entrée d’enchantement brute.
 * @param {number} entryIndex - Index réel de l’entrée dans la liste.
 * @returns {object} Contexte d’entrée pour le template.
 */
function buildEnchantmentEntryContext(item, entry, entryIndex) {
  const definition = getEnchantmentDefinition(entry?.definitionId ?? "");

  const family = normalizeEntryFamily(entry?.family);
  const side = normalizeEntrySide(entry?.side);
  const sourceType = normalizeEntrySourceType(entry?.sourceType);

  const actorBonuses = buildActorBonusRows(entry?.actorBonuses);
  const itemBonuses = buildItemBonusRows(item, entry?.itemBonuses);
  const tagPills = buildEntryTagPills(entry, definition);

  return {
    index: entryIndex,
    label: getEntryLabel(entry, definition),
    description: String(entry?.description ?? ""),
    tagsText: String(entry?.tagsText ?? ""),
    tagPills,

    rank: Math.max(1, toInteger(entry?.rank ?? 1)),
    magicWeight: toFiniteNumber(entry?.magicWeight, 0),
    locked: Boolean(entry?.locked),

    family,
    side,
    sourceType,
    sourceLabel: localizeEntrySourceLabel(entry),

    source: {
      catalystBase: String(entry?.source?.catalystBase ?? ""),
      essenceQuality: String(entry?.source?.essenceQuality ?? "none"),
      essenceTag: String(entry?.source?.essenceTag ?? "")
    },

    badges: [
      localizeEntrySide(side),
      localizeEntryFamily(family),
      localizeEntrySource(sourceType)
    ],

    isCustomEntry: sourceType !== ENTRY_SOURCE_TYPES.REGISTRY,
    isRegisteredEntry: sourceType === ENTRY_SOURCE_TYPES.REGISTRY,

    familyChoices: buildEntryFamilyChoices(family),
    sideChoices: buildEntrySideChoices(side),

    actorBonuses,
    itemBonuses,
    hasNumericBonuses: actorBonuses.length > 0 || itemBonuses.length > 0
  };
}

/**
 * Construit une section d’enchantement.
 *
 * Les sections typiques sont :
 * - préfixes ;
 * - suffixes ;
 * - malédictions.
 *
 * @param {Item} item - Item enchanté.
 * @param {Array<object>} entries - Entrées d’enchantement.
 * @param {object} options - Options de section.
 * @param {string} options.family - Famille filtrée.
 * @param {string|null} options.side - Côté filtré, ou null.
 * @param {string} options.labelKey - Clé i18n du titre.
 * @param {string} options.emptyKey - Clé i18n du message vide.
 * @param {string} options.addKey - Clé i18n du bouton d’ajout.
 * @returns {object} Contexte de section.
 */
function buildEnchantmentSectionContext(
  item,
  entries,
  {
    family,
    side,
    labelKey,
    emptyKey,
    addKey
  }
) {
  const normalizedFamily = normalizeEntryFamily(family);
  const normalizedSide = side ? normalizeEntrySide(side) : null;

  const filteredEntries = asArray(entries)
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => {
      const entryFamily = normalizeEntryFamily(entry?.family);
      const entrySide = normalizeEntrySide(entry?.side);

      return entryFamily === normalizedFamily
        && (!normalizedSide || entrySide === normalizedSide);
    });

  return {
    family: normalizedFamily,
    side: normalizedSide,
    label: game.i18n.localize(labelKey),
    emptyLabel: game.i18n.localize(emptyKey),
    addLabel: game.i18n.localize(addKey),
    entries: filteredEntries.map(({ entry, index }) => {
      return buildEnchantmentEntryContext(item, entry, index);
    })
  };
}

/**
 * Construit le résumé des bonus dérivés d’enchantement.
 *
 * Ce résumé affiche notamment :
 * - bonus de dés de dégâts ;
 * - bonus de portée ;
 * - bonus de portée de zone ;
 * - réduction de prérequis.
 *
 * @param {Item} item - Item enchanté.
 * @returns {{extraPills: object[]}} Résumé affichable.
 */
function buildDerivedSummary(item) {
  const derived = getEnchantingDerivedData(item);
  const extraPills = [];

  const damageDiceBonus = toPositiveInteger(derived.damageDiceBonus);
  if (damageDiceBonus > 0) {
    extraPills.push({
      label: game.i18n.localize("ETERN.ENCHANTING.SUMMARY.DAMAGE_DICE_BONUS"),
      value: `+${damageDiceBonus}d6`
    });
  }

  const rangeMetersBonus = toFiniteNumber(derived.rangeMetersBonus, 0);
  if (rangeMetersBonus > 0) {
    extraPills.push({
      label: game.i18n.localize("ETERN.ENCHANTING.SUMMARY.RANGE_BONUS"),
      value: `+${rangeMetersBonus}m`
    });
  }

  const zoneRangeMetersBonus = toFiniteNumber(derived.zoneRangeMetersBonus, 0);
  if (zoneRangeMetersBonus > 0) {
    extraPills.push({
      label: game.i18n.localize("ETERN.ENCHANTING.SUMMARY.ZONE_RANGE_BONUS"),
      value: `+${zoneRangeMetersBonus}m`
    });
  }

  const requirementReduction = toPositiveInteger(derived.requirementReduction);
  if (requirementReduction > 0) {
    extraPills.push({
      label: game.i18n.localize("ETERN.ENCHANTING.SUMMARY.REQUIREMENT_REDUCTION"),
      value: `-${requirementReduction}`
    });
  }

  return { extraPills };
}

/**
 * Construit le contexte complet du panneau d’enchantement d’une fiche item.
 *
 * Si l’item n’est pas enchantable, la fonction renvoie un contexte minimal.
 *
 * @param {Item} item - Item dont on prépare le panneau d’enchantement.
 * @returns {object} Contexte d’enchantement pour la fiche.
 */
export function buildEnchantingSheetContext(item) {
  if (!isEnchantableItem(item)) {
    return {
      isEnchantableItem: false,
      hasEquipToggle: false
    };
  }

  const enchanting = item.system?.enchanting ?? {};
  const entries = asArray(enchanting.entries);
  const derived = getEnchantingDerivedData(item);

  return {
    isEnchantableItem: true,
    hasEquipToggle: "equipped" in (item.system ?? {}),
    enchantingHasActorContext: item?.parent instanceof Actor,

    enchantingBaseQualityChoices: buildBaseQualityChoices(enchanting.baseQuality),
    enchantingUsesCustomCapacity: String(enchanting.baseQuality ?? "base") === "custom",

    enchantingSummary: {
      prefixUsed: toInteger(derived.prefixUsed),
      prefixMax: toInteger(derived.prefixMax),
      suffixUsed: toInteger(derived.suffixUsed),
      suffixMax: toInteger(derived.suffixMax),
      totalMagicWeight: toFiniteNumber(derived.totalMagicWeight, 0),
      affixCount: toInteger(derived.affixCount),
      curseCount: toInteger(derived.curseCount)
    },

    enchantingDerivedSummary: buildDerivedSummary(item),

    enchantingSections: [
      buildEnchantmentSectionContext(item, entries, {
        family: ENTRY_FAMILIES.AFFIX,
        side: ENTRY_SIDES.PREFIX,
        labelKey: "ETERN.ENCHANTING.PREFIXES",
        emptyKey: "ETERN.ENCHANTING.EMPTY_PREFIXES",
        addKey: "ETERN.ENCHANTING.ADD_PREFIX"
      }),
      buildEnchantmentSectionContext(item, entries, {
        family: ENTRY_FAMILIES.AFFIX,
        side: ENTRY_SIDES.SUFFIX,
        labelKey: "ETERN.ENCHANTING.SUFFIXES",
        emptyKey: "ETERN.ENCHANTING.EMPTY_SUFFIXES",
        addKey: "ETERN.ENCHANTING.ADD_SUFFIX"
      }),
      buildEnchantmentSectionContext(item, entries, {
        family: ENTRY_FAMILIES.CURSE,
        side: null,
        labelKey: "ETERN.ENCHANTING.CURSES",
        emptyKey: "ETERN.ENCHANTING.EMPTY_CURSES",
        addKey: "ETERN.ENCHANTING.ADD_CURSE"
      })
    ]
  };
}

/**
 * Récupère les données dérivées d’enchantement.
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
 * pour compatibilité avec d’anciennes données ou anciens services.
 *
 * @param {Item} item - Item enchanté.
 * @returns {object} Données dérivées d’enchantement.
 */
function getEnchantingDerivedData(item) {
  return item?.system?.derived?.enchanting
    ?? item?.system?.enchanting?.derived
    ?? {};
}

/**
 * Construit les choix de qualité de base d’enchantement.
 *
 * @param {unknown} selectedValue - Qualité actuellement sélectionnée.
 * @returns {{value: string, label: string, selected: boolean}[]} Choix de qualité.
 */
function buildBaseQualityChoices(selectedValue) {
  const selected = String(selectedValue ?? "base");

  return Object.entries(ENCHANTMENT_BASE_QUALITIES).map(([value, definition]) => ({
    value,
    label: game.i18n.localize(definition.labelKey),
    selected: value === selected
  }));
}

/**
 * Construit les lignes de bonus acteur d’une entrée.
 *
 * @param {Array<object>} bonuses - Bonus acteur bruts.
 * @returns {object[]} Lignes normalisées.
 */
function buildActorBonusRows(bonuses) {
  return asArray(bonuses).map((bonus, bonusIndex) => ({
    index: bonusIndex,
    targetKey: String(bonus?.targetKey ?? ""),
    value: toFiniteNumber(bonus?.value, 0),
    notes: String(bonus?.notes ?? ""),
    targetChoices: getEnchantmentActorBonusTargetChoices(bonus?.targetKey ?? "")
  }));
}

/**
 * Construit les lignes de bonus item d’une entrée.
 *
 * @param {Item} item - Item enchanté.
 * @param {Array<object>} bonuses - Bonus item bruts.
 * @returns {object[]} Lignes normalisées.
 */
function buildItemBonusRows(item, bonuses) {
  return asArray(bonuses).map((bonus, bonusIndex) => ({
    index: bonusIndex,
    targetKey: String(bonus?.targetKey ?? ""),
    value: toFiniteNumber(bonus?.value, 0),
    notes: String(bonus?.notes ?? ""),
    targetChoices: getEnchantmentItemBonusTargetChoices(item?.type, bonus?.targetKey ?? "")
  }));
}

/**
 * Construit les pills de tags d’une entrée.
 *
 * Priorité :
 * - tags saisis sur l’entrée ;
 * - tags de la définition enregistrée.
 *
 * @param {object} entry - Entrée d’enchantement.
 * @param {object|null} definition - Définition du registre.
 * @returns {{key: string, label: string}[]} Pills de tags.
 */
function buildEntryTagPills(entry, definition) {
  const tagsText = String(entry?.tagsText ?? "").trim();

  if (tagsText) {
    return buildEnchantmentTagPills(splitTags(tagsText));
  }

  return buildEnchantmentTagPills(
    Array.isArray(definition?.tags) ? definition.tags : []
  );
}

/**
 * Récupère le label d’une entrée.
 *
 * Priorité :
 * - label personnalisé de l’entrée ;
 * - label de définition dans la langue courante ;
 * - label français ;
 * - label anglais ;
 * - chaîne vide.
 *
 * @param {object} entry - Entrée d’enchantement.
 * @param {object|null} definition - Définition du registre.
 * @returns {string} Label affichable.
 */
function getEntryLabel(entry, definition) {
  const customLabel = String(entry?.label ?? "").trim();

  if (customLabel) return customLabel;

  return String(
    definition?.label?.[game.i18n.lang]
    ?? definition?.label?.fr
    ?? definition?.label?.en
    ?? ""
  );
}

/**
 * Construit les choix de famille d’entrée.
 *
 * @param {string} selectedFamily - Famille sélectionnée.
 * @returns {object[]} Choix de famille.
 */
function buildEntryFamilyChoices(selectedFamily) {
  return [
    {
      value: ENTRY_FAMILIES.AFFIX,
      label: localizeEntryFamily(ENTRY_FAMILIES.AFFIX),
      selected: selectedFamily === ENTRY_FAMILIES.AFFIX
    },
    {
      value: ENTRY_FAMILIES.CURSE,
      label: localizeEntryFamily(ENTRY_FAMILIES.CURSE),
      selected: selectedFamily === ENTRY_FAMILIES.CURSE
    }
  ];
}

/**
 * Construit les choix de côté d’affixe.
 *
 * @param {string} selectedSide - Côté sélectionné.
 * @returns {object[]} Choix de côté.
 */
function buildEntrySideChoices(selectedSide) {
  return [
    {
      value: ENTRY_SIDES.PREFIX,
      label: localizeEntrySide(ENTRY_SIDES.PREFIX),
      selected: selectedSide === ENTRY_SIDES.PREFIX
    },
    {
      value: ENTRY_SIDES.SUFFIX,
      label: localizeEntrySide(ENTRY_SIDES.SUFFIX),
      selected: selectedSide === ENTRY_SIDES.SUFFIX
    }
  ];
}

/**
 * Normalise une famille d’entrée.
 *
 * @param {unknown} value - Valeur brute.
 * @returns {"affix"|"curse"} Famille normalisée.
 */
function normalizeEntryFamily(value) {
  return String(value ?? "").trim() === ENTRY_FAMILIES.CURSE
    ? ENTRY_FAMILIES.CURSE
    : ENTRY_FAMILIES.AFFIX;
}

/**
 * Normalise un côté d’entrée.
 *
 * @param {unknown} value - Valeur brute.
 * @returns {"prefix"|"suffix"} Côté normalisé.
 */
function normalizeEntrySide(value) {
  return String(value ?? "").trim() === ENTRY_SIDES.SUFFIX
    ? ENTRY_SIDES.SUFFIX
    : ENTRY_SIDES.PREFIX;
}

/**
 * Normalise le type de source d’une entrée.
 *
 * @param {unknown} value - Valeur brute.
 * @returns {"custom"|"registry"} Type de source normalisé.
 */
function normalizeEntrySourceType(value) {
  return String(value ?? "").trim() === ENTRY_SOURCE_TYPES.REGISTRY
    ? ENTRY_SOURCE_TYPES.REGISTRY
    : ENTRY_SOURCE_TYPES.CUSTOM;
}


/**
 * Convertit une valeur en nombre fini.
 *
 * @param {unknown} value - Valeur brute.
 * @param {number} [fallback=0] - Valeur utilisée si l’entrée est invalide.
 * @returns {number} Nombre fini.
 */
function toFiniteNumber(value, fallback = 0) {
  const numericValue = Number(value ?? fallback);

  return Number.isFinite(numericValue)
    ? numericValue
    : fallback;
}