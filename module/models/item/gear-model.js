/**
 * DataModel d’item : Gear model.
 *
 * Responsabilités :
 * - déclarer les champs persistants du type d’item ;
 * - définir les valeurs initiales et contraintes de formulaire ;
 * - laisser les labels, totaux et résumés calculés à `system.derived`.
 *
 * Ce fichier doit rester déclaratif et ne pas contenir de logique UI.
 */

import { BaseItemModel } from "./base-item-model.js";
import { booleanField, buildEnchantingField } from "./fields.js";

export class GearModel extends BaseItemModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      equipped: booleanField(false),
      enchanting: buildEnchantingField()
    };
  }
}
