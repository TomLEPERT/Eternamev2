/**
 * Fragment de schéma personnage : Combat schema.
 *
 * Responsabilités :
 * - déclarer un groupe cohérent de champs DataModel ;
 * - centraliser les valeurs initiales et contraintes de validation ;
 * - éviter de dupliquer les définitions entre modèles d’acteurs.
 *
 * Ce fichier doit rester déclaratif et sans logique de règles.
 */

const { fields } = foundry.data;

export function createArmorTrainingSchema() {
  return new fields.SchemaField({
    light: new fields.BooleanField({ initial: false }),
    medium: new fields.BooleanField({ initial: false }),
    heavy: new fields.BooleanField({ initial: false })
  });
}

export function createDefenseSchema() {
  return new fields.SchemaField({
    armor: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
    shield: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
    bonus: new fields.NumberField({ required: true, integer: true, initial: 0 })
  });
}

export function createAttacksSchema() {
  return new fields.ArrayField(
    new fields.SchemaField({
      id: new fields.StringField({ required: true, blank: false, initial: '' }),
      name: new fields.StringField({ required: true, blank: true, initial: '' }),
      range: new fields.StringField({ required: true, blank: true, initial: 'melee' }),
      damage: new fields.StringField({ required: true, blank: true, initial: '1d6' }),
      type: new fields.StringField({ required: true, blank: true, initial: '' })
    }),
    { required: true, initial: [] }
  );
}
