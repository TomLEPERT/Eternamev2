/**
 * Registre central des presets d’équipement.
 *
 * Responsabilités :
 * - regrouper la configuration des presets d’armes, armures et boucliers ;
 * - fournir les valeurs par défaut de chaque type d’item ;
 * - construire les contextes nécessaires aux fiches d’items ;
 * - résoudre les bases de presets malgré les alias ou anciens identifiants ;
 * - construire les choix localisés de catégories, bases, poids, tags et sauvegardes.
 *
 * Ce fichier doit rester un registre de configuration et de préparation de contexte.
 * Il ne doit pas contenir la logique d’enchantement, de calcul de défense,
 * de jet d’attaque ou d’application des bonus.
 */

import {
  normalizeArmorCategory,
  normalizeShieldCategory,
  normalizeWeaponCategory
} from "../nomenclature.js";

import {
  ARMOR_CATEGORIES,
  ARMOR_PRESETS,
  ARMOR_SAVE_KEYS,
  ARMOR_SKILL_PRESETS
} from "../constants/armors.js";

import {
  SHIELD_CATEGORIES,
  SHIELD_PRESETS,
  SHIELD_SAVE_KEYS
} from "../constants/shields.js";

import {
  WEAPON_BASES,
  WEAPON_CATEGORIES,
  WEAPON_PRESETS,
  WEAPON_TAG_KEYS,
  WEAPON_TAG_LABELS
} from "../constants/weapons.js";

import { localizePresetName } from "../i18n/preset-localization.js";
import { resolvePresetBaseId } from "./preset-id-mapping.js";

const PRECISION_BASES = Object.freeze(["PRC", "PRD", "PRM"]);

/**
 * Registre des presets par type d’item.
 *
 * Chaque entrée décrit :
 * - le type d’item ;
 * - ses valeurs par défaut ;
 * - ses catégories ;
 * - ses presets ;
 * - sa fonction de normalisation ;
 * - sa fonction de contexte spécifique à la fiche.
 */
