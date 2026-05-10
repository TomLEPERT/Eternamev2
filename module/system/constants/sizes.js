/**
 * Référentiel des tailles disponibles dans le système Etername.
 *
 * Responsabilités :
 * - déclarer les catégories de taille utilisables par les acteurs ;
 * - associer chaque taille à sa clé i18n ;
 * - fournir une source unique pour les formulaires, fiches et règles qui utilisent la taille d’une créature.
 *
 * Ce fichier doit rester un fichier de constantes.
 * Il ne doit pas contenir de logique de déplacement, d’encombrement, de portée,
 * de calcul de défense ou de modificateurs liés à la taille.
 */

/**
 * Liste canonique des tailles du système.
 *
 * Les clés internes sont en anglais et doivent rester stables,
 * car elles peuvent être stockées dans les données des acteurs.
 *
 * Les valeurs sont des clés i18n utilisées pour l’affichage.
 *
 * @type {Record<string, string>}
 */
export const ETERNAME_SIZES = {
  very_small: "ETERN.SIZE.VERY_SMALL",
  small: "ETERN.SIZE.SMALL",
  medium: "ETERN.SIZE.MEDIUM",
  large: "ETERN.SIZE.LARGE",
  very_large: "ETERN.SIZE.VERY_LARGE",
  colossal: "ETERN.SIZE.COLOSSAL"
};