/**
 * Fragment de schéma personnage : Attributes schema.
 *
 * Responsabilités :
 * - déclarer un groupe cohérent de champs DataModel ;
 * - centraliser les valeurs initiales et contraintes de validation ;
 * - éviter de dupliquer les définitions entre modèles d’acteurs.
 *
 * Ce fichier doit rester déclaratif et sans logique de règles.
 */

import { ETERNAME_ATTRIBUTES, ETERNAME_ATTRIBUTE_MAX_VALUE } from '../../../system/constants/attributes.js';

const { fields } = foundry.data;

export function createAttributesSchema() {
  const schema = {};

  for (const [key, data] of Object.entries(ETERNAME_ATTRIBUTES)) {
    schema[key] = new fields.SchemaField({
      abbr: new fields.StringField({ required: true, initial: data.abbr }),
      label: new fields.StringField({ required: true, initial: data.label }),
      value: new fields.NumberField({ required: true, integer: true, min: 0, max: ETERNAME_ATTRIBUTE_MAX_VALUE, initial: 5 }),
      ticks: new fields.NumberField({ required: true, integer: true, min: 0, max: 4, initial: 0 })
    });
  }

  return new fields.SchemaField(schema);
}

export function createAttributeBonusSchema() {
  const schema = {};
  for (const key of Object.keys(ETERNAME_ATTRIBUTES)) {
    schema[key] = new fields.NumberField({ required: true, integer: true, initial: 0 });
  }
  return new fields.SchemaField(schema);
}
