/**
 * Catalogue d’affixes d’enchantement : Armors.
 *
 * Responsabilités :
 * - déclarer les affixes disponibles pour une famille d’items ;
 * - utiliser des identifiants internes stables et des clés i18n ;
 * - rester un fichier de données sans logique de tirage ou d’application.
 *
 * Les calculs d’enchantement doivent rester dans les services dédiés.
 */

import { defineAffix, actorRank, itemRank, specialFlag, specialRank, specialTable, summonRank, summonTable } from './helpers.js';

export const ARMOR_AFFIXES = Object.freeze([
  defineAffix({
    id: 'armor.prefix.hp',
    side: 'prefix',
    itemTypes: ['armor'],
    tags: ['life'],
    magicWeight: 1,
    label: { fr: 'Vitalisante', en: 'Vitalizing' },
    description: { fr: 'Vous obtenez un bonus de {value} PV.', en: 'You gain a {value} HP bonus.' },
    rankValues: [1, 1, 2, 2, 3, 3, 4, 4],
    effects: [actorRank('hpMax')]
  }),
  defineAffix({
    id: 'armor.prefix.def',
    side: 'prefix',
    itemTypes: ['armor'],
    tags: ['defense'],
    magicWeight: 2,
    label: { fr: 'Protectrice', en: 'Protective' },
    description: { fr: 'Vous obtenez un bonus de {value} DEF.', en: 'You gain a {value} DEF bonus.' },
    rankValues: [1, 2, 3, 4, 5, 6, 7, 7],
    effects: [itemRank('defBonus')]
  }),
  defineAffix({
    id: 'armor.prefix.shorter-states',
    side: 'prefix',
    itemTypes: ['armor'],
    tags: ['defense', 'state'],
    magicWeight: 4,
    label: { fr: 'Stoïque', en: 'Stoic' },
    description: { fr: 'Les états que vous subissez durent {value} tour de moins, mais toujours au moins 1 tour.', en: 'States affecting you last {value} fewer turn, but always at least 1.' },
    rankValues: [1, 1, 1, 1, 2, 2, 2, 2],
    effects: []
  }),
  defineAffix({
    id: 'armor.prefix.regen',
    side: 'prefix',
    itemTypes: ['armor'],
    tags: ['defense', 'life'],
    magicWeight: 3,
    label: { fr: 'Régénérante', en: 'Regenerating' },
    description: { fr: 'Vous soignez {value} PV au début de votre tour.', en: 'You heal {value} HP at the start of your turn.' },
    rankValues: [1, 1, 2, 2, 3, 3, 4, 4],
    effects: []
  }),
  defineAffix({
    id: 'armor.prefix.undetectable',
    side: 'prefix',
    itemTypes: ['armor'],
    tags: ['stealth'],
    magicWeight: 4,
    label: { fr: 'Indétectable', en: 'Undetectable' },
    description: { fr: 'Indétectable.', en: 'Undetectable.' },
    rankValues: ['-', '-', 1, 1, 1, 1, 1, 1],
    effects: []
  }),
  defineAffix({
    id: 'armor.prefix.thorns',
    side: 'prefix',
    itemTypes: ['armor'],
    tags: ['defense', 'damage'],
    magicWeight: 1,
    label: { fr: 'Réciproque', en: 'Rebuking' },
    description: { fr: 'Les créatures qui vous attaquent dans votre zone de contrôle subissent {value} DM perçant.', en: 'Creatures attacking you in your control zone suffer {value} piercing damage.' },
    rankValues: [1, 1, 2, 2, 3, 3, 4, 4],
    effects: []
  }),
  defineAffix({
    id: 'armor.prefix.speed',
    side: 'prefix',
    itemTypes: ['armor'],
    tags: ['mobility'],
    magicWeight: 5,
    label: { fr: 'D’allure vive', en: 'Fleet-footed' },
    description: { fr: 'Vous obtenez un bonus de {value} Vitesse.', en: 'You gain {value} Speed.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: []
  }),
  defineAffix({
    id: 'armor.prefix.convert-fire',
    side: 'prefix',
    itemTypes: ['armor'],
    tags: ['defense', 'fire'],
    magicWeight: 4,
    label: { fr: 'Anti-feu', en: 'Anti-fire' },
    description: { fr: '{value} DM de Feu que vous subissez sont considérés comme des DM physiques.', en: '{value} Fire damage you suffer is treated as physical damage.' },
    rankValues: [1, 2, 3, 4, 5, 6, 7, 7],
    effects: [specialRank('damageConversion.fire')]
  }),
  defineAffix({
    id: 'armor.prefix.convert-lightning',
    side: 'prefix',
    itemTypes: ['armor'],
    tags: ['defense', 'lightning'],
    magicWeight: 4,
    label: { fr: 'Anti-foudre', en: 'Anti-lightning' },
    description: { fr: '{value} DM de Foudre que vous subissez sont considérés comme des DM physiques.', en: '{value} Lightning damage you suffer is treated as physical damage.' },
    rankValues: [1, 2, 3, 4, 5, 6, 7, 7],
    effects: [specialRank('damageConversion.lightning')]
  }),
  defineAffix({
    id: 'armor.prefix.convert-earth',
    side: 'prefix',
    itemTypes: ['armor'],
    tags: ['defense', 'earth'],
    magicWeight: 4,
    label: { fr: 'Anti-terre', en: 'Anti-earth' },
    description: { fr: '{value} DM de Terre que vous subissez sont considérés comme des DM physiques.', en: '{value} Earth damage you suffer is treated as physical damage.' },
    rankValues: [1, 2, 3, 4, 5, 6, 7, 7],
    effects: [specialRank('damageConversion.earth')]
  }),
  defineAffix({
    id: 'armor.prefix.convert-ice',
    side: 'prefix',
    itemTypes: ['armor'],
    tags: ['defense', 'ice'],
    magicWeight: 4,
    label: { fr: 'Anti-glace', en: 'Anti-ice' },
    description: { fr: '{value} DM de Glace que vous subissez sont considérés comme des DM physiques.', en: '{value} Ice damage you suffer is treated as physical damage.' },
    rankValues: [1, 2, 3, 4, 5, 6, 7, 7],
    effects: [specialRank('damageConversion.ice')]
  }),
  defineAffix({
    id: 'armor.prefix.convert-wind',
    side: 'prefix',
    itemTypes: ['armor'],
    tags: ['defense', 'wind'],
    magicWeight: 4,
    label: { fr: 'Anti-vent', en: 'Anti-wind' },
    description: { fr: '{value} DM de Vent que vous subissez sont considérés comme des DM physiques.', en: '{value} Wind damage you suffer is treated as physical damage.' },
    rankValues: [1, 2, 3, 4, 5, 6, 7, 7],
    effects: [specialRank('damageConversion.wind')]
  }),
  defineAffix({
    id: 'armor.prefix.convert-acid',
    side: 'prefix',
    itemTypes: ['armor'],
    tags: ['defense', 'acid'],
    magicWeight: 4,
    label: { fr: 'Anti-acide', en: 'Anti-acid' },
    description: { fr: '{value} DM de Acide que vous subissez sont considérés comme des DM physiques.', en: '{value} Acid damage you suffer is treated as physical damage.' },
    rankValues: [1, 2, 3, 4, 5, 6, 7, 7],
    effects: [specialRank('damageConversion.acid')]
  }),
  defineAffix({
    id: 'armor.prefix.summon-def',
    side: 'prefix',
    itemTypes: ['armor'],
    tags: ['defense', 'summon'],
    magicWeight: 4,
    label: { fr: 'Totémique', en: 'Totemic' },
    description: { fr: 'Vos invocations obtiennent {value} DEF supplémentaire.', en: 'Your summons gain {value} bonus DEF.' },
    rankValues: [1, 2, 3, 4, 5, 6, 7, 7],
    effects: [summonRank('combat.def')]
  }),
  defineAffix({
    id: 'armor.prefix.silent',
    side: 'prefix',
    itemTypes: ['armor'],
    tags: ['stealth'],
    magicWeight: 6,
    label: { fr: 'Silencieuse', en: 'Silent' },
    description: { fr: 'Vous êtes silencieux.', en: 'You are silent.' },
    rankValues: ['-', '-', '-', '-', '-', '-', 1, 1],
    effects: [specialFlag('silent', 1)]
  }),
  defineAffix({
    id: 'armor.suffix.initiative',
    side: 'suffix',
    itemTypes: ['armor'],
    tags: ['mobility'],
    magicWeight: 1,
    label: { fr: 'De promptitude', en: 'of Swiftness' },
    description: { fr: 'Vous obtenez un bonus de {value} Initiative.', en: 'You gain a {value} Initiative bonus.' },
    rankValues: [1, 2, 3, 4, 5, 6, 7, 7],
    effects: [actorRank('initiative')]
  }),
  defineAffix({
    id: 'armor.suffix.strength',
    side: 'suffix',
    itemTypes: ['armor'],
    tags: ['attribute'],
    magicWeight: 3,
    label: { fr: 'De FOR', en: 'of FOR' },
    description: { fr: 'Vous obtenez un bonus de {value} FOR.', en: 'You gain a {value} FOR bonus.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('attributesValue.strength')]
  }),
  defineAffix({
    id: 'armor.suffix.robustness',
    side: 'suffix',
    itemTypes: ['armor'],
    tags: ['attribute'],
    magicWeight: 3,
    label: { fr: 'De ROB', en: 'of ROB' },
    description: { fr: 'Vous obtenez un bonus de {value} ROB.', en: 'You gain a {value} ROB bonus.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('attributesValue.robustness')]
  }),
  defineAffix({
    id: 'armor.suffix.agility',
    side: 'suffix',
    itemTypes: ['armor'],
    tags: ['attribute'],
    magicWeight: 4,
    label: { fr: 'De AGI', en: 'of AGI' },
    description: { fr: 'Vous obtenez un bonus de {value} AGI.', en: 'You gain a {value} AGI bonus.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('attributesValue.agility')]
  }),
  defineAffix({
    id: 'armor.suffix.magic',
    side: 'suffix',
    itemTypes: ['armor'],
    tags: ['attribute'],
    magicWeight: 4,
    label: { fr: 'De MAG', en: 'of MAG' },
    description: { fr: 'Vous obtenez un bonus de {value} MAG.', en: 'You gain a {value} MAG bonus.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('attributesValue.magic')]
  }),
  defineAffix({
    id: 'armor.suffix.hability',
    side: 'suffix',
    itemTypes: ['armor'],
    tags: ['attribute'],
    magicWeight: 4,
    label: { fr: 'De HAB', en: 'of HAB' },
    description: { fr: 'Vous obtenez un bonus de {value} HAB.', en: 'You gain a {value} HAB bonus.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank('attributesValue.hability')]
  }),
  defineAffix({
    id: 'armor.suffix.requirement-reduction',
    side: 'suffix',
    itemTypes: ['armor'],
    tags: ['meta'],
    magicWeight: 1,
    label: { fr: 'Accessible', en: 'Accessible' },
    description: { fr: 'Cet objet réduit de {value} ses prérequis pour être utilisé.', en: 'This item reduces its requirements by {value}.' },
    rankValues: [1, 1, 1, 1, 2, 2, 2, 2],
    effects: [itemRank('special.requirementReduction')]
  }),
  defineAffix({
    id: 'armor.suffix.invocation-transfer',
    side: 'suffix',
    itemTypes: ['armor'],
    tags: ['meta', 'summon'],
    magicWeight: 6,
    label: { fr: 'Déportée', en: 'Redirected' },
    description: { fr: 'Les enchantements de cet objet sont appliqués à vos invocations plutôt qu’à vous.', en: 'This item’s enchantments apply to your summons instead of you.' },
    rankValues: ['-', '-', '-', '-', '-', '-', 1, 1],
    effects: [specialFlag('summonTransfer', 1)]
  }),
  defineAffix({
    id: 'armor.suffix.weight',
    side: 'suffix',
    itemTypes: ['armor'],
    tags: ['meta'],
    magicWeight: 1,
    label: { fr: 'Allégée', en: 'Lightened' },
    description: { fr: 'Cet objet pèse {value}.', en: 'This item weighs {value}.' },
    rankValues: [2, 2, 2, 1, 1, 1, 0.3, 0.3],
    effects: [itemRank('weight')]
  }),
  defineAffix({
    id: 'armor.suffix.summon-hp',
    side: 'suffix',
    itemTypes: ['armor'],
    tags: ['life', 'summon'],
    magicWeight: 4,
    label: { fr: 'Tutélaire', en: 'Guardian' },
    description: { fr: 'Vos invocations obtiennent {value} PV supplémentaire.', en: 'Your summons gain {value} bonus HP.' },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [summonRank('hpMax')]
  }),
  defineAffix({
    id: 'armor.suffix.save-dodge',
    side: 'suffix',
    itemTypes: ['armor'],
    tags: ['defense', 'save'],
    magicWeight: 3,
    label: { fr: 'De esquive', en: 'of dodge' },
    description: { fr: 'Votre sauvegarde de esquive est améliorée de {value}.', en: 'Your dodge save is improved by {value}.' },
    rankValues: [1, 1, 2, 2, 3, 3, 4, 4],
    effects: [itemRank('saves.dodge')]
  }),
  defineAffix({
    id: 'armor.suffix.save-fire',
    side: 'suffix',
    itemTypes: ['armor'],
    tags: ['defense', 'save'],
    magicWeight: 4,
    label: { fr: 'De feu', en: 'of fire' },
    description: { fr: 'Votre sauvegarde de feu est améliorée de {value}.', en: 'Your fire save is improved by {value}.' },
    rankValues: [1, 1, 2, 2, 3, 3, 4, 4],
    effects: [itemRank('saves.fire')]
  }),
  defineAffix({
    id: 'armor.suffix.save-lightning',
    side: 'suffix',
    itemTypes: ['armor'],
    tags: ['defense', 'save'],
    magicWeight: 4,
    label: { fr: 'De foudre', en: 'of lightning' },
    description: { fr: 'Votre sauvegarde de foudre est améliorée de {value}.', en: 'Your lightning save is improved by {value}.' },
    rankValues: [1, 1, 2, 2, 3, 3, 4, 4],
    effects: [itemRank('saves.lightning')]
  }),
  defineAffix({
    id: 'armor.suffix.save-earth',
    side: 'suffix',
    itemTypes: ['armor'],
    tags: ['defense', 'save'],
    magicWeight: 4,
    label: { fr: 'De terre', en: 'of earth' },
    description: { fr: 'Votre sauvegarde de terre est améliorée de {value}.', en: 'Your earth save is improved by {value}.' },
    rankValues: [1, 1, 2, 2, 3, 3, 4, 4],
    effects: [itemRank('saves.earth')]
  }),
  defineAffix({
    id: 'armor.suffix.save-ice',
    side: 'suffix',
    itemTypes: ['armor'],
    tags: ['defense', 'save'],
    magicWeight: 4,
    label: { fr: 'De glace', en: 'of ice' },
    description: { fr: 'Votre sauvegarde de glace est améliorée de {value}.', en: 'Your ice save is improved by {value}.' },
    rankValues: [1, 1, 2, 2, 3, 3, 4, 4],
    effects: [itemRank('saves.ice')]
  }),
  defineAffix({
    id: 'armor.suffix.save-wind',
    side: 'suffix',
    itemTypes: ['armor'],
    tags: ['defense', 'save'],
    magicWeight: 4,
    label: { fr: 'De vent', en: 'of wind' },
    description: { fr: 'Votre sauvegarde de vent est améliorée de {value}.', en: 'Your wind save is improved by {value}.' },
    rankValues: [1, 1, 2, 2, 3, 3, 4, 4],
    effects: [itemRank('saves.wind')]
  }),
  defineAffix({
    id: 'armor.suffix.save-cover',
    side: 'suffix',
    itemTypes: ['armor'],
    tags: ['defense', 'save'],
    magicWeight: 4,
    label: { fr: 'De couvert', en: 'of cover' },
    description: { fr: 'Votre sauvegarde de couvert est améliorée de {value}.', en: 'Your cover save is improved by {value}.' },
    rankValues: [1, 1, 2, 2, 3, 3, 4, 4],
    effects: [itemRank('saves.cover')]
  }),
  defineAffix({
    id: 'armor.suffix.save-magic',
    side: 'suffix',
    itemTypes: ['armor'],
    tags: ['defense', 'save'],
    magicWeight: 6,
    label: { fr: 'De magique', en: 'of magic' },
    description: { fr: 'Votre sauvegarde de magique est améliorée de {value}.', en: 'Your magic save is improved by {value}.' },
    rankValues: [1, 1, 1, 1, 2, 2, 2, 2],
    effects: [itemRank('saves.magic')]
  }),
  defineAffix({
    id: 'armor.suffix.save-acid',
    side: 'suffix',
    itemTypes: ['armor'],
    tags: ['defense', 'save'],
    magicWeight: 4,
    label: { fr: 'De acide', en: 'of acid' },
    description: { fr: 'Votre sauvegarde de acide est améliorée de {value}.', en: 'Your acid save is improved by {value}.' },
    rankValues: [1, 1, 2, 2, 3, 3, 4, 4],
    effects: [itemRank('saves.acid')]
  }),
  defineAffix({
    id: 'armor.suffix.save-armor',
    side: 'suffix',
    itemTypes: ['armor'],
    tags: ['defense', 'save'],
    magicWeight: 3,
    label: { fr: 'De armure', en: 'of armor' },
    description: { fr: 'Votre sauvegarde de armure est améliorée de {value}.', en: 'Your armor save is improved by {value}.' },
    rankValues: [1, 1, 2, 2, 3, 3, 4, 4],
    effects: [itemRank('saves.armor')]
  }),
  defineAffix({
    id: 'armor.suffix.save-pain',
    side: 'suffix',
    itemTypes: ['armor'],
    tags: ['defense', 'save'],
    magicWeight: 3,
    label: { fr: 'De insensible à la douleur', en: 'of pain' },
    description: { fr: 'Votre sauvegarde de insensible à la douleur est améliorée de {value}.', en: 'Your pain save is improved by {value}.' },
    rankValues: [1, 1, 2, 2, 3, 3, 4, 4],
    effects: [itemRank('saves.pain')]
  }),
]);