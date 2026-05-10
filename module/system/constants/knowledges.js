/**
 * Référentiel des niveaux de connaissance du système Etername.
 *
 * Responsabilités :
 * - déclarer les niveaux de connaissance disponibles ;
 * - associer chaque niveau à sa clé i18n ;
 * - fournir une source unique pour les formulaires, affichages et règles utilisant la connaissance.
 *
 * Ce fichier doit rester un fichier de constantes.
 * Il ne doit pas contenir de logique de jet, de progression ou de validation complexe.
 */

/**
 * Niveaux de connaissance disponibles.
 *
 * Les clés internes sont en anglais et doivent rester stables,
 * car elles peuvent être stockées dans les données des acteurs, items ou techniques.
 *
 * Les valeurs sont des clés i18n utilisées pour l’affichage.
 *
 * @type {Record<string, string>}
 */
export const ETERNAME_KNOWLEDGES = {
  common: "ETERN.KNOWLEDGE.COMMON",
  educated: "ETERN.KNOWLEDGE.EDUCATED",
  erudite: "ETERN.KNOWLEDGE.ERUDITE",
  hidden: "ETERN.KNOWLEDGE.HIDDEN"
};