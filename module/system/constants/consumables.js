/**
 * Constantes et helpers liés aux consommables du système Etername.
 *
 * Responsabilités :
 * - déclarer les catégories de consommables ;
 * - déclarer les types de concoctions ;
 * - déclarer les qualités d’essence utilisées par les catalyseurs d’enchantement ;
 * - déclarer les définitions des bases de catalyseurs ;
 * - fournir des helpers de normalisation pour sécuriser les données système.
 *
 * Ce fichier doit rester un fichier de données et de normalisation.
 * Il ne doit pas contenir de logique UI, de logique d’enchantement complexe
 * ou de calculs métier liés aux effets des consommables.
 */

const DEFAULT_CONSUMABLE_CATEGORY = "misc";
const DEFAULT_CONCOCTION_TYPE = "healingPotion";
const DEFAULT_ESSENCE_QUALITY = "none";
const DEFAULT_CATALYST_BASE = "brutal_shard";

export const CONSUMABLE_CATEGORIES = {
  concoction: "ETERN.CONSUMABLE.CATEGORY.CONCOCTION",
  enchantmentCatalyst: "ETERN.CONSUMABLE.CATEGORY.ENCHANTMENT_CATALYST",
  misc: "ETERN.CONSUMABLE.CATEGORY.MISC"
};

export const CONCOCTION_TYPES = {
  healingPotion: "ETERN.CONSUMABLE.CONCOCTION.TYPES.HEALING_POTION",
  alterationPotion: "ETERN.CONSUMABLE.CONCOCTION.TYPES.ALTERATION_POTION"
};

export const ESSENCE_QUALITIES = {
  none: "ETERN.CONSUMABLE.CATALYST.ESSENCE_QUALITY.NONE",
  common: "ETERN.CONSUMABLE.CATALYST.ESSENCE_QUALITY.COMMON",
  superior: "ETERN.CONSUMABLE.CATALYST.ESSENCE_QUALITY.SUPERIOR",
  major: "ETERN.CONSUMABLE.CATALYST.ESSENCE_QUALITY.MAJOR",
  perfect: "ETERN.CONSUMABLE.CATALYST.ESSENCE_QUALITY.PERFECT"
};

export const ENCHANTMENT_CATALYST_DEFINITIONS = {
  brutal_shard: {
    labelKey: "ETERN.CONSUMABLE.CATALYST.BASES.BRUTAL_SHARD.NAME",
    descriptionKey: "ETERN.CONSUMABLE.CATALYST.BASES.BRUTAL_SHARD.DESCRIPTION",
    bonusLabelKey: "ETERN.CONSUMABLE.CATALYST.BASES.BRUTAL_SHARD.DESCRIPTION"
  },

  unstable_powder: {
    labelKey: "ETERN.CONSUMABLE.CATALYST.BASES.UNSTABLE_POWDER.NAME",
    descriptionKey: "ETERN.CONSUMABLE.CATALYST.BASES.UNSTABLE_POWDER.DESCRIPTION",
    bonusLabelKey: "ETERN.CONSUMABLE.CATALYST.BASES.UNSTABLE_POWDER.DESCRIPTION"
  },

  oblivion_crystal: {
    labelKey: "ETERN.CONSUMABLE.CATALYST.BASES.OBLIVION_CRYSTAL.NAME",
    descriptionKey: "ETERN.CONSUMABLE.CATALYST.BASES.OBLIVION_CRYSTAL.DESCRIPTION",
    bonusLabelKey: "ETERN.CONSUMABLE.CATALYST.BASES.OBLIVION_CRYSTAL.DESCRIPTION"
  },

  shifting_stone: {
    labelKey: "ETERN.CONSUMABLE.CATALYST.BASES.SHIFTING_STONE.NAME",
    descriptionKey: "ETERN.CONSUMABLE.CATALYST.BASES.SHIFTING_STONE.DESCRIPTION",
    bonusLabelKey: "ETERN.CONSUMABLE.CATALYST.BASES.SHIFTING_STONE.DESCRIPTION"
  },

  inflexible_inkwell: {
    labelKey: "ETERN.CONSUMABLE.CATALYST.BASES.INFLEXIBLE_INKWELL.NAME",
    descriptionKey: "ETERN.CONSUMABLE.CATALYST.BASES.INFLEXIBLE_INKWELL.DESCRIPTION",
    bonusLabelKey: "ETERN.CONSUMABLE.CATALYST.BASES.INFLEXIBLE_INKWELL.DESCRIPTION"
  },

  primordial_orb: {
    labelKey: "ETERN.CONSUMABLE.CATALYST.BASES.PRIMORDIAL_ORB.NAME",
    descriptionKey: "ETERN.CONSUMABLE.CATALYST.BASES.PRIMORDIAL_ORB.DESCRIPTION",
    bonusLabelKey: "ETERN.CONSUMABLE.CATALYST.BASES.PRIMORDIAL_ORB.DESCRIPTION"
  },

  master_fragment: {
    labelKey: "ETERN.CONSUMABLE.CATALYST.BASES.MASTER_FRAGMENT.NAME",
    descriptionKey: "ETERN.CONSUMABLE.CATALYST.BASES.MASTER_FRAGMENT.DESCRIPTION",
    bonusLabelKey: "ETERN.CONSUMABLE.CATALYST.BASES.MASTER_FRAGMENT.DESCRIPTION"
  },

  dark_oath: {
    labelKey: "ETERN.CONSUMABLE.CATALYST.BASES.DARK_OATH.NAME",
    descriptionKey: "ETERN.CONSUMABLE.CATALYST.BASES.DARK_OATH.DESCRIPTION",
    bonusLabelKey: "ETERN.CONSUMABLE.CATALYST.BASES.DARK_OATH.DESCRIPTION"
  },

  eternity_orb: {
    labelKey: "ETERN.CONSUMABLE.CATALYST.BASES.ETERNITY_ORB.NAME",
    descriptionKey: "ETERN.CONSUMABLE.CATALYST.BASES.ETERNITY_ORB.DESCRIPTION",
    bonusLabelKey: "ETERN.CONSUMABLE.CATALYST.BASES.ETERNITY_ORB.DESCRIPTION"
  }
};

