/**
 * Fragment de schéma personnage : Progression schema.
 *
 * Responsabilités :
 * - déclarer un groupe cohérent de champs DataModel ;
 * - centraliser les valeurs initiales et contraintes de validation ;
 * - éviter de dupliquer les définitions entre modèles d’acteurs.
 *
 * Ce fichier doit rester déclaratif et sans logique de règles.
 */

const { fields } = foundry.data;

export function createProgressionTrackSchema() {
  return new fields.SchemaField({
    name: new fields.StringField({ required: true, blank: true, initial: '' }),
    objectives: new fields.ArrayField(
      new fields.StringField({ required: true, blank: true, initial: '' }),
      { required: true, initial: [] }
    ),
    boxes: createBooleanBoxesField()
  });
}

export function createTrackSchema() {
  return new fields.SchemaField({
    id: new fields.StringField({ required: true, blank: false, initial: '' }),
    name: new fields.StringField({ required: true, blank: true, initial: '' }),
    objectivesText: new fields.StringField({ required: true, blank: true, initial: '' }),
    objectives: new fields.ArrayField(
      new fields.NumberField({ required: true, integer: true, min: 1, max: 12, initial: 1 }),
      { required: true, initial: [] }
    ),
    boxes: createBooleanBoxesField()
  });
}

export function createBooleanBoxesField(size = 12) {
  return new fields.ArrayField(
    new fields.BooleanField({ required: true, initial: false }),
    { required: true, initial: Array.from({ length: size }, () => false) }
  );
}
