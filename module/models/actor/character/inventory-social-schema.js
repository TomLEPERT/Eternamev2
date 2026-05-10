/**
 * Fragment de schéma personnage : Inventory social schema.
 *
 * Responsabilités :
 * - déclarer un groupe cohérent de champs DataModel ;
 * - centraliser les valeurs initiales et contraintes de validation ;
 * - éviter de dupliquer les définitions entre modèles d’acteurs.
 *
 * Ce fichier doit rester déclaratif et sans logique de règles.
 */

const { fields } = foundry.data;

export function createInventorySchema() {
  return new fields.SchemaField({
    notes: new fields.StringField({ required: true, blank: true, initial: '' })
  });
}

export function createTechniqueSlotsSchema() {
  return new fields.SchemaField({
    professionSlots: new fields.SchemaField({
      first: new fields.StringField({ required: true, blank: true, initial: '' }),
      second: new fields.StringField({ required: true, blank: true, initial: '' })
    })
  });
}

export function createWealthSchema() {
  return new fields.SchemaField({
    pp: coinField(),
    rc: coinField(),
    po: coinField(),
    pa: coinField(),
    pc: coinField(),
    lifeStyle: new fields.StringField({ required: true, blank: true, initial: '' })
  });
}

export function createRenownSchema() {
  return new fields.SchemaField({
    positive: coinField(),
    negative: coinField()
  });
}

function coinField() {
  return new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 });
}
