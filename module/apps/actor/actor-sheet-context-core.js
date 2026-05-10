/**
 * Extension de fiche acteur : Actor sheet context core.
 *
 * Responsabilités :
 * - ajouter à l’ActorSheetV2 les comportements propres à cette section ;
 * - lire ou mettre à jour uniquement les champs nécessaires à l’interface ;
 * - conserver les calculs de règles dans les modules `rules` ou `system`.
 *
 * Ce fichier doit rester un module UI spécialisé et ne pas devenir un service métier.
 */

import { ETERNAME_ATTRIBUTES } from '../../system/constants/attributes.js';
import { deriveProgressTracks } from '../../rules/derived/progression.js';
import { getLocalizedSelects } from '../../system/constants/sheet-selects.js';
import { getStatsAttributes } from '../../system/constants/stats-context.js';
import { deriveMagicList, getAvailableMagicTypes } from '../../rules/derived/magic.js';
import { getPreparedStates } from '../../system/constants/states.js';
import { ARMOR_CATEGORIES } from '../../system/constants/armors.js';
import { ITEM_SAVE_LABEL_KEYS } from '../../system/constants/save-keys.js';

export function buildCharacterCoreContext(actor) {
  const context = {
    system: actor.system,
    isGM: game.user.isGM,
    isOwner: actor.isOwner,
    actorType: String(actor?.type ?? 'character'),
    isInvocationActor: String(actor?.type ?? 'character') === 'invocation',
    selects: getLocalizedSelects(),
    stats: {
      attributes: getStatsAttributes(actor.system)
    },
    saveLabelKeys: ITEM_SAVE_LABEL_KEYS
  };

  const defenseItems = actor.items
    .filter((item) => ['armor', 'shield'].includes(item.type))
    .map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      equipped: Boolean(item.system?.equipped),
      defense: Number(item.system?.defense ?? 0),
      armorType: item.type === 'armor' ? normalizeArmorCategory(item.system?.category ?? 'light') : null,
      armorTypeLabel: item.type === 'armor'
        ? game.i18n.localize(ARMOR_CATEGORIES[normalizeArmorCategory(item.system?.category ?? 'light')] ?? 'ETERN.ARMOR.CATEGORY.LIGHT')
        : null,
      armorBase: item.type === 'armor' ? String(item.system?.base ?? '') : '',
      armorDefFormula: item.type === 'armor' ? String(item.system?.defFormula ?? item.system?.defense ?? '') : '',
      armorDefBonus: item.type === 'armor' ? Number(item.system?.defBonus ?? 0) || 0 : 0,
      armorDefLabel: item.type === 'armor'
        ? `${String(item.system?.defFormula ?? item.system?.defense ?? '')}${(Number(item.system?.defBonus ?? 0) || 0) ? ` ${(Number(item.system?.defBonus ?? 0) || 0) >= 0 ? '+' : ''}${Number(item.system?.defBonus ?? 0) || 0}` : ''}`
        : '',
      armorTypeOptions: item.type === 'armor' ? buildArmorTypeOptions(item.system?.armorType ?? 'light') : []
    }));

  context.defenseItems = {
    armors: defenseItems.filter((item) => item.type === 'armor'),
    shields: defenseItems.filter((item) => item.type === 'shield')
  };

  context.magicPools = (actor.system?.derived?.magic ?? deriveMagicList(
    actor.system?.magic,
    actor.system?.attributes ?? {}
  )).map((entry) => ({
    ...entry,
    label: game.i18n.localize(`ETERN.MAGIC.TYPE.${entry.type.toUpperCase()}`),
    hasMax: Number.isFinite(entry.max),
    canIncrease: !Number.isFinite(entry.max) || entry.current < entry.max,
    canDecrease: entry.current > 0
  }));

  const presentTypes = new Set(context.magicPools.map((entry) => entry.type));
  context.magicTypeChoices = getAvailableMagicTypes()
    .filter((type) => !presentTypes.has(type))
    .map((type) => ({
      value: type,
      label: game.i18n.localize(`ETERN.MAGIC.TYPE.${type.toUpperCase()}`)
    }));

  context.progressTracks = deriveProgressTracks(actor.system?.progressTracks ?? []);
  context.stateList = getPreparedStates(actor.system ?? {});
  context.activeStates = context.stateList.filter((state) => state.active);
  context.stateResistanceLabel = game.i18n.localize(
    ETERNAME_ATTRIBUTES[String(actor.system?.stateResistance?.attr ?? 'robustness')]?.label ?? 'ETERN.ATTR.ROBUSTNESS'
  );
  context.stateResistanceChoices = Object.entries(ETERNAME_ATTRIBUTES).map(([value, meta]) => ({
    value,
    label: game.i18n.localize(meta.label),
    selected: value === String(actor.system?.stateResistance?.attr ?? 'robustness')
  }));

  context.movementModes = Array.isArray(actor.system?.movement?.modes)
    ? actor.system.movement.modes
        .filter((mode) => !mode?.auto && String(mode?.id ?? '') !== 'walk')
        .map((mode) => ({
          id: String(mode?.id ?? ''),
          name: String(mode?.name ?? ''),
          value: Number(mode?.value ?? 0)
        }))
    : [];

  const inventoryRows = actor.items.contents
    .filter((item) => ['gear', 'material', 'consumable', 'object', 'tool', 'armor', 'shield', 'weapon', 'bag'].includes(item.type))
    .filter((item) => String(item.system?.location ?? 'backpack') !== 'bag')
    .map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      description: String(item.system?.description ?? ''),
      location: String(item.system?.location ?? 'backpack'),
      quantity: Math.max(1, Math.floor(Number(item.system?.quantity ?? 1) || 1)),
      weight: Number(item.system?.weight ?? 1),
      weightLabel: getInventoryWeightLabel(item.system?.weight ?? 1),
      equipped: Boolean(item.system?.equipped),
      isWeapon: item.type === 'weapon',
      isArmor: item.type === 'armor',
      isShield: item.type === 'shield',
      typeLabel: game.i18n.localize(`ETERN.ITEM.TYPES.${String(item.type ?? 'gear').toUpperCase()}`)
    }));

  context.inventory = {
    backpack: inventoryRows.filter((item) => item.location !== 'belt'),
    belt: inventoryRows.filter((item) => item.location === 'belt')
  };

  context.beltConsumables = inventoryRows
    .filter((item) => item.location === 'belt' && item.type === 'consumable')
    .map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      img: actor.items.get(item.id)?.img || 'icons/svg/item-bag.svg'
    }));

  return context;
}

function buildArmorTypeOptions(currentValue) {
  return ['light', 'medium', 'heavy'].map((value) => ({
    value,
    label: game.i18n.localize(`ETERN.ITEM.ARMOR_TYPE.${value.toUpperCase()}`),
    selected: value === currentValue
  }));
}

function getInventoryWeightLabel(weight) {
  const value = Number(weight ?? 0);
  if (Math.abs(value - 0.3) < 0.001) return '0.3';
  if (Math.abs(value - 1) < 0.001) return '1';
  if (Math.abs(value - 2) < 0.001) return '2';
  return `${value || 0}`;
}

function normalizeArmorCategory(value) {
  const normalized = String(value ?? 'light');
  return ['light', 'medium', 'heavy'].includes(normalized) ? normalized : 'light';
}
