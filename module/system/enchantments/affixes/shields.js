/**
 * Catalogue d’affixes d’enchantement : Shields.
 *
 * Responsabilités :
 * - déclarer les affixes disponibles pour une famille d’items ;
 * - utiliser des identifiants internes stables et des clés i18n ;
 * - rester un fichier de données sans logique de tirage ou d’application.
 *
 * Les calculs d’enchantement doivent rester dans les services dédiés.
 */

import { defineAffix, actorRank, itemRank, specialFlag, specialRank, specialTable, summonRank, summonTable } from './helpers.js';

export const SHIELD_AFFIXES = Object.freeze([
  defineAffix({
    id: 'shield.prefix.hp',
    side: 'prefix',
    itemTypes: ['shield'],
    tags: ['life'],
    magicWeight: 1,
    label: { fr: 'Vitalisant', en: 'Vitalizing' },
    description: { fr: 'Vous obtenez un bonus de {value} PV.', en: 'You gain a {value} HP bonus.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('hpMax')]
  }),
  defineAffix({
    id: 'shield.prefix.def',
    side: 'prefix',
    itemTypes: ['shield'],
    tags: ['defense'],
    magicWeight: 2,
    label: { fr: 'Protecteur', en: 'Protective' },
    description: { fr: 'Vous obtenez un bonus de {value} DEF.', en: 'You gain a {value} DEF bonus.' },
    rankValues: [1, 2, 3, 4, 5, 6, 7, 7],
    effects: [itemRank('defBonus')]
  }),
  defineAffix({
    id: 'shield.prefix.shorter-states',
    side: 'prefix',
    itemTypes: ['shield'],
    tags: ['defense', 'state'],
    magicWeight: 4,
    label: { fr: 'Stoïque', en: 'Stoic' },
    description: { fr: 'Les états que vous subissez durent {value} tour de moins, mais toujours au moins 1 tour.', en: 'States affecting you last {value} fewer turn, but always at least 1.' },
    rankValues: [1, 1, 1, 1, 2, 2, 2, 2],
    effects: []
  }),
  defineAffix({
    id: 'shield.prefix.regen',
    side: 'prefix',
    itemTypes: ['shield'],
    tags: ['life'],
    magicWeight: 3,
    label: { fr: 'Régénérant', en: 'Regenerating' },
    description: { fr: 'Vous soignez {value} PV au début de votre tour.', en: 'You heal {value} HP at the start of your turn.' },
    rankValues: [1, 1, 2, 2, 3, 3, 4, 4],
    effects: []
  }),
  defineAffix({
    id: 'shield.prefix.undetectable',
    side: 'prefix',
    itemTypes: ['shield'],
    tags: ['stealth'],
    magicWeight: 4,
    label: { fr: 'Indétectable', en: 'Undetectable' },
    description: { fr: 'Indétectable.', en: 'Undetectable.' },
    rankValues: ['-', '-', 1, 1, 1, 1, 1, 1],
    effects: []
  }),
  defineAffix({
    id: 'shield.prefix.thorns',
    side: 'prefix',
    itemTypes: ['shield'],
    tags: ['defense', 'damage'],
    magicWeight: 1,
    label: { fr: 'Réciproque', en: 'Rebuking' },
    description: { fr: 'Les créatures qui vous attaquent dans votre zone de contrôle subissent {value} DM perçant.', en: 'Creatures attacking you in your control zone suffer {value} piercing damage.' },
    rankValues: [1, 1, 2, 2, 2, 3, 4, 4],
    effects: []
  }),
  defineAffix({
    id: 'shield.prefix.absorb',
    side: 'prefix',
    itemTypes: ['shield'],
    tags: ['defense'],
    magicWeight: 3,
    label: { fr: 'Barricadé', en: 'Bulwarked' },
    description: { fr: 'Vous obtenez un bouclier qui absorbe {value} DM, restauré au début de chaque tour.', en: 'You gain a shield that absorbs {value} damage, restored at the start of each turn.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: []
  }),
  defineAffix({
    id: 'shield.prefix.extra-reaction',
    side: 'prefix',
    itemTypes: ['shield'],
    tags: ['meta'],
    magicWeight: 8,
    label: { fr: 'Réflexe', en: 'Reactive' },
    description: { fr: 'Vous obtenez une action de réaction supplémentaire.', en: 'You gain an additional reaction action.' },
    rankValues: ['-', '-', '-', 1, 1, 1, 1, 1],
    effects: [specialFlag('extraReaction', 1)]
  }),
  defineAffix({
    id: 'shield.prefix.convert-fire',
    side: 'prefix',
    itemTypes: ['shield'],
    tags: ['defense', 'fire'],
    magicWeight: 4,
    label: { fr: 'Anti-feu', en: 'Anti-fire' },
    description: { fr: '{value} DM de Feu que vous subissez sont considérés comme des DM physiques.', en: '{value} Fire damage you suffer is treated as physical damage.' },
    rankValues: [1, 2, 3, 4, 5, 6, 7, 7],
    effects: [specialRank('damageConversion.fire')]
  }),
  defineAffix({
    id: 'shield.prefix.convert-lightning',
    side: 'prefix',
    itemTypes: ['shield'],
    tags: ['defense', 'lightning'],
    magicWeight: 4,
    label: { fr: 'Anti-foudre', en: 'Anti-lightning' },
    description: { fr: '{value} DM de Foudre que vous subissez sont considérés comme des DM physiques.', en: '{value} Lightning damage you suffer is treated as physical damage.' },
    rankValues: [1, 2, 3, 4, 5, 6, 7, 7],
    effects: [specialRank('damageConversion.lightning')]
  }),
  defineAffix({
    id: 'shield.prefix.convert-earth',
    side: 'prefix',
    itemTypes: ['shield'],
    tags: ['defense', 'earth'],
    magicWeight: 4,
    label: { fr: 'Anti-terre', en: 'Anti-earth' },
    description: { fr: '{value} DM de Terre que vous subissez sont considérés comme des DM physiques.', en: '{value} Earth damage you suffer is treated as physical damage.' },
    rankValues: [1, 2, 3, 4, 5, 6, 7, 7],
    effects: [specialRank('damageConversion.earth')]
  }),
  defineAffix({
    id: 'shield.prefix.convert-ice',
    side: 'prefix',
    itemTypes: ['shield'],
    tags: ['defense', 'ice'],
    magicWeight: 4,
    label: { fr: 'Anti-glace', en: 'Anti-ice' },
    description: { fr: '{value} DM de Glace que vous subissez sont considérés comme des DM physiques.', en: '{value} Ice damage you suffer is treated as physical damage.' },
    rankValues: [1, 2, 3, 4, 5, 6, 7, 7],
    effects: [specialRank('damageConversion.ice')]
  }),
  defineAffix({
    id: 'shield.prefix.convert-wind',
    side: 'prefix',
    itemTypes: ['shield'],
    tags: ['defense', 'wind'],
    magicWeight: 4,
    label: { fr: 'Anti-vent', en: 'Anti-wind' },
    description: { fr: '{value} DM de Vent que vous subissez sont considérés comme des DM physiques.', en: '{value} Wind damage you suffer is treated as physical damage.' },
    rankValues: [1, 2, 3, 4, 5, 6, 7, 7],
    effects: [specialRank('damageConversion.wind')]
  }),
  defineAffix({
    id: 'shield.prefix.convert-acid',
    side: 'prefix',
    itemTypes: ['shield'],
    tags: ['defense', 'acid'],
    magicWeight: 4,
    label: { fr: 'Anti-acide', en: 'Anti-acid' },
    description: { fr: '{value} DM de Acide que vous subissez sont considérés comme des DM physiques.', en: '{value} Acid damage you suffer is treated as physical damage.' },
    rankValues: [1, 2, 3, 4, 5, 6, 7, 7],
    effects: [specialRank('damageConversion.acid')]
  }),
  defineAffix({
    id: 'shield.prefix.summon-def',
    side: 'prefix',
    itemTypes: ['shield'],
    tags: ['defense', 'summon'],
    magicWeight: 4,
    label: { fr: 'Totémique', en: 'Totemic' },
    description: { fr: 'Vos invocations obtiennent {value} DEF supplémentaire.', en: 'Your summons gain {value} bonus DEF.' },
    rankValues: [1, 2, 3, 4, 5, 6, 7, 7],
    effects: [summonRank('combat.def')]
  }),
  defineAffix({
    id: 'shield.suffix.initiative',
    side: 'suffix',
    itemTypes: ['shield'],
    tags: ['mobility'],
    magicWeight: 1,
    label: { fr: 'De promptitude', en: 'of Swiftness' },
    description: { fr: 'Vous obtenez un bonus de {value} Initiative.', en: 'You gain a {value} Initiative bonus.' },
    rankValues: [1, 2, 3, 4, 5, 6, 7, 7],
    effects: [actorRank('initiative')]
  }),
  defineAffix({
    id: 'shield.suffix.strength',
    side: 'suffix',
    itemTypes: ['shield'],
    tags: ['attribute'],
    magicWeight: 3,
    label: { fr: 'Du FOR', en: 'of FOR' },
    description: { fr: 'Vous obtenez un bonus de {value} FOR.', en: 'You gain a {value} FOR bonus.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('attributesValue.strength')]
  }),
  defineAffix({
    id: 'shield.suffix.robustness',
    side: 'suffix',
    itemTypes: ['shield'],
    tags: ['attribute'],
    magicWeight: 3,
    label: { fr: 'Du ROB', en: 'of ROB' },
    description: { fr: 'Vous obtenez un bonus de {value} ROB.', en: 'You gain a {value} ROB bonus.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('attributesValue.robustness')]
  }),
  defineAffix({
    id: 'shield.suffix.agility',
    side: 'suffix',
    itemTypes: ['shield'],
    tags: ['attribute'],
    magicWeight: 4,
    label: { fr: 'Du AGI', en: 'of AGI' },
    description: { fr: 'Vous obtenez un bonus de {value} AGI.', en: 'You gain a {value} AGI bonus.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('attributesValue.agility')]
  }),
  defineAffix({
    id: 'shield.suffix.instinct',
    side: 'suffix',
    itemTypes: ['shield'],
    tags: ['attribute'],
    magicWeight: 4,
    label: { fr: 'Du INS', en: 'of INS' },
    description: { fr: 'Vous obtenez un bonus de {value} INS.', en: 'You gain a {value} INS bonus.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('attributesValue.instinct')]
  }),
  defineAffix({
    id: 'shield.suffix.requirement-reduction',
    side: 'suffix',
    itemTypes: ['shield'],
    tags: ['meta'],
    magicWeight: 1,
    label: { fr: 'Accessible', en: 'Accessible' },
    description: { fr: 'Cet objet réduit de {value} ses prérequis pour être utilisé.', en: 'This item reduces its requirements by {value}.' },
    rankValues: [1, 1, 1, 1, 2, 2, 2, 2],
    effects: [itemRank('special.requirementReduction')]
  }),
  defineAffix({
    id: 'shield.suffix.invocation-transfer',
    side: 'suffix',
    itemTypes: ['shield'],
    tags: ['meta', 'summon'],
    magicWeight: 6,
    label: { fr: 'Déporté', en: 'Redirected' },
    description: { fr: 'Les enchantements de cet objet sont appliqués à vos invocations plutôt qu’à vous.', en: 'This item’s enchantments apply to your summons instead of you.' },
    rankValues: ['-', '-', '-', '-', '-', '-', 1, 1],
    effects: [specialFlag('summonTransfer', 1)]
  }),
  defineAffix({
    id: 'shield.suffix.weight',
    side: 'suffix',
    itemTypes: ['shield'],
    tags: ['meta'],
    magicWeight: 1,
    label: { fr: 'Allégé', en: 'Lightened' },
    description: { fr: 'Cet objet pèse {value}.', en: 'This item weighs {value}.' },
    rankValues: [2, 2, 2, 1, 1, 1, 0.3, 0.3],
    effects: [itemRank('weight')]
  }),
  defineAffix({
    id: 'shield.suffix.summon-hp',
    side: 'suffix',
    itemTypes: ['shield'],
    tags: ['life', 'summon'],
    magicWeight: 3,
    label: { fr: 'Tutélaire', en: 'Guardian' },
    description: { fr: 'Vos invocations obtiennent {value} PV supplémentaire.', en: 'Your summons gain {value} bonus HP.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [summonRank('hpMax')]
  }),
  defineAffix({
    id: 'shield.suffix.save-parry',
    side: 'suffix',
    itemTypes: ['shield'],
    tags: ['defense', 'save'],
    magicWeight: 3,
    label: { fr: 'Du parade', en: 'of parry' },
    description: { fr: 'Votre sauvegarde de parade est améliorée de {value}.', en: 'Your parry save is improved by {value}.' },
    rankValues: [1, 1, 2, 2, 3, 3, 4, 4],
    effects: [itemRank('saves.parry')]
  }),
  defineAffix({
    id: 'shield.suffix.save-fire',
    side: 'suffix',
    itemTypes: ['shield'],
    tags: ['defense', 'save'],
    magicWeight: 4,
    label: { fr: 'Du feu', en: 'of fire' },
    description: { fr: 'Votre sauvegarde de feu est améliorée de {value}.', en: 'Your fire save is improved by {value}.' },
    rankValues: [1, 1, 2, 2, 3, 3, 4, 4],
    effects: [itemRank('saves.fire')]
  }),
  defineAffix({
    id: 'shield.suffix.save-lightning',
    side: 'suffix',
    itemTypes: ['shield'],
    tags: ['defense', 'save'],
    magicWeight: 4,
    label: { fr: 'Du foudre', en: 'of lightning' },
    description: { fr: 'Votre sauvegarde de foudre est améliorée de {value}.', en: 'Your lightning save is improved by {value}.' },
    rankValues: [1, 1, 2, 2, 3, 3, 4, 4],
    effects: [itemRank('saves.lightning')]
  }),
  defineAffix({
    id: 'shield.suffix.save-earth',
    side: 'suffix',
    itemTypes: ['shield'],
    tags: ['defense', 'save'],
    magicWeight: 4,
    label: { fr: 'Du terre', en: 'of earth' },
    description: { fr: 'Votre sauvegarde de terre est améliorée de {value}.', en: 'Your earth save is improved by {value}.' },
    rankValues: [1, 1, 2, 2, 3, 3, 4, 4],
    effects: [itemRank('saves.earth')]
  }),
  defineAffix({
    id: 'shield.suffix.save-ice',
    side: 'suffix',
    itemTypes: ['shield'],
    tags: ['defense', 'save'],
    magicWeight: 4,
    label: { fr: 'Du glace', en: 'of ice' },
    description: { fr: 'Votre sauvegarde de glace est améliorée de {value}.', en: 'Your ice save is improved by {value}.' },
    rankValues: [1, 1, 2, 2, 3, 3, 4, 4],
    effects: [itemRank('saves.ice')]
  }),
  defineAffix({
    id: 'shield.suffix.save-wind',
    side: 'suffix',
    itemTypes: ['shield'],
    tags: ['defense', 'save'],
    magicWeight: 4,
    label: { fr: 'Du vent', en: 'of wind' },
    description: { fr: 'Votre sauvegarde de vent est améliorée de {value}.', en: 'Your wind save is improved by {value}.' },
    rankValues: [1, 1, 2, 2, 3, 3, 4, 4],
    effects: [itemRank('saves.wind')]
  }),
  defineAffix({
    id: 'shield.suffix.save-cover',
    side: 'suffix',
    itemTypes: ['shield'],
    tags: ['defense', 'save'],
    magicWeight: 3,
    label: { fr: 'Du couvert', en: 'of cover' },
    description: { fr: 'Votre sauvegarde de couvert est améliorée de {value}.', en: 'Your cover save is improved by {value}.' },
    rankValues: [1, 1, 2, 2, 3, 3, 4, 4],
    effects: [itemRank('saves.cover')]
  }),
  defineAffix({
    id: 'shield.suffix.save-magic',
    side: 'suffix',
    itemTypes: ['shield'],
    tags: ['defense', 'save'],
    magicWeight: 6,
    label: { fr: 'Du magique', en: 'of magic' },
    description: { fr: 'Votre sauvegarde de magique est améliorée de {value}.', en: 'Your magic save is improved by {value}.' },
    rankValues: [1, 1, 1, 1, 2, 2, 2, 2],
    effects: [itemRank('saves.magic')]
  }),
  defineAffix({
    id: 'shield.suffix.save-acid',
    side: 'suffix',
    itemTypes: ['shield'],
    tags: ['defense', 'save'],
    magicWeight: 4,
    label: { fr: 'Du acide', en: 'of acid' },
    description: { fr: 'Votre sauvegarde de acide est améliorée de {value}.', en: 'Your acid save is improved by {value}.' },
    rankValues: [1, 1, 2, 2, 3, 3, 4, 4],
    effects: [itemRank('saves.acid')]
  }),
]);