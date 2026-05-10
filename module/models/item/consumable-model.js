/**
 * DataModel d’item : Consumable model.
 *
 * Responsabilités :
 * - déclarer les champs persistants du type d’item ;
 * - définir les valeurs initiales et contraintes de formulaire ;
 * - laisser les labels, totaux et résumés calculés à `system.derived`.
 *
 * Ce fichier doit rester déclaratif et ne pas contenir de logique UI.
 */

import { BaseItemModel } from './base-item-model.js';
import { buildEnchantingField, numberField, stringField } from './fields.js';

export class ConsumableModel extends BaseItemModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      category: stringField('misc'),
      concoctionType: stringField('healingPotion'),
      essenceQuality: stringField('none'),
      essenceTag: stringField(''),
      catalystBase: stringField('brutal_shard'),
      enchanting: buildEnchantingField()
    };
  }
}
