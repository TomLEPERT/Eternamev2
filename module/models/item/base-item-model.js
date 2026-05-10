/**
 * DataModel d’item : Base item model.
 *
 * Responsabilités :
 * - déclarer les champs persistants du type d’item ;
 * - définir les valeurs initiales et contraintes de formulaire ;
 * - laisser les labels, totaux et résumés calculés à `system.derived`.
 *
 * Ce fichier doit rester déclaratif et ne pas contenir de logique UI.
 */

import { buildCommonItemSchema } from "./fields.js";

export class BaseItemModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return buildCommonItemSchema();
  }
}
