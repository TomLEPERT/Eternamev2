/**
 * Extension de fiche item : Item sheet autosave.
 *
 * Responsabilités :
 * - préparer ou synchroniser la section correspondante de l’ItemSheetV2 ;
 * - gérer les actions utilisateur liées à l’item affiché ;
 * - éviter de mélanger rendu, règles et persistance dans un même bloc.
 *
 * Ce fichier doit rester spécialisé par section de fiche item.
 */

import {
  bindSheetAutosaveFields,
  clearPendingFieldSave,
  normalizeAutosaveFieldValue
} from '../shared/form-autosave.js';
import { buildPresetIdentityUpdate } from './item-sheet-presets.js';
import { normalizeHeritageFeatureType } from '../../system/constants/heritages.js';

function shouldSkipItemField(name, field) {
  if (field instanceof HTMLInputElement && field.classList.contains('weapon-tag-checkbox')) return true;
  return name === 'system.base';
}

const TECHNIQUE_RENDER_FIELDS = new Set([
  'system.power',
  'system.mainStatisticId',
  'system.usageType',
  'system.linkedAttributeKey'
]);

function shouldRenderTechniqueSheetAfterAutosave(document, name) {
  const isTechniqueLike = document?.type === 'technique'
    || (document?.type === 'heritage' && normalizeHeritageFeatureType(document.system?.featureType) === 'technique');
  if (!isTechniqueLike) return false;
  if (TECHNIQUE_RENDER_FIELDS.has(name)) return true;
  return name === 'system.prepared';
}

function shouldRenderItemSheetAfterAutosave(document, name, field) {
  if (shouldRenderTechniqueSheetAfterAutosave(document, name)) return true;
  if (name === 'system.weight' || name === 'system.legality') return true;
  if (name === 'system.enchanting.baseQuality') return true;
  if (document?.type === 'heritage' && (name === 'system.heritageType' || name === 'system.featureType')) return true;

  if (name === 'system.enchanting.entries') return true;

  if (name.startsWith('system.enchanting.entries.')) {
    if (field instanceof HTMLSelectElement) return true;
    if (field instanceof HTMLInputElement && field.type === 'checkbox') return true;
  }

  return false;
}

function getItemSheetRoot(sheet, field = null) {
  return typeof sheet?._getRootElement === 'function'
    ? sheet._getRootElement()
    : field?.closest?.('.eternamev2-item-sheet') ?? null;
}

function getFieldValue(field) {
  return normalizeAutosaveFieldValue(field, { emptyNumberValue: null });
}

function hasChangedValue(document, name, next) {
  const current = foundry.utils.getProperty(document, name);
  return current !== next;
}

function collectPendingItemFieldChanges(sheet, root, excludedName = '') {
  const changes = {};
  const pendingNames = Array.from(sheet?._pendingFieldSaves?.keys?.() ?? []);

  for (const name of pendingNames) {
    clearPendingFieldSave(sheet, name);
    if (!name || name === excludedName) continue;

    const field = root?.querySelector?.(`[name="${CSS.escape(name)}"]`);
    if (!field || shouldSkipItemField(name, field, sheet)) continue;

    const next = getFieldValue(field);
    if (hasChangedValue(sheet.document, name, next)) changes[name] = next;
  }

  return changes;
}

function collectCurrentEnchantingFormState(sheet, root) {
  const enchanting = foundry.utils.deepClone(sheet?.item?.system?.enchanting ?? {});
  enchanting.entries = Array.isArray(enchanting.entries) ? enchanting.entries : [];

  if (!root) return enchanting;

  for (const field of root.querySelectorAll('[name^="system.enchanting."]')) {
    if (!field || shouldSkipItemField(field.getAttribute('name') ?? '', field, sheet)) continue;

    const name = String(field.getAttribute('name') ?? '');
    const path = name.slice('system.enchanting.'.length);
    if (!path || path.startsWith('derived.')) continue;

    foundry.utils.setProperty(enchanting, path, getFieldValue(field));
  }

  return enchanting;
}

function replaceEnchantingDotUpdatesWithCurrentState(changes, sheet, root) {
  const hasEnchantingUpdate = Object.keys(changes).some((name) => name.startsWith('system.enchanting.'));
  if (!hasEnchantingUpdate) return changes;

  const enchanting = collectCurrentEnchantingFormState(sheet, root);
  const next = {};

  for (const [key, value] of Object.entries(changes)) {
    if (!key.startsWith('system.enchanting.')) next[key] = value;
  }

  next['system.enchanting.baseQuality'] = String(enchanting?.baseQuality ?? 'base');
  next['system.enchanting.customPrefixMax'] = Math.max(0, Math.floor(Number(enchanting?.customPrefixMax ?? 1) || 0));
  next['system.enchanting.customSuffixMax'] = Math.max(0, Math.floor(Number(enchanting?.customSuffixMax ?? 1) || 0));
  next['system.enchanting.notes'] = String(enchanting?.notes ?? '');
  next['system.enchanting.entries'] = Array.isArray(enchanting?.entries) ? enchanting.entries : [];

  return next;
}

function shouldRenderAfterCombinedAutosave(document, changes, activeField) {
  const activeName = String(activeField?.getAttribute?.('name') ?? '');

  if (activeName.startsWith('system.enchanting.entries.')) {
    return activeField instanceof HTMLSelectElement
      || (activeField instanceof HTMLInputElement && activeField.type === 'checkbox');
  }

  if (activeName.startsWith('system.enchanting.')) {
    return activeName === 'system.enchanting.baseQuality';
  }

  for (const name of Object.keys(changes)) {
    const field = activeName === name ? activeField : null;
    if (shouldRenderItemSheetAfterAutosave(document, name, field)) return true;
  }
  return false;
}

function shouldRenderParentActorAfterAutosave(changes, activeField) {
  const activeName = String(activeField?.getAttribute?.('name') ?? '');
  if (activeName.startsWith('system.enchanting.')) {
    return activeName.includes('.actorBonuses.') || activeName.includes('.itemBonuses.');
  }

  return Object.keys(changes).some((name) => !String(name).startsWith('system.enchanting.'));
}

export function bindFieldAutosave(sheet, root) {
  bindSheetAutosaveFields(sheet, root, {
    shouldSkipField: shouldSkipItemField,
    shouldQueueInputField: (name) => !String(name ?? '').startsWith('system.enchanting.'),
    emptyNumberValue: null,
    updateDocument: async function(changes, field) {
      const changedName = Object.keys(changes)[0] ?? '';
      const root = getItemSheetRoot(this, field);
      const pendingChanges = collectPendingItemFieldChanges(this, root, changedName);
      const rawChanges = replaceEnchantingDotUpdatesWithCurrentState({ ...pendingChanges, ...changes }, this, root);
      const renderSheet = shouldRenderAfterCombinedAutosave(this.document, rawChanges, field);
      const renderParentActor = shouldRenderParentActorAfterAutosave(rawChanges, field);
      const normalizedChanges = { ...buildPresetIdentityUpdate(this, root), ...rawChanges };

      if (typeof this._updateItemDocument === 'function') {
        await this._updateItemDocument(normalizedChanges, field, { renderSheet, renderParentActor });
        return;
      }

      await this.document.update(normalizedChanges, { render: false });
      if (renderSheet && typeof this.render === 'function') await this.render(false);
    }
  });
}
