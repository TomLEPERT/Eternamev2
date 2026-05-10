/**
 * DataModel d’item : Invocation model.
 *
 * Responsabilités :
 * - déclarer les champs persistants du type d’item ;
 * - définir les valeurs initiales et contraintes de formulaire ;
 * - laisser les labels, totaux et résumés calculés à `system.derived`.
 *
 * Ce fichier doit rester déclaratif et ne pas contenir de logique UI.
 */

import { booleanField, numberField, stringField } from './fields.js';
import { INVOCATION_ATTRIBUTE_KEYS, INVOCATION_THRESHOLD_KEYS } from '../../system/techniques/invocation-definitions.js';
import { ETERNAME_ATTRIBUTE_MAX_VALUE } from '../../system/constants/attributes.js';

const { fields } = foundry.data;

function buildInvocationAttributeSchema() {
  const schema = {};
  for (const key of INVOCATION_ATTRIBUTE_KEYS) {
    schema[key] = numberField(0, { integer: true, min: 0, max: ETERNAME_ATTRIBUTE_MAX_VALUE });
  }
  return new fields.SchemaField(schema);
}

function buildInvocationPowerBoonsField() {
  return new fields.ArrayField(
    new fields.SchemaField({
      id: stringField(''),
      type: stringField('hp'),
      target: stringField(''),
      notes: stringField('')
    }),
    { required: true, initial: [] }
  );
}

function buildInvocationThresholdSchema() {
  const schema = {};
  for (const key of INVOCATION_THRESHOLD_KEYS) {
    schema[key] = new fields.SchemaField({
      techniqueId: stringField(''),
      notes: stringField('')
    });
  }
  return new fields.SchemaField(schema);
}

export class InvocationModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: stringField(''),
      techniqueId: stringField(''),
      actorId: stringField(''),
      size: stringField('medium'),
      baseCreationXp: numberField(0, { integer: true, min: 0 }),
      attributes: buildInvocationAttributeSchema(),
      powerBoons: buildInvocationPowerBoonsField(),
      thresholds: buildInvocationThresholdSchema(),
      notes: stringField(''),
      prepared: booleanField(false)
    };
  }
}