/**
 * Normalise une valeur en vérifiant qu’elle existe comme clé dans une table donnée.
 *
 * Cette fonction évite de répéter la même logique dans chaque normaliseur.
 *
 * @param {unknown} value - Valeur brute à normaliser.
 * @param {Record<string, unknown>} definitions - Table de référence contenant les clés valides.
 * @param {string} fallback - Valeur utilisée si l’entrée est absente ou inconnue.
 * @param {object} [options] - Options de normalisation.
 * @param {boolean} [options.lowercase=false] - Force la valeur en minuscules avant validation.
 * @returns {string} Clé valide issue de la table, ou fallback.
 */
function normalizeDefinitionKey(value, definitions, fallback, { lowercase = false } = {}) {
  const raw = String(value ?? "").trim();
  const normalized = lowercase ? raw.toLowerCase() : raw;

  return normalized in definitions ? normalized : fallback;
}

/**
 * Normalise une catégorie de consommable.
 *
 * Les catégories utilisent des clés canoniques comme :
 * - `concoction`
 * - `enchantmentCatalyst`
 * - `misc`
 *
 * @param {unknown} value - Catégorie brute à normaliser.
 * @param {string} [fallback=DEFAULT_CONSUMABLE_CATEGORY] - Catégorie utilisée si la valeur est invalide.
 * @returns {string} Catégorie de consommable valide.
 */
export function normalizeConsumableCategory(value, fallback = DEFAULT_CONSUMABLE_CATEGORY) {
  return normalizeDefinitionKey(value, CONSUMABLE_CATEGORIES, fallback);
}

/**
 * Normalise un type de concoction.
 *
 * Les types de concoction utilisent des clés canoniques comme :
 * - `healingPotion`
 * - `alterationPotion`
 *
 * @param {unknown} value - Type brut à normaliser.
 * @param {string} [fallback=DEFAULT_CONCOCTION_TYPE] - Type utilisé si la valeur est invalide.
 * @returns {string} Type de concoction valide.
 */
export function normalizeConcoctionType(value, fallback = DEFAULT_CONCOCTION_TYPE) {
  return normalizeDefinitionKey(value, CONCOCTION_TYPES, fallback);
}

/**
 * Normalise une qualité d’essence de catalyseur.
 *
 * Cette normalisation est volontairement insensible à la casse,
 * car les qualités sont stockées en minuscules.
 *
 * @param {unknown} value - Qualité brute à normaliser.
 * @param {string} [fallback=DEFAULT_ESSENCE_QUALITY] - Qualité utilisée si la valeur est invalide.
 * @returns {string} Qualité d’essence valide.
 */
export function normalizeEssenceQuality(value, fallback = DEFAULT_ESSENCE_QUALITY) {
  return normalizeDefinitionKey(value, ESSENCE_QUALITIES, fallback, {
    lowercase: true
  });
}

/**
 * Normalise une base de catalyseur d’enchantement.
 *
 * Cette normalisation est volontairement insensible à la casse,
 * car les clés des bases de catalyseur sont en snake_case minuscule.
 *
 * @param {unknown} value - Base brute à normaliser.
 * @param {string} [fallback=DEFAULT_CATALYST_BASE] - Base utilisée si la valeur est invalide.
 * @returns {string} Clé valide de base de catalyseur.
 */
export function normalizeCatalystBase(value, fallback = DEFAULT_CATALYST_BASE) {
  return normalizeDefinitionKey(value, ENCHANTMENT_CATALYST_DEFINITIONS, fallback, {
    lowercase: true
  });
}

/**
 * Récupère la définition complète d’une base de catalyseur.
 *
 * La fonction passe toujours par `normalizeCatalystBase` afin de garantir
 * qu’une définition valide est retournée, même si l’entrée est vide ou inconnue.
 *
 * @param {unknown} base - Clé brute ou canonique de la base de catalyseur.
 * @returns {{labelKey: string, descriptionKey: string, bonusLabelKey: string}} Définition du catalyseur.
 */
export function getCatalystDefinition(base) {
  const normalizedBase = normalizeCatalystBase(base);

  return ENCHANTMENT_CATALYST_DEFINITIONS[normalizedBase]
    ?? ENCHANTMENT_CATALYST_DEFINITIONS[DEFAULT_CATALYST_BASE];
}

/**
 * Renvoie la base de catalyseur utilisée par défaut.
 *
 * Cette fonction évite de répéter la chaîne brute dans les modèles,
 * factories ou formulaires qui créent des catalyseurs.
 *
 * @returns {string} Clé de la base de catalyseur par défaut.
 */
export function getDefaultCatalystBase() {
  return DEFAULT_CATALYST_BASE;
}