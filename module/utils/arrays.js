/**
 * Helpers génériques de normalisation de tableaux.
 *
 * Responsabilités :
 * - convertir les valeurs potentiellement absentes en tableaux sûrs ;
 * - éviter de répéter les mêmes garde-fous dans les services métier ;
 * - garder les fonctions pures, sans dépendance à Foundry ou à l’interface.
 */

/**
 * Retourne la valeur uniquement si elle est déjà un tableau.
 *
 * @param {unknown} value - Valeur brute.
 * @returns {Array} Tableau valide ou tableau vide.
 */
export function asArray(value) {
  return Array.isArray(value) ? value : [];
}
