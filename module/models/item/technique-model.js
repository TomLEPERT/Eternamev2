/**
 * DataModel d’item : Technique model.
 *
 * Responsabilités :
 * - déclarer les champs persistants du type d’item ;
 * - définir les valeurs initiales et contraintes de formulaire ;
 * - laisser les labels, totaux et résumés calculés à `system.derived`.
 *
 * Ce fichier doit rester déclaratif et ne pas contenir de logique UI.
 */

import {
  buildTechniqueComponentArrayField,
  buildTechniqueProfessionIdArrayField,
  buildTechniqueStatisticArrayField,
  buildTechniquePowerEnhancementArrayField,
  booleanField,
  numberField,
  stringField
} from './fields.js';

export class TechniqueModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: stringField(''),
      prepared: booleanField(false),
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
