/**
 * DataModel d’acteur : Character.
 *
 * Responsabilités :
 * - déclarer le schéma moderne du type d’acteur correspondant ;
 * - composer les fragments de schéma réutilisables ;
 * - garder les calculs dérivés hors du modèle persistant.
 *
 * Ce fichier doit rester centré sur la structure des données source.
 */

import { createAttributesSchema } from './character/attributes-schema.js';
import { createBonusesSchema } from './character/bonuses-schema.js';
import { createArmorTrainingSchema, createAttacksSchema, createDefenseSchema } from './character/combat-schema.js';
import { createIdentitySchema } from './character/identity-schema.js';
import {
  createInventorySchema,
  createRenownSchema,
  createTechniqueSlotsSchema,
  createWealthSchema
} from './character/inventory-social-schema.js';
import { createMagicSchema, createMovementSchema } from './character/movement-magic-schema.js';
import { createProgressionTrackSchema, createTrackSchema } from './character/progression-schema.js';
import { createAccustomanceDisabledField, createOverdoseField, createResourcesSchema } from './character/resources-schema.js';
import { createSavesSchema } from './character/saves-schema.js';
import { createStateResistanceSchema, createStatesSchema } from './character/states-schema.js';

const { fields } = foundry.data;

export class CharacterModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      identity: createIdentitySchema(),
      resources: createResourcesSchema(),
      armorTraining: createArmorTrainingSchema(),
      defense: createDefenseSchema(),
      attacks: createAttacksSchema(),
      saves: createSavesSchema(),
      progressTracks: new fields.ArrayField(createTrackSchema(), { required: true, initial: [] }),
      overdose: createOverdoseField(),
      movement: createMovementSchema(),
      magic: createMagicSchema(),
      accustomance: createProgressionTrackSchema(),
      accustomanceDisabled: createAccustomanceDisabledField(),
      inventory: createInventorySchema(),
      techniques: createTechniqueSlotsSchema(),
      wealth: createWealthSchema(),
      renown: createRenownSchema(),
      stateResistance: createStateResistanceSchema(),
      states: createStatesSchema(),
      bonuses: createBonusesSchema(),
      attributes: createAttributesSchema()
    };
  }
}
