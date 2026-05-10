/**
 * Extension de fiche item : Item sheet controller.
 *
 * Responsabilités :
 * - préparer ou synchroniser la section correspondante de l’ItemSheetV2 ;
 * - gérer les actions utilisateur liées à l’item affiché ;
 * - éviter de mélanger rendu, règles et persistance dans un même bloc.
 *
 * Ce fichier doit rester spécialisé par section de fiche item.
 */

import { bindFieldAutosave } from './item-sheet-autosave.js';
import { buildItemSheetContext } from './item-sheet-context.js';
import { bindImageEditor } from './item-sheet-image.js';
import { bindConsumableSelectListeners } from './item-sheet-consumables.js';
import { bindTechniqueBuilderListeners } from './item-sheet-techniques.js';
import { bindProfessionBuilderListeners } from './item-sheet-professions.js';
import { bindInvocationBuilderListeners } from './item-sheet-invocations.js';
import { bindEnchantmentBuilderListeners } from './item-sheet-enchantments.js';
import { bindBagListeners } from './item-sheet-bags.js';
import { bindMaterialSelectListeners } from './item-sheet-materials.js';
import {
  bindPresetActionListeners,
  bindPresetSelectListeners,
  bindWeaponTagListeners
} from './item-sheet-presets.js';
import { activateInitialItemTab, bindTabs } from './item-sheet-tabs.js';

export { activateInitialItemTab, buildItemSheetContext };

export function bindItemSheetInteractions(sheet, root) {
  bindTabs(sheet, root);
  bindImageEditor(sheet, root);
  bindMaterialSelectListeners(sheet, root);
  bindConsumableSelectListeners(sheet, root);
  bindBagListeners(sheet, root);
  bindTechniqueBuilderListeners(sheet, root);
  bindProfessionBuilderListeners(sheet, root);
  bindInvocationBuilderListeners(sheet, root);
  bindEnchantmentBuilderListeners(sheet, root);
  bindFieldAutosave(sheet, root);
  bindPresetSelectListeners(sheet, root);
  bindWeaponTagListeners(sheet, root);
  bindPresetActionListeners(sheet, root);
}
