/**
 * DataModel d’acteur : Invocation.
 *
 * Responsabilités :
 * - déclarer le schéma moderne du type d’acteur correspondant ;
 * - composer les fragments de schéma réutilisables ;
 * - garder les calculs dérivés hors du modèle persistant.
 *
 * Ce fichier doit rester centré sur la structure des données source.
 */

import { CharacterModel } from './character.js';

const { fields } = foundry.data;

export class InvocationActorModel extends CharacterModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      invocation: new fields.SchemaField({
        sourceActorId: new fields.StringField({ required: true, blank: true, initial: '' }),
        profileItemId: new fields.StringField({ required: true, blank: true, initial: '' }),
        sourceTechniqueId: new fields.StringField({ required: true, blank: true, initial: '' }),
        sourceInvocationSize: new fields.StringField({ required: true, blank: false, initial: 'medium' }),
        generatedFromPower: new fields.NumberField({ required: true, integer: true, min: 0, max: 10, initial: 0 }),
        generatedBonuses: new fields.SchemaField({
          damageDiceBonus: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          magicTypes: new fields.ArrayField(new fields.StringField({ required: true, blank: false, initial: 'canalisation' }), { required: true, initial: [] }),
          appliedPowerBoons: new fields.ArrayField(
            new fields.SchemaField({
              id: new fields.StringField({ required: true, blank: true, initial: '' }),
              type: new fields.StringField({ required: true, blank: true, initial: '' }),
              target: new fields.StringField({ required: true, blank: true, initial: '' }),
              applied: new fields.BooleanField({ required: true, initial: false })
            }),
            { required: true, initial: [] }
          )
        })
      })
    };
  }
}
