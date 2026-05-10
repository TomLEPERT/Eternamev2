/**
 * Constantes et helpers liés aux matériaux du système Etername.
 *
 * Responsabilités :
 * - déclarer les catégories de matériaux ;
 * - déclarer les tags alchimiques disponibles ;
 * - définir les relations alchimiques entre tags : aligné et opposé ;
 * - fournir des helpers de normalisation pour sécuriser les données stockées.
 *
 * Ce fichier doit rester un référentiel de données.
 * Il ne doit pas contenir de logique UI, de calcul d’artisanat ou de règles d’alchimie complexes.
 */

const DEFAULT_MATERIAL_CATEGORY = "alchemical";
const DEFAULT_ALCHEMICAL_TAG = "body";

export const MATERIAL_CATEGORIES = {
  alchemical: "ETERN.MATERIAL.CATEGORY.ALCHEMICAL",
  forging: "ETERN.MATERIAL.CATEGORY.FORGING"
};

export const ALCHEMICAL_TAG_KEYS = {
  body: "ETERN.MATERIAL.ALCHEMICAL.TAGS.BODY",
  earth: "ETERN.MATERIAL.ALCHEMICAL.TAGS.EARTH",
  root: "ETERN.MATERIAL.ALCHEMICAL.TAGS.ROOT",
  fire: "ETERN.MATERIAL.ALCHEMICAL.TAGS.FIRE",
  ice: "ETERN.MATERIAL.ALCHEMICAL.TAGS.ICE",
  lightning: "ETERN.MATERIAL.ALCHEMICAL.TAGS.LIGHTNING",
  wind: "ETERN.MATERIAL.ALCHEMICAL.TAGS.WIND",
  chaos: "ETERN.MATERIAL.ALCHEMICAL.TAGS.CHAOS",
  spirit: "ETERN.MATERIAL.ALCHEMICAL.TAGS.SPIRIT"
};

/**
 * Définitions des tags alchimiques.
 *
 * Chaque tag contient :
 * - `labelKey` : clé i18n du nom du tag ;
 * - `usageKey` : clé i18n décrivant son usage ;
 * - `aligned` : tag considéré comme compatible ou renforçant ;
 * - `opposed` : tag considéré comme opposé.
 *
 * Les relations sont stockées sous forme de clés internes anglaises.
 */
export const ALCHEMICAL_MATERIAL_DEFINITIONS = {
  body: {
    labelKey: ALCHEMICAL_TAG_KEYS.body,
    usageKey: "ETERN.MATERIAL.ALCHEMICAL.USES.BODY",
    aligned: "root",
    opposed: "chaos"
  },

  earth: {
    labelKey: ALCHEMICAL_TAG_KEYS.earth,
    usageKey: "ETERN.MATERIAL.ALCHEMICAL.USES.EARTH",
    aligned: "ice",
    opposed: "wind"
  },

  root: {
    labelKey: ALCHEMICAL_TAG_KEYS.root,
    usageKey: "ETERN.MATERIAL.ALCHEMICAL.USES.ROOT",
    aligned: "body",
    opposed: "lightning"
  },

  fire: {
    labelKey: ALCHEMICAL_TAG_KEYS.fire,
    usageKey: "ETERN.MATERIAL.ALCHEMICAL.USES.FIRE",
    aligned: "lightning",
    opposed: "ice"
  },

  ice: {
    labelKey: ALCHEMICAL_TAG_KEYS.ice,
    usageKey: "ETERN.MATERIAL.ALCHEMICAL.USES.ICE",
    aligned: "earth",
    opposed: "fire"
  },

  lightning: {
    labelKey: ALCHEMICAL_TAG_KEYS.lightning,
    usageKey: "ETERN.MATERIAL.ALCHEMICAL.USES.LIGHTNING",
    aligned: "fire",
    opposed: "root"
  },

  wind: {
    labelKey: ALCHEMICAL_TAG_KEYS.wind,
    usageKey: "ETERN.MATERIAL.ALCHEMICAL.USES.WIND",
    aligned: "chaos",
    opposed: "earth"
  },

  chaos: {
    labelKey: ALCHEMICAL_TAG_KEYS.chaos,
    usageKey: "ETERN.MATERIAL.ALCHEMICAL.USES.CHAOS",
    aligned: "wind",
    opposed: "body"
  },

  spirit: {
    labelKey: ALCHEMICAL_TAG_KEYS.spirit,
    usageKey: "ETERN.MATERIAL.ALCHEMICAL.USES.SPIRIT",
    aligned: "ice",
    opposed: "fire"
  }
};

