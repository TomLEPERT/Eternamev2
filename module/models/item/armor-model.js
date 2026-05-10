/**
 * DataModel d’item : Armor model.
 *
 * Responsabilités :
 * - déclarer les champs persistants du type d’item ;
 * - définir les valeurs initiales et contraintes de formulaire ;
 * - laisser les labels, totaux et résumés calculés à `system.derived`.
 *
 * Ce fichier doit rester déclaratif et ne pas contenir de logique UI.
 */

import { BaseItemModel } from "./base-item-model.js";
import {
  booleanField,
  buildEnchantingField,
  numberField,
  saveMapField,
  skillField,
  stringField
} from "./fields.js";

const { fields } = foundry.data;

export class ArmorModel extends BaseItemModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      equipped: booleanField(false),
      category: stringField("light"),
      base: stringField("padded_armor"),
      defFormula: stringField("2 + AGI/2"),
      defBonus: numberField(0, { integer: true }),
      saves: saveMapField(),
      skill: skillField(),
      enchanting: buildEnchantingField()
    };
  }
}
