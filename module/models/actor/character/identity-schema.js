/**
 * Fragment de schéma personnage : Identity schema.
 *
 * Responsabilités :
 * - déclarer un groupe cohérent de champs DataModel ;
 * - centraliser les valeurs initiales et contraintes de validation ;
 * - éviter de dupliquer les définitions entre modèles d’acteurs.
 *
 * Ce fichier doit rester déclaratif et sans logique de règles.
 */

import { ETERNAME_KNOWLEDGES } from '../../../system/constants/knowledges.js';
import { ETERNAME_PROFILES } from '../../../system/constants/profiles.js';
import { ETERNAME_SIZES } from '../../../system/constants/sizes.js';
import { ETERNAME_SPECIES } from '../../../system/constants/species.js';

const { fields } = foundry.data;

export function createIdentitySchema() {
  return new fields.SchemaField({
    playerName: textField(),
    species: new fields.StringField({ required: true, initial: 'human', choices: Object.keys(ETERNAME_SPECIES) }),
    profile: new fields.StringField({ required: true, initial: 'warrior', choices: Object.keys(ETERNAME_PROFILES) }),
    gender: textField(),
    knowledge: new fields.StringField({ required: true, initial: 'common', choices: Object.keys(ETERNAME_KNOWLEDGES) }),
    size: new fields.StringField({ required: true, initial: 'medium', choices: Object.keys(ETERNAME_SIZES) }),
    xp: new fields.SchemaField({
      total: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      used: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 })
    }),
    description: textField(),
    personality: textField(),
    history: textField(),
    gmNotes: textField()
  });
}

function textField() {
  return new fields.StringField({ required: true, blank: true, initial: '' });
}