/**
 * Normalise une valeur en vérifiant qu’elle existe comme clé dans une table donnée.
 *
 * Cette fonction évite de laisser circuler des valeurs invalides dans les données système.
 *
 * @param {unknown} value - Valeur brute à normaliser.
 * @param {Record<string, unknown>} definitions - Table contenant les clés valides.
 * @param {string} fallback - Valeur utilisée si l’entrée est absente ou invalide.
 * @returns {string} Clé valide issue de la table, ou fallback sécurisé.
 */
function normalizeDefinitionKey(value, definitions, fallback) {
  const normalized = String(value ?? "").trim().toLowerCase();
  const safeFallback = fallback in definitions
    ? fallback
    : Object.keys(definitions)[0] ?? "";

  return normalized in definitions ? normalized : safeFallback;
}

/**
 * Normalise une catégorie de matériau.
 *
 * Valeurs autorisées :
 * - `alchemical`
 * - `forging`
 *
 * @param {unknown} value - Catégorie brute à normaliser.
 * @param {string} [fallback=DEFAULT_MATERIAL_CATEGORY] - Catégorie utilisée si l’entrée est invalide.
 * @returns {string} Catégorie de matériau valide.
 */
export function normalizeMaterialCategory(value, fallback = DEFAULT_MATERIAL_CATEGORY) {
  return normalizeDefinitionKey(value, MATERIAL_CATEGORIES, fallback);
}

/**
 * Normalise un tag alchimique.
 *
 * Valeurs autorisées :
 * - `body`
 * - `earth`
 * - `root`
 * - `fire`
 * - `ice`
 * - `lightning`
 * - `wind`
 * - `chaos`
 * - `spirit`
 *
 * @param {unknown} value - Tag brut à normaliser.
 * @param {string} [fallback=DEFAULT_ALCHEMICAL_TAG] - Tag utilisé si l’entrée est invalide.
 * @returns {string} Tag alchimique valide.
 */
export function normalizeAlchemicalTag(value, fallback = DEFAULT_ALCHEMICAL_TAG) {
  return normalizeDefinitionKey(value, ALCHEMICAL_MATERIAL_DEFINITIONS, fallback);
}

/**
 * Récupère la définition complète d’un tag alchimique.
 *
 * La fonction normalise toujours le tag avant lecture afin de garantir
 * qu’une définition valide est renvoyée.
 *
 * @param {unknown} tag - Tag brut ou canonique.
 * @returns {{labelKey: string, usageKey: string, aligned: string, opposed: string}} Définition alchimique.
 */
export function getAlchemicalMaterialDefinition(tag) {
  const normalizedTag = normalizeAlchemicalTag(tag);

  return ALCHEMICAL_MATERIAL_DEFINITIONS[normalizedTag]
    ?? ALCHEMICAL_MATERIAL_DEFINITIONS[DEFAULT_ALCHEMICAL_TAG];
}

/**
 * Renvoie le tag alchimique utilisé par défaut.
 *
 * Cette fonction évite de répéter directement la chaîne `"body"`
 * dans les modèles, factories ou formulaires.
 *
 * @returns {string} Tag alchimique par défaut.
 */
export function getDefaultAlchemicalTag() {
  return DEFAULT_ALCHEMICAL_TAG;
}