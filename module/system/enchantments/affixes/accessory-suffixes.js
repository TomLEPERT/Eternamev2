/**
 * Catalogue d’affixes d’enchantement : Accessory suffixes.
 *
 * Responsabilités :
 * - déclarer les affixes disponibles pour une famille d’items ;
 * - utiliser des identifiants internes stables et des clés i18n ;
 * - rester un fichier de données sans logique de tirage ou d’application.
 *
 * Les calculs d’enchantement doivent rester dans les services dédiés.
 */

import { defineAffix, actorRank, itemRank, specialFlag, specialRank, specialTable, summonRank, summonTable } from './helpers.js';

export const ACCESSORY_SUFFIX_AFFIXES = Object.freeze([
  defineAffix({
    id: 'accessory.suffix.initiative',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['mobility'],
    magicWeight: 1,
    label: { fr: 'De promptitude', en: 'of Swiftness' },
    description: { fr: 'Vous obtenez un bonus de {value} Initiative.', en: 'You gain a {value} Initiative bonus.' },
    rankValues: [1, 2, 3, 4, 5, 6, 7, 7],
    effects: [actorRank('initiative')]
  }),
  defineAffix({
    id: 'accessory.suffix.exploration',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['attribute'],
    magicWeight: 2,
    label: { fr: 'De l’éclaireur', en: 'Pathfinder’s' },
    description: { fr: 'Vous obtenez un bonus de {value} Exploration passive.', en: 'You gain a {value} passive exploration bonus.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('explorationPassive')]
  }),
  defineAffix({
    id: 'accessory.suffix.strength',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['attribute'],
    magicWeight: 3,
    label: { fr: 'De FOR', en: 'of FOR' },
    description: { fr: 'Vous obtenez un bonus de {value} FOR.', en: 'You gain a {value} FOR bonus.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('attributesValue.strength')]
  }),
  defineAffix({
    id: 'accessory.suffix.robustness',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['attribute'],
    magicWeight: 3,
    label: { fr: 'De ROB', en: 'of ROB' },
    description: { fr: 'Vous obtenez un bonus de {value} ROB.', en: 'You gain a {value} ROB bonus.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('attributesValue.robustness')]
  }),
  defineAffix({
    id: 'accessory.suffix.hability',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['attribute'],
    magicWeight: 3,
    label: { fr: 'De HAB', en: 'of HAB' },
    description: { fr: 'Vous obtenez un bonus de {value} HAB.', en: 'You gain a {value} HAB bonus.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('attributesValue.hability')]
  }),
  defineAffix({
    id: 'accessory.suffix.agility',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['attribute'],
    magicWeight: 3,
    label: { fr: 'De AGI', en: 'of AGI' },
    description: { fr: 'Vous obtenez un bonus de {value} AGI.', en: 'You gain a {value} AGI bonus.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('attributesValue.agility')]
  }),
  defineAffix({
    id: 'accessory.suffix.perception',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['attribute'],
    magicWeight: 3,
    label: { fr: 'De PER', en: 'of PER' },
    description: { fr: 'Vous obtenez un bonus de {value} PER.', en: 'You gain a {value} PER bonus.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('attributesValue.perception')]
  }),
  defineAffix({
    id: 'accessory.suffix.instinct',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['attribute'],
    magicWeight: 3,
    label: { fr: 'De INS', en: 'of INS' },
    description: { fr: 'Vous obtenez un bonus de {value} INS.', en: 'You gain a {value} INS bonus.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('attributesValue.instinct')]
  }),
  defineAffix({
    id: 'accessory.suffix.reasoning',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['attribute'],
    magicWeight: 3,
    label: { fr: 'De RAI', en: 'of RAI' },
    description: { fr: 'Vous obtenez un bonus de {value} RAI.', en: 'You gain a {value} RAI bonus.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('attributesValue.reasoning')]
  }),
  defineAffix({
    id: 'accessory.suffix.knowledge',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['attribute'],
    magicWeight: 3,
    label: { fr: 'De SAV', en: 'of SAV' },
    description: { fr: 'Vous obtenez un bonus de {value} SAV.', en: 'You gain a {value} SAV bonus.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('attributesValue.knowledge')]
  }),
  defineAffix({
    id: 'accessory.suffix.aura',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['attribute'],
    magicWeight: 3,
    label: { fr: 'De AUR', en: 'of AUR' },
    description: { fr: 'Vous obtenez un bonus de {value} AUR.', en: 'You gain a {value} AUR bonus.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('attributesValue.aura')]
  }),
  defineAffix({
    id: 'accessory.suffix.bagou',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['attribute'],
    magicWeight: 3,
    label: { fr: 'De BAG', en: 'of BAG' },
    description: { fr: 'Vous obtenez un bonus de {value} BAG.', en: 'You gain a {value} BAG bonus.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('attributesValue.bagou')]
  }),
  defineAffix({
    id: 'accessory.suffix.magic',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['attribute'],
    magicWeight: 3,
    label: { fr: 'De MAG', en: 'of MAG' },
    description: { fr: 'Vous obtenez un bonus de {value} MAG.', en: 'You gain a {value} MAG bonus.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('attributesValue.magic')]
  }),
  defineAffix({
    id: 'accessory.suffix.chance',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['attribute'],
    magicWeight: 3,
    label: { fr: 'De CHA', en: 'of CHA' },
    description: { fr: 'Vous obtenez un bonus de {value} CHA.', en: 'You gain a {value} CHA bonus.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('attributesValue.chance')]
  }),
  defineAffix({
    id: 'accessory.suffix.requirement-reduction',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['meta'],
    magicWeight: 1,
    label: { fr: 'Accessible', en: 'Accessible' },
    description: { fr: 'Cet objet réduit de {value} ses prérequis pour être utilisé.', en: 'This item reduces its requirements by {value}.' },
    rankValues: [1, 1, 1, 1, 2, 2, 2, 2],
    effects: [itemRank('special.requirementReduction')]
  }),
  defineAffix({
    id: 'accessory.suffix.invocation-transfer',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['meta', 'summon'],
    magicWeight: 6,
    label: { fr: 'Déporté', en: 'Redirected' },
    description: { fr: 'Les enchantements de cet objet sont appliqués à vos invocations plutôt qu’à vous.', en: 'This item’s enchantments apply to your summons instead of you.' },
    rankValues: ['-', '-', '-', '-', '-', '-', 1, 1],
    effects: [specialFlag('summonTransfer', 1)]
  }),
  defineAffix({
    id: 'accessory.suffix.weight',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['meta'],
    magicWeight: 1,
    label: { fr: 'Allégé', en: 'Lightened' },
    description: { fr: 'Cet objet pèse {value}.', en: 'This item weighs {value}.' },
    rankValues: [2, 2, 2, 1, 1, 1, 0.3, 0.3],
    effects: [itemRank('weight')]
  }),
  defineAffix({
    id: 'accessory.suffix.summon-hp',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['life', 'summon'],
    magicWeight: 4,
    label: { fr: 'Tutélaire', en: 'Guardian' },
    description: { fr: 'Vos invocations obtiennent {value} PV supplémentaire.', en: 'Your summons gain {value} bonus HP.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [summonRank('hpMax')]
  }),
  defineAffix({
    id: 'accessory.suffix.save-dodge',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['defense', 'save'],
    magicWeight: 4,
    label: { fr: 'De esquive', en: 'of dodge' },
    description: { fr: 'Votre sauvegarde de esquive est améliorée de {value}.', en: 'Your dodge save is improved by {value}.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('saves.dodge')]
  }),
  defineAffix({
    id: 'accessory.suffix.save-fire',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['defense', 'save'],
    magicWeight: 4,
    label: { fr: 'De feu', en: 'of fire' },
    description: { fr: 'Votre sauvegarde de feu est améliorée de {value}.', en: 'Your fire save is improved by {value}.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('saves.fire')]
  }),
  defineAffix({
    id: 'accessory.suffix.save-lightning',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['defense', 'save'],
    magicWeight: 4,
    label: { fr: 'De foudre', en: 'of lightning' },
    description: { fr: 'Votre sauvegarde de foudre est améliorée de {value}.', en: 'Your lightning save is improved by {value}.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('saves.lightning')]
  }),
  defineAffix({
    id: 'accessory.suffix.save-earth',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['defense', 'save'],
    magicWeight: 4,
    label: { fr: 'De terre', en: 'of earth' },
    description: { fr: 'Votre sauvegarde de terre est améliorée de {value}.', en: 'Your earth save is improved by {value}.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('saves.earth')]
  }),
  defineAffix({
    id: 'accessory.suffix.save-ice',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['defense', 'save'],
    magicWeight: 4,
    label: { fr: 'De glace', en: 'of ice' },
    description: { fr: 'Votre sauvegarde de glace est améliorée de {value}.', en: 'Your ice save is improved by {value}.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('saves.ice')]
  }),
  defineAffix({
    id: 'accessory.suffix.save-wind',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['defense', 'save'],
    magicWeight: 4,
    label: { fr: 'De vent', en: 'of wind' },
    description: { fr: 'Votre sauvegarde de vent est améliorée de {value}.', en: 'Your wind save is improved by {value}.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('saves.wind')]
  }),
  defineAffix({
    id: 'accessory.suffix.save-cover',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['defense', 'save'],
    magicWeight: 4,
    label: { fr: 'De couvert', en: 'of cover' },
    description: { fr: 'Votre sauvegarde de couvert est améliorée de {value}.', en: 'Your cover save is improved by {value}.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('saves.cover')]
  }),
  defineAffix({
    id: 'accessory.suffix.save-magic',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['defense', 'save'],
    magicWeight: 4,
    label: { fr: 'De magique', en: 'of magic' },
    description: { fr: 'Votre sauvegarde de magique est améliorée de {value}.', en: 'Your magic save is improved by {value}.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('saves.magic')]
  }),
  defineAffix({
    id: 'accessory.suffix.save-acid',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['defense', 'save'],
    magicWeight: 4,
    label: { fr: 'De acide', en: 'of acid' },
    description: { fr: 'Votre sauvegarde de acide est améliorée de {value}.', en: 'Your acid save is improved by {value}.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('saves.acid')]
  }),
  defineAffix({
    id: 'accessory.suffix.save-armor',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['defense', 'save'],
    magicWeight: 4,
    label: { fr: 'De armure', en: 'of armor' },
    description: { fr: 'Votre sauvegarde de armure est améliorée de {value}.', en: 'Your armor save is improved by {value}.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('saves.armor')]
  }),
  defineAffix({
    id: 'accessory.suffix.save-pain',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['defense', 'save'],
    magicWeight: 4,
    label: { fr: 'De insensible à la douleur', en: 'of pain' },
    description: { fr: 'Votre sauvegarde de insensible à la douleur est améliorée de {value}.', en: 'Your pain save is improved by {value}.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('saves.pain')]
  }),
  defineAffix({
    id: 'accessory.suffix.save-parry',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['defense', 'save'],
    magicWeight: 4,
    label: { fr: 'De parade', en: 'of parry' },
    description: { fr: 'Votre sauvegarde de parade est améliorée de {value}.', en: 'Your parry save is improved by {value}.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('saves.parry')]
  }),
  defineAffix({
    id: 'accessory.suffix.extra-bleeding',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['state', 'damage'],
    magicWeight: 5,
    label: { fr: 'Saignement', en: 'Bleeding' },
    description: { fr: 'L’état Saignement inflige ses DM {value} fois supplémentaire par tour.', en: 'Bleeding deals its damage {value} extra time per turn.' },
    rankValues: [1, 1, 1, 1, 2, 2, 2, 2],
    effects: [specialTable('state.bleedingExtra', [1, 1, 1, 1, 2, 2, 2, 2])]
  }),
  defineAffix({
    id: 'accessory.suffix.extra-frozen',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['state', 'ice'],
    magicWeight: 5,
    label: { fr: 'Gelé', en: 'Frozen' },
    description: { fr: 'L’état Gelé s’applique {value} fois supplémentaire par tour.', en: 'Frozen applies {value} extra time per turn.' },
    rankValues: [1, 1, 1, 1, 2, 2, 2, 2],
    effects: [specialTable('state.frozenExtra', [1, 1, 1, 1, 2, 2, 2, 2])]
  }),
  defineAffix({
    id: 'accessory.suffix.extra-burn',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['state', 'damage', 'fire'],
    magicWeight: 5,
    label: { fr: 'Brûlure', en: 'Burn' },
    description: { fr: 'L’état Brûlure s’applique {value} fois supplémentaire par tour.', en: 'Burn applies {value} extra time per turn.' },
    rankValues: [1, 1, 1, 1, 2, 2, 2, 2],
    effects: [specialTable('state.burnExtra', [1, 1, 1, 1, 2, 2, 2, 2])]
  }),
  defineAffix({
    id: 'accessory.suffix.extra-poison',
    side: 'suffix',
    itemTypes: ['gear', 'object', 'tool'],
    tags: ['state', 'damage', 'acid'],
    magicWeight: 5,
    label: { fr: 'Empoisonné', en: 'Poison' },
    description: { fr: 'L’état Empoisonné inflige ses DM {value} fois supplémentaire par tour.', en: 'Poison deals its damage {value} extra time per turn.' },
    rankValues: [1, 1, 1, 1, 2, 2, 2, 2],
    effects: [specialTable('state.poisonExtra', [1, 1, 1, 1, 2, 2, 2, 2])]
  }),
]);