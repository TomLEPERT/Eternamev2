/**
 * Fragment de schéma personnage : States schema.
 *
 * Responsabilités :
 * - déclarer un groupe cohérent de champs DataModel ;
 * - centraliser les valeurs initiales et contraintes de validation ;
 * - éviter de dupliquer les définitions entre modèles d’acteurs.
 *
 * Ce fichier doit rester déclaratif et sans logique de règles.
 */

import { ETERNAME_ATTRIBUTES } from '../../../system/constants/attributes.js';
import { ETERNAME_STATES } from '../../../system/constants/states.js';

const { fields } = foundry.data;

export function createStateResistanceSchema() {
  return new fields.SchemaField({
    attr: new fields.StringField({
      required: true,
      initial: 'robustness',
      choices: Object.keys(ETERNAME_ATTRIBUTES)
    })
  });
}

export function createStatesSchema() {
  const schema = {};
  for (const state of ETERNAME_STATES) {
    schema[state.id] = new fields.SchemaField({
      active: new fields.BooleanField({ required: true, initial: false }),
      value: new fields.NumberField({ required: true, integer: true, initial: 0 })
    });
  }
  return new fields.SchemaField(schema);
}
