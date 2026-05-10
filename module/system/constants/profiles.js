/**
 * Référentiel des profils de personnage du système Etername.
 *
 * Responsabilités :
 * - déclarer les profils disponibles pour les personnages ;
 * - associer chaque profil à sa clé i18n ;
 * - fournir une source unique pour les formulaires, affichages et règles qui utilisent les profils.
 *
 * Ce fichier doit rester un fichier de constantes.
 * Il ne doit pas contenir de logique de création de personnage, de bonus ou de progression.
 */

/**
 * Profils de personnage disponibles.
 *
 * Les clés internes sont en anglais et doivent rester stables,
 * car elles peuvent être stockées dans les données des acteurs ou utilisées par des règles.
 *
 * Les valeurs sont des clés i18n utilisées pour l’affichage.
 *
 * @type {Record<string, string>}
 */
export const ETERNAME_PROFILES = {
  warrior: "ETERN.PROFILE.WARRIOR",
  support: "ETERN.PROFILE.SUPPORT",
  elementalist: "ETERN.PROFILE.ELEMENTALIST",
  mage: "ETERN.PROFILE.MAGE",
  disciple: "ETERN.PROFILE.DISCIPLE",
  engineer: "ETERN.PROFILE.ENGINEER",
  rogue: "ETERN.PROFILE.ROGUE",
  ranger: "ETERN.PROFILE.RANGER",
  monk: "ETERN.PROFILE.MONK"
};