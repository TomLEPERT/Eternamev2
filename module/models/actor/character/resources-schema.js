/**
 * Fragment de schéma personnage : Resources schema.
 *
 * Responsabilités :
 * - déclarer un groupe cohérent de champs DataModel ;
 * - centraliser les valeurs initiales et contraintes de validation ;
 * - éviter de dupliquer les définitions entre modèles d’acteurs.
 *
 * Ce fichier doit rester déclaratif et sans logique de règles.
 */

import { createBooleanBoxesField, createProgressionTrackSchema } from './progression-schema.js';

const { fields } = foundry.data;

export function createResourcesSchema() {
  return new fields.SchemaField({
    hp: new fields.SchemaField({
      value: new fields.NumberField({ required: true, integer: true, min: 0, initial: 10 }),
      max: new fields.NumberField({ required: true, integer: true, min: 0, initial: 10 }),
      boxes: createBooleanBoxesField(),
      severeWounds: new fields.NumberField({ required: true, integer: true, min: 0, max: 4, initial: 0 }),
      progression: createProgressionTrackSchema()
    }),
    destiny: new fields.SchemaField({
      value: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 })
    }),
    fatigue: new fields.SchemaField({
      value: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 })
    })
  });
}

export function createAccustomanceDisabledField() {
  return new fields.NumberField({ required: true, integer: true, min: 0, max: 11, initial: 11 });
}

export function createOverdoseField() {
  return new fields.NumberField({ required: true, integer: true, initial: 0 });
}
