/**
 * DataModel d’item : Material model.
 *
 * Responsabilités :
 * - déclarer les champs persistants du type d’item ;
 * - définir les valeurs initiales et contraintes de formulaire ;
 * - laisser les labels, totaux et résumés calculés à `system.derived`.
 *
 * Ce fichier doit rester déclaratif et ne pas contenir de logique UI.
 */

import { BaseItemModel } from "./base-item-model.js";
import { numberField, stringField } from "./fields.js";

export class MaterialModel extends BaseItemModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      category: stringField("alchemical"),
      difficulty: numberField(0, { integer: true, min: 0 }),
      tag: stringField("body"),
      forgingProperty: stringField("")
    };
  }
}
