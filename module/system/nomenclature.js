/**
 * Centralise la nomenclature interne du système Etername.
 *
 * Responsabilités :
 * - convertir les anciennes valeurs françaises ou mixtes vers des valeurs anglaises canoniques ;
 * - éviter que la logique métier dépende de libellés affichés ou de traductions ;
 * - fournir des helpers de localisation pour les valeurs techniques les plus utilisées.
 *
 * Règle importante :
 * le code interne doit manipuler uniquement les valeurs anglaises canoniques.
 * Les alias français existent seulement pour la compatibilité avec d’anciennes données
 * ou avec des saisies manuelles.
 */

// Alias acceptés pour les catégories d’armure.
export const ARMOR_CATEGORY_ALIASES = {
  natural: "natural",
  naturelle: "natural",

  light: "light",
  legere: "light",
  légère: "light",

  medium: "medium",
  intermediaire: "medium",
  intermédiaire: "medium",

  heavy: "heavy",
  lourde: "heavy"
};

// Alias acceptés pour les catégories de bouclier.
export const SHIELD_CATEGORY_ALIASES = {
  light: "light",
  legere: "light",
  légère: "light",

  medium: "medium",
  intermediaire: "medium",
  intermédiaire: "medium",

  heavy: "heavy",
  lourde: "heavy"
};

// Alias acceptés pour les catégories d’arme.
export const WEAPON_CATEGORY_ALIASES = {
  natural: "natural",
  naturelle: "natural",

  sidearm: "sidearm",
  poignet: "sidearm",

  wooden: "wooden",
  bois: "wooden",

  mechanical: "mechanical",
  mecanique: "mechanical",
  mécanique: "mechanical"
};

// Alias acceptés pour les types de dégâts.
export const DAMAGE_TYPE_ALIASES = {
  bludgeoning: "bludgeoning",
  contondant: "bludgeoning",

  piercing: "piercing",
  perçant: "piercing",
  percant: "piercing",

  slashing: "slashing",
  tranchant: "slashing",

  fire: "fire",
  feu: "fire",

  ice: "ice",
  glace: "ice",
  froid: "ice",

  lightning: "lightning",
  foudre: "lightning",

  earth: "earth",
  terre: "earth",

  wind: "wind",
  vent: "wind",

  acid: "acid",
  acide: "acid",

  magic: "magic",
  magique: "magic",

  mental: "mental",
  mentale: "mental"
};

// Alias acceptés pour les portées.
export const RANGE_ALIASES = {
  melee: "melee",
  cac: "melee",
  contact: "melee"
};

/**
 * Normalise une valeur à partir d’une table d’alias.
 *
 * La fonction :
 * - convertit la valeur en chaîne ;
 * - retire les espaces inutiles ;
 * - compare en minuscules ;
 * - renvoie la valeur canonique si elle existe ;
 * - renvoie le fallback si la valeur est vide ou inconnue.
 *
 * @param {unknown} value - Valeur à normaliser.
 * @param {Record<string, string>} aliases - Table d’alias vers valeurs canoniques.
 * @param {string} fallback - Valeur utilisée si l’entrée est vide ou inconnue.
 * @returns {string} Valeur canonique normalisée.
 */
function normalizeFromAliases(value, aliases, fallback = "") {
  const raw = String(value ?? "").trim();

  if (!raw) return fallback;

  return aliases[raw.toLowerCase()] ?? fallback;
}

/**
 * Normalise une catégorie d’armure vers une valeur canonique.
 *
 * @param {unknown} value - Catégorie brute à normaliser.
 * @param {string} fallback - Catégorie utilisée si la valeur est absente ou inconnue.
 * @returns {"natural"|"light"|"medium"|"heavy"|string} Catégorie d’armure normalisée.
 */
export function normalizeArmorCategory(value, fallback = "light") {
  return normalizeFromAliases(value, ARMOR_CATEGORY_ALIASES, fallback);
}

/**
 * Normalise une catégorie de bouclier vers une valeur canonique.
 *
 * @param {unknown} value - Catégorie brute à normaliser.
 * @param {string} fallback - Catégorie utilisée si la valeur est absente ou inconnue.
 * @returns {"light"|"medium"|"heavy"|string} Catégorie de bouclier normalisée.
 */
export function normalizeShieldCategory(value, fallback = "light") {
  return normalizeFromAliases(value, SHIELD_CATEGORY_ALIASES, fallback);
}

/**
 * Normalise une catégorie d’arme vers une valeur canonique.
 *
 * @param {unknown} value - Catégorie brute à normaliser.
 * @param {string} fallback - Catégorie utilisée si la valeur est absente ou inconnue.
 * @returns {"natural"|"sidearm"|"wooden"|"mechanical"|string} Catégorie d’arme normalisée.
 */
export function normalizeWeaponCategory(value, fallback = "natural") {
  return normalizeFromAliases(value, WEAPON_CATEGORY_ALIASES, fallback);
}

/**
 * Normalise un type de dégâts vers une valeur canonique.
 *
 * @param {unknown} value - Type de dégâts brut à normaliser.
 * @param {string} fallback - Type utilisé si la valeur est absente ou inconnue.
 * @returns {string} Type de dégâts normalisé.
 */
export function normalizeDamageType(value, fallback = "") {
  return normalizeFromAliases(value, DAMAGE_TYPE_ALIASES, fallback);
}

/**
 * Normalise une portée vers une valeur canonique.
 *
 * @param {unknown} value - Portée brute à normaliser.
 * @param {string} fallback - Portée utilisée si la valeur est absente ou inconnue.
 * @returns {"melee"|string} Portée normalisée.
 */
export function normalizeRange(value, fallback = "melee") {
  return normalizeFromAliases(value, RANGE_ALIASES, fallback);
}

/**
 * Localise une portée pour l’affichage utilisateur.
 *
 * La logique interne continue d’utiliser la valeur canonique anglaise,
 * tandis que cette fonction fournit le libellé traduit.
 *
 * @param {unknown} value - Portée brute ou canonique.
 * @returns {string} Libellé localisé de la portée.
 */
export function localizeRange(value) {
  const normalized = normalizeRange(value, "melee");

  if (normalized === "melee") {
    return game.i18n.localize("ETERN.COMMON.RANGE.MELEE");
  }

  return String(normalized);
}

/**
 * Localise un type de dégâts pour l’affichage utilisateur.
 *
 * Si la valeur n’est pas connue, la fonction renvoie une chaîne vide
 * afin d’éviter d’afficher une clé i18n brute dans l’interface.
 *
 * @param {unknown} value - Type de dégâts brut ou canonique.
 * @returns {string} Libellé localisé du type de dégâts.
 */
export function localizeDamageType(value) {
  const normalized = normalizeDamageType(value, "");

  if (!normalized) return "";

  const key = `ETERN.COMMON.DAMAGE_TYPE.${normalized.toUpperCase()}`;

  return game.i18n.localize(key);
}