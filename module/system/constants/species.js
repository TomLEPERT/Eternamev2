/**
 * Référentiel des espèces disponibles dans le système Etername.
 *
 * Responsabilités :
 * - déclarer les espèces jouables ou utilisables par les acteurs ;
 * - associer chaque espèce à sa clé i18n ;
 * - fournir une source unique pour les formulaires, fiches et règles qui utilisent l’espèce d’un personnage.
 *
 * Ce fichier doit rester un fichier de constantes.
 * Il ne doit pas contenir de logique de création de personnage, de bonus d’espèce,
 * de règles d’héritage ou de calculs dérivés.
 */

/**
 * Liste canonique des espèces du système.
 *
 * Les clés internes sont en anglais ou en noms propres d’univers.
 * Elles doivent rester stables, car elles peuvent être stockées dans les données des acteurs.
 *
 * Les valeurs sont des clés i18n utilisées pour l’affichage.
 *
 * @type {Record<string, string>}
 */
export const ETERNAME_SPECIES = {
  human: "ETERN.SPECIES.HUMAN",
  afflicted: "ETERN.SPECIES.AFFLICTED",
  anima: "ETERN.SPECIES.ANIMA",
  foljesjaggerkin: "ETERN.SPECIES.FOLJESJAGGERKIN",
  eternal: "ETERN.SPECIES.ETERNAL",
  silvindari: "ETERN.SPECIES.SILVINDARI",
  rohrk: "ETERN.SPECIES.ROHRK",
  nexian: "ETERN.SPECIES.NEXIAN",
  lx: "ETERN.SPECIES.LX",
  goblin: "ETERN.SPECIES.GOBLIN"
};