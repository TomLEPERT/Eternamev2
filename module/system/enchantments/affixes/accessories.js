/**
 * Catalogue d’affixes d’enchantement : Accessories.
 *
 * Responsabilités :
 * - déclarer les affixes disponibles pour une famille d’items ;
 * - utiliser des identifiants internes stables et des clés i18n ;
 * - rester un fichier de données sans logique de tirage ou d’application.
 *
 * Les calculs d’enchantement doivent rester dans les services dédiés.
 */


import { ACCESSORY_PREFIX_AFFIXES } from './accessory-prefixes.js';
import { ACCESSORY_ATTRIBUTE_DICE_AFFIXES } from './accessory-attribute-dice.js';
import { ACCESSORY_SUFFIX_AFFIXES } from './accessory-suffixes.js';

export const ACCESSORY_AFFIXES = Object.freeze([
  ...ACCESSORY_PREFIX_AFFIXES,
  ...ACCESSORY_ATTRIBUTE_DICE_AFFIXES,
  ...ACCESSORY_SUFFIX_AFFIXES
]);