const ITEM_PRESET_REGISTRY = {
  weapon: {
    type: "weapon",
    defaultNameKey: "ETERN.ITEM.DEFAULT_WEAPON_NAME",
    defaultBase: "unarmed",
    defaultCategory: "natural",
    defaultImage: "icons/weapons/swords/sword-guard.webp",
    enchantPlaceholderKey: "ETERN.WEAPON.ENCHANTMENT.PLACEHOLDER",
    categories: WEAPON_CATEGORIES,
    presets: WEAPON_PRESETS,
    baseMap: WEAPON_BASES,
    normalizeCategory: normalizeWeaponCategory,
    tagKeys: WEAPON_TAG_KEYS,
    tagLabels: WEAPON_TAG_LABELS,

    /**
     * Construit le contexte de fiche spécifique aux armes.
     *
     * @param {Item} item - Item arme.
     * @returns {object} Contexte de preset pour la fiche d’arme.
     */
    buildBaseContext(item) {
      const system = item.system ?? {};
      const base = resolvePresetBaseId(this.type, system.base, this.defaultBase);
      const preset = this.presets?.[base] ?? null;
      const category = this.normalizeCategory(
        preset?.category ?? system.category ?? this.defaultCategory,
        this.defaultCategory
      );

      return {
        weaponCategories: buildCategoryChoices(this.categories, category),
        weaponCategoryLabel: localizeCategoryChoice(this.categories, category),
        weaponBases: buildBaseChoices(this.type, getAllPresetBases(this.type), base),
        precisionChoices: buildPrecisionChoices(system.precisionBase),
        weightChoices: buildWeightChoices([0.3, 1, 2], system.weight ?? 1),
        tagChoices: buildWeaponTagChoices(this.tagKeys, this.tagLabels, system.tags),
        skillRows: buildWeaponSkillRows(system.skills)
      };
    }
  },

  armor: {
    type: "armor",
    defaultNameKey: "ETERN.ITEM.DEFAULT_ARMOR_NAME",
    defaultBase: "padded_armor",
    defaultCategory: "light",
    defaultImage: "icons/equipment/chest/breastplate-layered-leather-brown.webp",
    enchantPlaceholderKey: "ETERN.ARMOR.ENCHANTMENT.PLACEHOLDER",
    categories: ARMOR_CATEGORIES,
    presets: ARMOR_PRESETS,
    normalizeCategory: normalizeArmorCategory,
    saveKeys: ARMOR_SAVE_KEYS,
    skillPresets: ARMOR_SKILL_PRESETS,

    /**
     * Construit le contexte de fiche spécifique aux armures.
     *
     * @param {Item} item - Item armure.
     * @returns {object} Contexte de preset pour la fiche d’armure.
     */
    buildBaseContext(item) {
      const system = item.system ?? {};
      const base = resolvePresetBaseId(this.type, system.base, this.defaultBase);
      const preset = this.presets?.[base] ?? null;
      const category = this.normalizeCategory(
        preset?.category ?? system.category ?? this.defaultCategory,
        this.defaultCategory
      );

      return {
        armorCategories: buildCategoryChoices(this.categories, category),
        armorCategoryLabel: localizeCategoryChoice(this.categories, category),
        armorBases: buildBaseChoices(this.type, getAllPresetBases(this.type), base),
        weightChoices: buildWeightChoices([0, 0.3, 1, 2], system.weight ?? 1),
        saveRows: buildSaveRows(system.saves, this.saveKeys, "armor"),
        armorSkill: {
          name: String(system.skill?.name ?? ""),
          description: String(system.skill?.description ?? "")
        }
      };
    }
  },

  shield: {
    type: "shield",
    defaultNameKey: "ETERN.ITEM.DEFAULT_SHIELD_NAME",
    defaultBase: "buckler",
    defaultCategory: "light",
    defaultImage: "icons/equipment/shield/buckler-wooden-boss-brown.webp",
    enchantPlaceholderKey: "ETERN.SHIELD.ENCHANTMENT.PLACEHOLDER",
    categories: SHIELD_CATEGORIES,
    presets: SHIELD_PRESETS,
    normalizeCategory: normalizeShieldCategory,
    saveKeys: SHIELD_SAVE_KEYS,

    /**
     * Construit le contexte de fiche spécifique aux boucliers.
     *
     * @param {Item} item - Item bouclier.
     * @returns {object} Contexte de preset pour la fiche de bouclier.
     */
    buildBaseContext(item) {
      const system = item.system ?? {};
      const base = resolvePresetBaseId(this.type, system.base, this.defaultBase);
      const preset = this.presets?.[base] ?? null;
      const category = this.normalizeCategory(
        preset?.category ?? system.category ?? this.defaultCategory,
        this.defaultCategory
      );

      return {
        shieldCategories: buildCategoryChoices(this.categories, category),
        shieldCategoryLabel: localizeCategoryChoice(this.categories, category),
        shieldBases: buildBaseChoices(this.type, getAllPresetBases(this.type), base),
        weightChoices: buildWeightChoices([1, 2], system.weight ?? 2),
        saveRows: buildSaveRows(system.saves, this.saveKeys, "shield"),
        shieldSkill: {
          name: String(system.skill?.name ?? ""),
          description: String(system.skill?.description ?? "")
        }
      };
    }
  }
};

/**
 * Construit les choix de catégories pour une fiche d’item.
 *
 * @param {Record<string, string>} map - Table catégorie → clé i18n.
 * @param {string|null} [selectedValue=null] - Catégorie sélectionnée.
 * @returns {{value: string, label: string, selected: boolean}[]} Choix de catégories.
 */
function buildCategoryChoices(map, selectedValue = null) {
  return Object.entries(map ?? {}).map(([value, labelKey]) => ({
    value,
    label: game.i18n.localize(labelKey),
    selected: value === selectedValue
  }));
}

/**
 * Localise une catégorie.
 *
 * Si la catégorie est inconnue, la valeur brute est retournée.
 *
 * @param {Record<string, string>} map - Table catégorie → clé i18n.
 * @param {unknown} value - Catégorie à localiser.
 * @returns {string} Label localisé ou valeur brute.
 */
function localizeCategoryChoice(map, value) {
  const labelKey = map?.[String(value ?? "")];

  return labelKey
    ? game.i18n.localize(labelKey)
    : String(value ?? "");
}

/**
 * Récupère toutes les bases de presets disponibles pour un type d’item.
 *
 * @param {string} type - Type d’item.
 * @returns {string[]} Bases disponibles.
 */
function getAllPresetBases(type) {
  const config = getItemPresetConfig(type);

  return Object.keys(config?.presets ?? {});
}

