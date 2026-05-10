/**
 * Catalogue d’affixes d’enchantement : Accessory attribute dice.
 *
 * Responsabilités :
 * - déclarer les affixes disponibles pour une famille d’items ;
 * - utiliser des identifiants internes stables et des clés i18n ;
 * - rester un fichier de données sans logique de tirage ou d’application.
 *
 * Les calculs d’enchantement doivent rester dans les services dédiés.
 */

import { defineAffix, actorRank, itemRank } from './helpers.js';

export const ACCESSORY_ATTRIBUTE_DICE_AFFIXES = Object.freeze([
  defineAffix({
    id: 'accessory.prefix.strength-dice',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['attribute'],
    magicWeight: 4,
    label: { fr: 'De test FOR', en: 'FOR trial' },
    description: { fr: 'Vous obtenez {value} dés supplémentaires lors d’un test de caractéristique FOR.', en: 'You gain {value} extra dice on FOR attribute tests.' },
    rankValues: [1, 1, 1, 1, 2, 2, 2, 2],
    effects: [actorRank('attributesDice.strength')]
  }),
  defineAffix({
    id: 'accessory.prefix.robustness-dice',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['attribute'],
    magicWeight: 4,
    label: { fr: 'De test ROB', en: 'ROB trial' },
    description: { fr: 'Vous obtenez {value} dés supplémentaires lors d’un test de caractéristique ROB.', en: 'You gain {value} extra dice on ROB attribute tests.' },
    rankValues: [1, 1, 1, 1, 2, 2, 2, 2],
    effects: [actorRank('attributesDice.robustness')]
  }),
  defineAffix({
    id: 'accessory.prefix.hability-dice',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['attribute'],
    magicWeight: 4,
    label: { fr: 'De test HAB', en: 'HAB trial' },
    description: { fr: 'Vous obtenez {value} dés supplémentaires lors d’un test de caractéristique HAB.', en: 'You gain {value} extra dice on HAB attribute tests.' },
    rankValues: [1, 1, 1, 1, 2, 2, 2, 2],
    effects: [actorRank('attributesDice.hability')]
  }),
  defineAffix({
    id: 'accessory.prefix.agility-dice',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['attribute'],
    magicWeight: 4,
    label: { fr: 'De test AGI', en: 'AGI trial' },
    description: { fr: 'Vous obtenez {value} dés supplémentaires lors d’un test de caractéristique AGI.', en: 'You gain {value} extra dice on AGI attribute tests.' },
    rankValues: [1, 1, 1, 1, 2, 2, 2, 2],
    effects: [actorRank('attributesDice.agility')]
  }),
  defineAffix({
    id: 'accessory.prefix.perception-dice',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['attribute'],
    magicWeight: 4,
    label: { fr: 'De test PER', en: 'PER trial' },
    description: { fr: 'Vous obtenez {value} dés supplémentaires lors d’un test de caractéristique PER.', en: 'You gain {value} extra dice on PER attribute tests.' },
    rankValues: [1, 1, 1, 1, 2, 2, 2, 2],
    effects: [actorRank('attributesDice.perception')]
  }),
  defineAffix({
    id: 'accessory.prefix.instinct-dice',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['attribute'],
    magicWeight: 4,
    label: { fr: 'De test INS', en: 'INS trial' },
    description: { fr: 'Vous obtenez {value} dés supplémentaires lors d’un test de caractéristique INS.', en: 'You gain {value} extra dice on INS attribute tests.' },
    rankValues: [1, 1, 1, 1, 2, 2, 2, 2],
    effects: [actorRank('attributesDice.instinct')]
  }),
  defineAffix({
    id: 'accessory.prefix.reasoning-dice',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['attribute'],
    magicWeight: 4,
    label: { fr: 'De test RAI', en: 'RAI trial' },
    description: { fr: 'Vous obtenez {value} dés supplémentaires lors d’un test de caractéristique RAI.', en: 'You gain {value} extra dice on RAI attribute tests.' },
    rankValues: [1, 1, 1, 1, 2, 2, 2, 2],
    effects: [actorRank('attributesDice.reasoning')]
  }),
  defineAffix({
    id: 'accessory.prefix.knowledge-dice',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['attribute'],
    magicWeight: 4,
    label: { fr: 'De test SAV', en: 'SAV trial' },
    description: { fr: 'Vous obtenez {value} dés supplémentaires lors d’un test de caractéristique SAV.', en: 'You gain {value} extra dice on SAV attribute tests.' },
    rankValues: [1, 1, 1, 1, 2, 2, 2, 2],
    effects: [actorRank('attributesDice.knowledge')]
  }),
  defineAffix({
    id: 'accessory.prefix.aura-dice',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['attribute'],
    magicWeight: 4,
    label: { fr: 'De test AUR', en: 'AUR trial' },
    description: { fr: 'Vous obtenez {value} dés supplémentaires lors d’un test de caractéristique AUR.', en: 'You gain {value} extra dice on AUR attribute tests.' },
    rankValues: [1, 1, 1, 1, 2, 2, 2, 2],
    effects: [actorRank('attributesDice.aura')]
  }),
  defineAffix({
    id: 'accessory.prefix.bagou-dice',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['attribute'],
    magicWeight: 4,
    label: { fr: 'De test BAG', en: 'BAG trial' },
    description: { fr: 'Vous obtenez {value} dés supplémentaires lors d’un test de caractéristique BAG.', en: 'You gain {value} extra dice on BAG attribute tests.' },
    rankValues: [1, 1, 1, 1, 2, 2, 2, 2],
    effects: [actorRank('attributesDice.bagou')]
  }),
  defineAffix({
    id: 'accessory.prefix.magic-dice',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['attribute'],
    magicWeight: 4,
    label: { fr: 'De test MAG', en: 'MAG trial' },
    description: { fr: 'Vous obtenez {value} dés supplémentaires lors d’un test de caractéristique MAG.', en: 'You gain {value} extra dice on MAG attribute tests.' },
    rankValues: [1, 1, 1, 1, 2, 2, 2, 2],
    effects: [actorRank('attributesDice.magic')]
  }),
  defineAffix({
    id: 'accessory.prefix.chance-dice',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['attribute'],
    magicWeight: 4,
    label: { fr: 'De test CHA', en: 'CHA trial' },
    description: { fr: 'Vous obtenez {value} dés supplémentaires lors d’un test de caractéristique CHA.', en: 'You gain {value} extra dice on CHA attribute tests.' },
    rankValues: [1, 1, 1, 1, 2, 2, 2, 2],
    effects: [actorRank('attributesDice.chance')]
  }),
]);