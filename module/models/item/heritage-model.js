/**
 * DataModel d’item : Heritage model.
 *
 * Responsabilités :
 * - déclarer les champs persistants du type d’item ;
 * - définir les valeurs initiales et contraintes de formulaire ;
 * - laisser les labels, totaux et résumés calculés à `system.derived`.
 *
 * Ce fichier doit rester déclaratif et ne pas contenir de logique UI.
 */

import { BaseItemModel } from './base-item-model.js';
import {
  booleanField,
  buildTechniqueComponentArrayField,
  buildProfessionEntryArrayField,
  buildTechniquePowerEnhancementArrayField,
  buildTechniqueProfessionIdArrayField,
  buildTechniqueStatisticArrayField,
  numberField,
  stringField
} from './fields.js';

export class HeritageModel extends BaseItemModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      heritageType: stringField('ancestral'),
      featureType: stringField('passive'),
      active: booleanField(false),
      prepared: booleanField(false),
      passives: buildProfessionEntryArrayField({ withActive: true }),
      usageType: stringField('attack'),
      linkedAttributeKey: stringField('magic'),
      professionIds: buildTechniqueProfessionIdArrayField(),
      keys: buildTechniqueComponentArrayField(),
      conditions: buildTechniqueComponentArrayField(),
      mechanics: buildTechniqueComponentArrayField(),
      states: buildTechniqueComponentArrayField(),
      statistics: buildTechniqueStatisticArrayField(),
      mainStatisticId: stringField(''),
      power: numberField(0, { integer: true, min: 0, max: 10 }),
      powerEnhancements: buildTechniquePowerEnhancementArrayField()
    };
  }
}
