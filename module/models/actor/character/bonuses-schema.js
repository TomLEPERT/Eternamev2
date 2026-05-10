/**
 * Fragment de schéma personnage : Bonuses schema.
 *
 * Responsabilités :
 * - déclarer un groupe cohérent de champs DataModel ;
 * - centraliser les valeurs initiales et contraintes de validation ;
 * - éviter de dupliquer les définitions entre modèles d’acteurs.
 *
 * Ce fichier doit rester déclaratif et sans logique de règles.
 */

import { createAttributeBonusSchema } from './attributes-schema.js';
import { createAttributelessSaveBonusSchema } from './saves-schema.js';

const { fields } = foundry.data;

export function createBonusesSchema() {
  return new fields.SchemaField({
    attributesValue: createAttributeBonusSchema(),
    attributesIndex: createAttributeBonusSchema(),
    attributesDice: createAttributeBonusSchema(),
    hpMax: new fields.NumberField({ required: true, integer: true, initial: 0 }),
    initiative: new fields.NumberField({ required: true, integer: true, initial: 0 }),
    destinyDice: new fields.NumberField({ required: true, integer: true, initial: 0 }),
    fatigueMax: new fields.NumberField({ required: true, integer: true, initial: 0 }),
    explorationPassive: new fields.NumberField({ required: true, integer: true, initial: 0 }),
    spellSlotsMax: new fields.NumberField({ required: true, integer: true, initial: 0 }),
    psMax: new fields.NumberField({ required: true, integer: true, initial: 0 }),
    power: new fields.NumberField({ required: true, integer: true, initial: 0 }),
    combat: new fields.SchemaField({
      prc: new fields.NumberField({ required: true, integer: true, initial: 0 }),
      prd: new fields.NumberField({ required: true, integer: true, initial: 0 }),
      prm: new fields.NumberField({ required: true, integer: true, initial: 0 }),
      def: new fields.NumberField({ required: true, integer: true, initial: 0 })
    }),
    saves: createAttributelessSaveBonusSchema()
  });
}