/**
 * Construit les choix de bases de presets.
 *
 * Les bases sont localisées via `localizePresetName`.
 *
 * @param {string} itemType - Type d’item.
 * @param {string[]} values - Bases disponibles.
 * @param {string} [selectedValue=""] - Base sélectionnée.
 * @returns {{value: string, label: string, selected: boolean}[]} Choix de bases.
 */
function buildBaseChoices(itemType, values, selectedValue = "") {
  const normalizedSelectedValue = resolvePresetBaseId(
    itemType,
    selectedValue,
    String(selectedValue ?? "")
  );

  return values.map((value) => ({
    value,
    label: localizePresetName(itemType, value, value),
    selected: value === normalizedSelectedValue
  }));
}

/**
 * Construit les choix de poids ou d’encombrement.
 *
 * @param {number[]} values - Valeurs disponibles.
 * @param {unknown} selectedValue - Valeur sélectionnée.
 * @returns {{value: number, label: string, selected: boolean}[]} Choix de poids.
 */
function buildWeightChoices(values, selectedValue) {
  const current = Number(selectedValue ?? 0);

  return values.map((value) => ({
    value,
    label: String(value),
    selected: Math.abs(Number(value) - current) < 0.001
  }));
}

/**
 * Construit les choix de base de précision d’une arme.
 *
 * @param {unknown} selectedValue - Précision sélectionnée.
 * @returns {{value: string, selected: boolean}[]} Choix de précision.
 */
function buildPrecisionChoices(selectedValue) {
  const selected = String(selectedValue ?? "PRC").trim().toUpperCase();

  return PRECISION_BASES.map((value) => ({
    value,
    selected: value === selected
  }));
}

/**
 * Construit les choix de tags d’arme.
 *
 * @param {string[]} tagKeys - Tags disponibles.
 * @param {Record<string, string>} tagLabels - Table tag → clé i18n.
 * @param {unknown} selectedTags - Tags actuellement cochés.
 * @returns {{key: string, label: string, checked: boolean}[]} Choix de tags.
 */
function buildWeaponTagChoices(tagKeys, tagLabels, selectedTags) {
  const selectedSet = new Set(Array.isArray(selectedTags) ? selectedTags : []);

  return tagKeys.map((key) => ({
    key,
    label: game.i18n.localize(tagLabels[key] ?? key),
    checked: selectedSet.has(key)
  }));
}

/**
 * Construit les trois lignes de compétences d’une arme.
 *
 * @param {Array<object>} skills - Compétences stockées sur l’arme.
 * @returns {{index: number, name: string, description: string, learned: boolean}[]} Lignes de compétence.
 */
function buildWeaponSkillRows(skills) {
  return Array.from({ length: 3 }, (_, index) => {
    const row = skills?.[index] ?? {};

    return {
      index,
      name: String(row.name ?? ""),
      description: String(row.description ?? ""),
      learned: Boolean(row.learned)
    };
  });
}

/**
 * Construit les lignes de sauvegardes pour une armure ou un bouclier.
 *
 * @param {Array<object>|object} saves - Sauvegardes stockées sur l’item.
 * @param {Record<string, string>} labels - Table sauvegarde → clé i18n.
 * @param {string} itemType - Type d’item utilisé pour générer les ids d’input.
 * @returns {{key: string, label: string, value: number, inputId: string}[]} Lignes de sauvegardes.
 */
function buildSaveRows(saves, labels, itemType) {
  const source = normalizeSaveMap(saves, labels);

  return Object.keys(labels ?? {}).map((key) => ({
    key,
    label: game.i18n.localize(labels[key]),
    value: Number(source[key] ?? 0) || 0,
    inputId: `${itemType}-save-${key}`
  }));
}

/**
 * Normalise les sauvegardes d’un item.
 *
 * Cette fonction accepte deux formats :
 * - tableau : `[{ key, value }]` ou `[{ type, value }]` ;
 * - objet : `{ armor: 2, fire: 1 }`.
 *
 * Les clés attendues sont déterminées par `labels`.
 *
 * @param {Array<object>|object} saves - Données brutes de sauvegardes.
 * @param {Record<string, string>} labels - Sauvegardes attendues.
 * @returns {Record<string, number>} Sauvegardes normalisées.
 */
