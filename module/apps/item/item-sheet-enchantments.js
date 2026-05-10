/**
 * Extension de fiche item : Item sheet enchantments.
 *
 * Responsabilités :
 * - préparer ou synchroniser la section correspondante de l’ItemSheetV2 ;
 * - gérer les actions utilisateur liées à l’item affiché ;
 * - éviter de mélanger rendu, règles et persistance dans un même bloc.
 *
 * Ce fichier doit rester spécialisé par section de fiche item.
 */

import {
  createCustomEnchantmentEntry,
  createDefaultEnchantmentActorBonus,
  createDefaultEnchantmentItemBonus
} from '../../system/enchantments/services/entry-service.js';
import {
  clearPendingFieldSave,
  normalizeAutosaveFieldValue
} from '../shared/form-autosave.js';
import { openEnchantmentDialog } from '../dialogs/enchantment-dialog.js';

function getRoot(sheet) {
  return typeof sheet?._getRootElement === 'function' ? sheet._getRootElement() : null;
}

function normalizeFieldValue(field) {
  return normalizeAutosaveFieldValue(field, { emptyNumberValue: null });
}

function clearPendingEnchantingSaves(sheet) {
  const pendingNames = Array.from(sheet?._pendingFieldSaves?.keys?.() ?? []);
  for (const name of pendingNames) {
    if (String(name).startsWith('system.enchanting.')) clearPendingFieldSave(sheet, name);
  }
}

function collectCurrentEnchantingData(sheet) {
  const enchanting = foundry.utils.deepClone(sheet?.item?.system?.enchanting ?? {});
  enchanting.entries = Array.isArray(enchanting.entries) ? enchanting.entries : [];

  const root = getRoot(sheet);
  if (!root) return enchanting;

  for (const field of root.querySelectorAll('[name^="system.enchanting."]')) {
    const name = String(field.getAttribute('name') ?? '');
    const path = name.slice('system.enchanting.'.length);
    if (!path || path.startsWith('derived.')) continue;

    foundry.utils.setProperty(enchanting, path, normalizeFieldValue(field));
  }

  clearPendingEnchantingSaves(sheet);
  return enchanting;
}

function buildEnchantingUpdate(enchanting) {
  return {
    'system.enchanting.baseQuality': String(enchanting?.baseQuality ?? 'base'),
    'system.enchanting.customPrefixMax': Math.max(0, Math.floor(Number(enchanting?.customPrefixMax ?? 1) || 0)),
    'system.enchanting.customSuffixMax': Math.max(0, Math.floor(Number(enchanting?.customSuffixMax ?? 1) || 0)),
    'system.enchanting.notes': String(enchanting?.notes ?? ''),
    'system.enchanting.entries': Array.isArray(enchanting?.entries) ? enchanting.entries : []
  };
}

async function persistEnchanting(sheet, enchanting, activeElement = null, { renderSheet = true } = {}) {
  const target = activeElement instanceof HTMLElement ? activeElement : null;
  const changes = buildEnchantingUpdate(enchanting);

  if (typeof sheet._updateItemDocument === 'function') {
    await sheet._updateItemDocument(changes, target, { renderSheet });
    return;
  }

  if (typeof sheet._captureViewState === 'function') sheet._captureViewState(target);
  await sheet.item.update(changes, { render: false });
  if (renderSheet && typeof sheet.render === 'function') await sheet.render(false);
}

async function onAddEntry(sheet, button) {
  const enchanting = collectCurrentEnchantingData(sheet);
  enchanting.entries.push(createCustomEnchantmentEntry({
    family: button.dataset.entryFamily ?? 'affix',
    side: button.dataset.entrySide ?? 'prefix'
  }));
  await persistEnchanting(sheet, enchanting, button);
}

async function onRemoveEntry(sheet, button) {
  const entryIndex = Math.max(0, Math.floor(Number(button.dataset.entryIndex ?? -1)));
  const enchanting = collectCurrentEnchantingData(sheet);
  if (!enchanting.entries[entryIndex]) return;
  enchanting.entries.splice(entryIndex, 1);
  await persistEnchanting(sheet, enchanting, button);
}

