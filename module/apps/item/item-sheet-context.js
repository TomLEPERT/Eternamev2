/**
 * Extension de fiche item : Item sheet context.
 *
 * Responsabilités :
 * - préparer ou synchroniser la section correspondante de l’ItemSheetV2 ;
 * - gérer les actions utilisateur liées à l’item affiché ;
 * - éviter de mélanger rendu, règles et persistance dans un même bloc.
 *
 * Ce fichier doit rester spécialisé par section de fiche item.
 */

import { buildItemSheetPresetContext } from '../../system/items/preset-registry.js';
import { buildProfessionSheetContext, buildTechniqueSheetContext } from '../../system/techniques/sheet-context.js';
import { buildSheetHeaderContext } from './item-sheet-header-context.js';
import { buildEnchantingSheetContext } from '../../system/enchantments/sheet-context.js';
import {
  buildBagSheetContext,
  buildBaseItemSheetContext,
  buildConsumableSheetContext,
  buildGenericItemSheetContext,
  buildHeritageSheetContext,
  buildInvocationSheetContext,
  buildItemVariantContext,
  buildLegalityChoices,
  buildMaterialSheetContext,
  usesItemLegality
} from './item-sheet-context-sections.js';

export async function buildItemSheetContext(sheet, options = {}) {
  const item = sheet.item;
  const baseContext = await buildBaseItemSheetContext(sheet, options);
  const presetContext = buildItemSheetPresetContext(item);
  const genericContext = buildGenericItemSheetContext(item);
  const materialContext = buildMaterialSheetContext(item);
  const consumableContext = buildConsumableSheetContext(item);
  const bagContext = buildBagSheetContext(item);
  const professionContext = buildProfessionSheetContext(item);
  const techniqueContext = buildTechniqueSheetContext(item);
  const heritageContext = buildHeritageSheetContext(item);
  const invocationContext = buildInvocationSheetContext(item);
  const enchantingContext = buildEnchantingSheetContext(item);
  const legalityChoices = usesItemLegality(item?.type) ? buildLegalityChoices(item) : [];
  const variantContext = buildItemVariantContext(item);

  const mergedContext = {
    ...presetContext,
    ...genericContext,
    ...materialContext,
    ...consumableContext,
    ...bagContext,
    ...professionContext,
    ...techniqueContext,
    ...heritageContext,
    ...invocationContext,
    ...enchantingContext,
    legalityChoices
  };

  return {
    ...baseContext,
    ...variantContext,
    ...mergedContext,
    sheetHeader: buildSheetHeaderContext(item, mergedContext)
  };
}