function normalizeSaveMap(saves, labels) {
  const result = Object.fromEntries(
    Object.keys(labels ?? {}).map((key) => [key, 0])
  );

  if (Array.isArray(saves)) {
    for (const row of saves) {
      const key = String(row?.key ?? row?.type ?? "");

      if (!key || !(key in result)) continue;

      result[key] = Number(row?.value ?? 0) || 0;
    }

    return result;
  }

  if (saves && typeof saves === "object") {
    for (const key of Object.keys(result)) {
      result[key] = Number(saves[key] ?? 0) || 0;
    }
  }

  return result;
}

/**
 * Récupère la configuration de presets d’un type d’item.
 *
 * @param {unknown} type - Type d’item.
 * @returns {object|null} Configuration de presets, ou `null`.
 */
export function getItemPresetConfig(type) {
  return ITEM_PRESET_REGISTRY[String(type ?? "")] ?? null;
}

/**
 * Récupère la base par défaut d’un type d’item.
 *
 * @param {unknown} type - Type d’item.
 * @returns {string} Base par défaut, ou chaîne vide.
 */
export function getDefaultBaseForItemType(type) {
  return getItemPresetConfig(type)?.defaultBase ?? "";
}

/**
 * Récupère la catégorie par défaut d’un type d’item.
 *
 * @param {unknown} type - Type d’item.
 * @returns {string} Catégorie par défaut, ou chaîne vide.
 */
export function getDefaultCategoryForItemType(type) {
  return getItemPresetConfig(type)?.defaultCategory ?? "";
}

/**
 * Récupère un preset d’item.
 *
 * Le preset est cloné avant d’être renvoyé pour éviter de modifier
 * les données du registre par accident.
 *
 * @param {unknown} type - Type d’item.
 * @param {unknown} baseName - Base du preset.
 * @returns {object|null} Preset cloné, ou `null`.
 */
export function getItemPreset(type, baseName) {
  const config = getItemPresetConfig(type);
  const presets = config?.presets ?? {};
  const defaultBase = config?.defaultBase ?? "";
  const resolvedBaseName = resolvePresetBaseId(type, baseName, defaultBase);
  const preset = presets[String(resolvedBaseName ?? "")];

  return preset
    ? foundry.utils.deepClone(preset)
    : null;
}

/**
 * Récupère les bases disponibles pour une catégorie donnée.
 *
 * Pour les armes, la recherche utilise `baseMap`.
 * Pour les autres types, elle filtre directement les presets selon leur catégorie.
 *
 * @param {unknown} type - Type d’item.
 * @param {unknown} category - Catégorie demandée.
 * @returns {string[]} Bases disponibles pour la catégorie.
 */
export function getPresetBasesForCategory(type, category) {
  const config = getItemPresetConfig(type);

  if (!config) return [];

  const normalizedCategory = config.normalizeCategory?.(
    category ?? config.defaultCategory,
    config.defaultCategory
  ) ?? String(category ?? "");

  if (config.baseMap) {
    return Array.from(config.baseMap[String(normalizedCategory)] ?? []);
  }

  return Object.entries(config.presets ?? {})
    .filter(([, preset]) => {
      return config.normalizeCategory?.(
        preset?.category ?? config.defaultCategory,
        config.defaultCategory
      ) === normalizedCategory;
    })
    .map(([name]) => name);
}

/**
 * Alias lisible de `getPresetBasesForCategory`.
 *
 * @param {unknown} type - Type d’item.
 * @param {unknown} category - Catégorie demandée.
 * @returns {string[]} Bases disponibles.
 */
export function getBasesForItemCategory(type, category) {
  return getPresetBasesForCategory(type, category);
}

/**
 * Construit le contexte de preset pour une fiche d’item.
 *
 * Si l’item n’a pas de registre de preset, seul un placeholder vide d’enchantement est renvoyé.
 *
 * @param {Item} item - Item dont on prépare le contexte.
 * @returns {object} Contexte de preset pour la fiche.
 */
export function buildItemSheetPresetContext(item) {
  const config = getItemPresetConfig(item?.type);

  if (!config) {
    return {
      enchantPlaceholder: ""
    };
  }

  return {
    ...config.buildBaseContext(item),
    enchantPlaceholder: game.i18n.localize(config.enchantPlaceholderKey)
  };
}