/**
 * Extension de fiche item : Item sheet header context.
 *
 * Responsabilités :
 * - préparer ou synchroniser la section correspondante de l’ItemSheetV2 ;
 * - gérer les actions utilisateur liées à l’item affiché ;
 * - éviter de mélanger rendu, règles et persistance dans un même bloc.
 *
 * Ce fichier doit rester spécialisé par section de fiche item.
 */

import { isPresetItemType } from './item-sheet-presets.js';
import { getTechniquePowerCumulativeCost } from '../../system/techniques/stat-definitions.js';
import {
  buildInvocationSheetContext,
  findSelectedLabel,
  getBaseChoicesForType,
  getCategoryChoicesForType,
  getWeightLabelKey,
  localizeItemType,
  usesItemLegality
} from './item-sheet-context-sections.js';
import { buildInvocationSummary } from '../../system/techniques/invocation-service.js';
import { normalizeHeritageFeatureType, normalizeHeritageType } from '../../system/constants/heritages.js';

export function buildSheetHeaderContext(item, context) {
  const type = String(item?.type ?? '');
  const badges = [];
  const typeLabel = localizeItemType(type);
  if (typeLabel) badges.push(typeLabel);

  const categoryLabel = findSelectedLabel(getCategoryChoicesForType(type, context));
  if (categoryLabel) badges.push(categoryLabel);

  const baseLabel = findSelectedLabel(getBaseChoicesForType(type, context));
  if (baseLabel) badges.push(baseLabel);

  if (type === 'material' && context.isAlchemicalMaterial) {
    const tagLabel = findSelectedLabel(context.alchemicalTagChoices ?? []);
    if (tagLabel) badges.push(tagLabel);
  }

  if (type === 'consumable') {
    if (context.isConcoctionConsumable) {
      const concoctionLabel = findSelectedLabel(context.concoctionTypeChoices ?? []);
      if (concoctionLabel) badges.push(concoctionLabel);
    }

    if (context.isEnchantmentCatalyst) {
      const qualityLabel = findSelectedLabel(context.essenceQualityChoices ?? []);
      if (qualityLabel) badges.push(qualityLabel);
    }
  }

  const legalityLabel = findSelectedLabel(context.legalityChoices ?? []);
  if (legalityLabel) badges.push(legalityLabel);

  return {
    badges,
    statBadges: buildStatBadges(item, context),
    showPresetReset: isPresetItemType(type)
  };
}

