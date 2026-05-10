/**
 * Extension de fiche item : Item sheet consumables.
 *
 * Responsabilités :
 * - préparer ou synchroniser la section correspondante de l’ItemSheetV2 ;
 * - gérer les actions utilisateur liées à l’item affiché ;
 * - éviter de mélanger rendu, règles et persistance dans un même bloc.
 *
 * Ce fichier doit rester spécialisé par section de fiche item.
 */

import {
  getCatalystDefinition,
  getDefaultCatalystBase,
  normalizeCatalystBase,
  normalizeConsumableCategory
} from '../../system/constants/consumables.js';

function localize(key) {
  return game.i18n.localize(key);
}

function getCatalystName(base) {
  return localize(getCatalystDefinition(base).labelKey);
}

function getCatalystDescription(base) {
  return localize(getCatalystDefinition(base).descriptionKey);
}

function shouldReplaceName(currentName, acceptedValues = []) {
  const normalized = String(currentName ?? '').trim();
  if (!normalized) return true;
  return acceptedValues.includes(normalized);
}

export function bindConsumableSelectListeners(sheet, root) {
  if (sheet.item?.type !== 'consumable') return;

  bindConsumableCategorySelect(sheet, root);
  bindCatalystBaseSelect(sheet, root);
}

function bindConsumableCategorySelect(sheet, root) {
  const categorySelect = root.querySelector('[name="system.category"]');
  if (!(categorySelect instanceof HTMLSelectElement)) return;

  categorySelect.dataset.boundAutosave = '1';
  if (categorySelect.dataset.boundConsumableCategory === '1') return;

  categorySelect.dataset.boundConsumableCategory = '1';
  categorySelect.addEventListener('change', async (event) => {
    const currentCategory = normalizeConsumableCategory(sheet.item.system?.category ?? 'misc');
    const nextCategory = normalizeConsumableCategory(event.currentTarget?.value ?? 'misc');
    const payload = { 'system.category': nextCategory };

    if (nextCategory === 'enchantmentCatalyst') {
      const catalystBase = normalizeCatalystBase(sheet.item.system?.catalystBase ?? getDefaultCatalystBase());
      payload['system.catalystBase'] = catalystBase;
      if (shouldReplaceName(sheet.item.name, [
        '',
        localize('ETERN.ITEM.DEFAULT_CONSUMABLE_NAME'),
        localize('ETERN.ITEM.DEFAULT_CONCOCTION_NAME'),
        currentCategory === 'enchantmentCatalyst' ? getCatalystName(sheet.item.system?.catalystBase) : ''
      ])) {
        payload.name = getCatalystName(catalystBase);
      }
      if (!String(sheet.item.system?.description ?? '').trim()) {
        payload['system.description'] = getCatalystDescription(catalystBase);
      }
    } else if (nextCategory === 'concoction') {
      if (shouldReplaceName(sheet.item.name, [
        '',
        localize('ETERN.ITEM.DEFAULT_CONSUMABLE_NAME'),
        currentCategory === 'enchantmentCatalyst' ? getCatalystName(sheet.item.system?.catalystBase) : ''
      ])) {
        payload.name = localize('ETERN.ITEM.DEFAULT_CONCOCTION_NAME');
      }
    } else if (nextCategory === 'misc') {
      if (shouldReplaceName(sheet.item.name, [
        '',
        localize('ETERN.ITEM.DEFAULT_CONCOCTION_NAME'),
        currentCategory === 'enchantmentCatalyst' ? getCatalystName(sheet.item.system?.catalystBase) : ''
      ])) {
        payload.name = localize('ETERN.ITEM.DEFAULT_CONSUMABLE_NAME');
      }
    }

    await sheet.item.update(payload);
    await sheet.render(false);
  });
}

function bindCatalystBaseSelect(sheet, root) {
  const baseSelect = root.querySelector('[name="system.catalystBase"]');
  if (!(baseSelect instanceof HTMLSelectElement)) return;

  baseSelect.dataset.boundAutosave = '1';
  if (baseSelect.dataset.boundCatalystBase === '1') return;

  baseSelect.dataset.boundCatalystBase = '1';
  baseSelect.addEventListener('change', async (event) => {
    const previousBase = normalizeCatalystBase(sheet.item.system?.catalystBase ?? getDefaultCatalystBase());
    const nextBase = normalizeCatalystBase(event.currentTarget?.value ?? getDefaultCatalystBase());
    const payload = { 'system.catalystBase': nextBase };

    if (shouldReplaceName(sheet.item.name, [
      '',
      localize('ETERN.ITEM.DEFAULT_CONSUMABLE_NAME'),
      getCatalystName(previousBase)
    ])) {
      payload.name = getCatalystName(nextBase);
    }

    if (!String(sheet.item.system?.description ?? '').trim() || String(sheet.item.system?.description ?? '').trim() == getCatalystDescription(previousBase)) {
      payload['system.description'] = getCatalystDescription(nextBase);
    }

    await sheet.item.update(payload);
    await sheet.render(false);
  });
}
