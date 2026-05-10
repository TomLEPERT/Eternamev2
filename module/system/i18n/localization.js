/**
 * Helpers génériques de localisation i18n.
 *
 * Responsabilités :
 * - simplifier l’appel à `game.i18n.localize` ;
 * - simplifier l’appel à `game.i18n.format` quand des variables sont fournies ;
 * - fournir une localisation avec fallback si une clé i18n est absente.
 *
 * Ce fichier doit rester très léger.
 * Il ne doit pas contenir de clés i18n spécifiques au système, ni de logique métier.
 */

/**
 * Localise une clé i18n Foundry.
 *
 * Si des données de formatage sont fournies, la fonction utilise `game.i18n.format`.
 * Sinon, elle utilise `game.i18n.localize`.
 *
 * Exemple :
 *
 * ```js
 * localize("ETERN.MESSAGE.HELLO")
 * localize("ETERN.MESSAGE.XP_GAIN", { amount: 3 })
 * ```
 *
 * @param {string} key - Clé i18n à localiser.
 * @param {object|null} [formatData=null] - Données utilisées par `game.i18n.format`.
 * @returns {string} Texte localisé.
 */
export function localize(key, formatData = null) {
  return formatData
    ? game.i18n.format(key, formatData)
    : game.i18n.localize(key);
}

/**
 * Localise une clé i18n seulement si elle existe.
 *
 * Foundry renvoie généralement la clé elle-même quand aucune traduction n’est trouvée.
 * Cette fonction détecte ce cas et renvoie un fallback à la place.
 *
 * @param {string} key - Clé i18n à localiser.
 * @param {string} [fallback=""] - Valeur utilisée si la clé est absente.
 * @returns {string} Texte localisé ou fallback.
 */
export function localizeIfAvailable(key, fallback = "") {
  const value = game.i18n.localize(key);

  return value === key
    ? fallback
    : value;
}