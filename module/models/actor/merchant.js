/**
 * DataModel d’acteur : Merchant.
 *
 * Responsabilités :
 * - déclarer le schéma moderne du type d’acteur correspondant ;
 * - composer les fragments de schéma réutilisables ;
 * - garder les calculs dérivés hors du modèle persistant.
 *
 * Ce fichier doit rester centré sur la structure des données source.
 */

const { fields } = foundry.data;

function buildAcceptedTypesSchema() {
  const itemTypes = ["weapon", "armor", "shield", "gear", "object", "tool", "material", "consumable", "bag"];
  return Object.fromEntries(itemTypes.map((type) => [type, new fields.BooleanField({ required: true, initial: true })]));
}

function buildWealthSchema() {
  return new fields.SchemaField({
    pp: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
    rc: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
    po: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
    pa: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
    pc: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 })
  });
}

export class MerchantModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new fields.StringField({ required: true, blank: true, initial: "" }),
      wealth: buildWealthSchema(),
      trade: new fields.SchemaField({
        acceptedTypes: new fields.SchemaField(buildAcceptedTypesSchema()),
        acceptsLegal: new fields.BooleanField({ required: true, initial: true }),
        acceptsIllegal: new fields.BooleanField({ required: true, initial: false })
      })
    };
  }
}
