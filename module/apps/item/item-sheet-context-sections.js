/**
 * Extension de fiche item : Item sheet context sections.
 *
 * Responsabilités :
 * - préparer ou synchroniser la section correspondante de l’ItemSheetV2 ;
 * - gérer les actions utilisateur liées à l’item affiché ;
 * - éviter de mélanger rendu, règles et persistance dans un même bloc.
 *
 * Ce fichier doit rester spécialisé par section de fiche item.
 */

import { getItemSheetVariant } from '../../system/items/item-template-context.js';
import { isPresetItemType } from './item-sheet-presets.js';
import {
  ALCHEMICAL_TAG_KEYS,
  MATERIAL_CATEGORIES,
  getAlchemicalMaterialDefinition,
  normalizeAlchemicalTag,
  normalizeMaterialCategory
} from '../../system/constants/materials.js';
import {
  CONCOCTION_TYPES,
  CONSUMABLE_CATEGORIES,
  ENCHANTMENT_CATALYST_DEFINITIONS,
  ESSENCE_QUALITIES,
  getCatalystDefinition,
  normalizeCatalystBase,
  normalizeConsumableCategory,
  normalizeConcoctionType,
  normalizeEssenceQuality
} from '../../system/constants/consumables.js';
import { ITEM_LEGALITY, normalizeItemLegality } from '../../system/constants/item-legality.js';
import { formatBagWeight, getBagStoredItems, getBagStoredWeight } from '../../system/constants/bags.js';
import { buildInvocationSummary, buildInvocationValidation } from '../../system/techniques/invocation-service.js';
import { getTechniqueStatIds } from '../../system/techniques/stat-definitions.js';
import { buildBuilderSectionContext, buildTechniqueStatCatalog } from '../../system/techniques/sheet-context-builder.js';
import { getLinkedInvocationActor } from '../../system/techniques/invocation-actor-service.js';
import {
  INVOCATION_POWER_BONUS_DEFINITIONS,
  getInvocationPowerBonusIds,
  getInvocationPowerBonusTargetChoices,
  getInvocationSizeIds,
  getInvocationSizeDefinition,
  normalizeInvocationSize
} from '../../system/techniques/invocation-definitions.js';
import {
  getHeritageFeatureTypeChoices,
  getHeritageTypeChoices,
  normalizeHeritageFeatureType,
  normalizeHeritageType
} from '../../system/constants/heritages.js';

export async function buildBaseItemSheetContext(sheet, options = {}) {
  const context = await sheet._prepareBaseContext(options);
  context.system = sheet.item.system;
  return context;
}

export function buildItemVariantContext(item) {
  return {
    sheetVariant: getItemSheetVariant(item.type),
    sheetCssClass: `${getItemSheetVariant(item.type)}-sheet`
  };
}

export function buildGenericItemSheetContext(item) {
  if (isPresetItemType(item?.type) || ['material', 'consumable', 'bag', 'profession', 'technique', 'invocation', 'heritage'].includes(String(item?.type ?? ''))) {
    return { genericItemTypeLabel: localizeItemType(item?.type) };
  }

  const currentWeight = Number(item?.system?.weight ?? 1);
  return {
    genericItemTypeLabel: localizeItemType(item?.type),
    hasGenericEquipToggle: ['gear', 'object', 'tool'].includes(String(item?.type ?? '')),
    weightChoices: [0.3, 1, 2].map((value) => ({
      value,
      label: String(value),
      selected: Math.abs(Number(value) - currentWeight) < 0.001
    }))
  };
}

export function buildMaterialSheetContext(item) {
  if (item?.type !== 'material') return {};

  const category = normalizeMaterialCategory(item.system?.category ?? 'alchemical');
  const tag = normalizeAlchemicalTag(item.system?.tag ?? 'body');
  const profile = getAlchemicalMaterialDefinition(tag);

  return {
    isAlchemicalMaterial: category === 'alchemical',
    isForgingMaterial: category === 'forging',
    materialCategories: Object.entries(MATERIAL_CATEGORIES).map(([value, key]) => ({
      value,
      label: game.i18n.localize(key),
      selected: value === category
    })),
    alchemicalTagChoices: Object.entries(ALCHEMICAL_TAG_KEYS).map(([value, key]) => ({
      value,
      label: game.i18n.localize(key),
      selected: value === tag
    })),
    alchemicalProfile: {
      usageLabel: game.i18n.localize(profile.usageKey),
      alignedLabel: game.i18n.localize(ALCHEMICAL_TAG_KEYS[profile.aligned] ?? profile.aligned),
      opposedLabel: game.i18n.localize(ALCHEMICAL_TAG_KEYS[profile.opposed] ?? profile.opposed)
    }
  };
}

