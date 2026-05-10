/**
 * Constantes et helpers liés aux héritages du système Etername.
 *
 * Responsabilités :
 * - déclarer les types d’héritages disponibles : ancestral ou culturel ;
 * - déclarer les formes possibles d’un héritage : passif ou technique ;
 * - normaliser les valeurs stockées dans les items héritage ;
 * - produire des listes de choix localisées pour les formulaires.
 *
 * Ce fichier ne doit contenir que des données de référence et des helpers simples.
 * La logique d’application des bonus passifs ou d’utilisation des techniques d’héritage
 * doit rester dans les services dédiés.
 */

const DEFAULT_HERITAGE_TYPE = "ancestral";
const DEFAULT_HERITAGE_FEATURE_TYPE = "passive";

export const HERITAGE_TYPES = {
  ancestral: "ETERN.HERITAGE.TYPE.ANCESTRAL",
  cultural: "ETERN.HERITAGE.TYPE.CULTURAL"
};

export const HERITAGE_FEATURE_TYPES = {
  passive: "ETERN.HERITAGE.FEATURE_TYPE.PASSIVE",
  technique: "ETERN.HERITAGE.FEATURE_TYPE.TECHNIQUE"
};

/**
 * Normalise une valeur en vérifiant qu’elle existe comme clé dans une table donnée.
 *
 * @param {unknown} value - Valeur brute à normaliser.
 * @param {Record<string, string>} choices - Table des choix autorisés.
 * @param {string} fallback - Valeur utilisée si l’entrée est absente ou invalide.
 * @returns {string} Valeur normalisée.
 */
function normalizeChoice(value, choices, fallback) {
  const normalized = String(value ?? "").trim();

  return normalized in choices ? normalized : fallback;
}

/**
 * Normalise le type d’un héritage.
 *
 * Valeurs autorisées :
 * - `ancestral`
 * - `cultural`
 *
 * Toute valeur absente ou inconnue revient à `ancestral`.
 *
 * @param {unknown} value - Type brut à normaliser.
 * @returns {"ancestral"|"cultural"} Type d’héritage normalisé.
 */
export function normalizeHeritageType(value) {
  return normalizeChoice(value, HERITAGE_TYPES, DEFAULT_HERITAGE_TYPE);
}

/**
 * Normalise la forme fonctionnelle d’un héritage.
 *
 * Valeurs autorisées :
 * - `passive`
 * - `technique`
 *
 * Toute valeur absente ou inconnue revient à `passive`.
 *
 * @param {unknown} value - Type brut de fonctionnalité à normaliser.
 * @returns {"passive"|"technique"} Type de fonctionnalité normalisé.
 */
export function normalizeHeritageFeatureType(value) {
  return normalizeChoice(value, HERITAGE_FEATURE_TYPES, DEFAULT_HERITAGE_FEATURE_TYPE);
}

/**
 * Construit les choix localisés pour un champ de type d’héritage.
 *
 * Cette fonction est destinée au contexte de fiche ou de formulaire.
 * Elle dépend de `game.i18n`, donc elle doit être appelée quand Foundry est initialisé.
 *
 * @param {unknown} selectedValue - Valeur actuellement sélectionnée.
 * @returns {{value: string, label: string, selected: boolean}[]} Choix localisés pour le template.
 */
export function getHeritageTypeChoices(selectedValue) {
  const selected = normalizeHeritageType(selectedValue);

  return Object.entries(HERITAGE_TYPES).map(([value, labelKey]) => ({
    value,
    label: game.i18n.localize(labelKey),
    selected: value === selected
  }));
}

/**
 * Construit les choix localisés pour un champ de forme d’héritage.
 *
 * Cette fonction permet d’afficher le choix entre :
 * - héritage passif ;
 * - héritage technique.
 *
 * Elle dépend de `game.i18n`, donc elle doit être appelée depuis une feuille,
 * un dialogue ou un contexte déjà rendu par Foundry.
 *
 * @param {unknown} selectedValue - Valeur actuellement sélectionnée.
 * @returns {{value: string, label: string, selected: boolean}[]} Choix localisés pour le template.
 */
export function getHeritageFeatureTypeChoices(selectedValue) {
  const selected = normalizeHeritageFeatureType(selectedValue);

  return Object.entries(HERITAGE_FEATURE_TYPES).map(([value, labelKey]) => ({
    value,
    label: game.i18n.localize(labelKey),
    selected: value === selected
  }));
}