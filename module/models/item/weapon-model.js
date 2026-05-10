/**
 * DataModel d’item : Weapon model.
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
  learnedSkillField,
  numberField,
  stringField
} from "./fields.js";

const { fields } = foundry.data;

export class WeaponModel extends BaseItemModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      equipped: booleanField(false),
      category: stringField("natural"),
      base: stringField("unarmed"),
      range: stringField("melee"),
      damage: stringField("1d6"),
      damageType: stringField("bludgeoning"),
      precisionBase: stringField("PRC"),
      precisionBonus: numberField(0, { integer: true }),
      tags: new fields.ArrayField(stringField("")),
      skills: new fields.ArrayField(learnedSkillField()),
      enchanting: buildEnchantingField()
    };
  }
}