export function buildConsumableSheetContext(item) {
  if (item?.type !== 'consumable') return {};

  const category = normalizeConsumableCategory(item.system?.category ?? 'concoction');
  const concoctionType = normalizeConcoctionType(item.system?.concoctionType ?? 'potion');
  const catalystBase = normalizeCatalystBase(item.system?.catalystBase ?? 'brutal_shard');
  const catalystDefinition = getCatalystDefinition(catalystBase);
  const essenceQuality = normalizeEssenceQuality(item.system?.essenceQuality ?? 'common');

  return {
    isConcoctionConsumable: category === 'concoction',
    isEnchantmentCatalyst: category === 'enchantmentCatalyst',
    isMiscConsumable: category === 'misc',
    consumableCategories: Object.entries(CONSUMABLE_CATEGORIES).map(([value, key]) => ({
      value,
      label: game.i18n.localize(key),
      selected: value === category
    })),
    concoctionTypeChoices: Object.entries(CONCOCTION_TYPES).map(([value, key]) => ({
      value,
      label: game.i18n.localize(key),
      selected: value === concoctionType
    })),
    catalystBaseChoices: Object.entries(ENCHANTMENT_CATALYST_DEFINITIONS).map(([value, definition]) => ({
      value,
      label: game.i18n.localize(definition.labelKey),
      selected: value === catalystBase
    })),
    catalystProfile: {
      description: game.i18n.localize(catalystDefinition.descriptionKey),
      bonusLabel: game.i18n.localize(catalystDefinition.bonusLabelKey)
    },
    essenceQualityChoices: Object.entries(ESSENCE_QUALITIES).map(([value, key]) => ({
      value,
      label: game.i18n.localize(key),
      selected: value === essenceQuality
    }))
  };
}

export function buildBagSheetContext(item) {
  if (item?.type !== 'bag') return {};

  const actor = item.parent;
  const storedItems = getBagStoredItems(actor, item.id);
  const availableItems = actor
    ? actor.items.contents.filter((ownedItem) => String(ownedItem.system?.location ?? 'backpack') !== 'bag' && String(ownedItem.id ?? '') !== String(item.id ?? ''))
    : [];

  const loadWeight = getBagStoredWeight(actor, item.id);
  const capacityWeight = Number(item.system?.capacityWeight ?? 0) || 0;

  return {
    bagStoredItems: storedItems.map((storedItem) => ({
      id: storedItem.id,
      name: storedItem.name,
      typeLabel: localizeItemType(storedItem.type),
      quantity: Math.max(1, Math.floor(Number(storedItem.system?.quantity ?? 1) || 1)),
      weightLabel: String(Number(storedItem.system?.weight ?? 0) || 0),
      totalWeightLabel: formatBagWeight((Math.max(1, Math.floor(Number(storedItem.system?.quantity ?? 1) || 1)) * (Number(storedItem.system?.weight ?? 0) || 0)))
    })),
    bagAvailableItems: availableItems.map((availableItem) => ({
      id: availableItem.id,
      name: availableItem.name,
      typeLabel: localizeItemType(availableItem.type),
      quantity: Math.max(1, Math.floor(Number(availableItem.system?.quantity ?? 1) || 1)),
      weightLabel: String(Number(availableItem.system?.weight ?? 0) || 0)
    })),
    bagLoad: {
      current: loadWeight,
      currentLabel: formatBagWeight(loadWeight),
      capacity: capacityWeight,
      capacityLabel: formatBagWeight(capacityWeight),
      isOverCapacity: loadWeight > capacityWeight
    }
  };
}

export function buildHeritageSheetContext(item) {
  if (item?.type !== 'heritage') return {};

  const heritageType = normalizeHeritageType(item.system?.heritageType);
  const featureType = normalizeHeritageFeatureType(item.system?.featureType);
  const statCatalog = buildTechniqueStatCatalog(getTechniqueStatIds());

  return {
    isAncestralHeritage: heritageType === 'ancestral',
    isCulturalHeritage: heritageType === 'cultural',
    isPassiveHeritage: featureType === 'passive',
    isTechniqueHeritage: featureType === 'technique',
    heritageTypeChoices: getHeritageTypeChoices(heritageType),
    heritageFeatureTypeChoices: getHeritageFeatureTypeChoices(featureType),
    heritagePassiveSections: featureType === 'passive'
      ? [buildBuilderSectionContext('passives', game.i18n.localize('ETERN.HERITAGE.PASSIVE_EFFECTS'), item.system?.passives, {
          withActive: true,
          emptyLabelKey: 'ETERN.HERITAGE.EMPTY_PASSIVES',
          statCatalog
        })]
      : []
  };
}

