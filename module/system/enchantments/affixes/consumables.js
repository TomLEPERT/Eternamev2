/**
 * Catalogue d’affixes d’enchantement : Consumables.
 *
 * Responsabilités :
 * - déclarer les affixes disponibles pour une famille d’items ;
 * - utiliser des identifiants internes stables et des clés i18n ;
 * - rester un fichier de données sans logique de tirage ou d’application.
 *
 * Les calculs d’enchantement doivent rester dans les services dédiés.
 */

import { defineAffix, itemSpecial } from './helpers.js';

export const CONSUMABLE_AFFIXES = Object.freeze([
  defineAffix({
    id: 'consumable.prefix.delayed-repeat',
    side: 'prefix',
    itemTypes: ['consumable'],
    itemCategories: ['concoction', 'misc'],
    tags: ['consumable'],
    magicWeight: 0,
    label: { fr: 'Persistant', en: 'Persistent' },
    description: { fr: 'Le consommable appliquera son effet le tour suivant après la fin du premier effet.', en: 'The consumable applies its effect again on the following turn after the first effect ends.' },
    rankValues: [1, 1, 1, 1, 1, 1, 1, 1],
    effects: [itemSpecial('consumable.repeatNextTurn', 1)]
  }),
  defineAffix({
    id: 'consumable.prefix.double-effect-half-duration',
    side: 'prefix',
    itemTypes: ['consumable'],
    itemCategories: ['concoction', 'misc'],
    tags: ['consumable'],
    magicWeight: 0,
    label: { fr: 'Concentré', en: 'Concentrated' },
    description: { fr: 'L’effet du consommable est multiplié par 2, mais sa durée est divisée par 2.', en: 'The consumable effect is doubled, but its duration is halved.' },
    rankValues: [1, 1, 1, 1, 1, 1, 1, 1],
    effects: [itemSpecial('consumable.effectMultiplier', 2), itemSpecial('consumable.durationMultiplier', 0.5)]
  }),
  defineAffix({
    id: 'consumable.suffix.double-duration',
    side: 'suffix',
    itemTypes: ['consumable'],
    itemCategories: ['concoction', 'misc'],
    tags: ['consumable'],
    magicWeight: 0,
    label: { fr: 'Durable', en: 'Long-lasting' },
    description: { fr: 'La durée du consommable est multipliée par 2.', en: 'The consumable duration is doubled.' },
    rankValues: [1, 1, 1, 1, 1, 1, 1, 1],
    effects: [itemSpecial('consumable.durationMultiplier', 2)]
  }),
  defineAffix({
    id: 'consumable.suffix.control-zone',
    side: 'suffix',
    itemTypes: ['consumable'],
    itemCategories: ['concoction', 'misc'],
    tags: ['consumable', 'zone'],
    magicWeight: 0,
    label: { fr: 'Diffusant', en: 'Diffusing' },
    description: { fr: 'L’effet du consommable s’applique dans la zone de contrôle de l’utilisateur.', en: 'The consumable effect applies within the user’s control zone.' },
    rankValues: [1, 1, 1, 1, 1, 1, 1, 1],
    effects: [itemSpecial('consumable.applyInControlZone', 1)]
  })
]);
