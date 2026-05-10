/**
 * Fragment de schéma personnage : Saves schema.
 *
 * Responsabilités :
 * - déclarer un groupe cohérent de champs DataModel ;
 * - centraliser les valeurs initiales et contraintes de validation ;
 * - éviter de dupliquer les définitions entre modèles d’acteurs.
 *
 * Ce fichier doit rester déclaratif et sans logique de règles.
 */

import { createBooleanBoxesField } from './progression-schema.js';
import { SAVE_DEFINITIONS } from './save-definitions.js';

const { fields } = foundry.data;

export function createSavesSchema() {
  const schema = {};
  for (const [key, config] of SAVE_DEFINITIONS) {
    schema[key] = createSaveSchema(config.labelKey, config.sourceAttr);
  }
  return new fields.SchemaField(schema);
}

export function createAttributelessSaveBonusSchema() {
  const schema = {};
  for (const [key] of SAVE_DEFINITIONS) {
    schema[key] = new fields.NumberField({ required: true, integer: true, initial: 0 });
  }
  return new fields.SchemaField(schema);
}

function createSaveSchema(labelKey = '', sourceAttr = '') {
  return new fields.SchemaField({
    labelKey: new fields.StringField({ required: true, blank: false, initial: labelKey }),
    name: new fields.StringField({ required: true, blank: true, initial: '' }),
    sourceAttr: new fields.StringField({ required: true, blank: true, initial: sourceAttr }),
    bonus: new fields.NumberField({ required: true, integer: true, initial: 0 }),
    bonusGear: new fields.NumberField({ required: true, integer: true, initial: 0 }),
    bonusOther: new fields.NumberField({ required: true, integer: true, initial: 0 }),
    boxes: createBooleanBoxesField()
  });
}