function buildStatBadges(item, context) {
  const system = item?.system ?? {};
  const badges = [];

  if (usesItemLegality(item?.type)) {
    const weightLabel = findSelectedLabel(context.weightChoices ?? []) || String(system.weight ?? '');
    if (weightLabel) badges.push({ label: game.i18n.localize(getWeightLabelKey(item?.type)), value: weightLabel });
  }

  if (item?.type === 'weapon') {
    if (system.range) badges.push({ label: game.i18n.localize('ETERN.WEAPON.RANGE'), value: String(system.range) });
    if (system.damage) badges.push({ label: game.i18n.localize('ETERN.WEAPON.DAMAGE'), value: String(system.damage) });
    const zoneBonus = Number(system.derived?.enchanting?.zoneRangeMetersBonus ?? 0);
    if (zoneBonus > 0) badges.push({ label: game.i18n.localize('ETERN.ENCHANTING.SUMMARY.ZONE_RANGE_BONUS'), value: `+${zoneBonus}m` });
  }

  if (item?.type === 'invocation') {
    const summary = context.invocationSummary ?? buildInvocationSummary(item, item.parent ?? null);
    badges.push({ label: game.i18n.localize('ETERN.INVOCATION.SIZE_LABEL'), value: game.i18n.localize(summary.sizeDefinition.labelKey) });
    badges.push({ label: game.i18n.localize('ETERN.INVOCATION.POINTS'), value: `${summary.totalAllocated} / ${summary.sizeDefinition.pointBudget}` });
    badges.push({ label: game.i18n.localize('ETERN.INVOCATION.XP_MULTIPLIER'), value: `x${summary.sizeDefinition.xpMultiplier}` });
  }

  if (item?.type === 'armor') {
    if (system.defFormula) badges.push({ label: game.i18n.localize('ETERN.ARMOR.DEF_FORMULA'), value: String(system.defFormula) });
    badges.push({ label: game.i18n.localize('ETERN.ARMOR.DEF_BONUS'), value: String(Number(system.defBonus ?? 0) || 0) });
  }

  if (item?.type === 'shield') {
    badges.push({ label: game.i18n.localize('ETERN.SHIELD.DEF_BONUS'), value: String(Number(system.defBonus ?? 0) || 0) });
  }

  if (item?.type === 'material') {
    badges.push({ label: game.i18n.localize('ETERN.MATERIAL.DIFFICULTY'), value: String(Number(system.difficulty ?? 0) || 0) });
  }

  if (item?.type === 'bag') {
    badges.push({ label: game.i18n.localize('ETERN.BAG.CAPACITY_WEIGHT'), value: String(context.bagLoad?.capacityLabel ?? '0') });
    badges.push({ label: game.i18n.localize('ETERN.BAG.STORED_WEIGHT'), value: String(context.bagLoad?.currentLabel ?? '0') });
  }

  if (item?.type === 'profession') {
    badges.push({ label: game.i18n.localize('ETERN.PROFESSION.SECTION.PASSIVES'), value: String((system.passives ?? []).length) });
    badges.push({ label: game.i18n.localize('ETERN.PROFESSION.SECTION.KEYS'), value: String((system.keys ?? []).length) });
    badges.push({ label: game.i18n.localize('ETERN.PROFESSION.SECTION.CONDITIONS'), value: String((system.conditions ?? []).length) });
    badges.push({ label: game.i18n.localize('ETERN.PROFESSION.SECTION.MECHANICS'), value: String((system.mechanics ?? []).length) });
    badges.push({ label: game.i18n.localize('ETERN.PROFESSION.SECTION.STATES'), value: String((system.states ?? []).length) });
  }

  if (item?.type === 'heritage') {
    const heritageType = normalizeHeritageType(system.heritageType);
    const featureType = normalizeHeritageFeatureType(system.featureType);
    badges.push({ label: game.i18n.localize('ETERN.HERITAGE.TYPE_LABEL'), value: game.i18n.localize(`ETERN.HERITAGE.TYPE.${heritageType.toUpperCase()}`) });
    badges.push({ label: game.i18n.localize('ETERN.HERITAGE.FEATURE_TYPE_LABEL'), value: game.i18n.localize(`ETERN.HERITAGE.FEATURE_TYPE.${featureType.toUpperCase()}`) });
    if (featureType === 'technique') {
      badges.push({ label: game.i18n.localize('ETERN.TECHNIQUE.POWER.LEVEL'), value: String(Number(system.power ?? 0) || 0) });
      badges.push({ label: game.i18n.localize('ETERN.TECHNIQUE.STATISTICS'), value: String((system.statistics ?? []).length) });
      badges.push({ label: game.i18n.localize('ETERN.TECHNIQUE.XP_TOTAL'), value: String(Number(system.derived?.totalXp ?? getTechniquePowerCumulativeCost(system.power ?? 0)) || 0) });
    }
  }

  if (item?.type === 'technique') {
    badges.push({ label: game.i18n.localize('ETERN.TECHNIQUE.POWER.LEVEL'), value: String(Number(system.power ?? 0) || 0) });
    badges.push({ label: game.i18n.localize('ETERN.TECHNIQUE.STATISTICS'), value: String((system.statistics ?? []).length) });
    badges.push({ label: game.i18n.localize('ETERN.TECHNIQUE.XP_TOTAL'), value: String(Number(system.derived?.totalXp ?? getTechniquePowerCumulativeCost(system.power ?? 0)) || 0) });
  }

  return badges;
}
