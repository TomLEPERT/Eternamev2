/**
 * Fragment de schéma personnage : Movement magic schema.
 *
 * Responsabilités :
 * - déclarer un groupe cohérent de champs DataModel ;
 * - centraliser les valeurs initiales et contraintes de validation ;
 * - éviter de dupliquer les définitions entre modèles d’acteurs.
 *
 * Ce fichier doit rester déclaratif et sans logique de règles.
 */

const { fields } = foundry.data;

export function createMovementSchema() {
  return new fields.SchemaField({
    base: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
    modes: new fields.ArrayField(
      new fields.SchemaField({
        id: new fields.StringField({ required: true, blank: false, initial: '' }),
        name: new fields.StringField({ required: true, blank: true, initial: '' }),
        value: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        auto: new fields.BooleanField({ required: true, initial: false })
      }),
      { required: true, initial: [] }
    )
  });
}

export function createMagicSchema() {
  return new fields.ArrayField(
    new fields.SchemaField({
      id: new fields.StringField({ required: true, blank: false, initial: '' }),
      type: new fields.StringField({ required: true, blank: false, initial: 'canalisation' }),
      current: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 })
    }),
    { required: true, initial: [] }
  );
}