async function onAddNestedBonus(sheet, button, nestedKey, factory) {
  const entryIndex = Math.max(0, Math.floor(Number(button.dataset.entryIndex ?? -1)));
  const enchanting = collectCurrentEnchantingData(sheet);
  const entry = enchanting.entries[entryIndex];
  if (!entry) return;
  entry[nestedKey] = Array.isArray(entry[nestedKey]) ? entry[nestedKey] : [];
  entry[nestedKey].push(factory());
  await persistEnchanting(sheet, enchanting, button);
}

async function onRemoveNestedBonus(sheet, button, nestedKey) {
  const entryIndex = Math.max(0, Math.floor(Number(button.dataset.entryIndex ?? -1)));
  const bonusIndex = Math.max(0, Math.floor(Number(button.dataset.bonusIndex ?? -1)));
  const enchanting = collectCurrentEnchantingData(sheet);
  const entry = enchanting.entries[entryIndex];
  if (!entry || !Array.isArray(entry[nestedKey]) || !entry[nestedKey][bonusIndex]) return;
  entry[nestedKey].splice(bonusIndex, 1);
  await persistEnchanting(sheet, enchanting, button);
}

async function onUseCatalyst(sheet, button) {
  try {
    const target = button instanceof HTMLElement ? button : null;
    const enchanting = collectCurrentEnchantingData(sheet);
    await persistEnchanting(sheet, enchanting, target, { renderSheet: false });

    if (typeof sheet._captureViewState === 'function') sheet._captureViewState(target);
    if (typeof sheet._captureParentActorViewState === 'function') sheet._captureParentActorViewState();

    const result = await openEnchantmentDialog(sheet.item);
    if (!result) return;

    if (typeof sheet._renderParentActorSheets === 'function') sheet._renderParentActorSheets();
    if (typeof sheet.render === 'function') await sheet.render(false);
  } catch (error) {
    console.error(error);
    ui.notifications.error(error?.message ?? String(error));
  }
}

export function bindEnchantmentBuilderListeners(sheet, root) {
  if (!root) return;

  for (const button of root.querySelectorAll('[data-action="enchantment-open-dialog"]')) {
    if (button.dataset.boundClick === '1') continue;
    button.dataset.boundClick = '1';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      void onUseCatalyst(sheet, button);
    });
  }

  for (const button of root.querySelectorAll('[data-action="enchantment-add-entry"]')) {
    if (button.dataset.boundClick === '1') continue;
    button.dataset.boundClick = '1';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      void onAddEntry(sheet, button);
    });
  }

  for (const button of root.querySelectorAll('[data-action="enchantment-remove-entry"]')) {
    if (button.dataset.boundClick === '1') continue;
    button.dataset.boundClick = '1';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      void onRemoveEntry(sheet, button);
    });
  }

  for (const button of root.querySelectorAll('[data-action="enchantment-add-actor-bonus"]')) {
    if (button.dataset.boundClick === '1') continue;
    button.dataset.boundClick = '1';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      void onAddNestedBonus(sheet, button, 'actorBonuses', createDefaultEnchantmentActorBonus);
    });
  }

  for (const button of root.querySelectorAll('[data-action="enchantment-remove-actor-bonus"]')) {
    if (button.dataset.boundClick === '1') continue;
    button.dataset.boundClick = '1';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      void onRemoveNestedBonus(sheet, button, 'actorBonuses');
    });
  }

  for (const button of root.querySelectorAll('[data-action="enchantment-add-item-bonus"]')) {
    if (button.dataset.boundClick === '1') continue;
    button.dataset.boundClick = '1';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      void onAddNestedBonus(sheet, button, 'itemBonuses', createDefaultEnchantmentItemBonus);
    });
  }

  for (const button of root.querySelectorAll('[data-action="enchantment-remove-item-bonus"]')) {
    if (button.dataset.boundClick === '1') continue;
    button.dataset.boundClick = '1';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      void onRemoveNestedBonus(sheet, button, 'itemBonuses');
    });
  }
}