export function buildInvocationSheetContext(item) {
  if (item?.type !== 'invocation') return {};

  const actor = item.parent;
  const summary = item.system?.derived?.summary ?? buildInvocationSummary(item, actor);
  const validation = item.system?.derived?.validation ?? buildInvocationValidation(item);
  const size = normalizeInvocationSize(item.system?.size ?? 'medium');
  const techniques = actor ? actor.items.contents.filter((ownedItem) => ownedItem.type === 'technique') : [];
  const linkedActor = getLinkedInvocationActor(item);

  return {
    invocationValidation: {
      ...validation,
      errors: validation.errors.map(localizeValidationMessage),
      warnings: validation.warnings.map(localizeValidationMessage)
    },
    invocationSizeChoices: getInvocationSizeIds().map((value) => ({
      value,
      label: game.i18n.localize(getInvocationSizeDefinition(value).labelKey),
      selected: value === size
    })),
    invocationTechniqueChoices: [
      { value: '', label: game.i18n.localize('ETERN.INVOCATION.NO_LINKED_TECHNIQUE'), selected: !String(item.system?.techniqueId ?? '') },
      ...techniques.map((technique) => ({
        value: String(technique.id ?? ''),
        label: technique.name,
        selected: String(technique.id ?? '') === String(item.system?.techniqueId ?? '')
      }))
    ],
    invocationPowerBonusChoices: getInvocationPowerBonusIds().map((value) => ({
      value,
      label: game.i18n.localize(INVOCATION_POWER_BONUS_DEFINITIONS[value]?.labelKey ?? value)
    })),
    invocationThresholdRows: summary.thresholdSummaries.map((entry) => ({
      ...entry,
      choices: [
        { value: '', label: game.i18n.localize('ETERN.INVOCATION.NO_THRESHOLD_TECHNIQUE'), selected: !String(entry.techniqueId ?? '') },
        ...techniques.map((technique) => ({
          value: String(technique.id ?? ''),
          label: technique.name,
          selected: String(technique.id ?? '') === String(entry.techniqueId ?? '')
        }))
      ]
    })),
    invocationSummary: {
      ...summary,
      powerBoons: (summary.powerBoons ?? []).map((entry) => ({
        ...entry,
        targetChoices: getInvocationPowerBonusTargetChoices(entry.type).map((choice) => ({
          value: choice.value,
          label: game.i18n.localize(choice.labelKey),
          selected: String(choice.value ?? '') === String(entry.target ?? '')
        }))
      }))
    },
    invocationLinkedActor: linkedActor
      ? {
          id: linkedActor.id,
          name: linkedActor.name
        }
      : null
  };
}

export function usesItemLegality(type) {
  return ['weapon', 'armor', 'shield', 'gear', 'object', 'tool', 'material', 'consumable', 'bag'].includes(String(type ?? ''));
}

export function buildLegalityChoices(item) {
  const selectedLegality = normalizeItemLegality(item?.system?.legality ?? 'legal');
  return Object.entries(ITEM_LEGALITY).map(([value, key]) => ({
    value,
    label: game.i18n.localize(key),
    selected: value === selectedLegality
  }));
}

export function getCategoryChoicesForType(type, context) {
  if (type === 'weapon') return context.weaponCategories ?? [];
  if (type === 'armor') return context.armorCategories ?? [];
  if (type === 'shield') return context.shieldCategories ?? [];
  if (type === 'material') return context.materialCategories ?? [];
  if (type === 'consumable') return context.consumableCategories ?? [];
  return [];
}

export function getBaseChoicesForType(type, context) {
  if (type === 'weapon') return context.weaponBases ?? [];
  if (type === 'armor') return context.armorBases ?? [];
  if (type === 'shield') return context.shieldBases ?? [];
  if (type === 'consumable' && context.isEnchantmentCatalyst) return context.catalystBaseChoices ?? [];
  return [];
}

export function getWeightLabelKey(type) {
  if (type === 'weapon') return 'ETERN.WEAPON.WEIGHT';
  if (type === 'armor') return 'ETERN.ARMOR.WEIGHT';
  if (type === 'shield') return 'ETERN.SHIELD.WEIGHT';
  if (type === 'material') return 'ETERN.MATERIAL.WEIGHT';
  if (type === 'consumable') return 'ETERN.CONSUMABLE.WEIGHT';
  if (type === 'bag') return 'ETERN.BAG.WEIGHT';
  return 'ETERN.ITEM.WEIGHT';
}

export function localizeItemType(type) {
  const key = String(type ?? '').toUpperCase();
  if (!key) return '';
  return game.i18n.localize(`ETERN.ITEM.TYPES.${key}`);
}

export function findSelectedLabel(choices) {
  return Array.isArray(choices) ? String(choices.find((choice) => choice.selected)?.label ?? '') : '';
}

export function localizeValidationMessage(message) {
  return game.i18n.format(String(message?.key ?? ''), message?.data ?? {});
}
