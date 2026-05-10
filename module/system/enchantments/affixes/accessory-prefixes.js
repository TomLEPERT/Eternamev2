/**
 * Catalogue d’affixes d’enchantement : Accessory prefixes.
 *
 * Responsabilités :
 * - déclarer les affixes disponibles pour une famille d’items ;
 * - utiliser des identifiants internes stables et des clés i18n ;
 * - rester un fichier de données sans logique de tirage ou d’application.
 *
 * Les calculs d’enchantement doivent rester dans les services dédiés.
 */

import { defineAffix, actorRank, itemRank, specialFlag, specialRank, specialTable, summonRank, summonTable } from './helpers.js';

export const ACCESSORY_PREFIX_AFFIXES = Object.freeze([
  defineAffix({
    id: 'accessory.prefix.hp',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['life'],
    magicWeight: 1,
    label: { fr: 'Vitalisant', en: 'Vitalizing' },
    description: { fr: 'Vous obtenez un bonus de {value} PV.', en: 'You gain a {value} HP bonus.' },
    rankValues: [1, 1, 2, 2, 3, 3, 4, 4],
    effects: [actorRank('hpMax')]
  }),
  defineAffix({
    id: 'accessory.prefix.def',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['defense'],
    magicWeight: 2,
    label: { fr: 'Protecteur', en: 'Protective' },
    description: { fr: 'Vous obtenez un bonus de {value} DEF.', en: 'You gain a {value} DEF bonus.' },
    rankValues: [1, 2, 3, 4, 5, 6, 7, 7],
    effects: [actorRank('combat.def')]
  }),
  defineAffix({
    id: 'accessory.prefix.destiny',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['attribute'],
    magicWeight: 3,
    label: { fr: 'Du destin', en: 'Fateful' },
    description: { fr: 'Vous obtenez un bonus de {value} DD.', en: 'You gain a {value} destiny die bonus.' },
    rankValues: [1, 1, 1, 1, 2, 2, 2, 2],
    effects: [actorRank('destinyDice')]
  }),
  defineAffix({
    id: 'accessory.prefix.invisible',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['stealth'],
    magicWeight: 8,
    label: { fr: 'Invisible', en: 'Invisible' },
    description: { fr: 'Vous êtes invisible.', en: 'You are invisible.' },
    rankValues: ['-', '-', '-', '-', '-', '-', '-', 1],
    effects: [specialFlag('invisible', 1)]
  }),
  defineAffix({
    id: 'accessory.prefix.regen',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['life'],
    magicWeight: 3,
    label: { fr: 'Régénérant', en: 'Regenerating' },
    description: { fr: 'Vous soignez {value} PV au début de votre tour.', en: 'You heal {value} HP at the start of your turn.' },
    rankValues: [1, 1, 2, 2, 3, 3, 4, 4],
    effects: []
  }),
  defineAffix({
    id: 'accessory.prefix.undetectable',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['stealth'],
    magicWeight: 4,
    label: { fr: 'Indétectable', en: 'Undetectable' },
    description: { fr: 'Indétectable.', en: 'Undetectable.' },
    rankValues: ['-', '-', 1, 1, 1, 1, 1, 1],
    effects: []
  }),
  defineAffix({
    id: 'accessory.prefix.speed',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['mobility'],
    magicWeight: 5,
    label: { fr: 'D’allure vive', en: 'Fleet-footed' },
    description: { fr: 'Vous obtenez un bonus de {value} Vitesse.', en: 'You gain {value} Speed.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: []
  }),
  defineAffix({
    id: 'accessory.prefix.silent',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['stealth'],
    magicWeight: 6,
    label: { fr: 'Silencieux', en: 'Silent' },
    description: { fr: 'Vous êtes silencieux.', en: 'You are silent.' },
    rankValues: ['-', '-', '-', '-', '-', '-', 1, 1],
    effects: [specialFlag('silent', 1)]
  }),
  defineAffix({
    id: 'accessory.prefix.prc',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['attack'],
    magicWeight: 2,
    label: { fr: 'Du chasseur', en: 'Hunter’s' },
    description: { fr: 'Vous obtenez un bonus de {value} PRC.', en: 'You gain a {value} PRC bonus.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('combat.prc')]
  }),
  defineAffix({
    id: 'accessory.prefix.prd',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['attack'],
    magicWeight: 2,
    label: { fr: 'Du duelliste', en: 'Duelist’s' },
    description: { fr: 'Vous obtenez un bonus de {value} PRD.', en: 'You gain a {value} PRD bonus.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('combat.prd')]
  }),
  defineAffix({
    id: 'accessory.prefix.prm',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['spell'],
    magicWeight: 2,
    label: { fr: 'Arcanique', en: 'Arcane' },
    description: { fr: 'Vous obtenez un bonus de {value} PRM.', en: 'You gain a {value} PRM bonus.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('combat.prm')]
  }),
  defineAffix({
    id: 'accessory.prefix.power',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['attack', 'damage'],
    magicWeight: 3,
    label: { fr: 'De puissance', en: 'Mighty' },
    description: { fr: 'Vous obtenez un bonus de {value} Puissance.', en: 'You gain a {value} Power bonus.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('power')]
  }),
  defineAffix({
    id: 'accessory.prefix.weapon-damage',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['damage'],
    magicWeight: 2,
    label: { fr: 'Des armes', en: 'of Weapons' },
    description: { fr: 'Vous obtenez un bonus de {value} DM avec une arme.', en: 'You gain a bonus of {value} damage with a weapon.' },
    rankValues: ['1d6', '1d6', '1d6', '2d6', '2d6', '2d6', '2d6', '2d6'],
    effects: []
  }),
  defineAffix({
    id: 'accessory.prefix.spell-damage',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['damage', 'spell'],
    magicWeight: 3,
    label: { fr: 'Des sorts', en: 'of Spells' },
    description: { fr: 'Vous obtenez un bonus de {value} DM avec un sort.', en: 'You gain a bonus of {value} damage with a spell.' },
    rankValues: ['1d6', '1d6', '1d6', '2d6', '2d6', '2d6', '2d6', '2d6'],
    effects: [specialTable('spellDamageDiceBonus', [1, 1, 1, 2, 2, 2, 2, 2])]
  }),
  defineAffix({
    id: 'accessory.prefix.life-on-damage',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['damage', 'life'],
    magicWeight: 3,
    label: { fr: 'Vampirique', en: 'Vampiric' },
    description: { fr: 'Vous vous soignez de {value} quand vous infligez des DM.', en: 'You heal {value} when you deal damage.' },
    rankValues: [1, 1, 1, 1, 2, 2, 2, 2],
    effects: []
  }),
  defineAffix({
    id: 'accessory.prefix.summon-damage',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['damage', 'summon'],
    magicWeight: 3,
    label: { fr: 'De l’invocateur', en: 'Invoker’s' },
    description: { fr: 'Vos invocations obtiennent {value} DM supplémentaire.', en: 'Your summons gain {value} bonus damage.' },
    rankValues: ['1d6', '1d6', '1d6', '2d6', '2d6', '2d6', '2d6', '2d6'],
    effects: [summonTable('damageDiceBonus', [1, 1, 1, 2, 2, 2, 2, 2])]
  }),
  defineAffix({
    id: 'accessory.prefix.summon-prc',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['attack', 'summon'],
    magicWeight: 4,
    label: { fr: 'Du commandant', en: 'Commander’s' },
    description: { fr: 'Vos invocations obtiennent {value} PRC supplémentaire.', en: 'Your summons gain {value} bonus PRC.' },
    rankValues: [1, 1, 1, 2, 2, 2, 2, 2],
    effects: [summonRank('combat.prc')]
  }),
  defineAffix({
    id: 'accessory.prefix.summon-prd',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['attack', 'summon'],
    magicWeight: 4,
    label: { fr: 'Du maréchal', en: 'Marshal’s' },
    description: { fr: 'Vos invocations obtiennent {value} PRD supplémentaire.', en: 'Your summons gain {value} bonus PRD.' },
    rankValues: [1, 1, 1, 2, 2, 2, 2, 2],
    effects: [summonRank('combat.prd')]
  }),
  defineAffix({
    id: 'accessory.prefix.summon-prm',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['spell', 'summon'],
    magicWeight: 4,
    label: { fr: 'Du thaumaturge', en: 'Thaumaturge’s' },
    description: { fr: 'Vos invocations obtiennent {value} PRM supplémentaire.', en: 'Your summons gain {value} bonus PRM.' },
    rankValues: [1, 1, 1, 2, 2, 2, 2, 2],
    effects: [summonRank('combat.prm')]
  }),
  defineAffix({
    id: 'accessory.prefix.summon-def',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['defense', 'summon'],
    magicWeight: 4,
    label: { fr: 'Totémique', en: 'Totemic' },
    description: { fr: 'Vos invocations obtiennent {value} DEF supplémentaire.', en: 'Your summons gain {value} bonus DEF.' },
    rankValues: [1, 1, 2, 2, 3, 3, 4, 4],
    effects: [summonRank('combat.def')]
  }),
  defineAffix({
    id: 'accessory.prefix.extra-action',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['meta'],
    magicWeight: 8,
    label: { fr: 'Du temps volé', en: 'Time-Stolen' },
    description: { fr: 'Vous obtenez une action supplémentaire.', en: 'You gain an additional action.' },
    rankValues: ['-', '-', '-', '-', '-', '-', 1, 1],
    effects: [specialFlag('extraAction', 1)]
  }),
  defineAffix({
    id: 'accessory.prefix.extra-reaction',
    side: 'prefix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['meta'],
    magicWeight: 6,
    label: { fr: 'Réflexe', en: 'Reactive' },
    description: { fr: 'Vous obtenez une action de réaction supplémentaire.', en: 'You gain an additional reaction action.' },
    rankValues: ['-', '-', '-', '-', 1, 1, 1, 1],
    effects: [specialFlag('extraReaction', 1)]
  }),
]);