/**
 * Préparation des données dérivées des matériaux.
 *
 * Responsabilités :
 * - normaliser la catégorie du matériau ;
 * - normaliser la difficulté ;
 * - normaliser le tag alchimique ;
 * - garantir une propriété de forge textuelle ;
 * - appliquer un nom par défaut si l’item n’en possède pas.
 *
 * Ce fichier doit rester dédié aux matériaux.
 * Il ne doit pas contenir la logique d’alchimie, de forge, d’enchantement
 * ou d’application des effets en jeu.
 */

import { toPositiveInteger } from '../../../utils/numbers.js';
import {
  getDefaultAlchemicalTag,
  normalizeAlchemicalTag,
  normalizeMaterialCategory
} from "../../constants/materials.js";

/**
 * Prépare les données système d’un item matériau.
 *
 * La fonction normalise :
 * - `category` avec les catégories connues de matériaux ;
 * - `difficulty` en entier positif ou zéro ;
 * - `tag` avec les tags alchimiques connus ;
 * - `forgingProperty` en chaîne de texte ;
 * - le nom de l’item si celui-ci est vide.
 *
 * @param {Item} item - Item matériau à préparer.
 * @param {object} system - Données système mutables du matériau.
 * @returns {void}
 */
export function prepareMaterialData(item, system) {
  system.category = normalizeMaterialCategory(system.category ?? "alchemical");
  system.difficulty = toPositiveInteger(system.difficulty);
  system.tag = normalizeAlchemicalTag(system.tag ?? getDefaultAlchemicalTag());
  system.forgingProperty = String(system.forgingProperty ?? "");

  if (!String(item.name ?? "").trim()) {
    item.name = game.i18n.localize("ETERN.ITEM.DEFAULT_MATERIAL_NAME");
  }
}

