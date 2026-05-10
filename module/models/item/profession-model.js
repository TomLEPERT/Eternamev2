/**
 * DataModel d’item : Profession model.
 *
 * Responsabilités :
 * - déclarer les champs persistants du type d’item ;
 * - définir les valeurs initiales et contraintes de formulaire ;
 * - laisser les labels, totaux et résumés calculés à `system.derived`.
 *
 * Ce fichier doit rester déclaratif et ne pas contenir de logique UI.
 */

import { buildProfessionEntryArrayField, stringField } from './fields.js';

export class ProfessionModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: stringField(''),
      passives: buildProfessionEntryArrayField({ withActive: true }),
      keys: buildProfessionEntryArrayField({ withUniversal: true }),
      conditions: buildProfessionEntryArrayField({ withUniversal: true }),
      mechanics: buildProfessionEntryArrayField({ withUniversal: true }),
      states: buildProfessionEntryArrayField({ withUniversal: true })
    };
  }
}
