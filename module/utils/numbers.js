/**
 * Helpers génériques de normalisation numérique.
 *
 * Responsabilités :
 * - convertir les valeurs de formulaire en nombres sûrs ;
 * - centraliser les règles d’arrondi utilisées dans plusieurs services ;
 * - éviter les valeurs NaN dans les données préparées ou affichées.
 */

/**
 * Convertit une valeur en entier.
 *
 * Les valeurs négatives sont conservées.
 * L’arrondi se fait vers le bas pour conserver le comportement historique du système.
 *
 * @param {unknown} value - Valeur brute.
 * @param {number} [fallback=0] - Valeur utilisée si l’entrée est invalide.
 * @returns {number} Entier normalisé.
 */
export function toInteger(value, fallback = 0) {
  const numericValue = Number(value ?? fallback);
  const numericFallback = Number(fallback ?? 0);
  const safeFallback = Number.isFinite(numericFallback) ? Math.floor(numericFallback) : 0;

  if (!Number.isFinite(numericValue)) return safeFallback;

  return Math.floor(numericValue);
}

/**
 * Convertit une valeur en entier positif.
 *
 * Quand un fallback est fourni, il sert aussi de minimum autorisé.
 * Cela permet de protéger les compteurs qui doivent commencer à 1.
 *
 * @param {unknown} value - Valeur brute.
 * @param {number} [fallback=0] - Minimum et valeur de secours.
 * @returns {number} Entier positif normalisé.
 */
export function toPositiveInteger(value, fallback = 0) {
  const minimum = Math.max(0, toInteger(fallback, 0));
  const numericValue = Number(value ?? fallback);

  if (!Number.isFinite(numericValue)) return minimum;

  return Math.max(minimum, Math.floor(numericValue));
}
