/**
 * Référentiel des clés de sauvegarde utilisables par les items du système Etername.
 *
 * Responsabilités :
 * - déclarer la liste canonique des sauvegardes pouvant être modifiées par des items ;
 * - associer chaque sauvegarde à sa clé i18n ;
 * - fournir une source unique pour les formulaires, modèles et règles liés aux bonus de sauvegarde.
 *
 * Ce fichier doit rester un fichier de constantes.
 * Il ne doit pas contenir de calcul de sauvegarde, de logique d’équipement ou de rendu UI.
 *
 * Note :
 * si d’autres fichiers déclarent les mêmes clés, préférer importer ces constantes
 * pour éviter la duplication et les divergences futures.
 */

/**
 * Liste ordonnée des sauvegardes utilisables par les items.
 *
 * L’ordre est important s’il est utilisé pour afficher les champs dans une fiche.
 * Les clés internes sont en anglais et doivent rester stables,
 * car elles peuvent être stockées dans les données des acteurs ou items.
 *
 * @type {string[]}
 */
export const ITEM_SAVE_KEYS = [
  "dodge",
  "parry",
  "pain",
  "cover",
  "armor",
  "fire",
  "ice",
  "lightning",
  "earth",
  "wind",
  "mental",
  "acid",
  "magic"
];

/**
 * Correspondance entre les clés internes de sauvegarde et leurs clés i18n.
 *
 * `Object.freeze` empêche les modifications accidentelles au runtime.
 * Cela protège le référentiel contre les mutations involontaires depuis une fiche,
 * un service ou un helper.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const ITEM_SAVE_LABEL_KEYS = Object.freeze({
  dodge: "ETERN.SAVE.DODGE",
  parry: "ETERN.SAVE.PARRY",
  pain: "ETERN.SAVE.PAIN",
  cover: "ETERN.SAVE.COVER",
  armor: "ETERN.SAVE.ARMOR",
  fire: "ETERN.SAVE.FIRE",
  ice: "ETERN.SAVE.ICE",
  lightning: "ETERN.SAVE.LIGHTNING",
  earth: "ETERN.SAVE.EARTH",
  wind: "ETERN.SAVE.WIND",
  mental: "ETERN.SAVE.MENTAL",
  acid: "ETERN.SAVE.ACID",
  magic: "ETERN.SAVE.MAGIC"
});