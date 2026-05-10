/**
 * Extension de fiche item : Item sheet presets.
 *
 * Responsabilités :
 * - préparer ou synchroniser la section correspondante de l’ItemSheetV2 ;
 * - gérer les actions utilisateur liées à l’item affiché ;
 * - éviter de mélanger rendu, règles et persistance dans un même bloc.
 *
 * Ce fichier doit rester spécialisé par section de fiche item.
 */

import { localizePresetDescription, localizePresetName, localizePresetSkill } from '../../system/i18n/preset-localization.js';
import { normalizeDamageType, normalizeRange } from '../../system/nomenclature.js';
import { ITEM_SAVE_KEYS } from '../../system/constants/save-keys.js';
import { getDefaultBaseForItemType, getItemPresetConfig } from '../../system/items/preset-registry.js';
import { resolvePresetBaseId } from '../../system/items/preset-id-mapping.js';
import { buildLocalizedArmorSkill, buildLocalizedShieldSkill } from '../../system/items/item-preset-service.js';

const PRESET_ITEM_TYPES = ['weapon', 'armor', 'shield'];

export function isPresetItemType(itemType) {
  return PRESET_ITEM_TYPES.includes(String(itemType ?? ''));
}

export function bindPresetSelectListeners(sheet, root) {
  bindBaseSelect(sheet, root);
}

export function bindWeaponTagListeners(sheet, root) {
  for (const checkbox of root.querySelectorAll('.weapon-tag-checkbox')) {
    if (checkbox.dataset.boundChange === '1') continue;

    checkbox.dataset.boundChange = '1';
    checkbox.addEventListener('change', async () => {
      if (sheet.item.type !== 'weapon') return;
      const tags = Array.from(root.querySelectorAll('.weapon-tag-checkbox:checked')).map((element) => String(element.value));
      const changes = { 'system.tags': tags, ...buildPresetIdentityUpdate(sheet, root) };

      if (typeof sheet._updateItemDocument === 'function') {
        await sheet._updateItemDocument(changes, checkbox, { renderSheet: false });
        return;
      }

      await sheet.item.update(changes, { render: false });
    });
  }
}

export function bindPresetActionListeners(sheet, root) {
  const resetButton = root.querySelector('[data-action="preset-reset"]');
  if (!resetButton || resetButton.dataset.boundClick === '1') return;

  resetButton.dataset.boundClick = '1';
  resetButton.addEventListener('click', async (event) => {
    if (!isPresetItemType(sheet.item.type)) return;

    event.preventDefault();
    event.stopPropagation();

    const fallbackBase = getDefaultBaseForItemType(sheet.item.type);
    const currentBase = root.querySelector('[name="system.base"]')?.value ?? sheet.item.system?.base ?? fallbackBase;
    const baseId = String(currentBase || fallbackBase);
    const payload = buildPresetResetUpdate(sheet.item, baseId);

    if (typeof sheet._updateItemDocument === 'function') {
      await sheet._updateItemDocument(payload, event.currentTarget instanceof HTMLElement ? event.currentTarget : resetButton, { renderSheet: true });
      return;
    }

    sheet._captureViewState(event.currentTarget instanceof HTMLElement ? event.currentTarget : resetButton);
    await sheet.item.update(payload, { render: false });
    await sheet.render(false);
  });
}

export function buildPresetIdentityUpdate(sheet, root = null) {
  const item = sheet?.item ?? sheet?.document;
  if (!isPresetItemType(item?.type)) return {};

  const config = getItemPresetConfig(item.type);
  if (!config) return {};

  const baseField = root?.querySelector?.('[name="system.base"]') ?? sheet?._getRootElement?.()?.querySelector?.('[name="system.base"]');
  const fallbackBase = getDefaultBaseForItemType(item.type);
  const base = resolvePresetBaseId(item.type, baseField?.value ?? item.system?.base ?? fallbackBase, fallbackBase);
  const preset = config.presets?.[base] ?? null;
  const category = config.normalizeCategory?.(preset?.category ?? item.system?.category ?? config.defaultCategory, config.defaultCategory)
    ?? String(preset?.category ?? item.system?.category ?? config.defaultCategory ?? '');

  return {
    'system.base': base,
    'system.category': category
  };
}

function bindBaseSelect(sheet, root) {
  const baseSelect = root.querySelector('[name="system.base"]');
  if (!baseSelect || baseSelect.dataset.boundPresetBase === '1') return;

  baseSelect.dataset.boundPresetBase = '1';
  baseSelect.dataset.boundAutosaveChange = '1';
  baseSelect.addEventListener('change', async (event) => {
    if (!isPresetItemType(sheet.item.type)) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();

    const baseId = String(event.currentTarget.value || getDefaultBaseForItemType(sheet.item.type));
    const payload = buildPresetResetUpdate(sheet.item, baseId);

    if (typeof sheet._updateItemDocument === 'function') {
      await sheet._updateItemDocument(payload, event.currentTarget instanceof HTMLElement ? event.currentTarget : baseSelect, { renderSheet: true });
      return;
    }

    sheet._captureViewState(event.currentTarget instanceof HTMLElement ? event.currentTarget : baseSelect);
    await sheet.item.update(payload, { render: false });
    await sheet.render(false);
  });
}

function buildPresetResetUpdate(item, baseId) {
  const type = String(item?.type ?? '');
  const config = getItemPresetConfig(type);
  if (!config) return {};

  const base = resolvePresetBaseId(type, baseId, config.defaultBase);
  const preset = config.presets?.[base] ?? config.presets?.[config.defaultBase] ?? null;
  const category = config.normalizeCategory?.(preset?.category ?? config.defaultCategory, config.defaultCategory)
    ?? String(preset?.category ?? config.defaultCategory ?? '');

  const update = {
    name: localizePresetName(type, base, base),
    'system.base': base,
    'system.category': category,
    'system.quantity': Math.max(1, Math.floor(Number(item?.system?.quantity ?? 1) || 1)),
    'system.location': String(item?.system?.location ?? 'backpack'),
    'system.containerId': String(item?.system?.containerId ?? ''),
    'system.legality': String(item?.system?.legality ?? 'legal'),
    'system.equipped': Boolean(item?.system?.equipped)
  };

  if (!item?.img && config.defaultImage) update.img = config.defaultImage;

  if (type === 'armor') addArmorPresetUpdate(update, base, category, preset);
  else if (type === 'shield') addShieldPresetUpdate(update, base, category, preset);
  else if (type === 'weapon') addWeaponPresetUpdate(update, base, preset);

  return update;
}

function addArmorPresetUpdate(update, base, category, preset) {
  update['system.defFormula'] = String(preset?.defFormula ?? '2 + AGI/2');
  update['system.defBonus'] = Number(preset?.defBonus ?? 0) || 0;
  update['system.weight'] = Number(preset?.weight ?? 1) || 0;
  update['system.description'] = localizePresetDescription('armor', base, String(preset?.description ?? ''));

  const localizedSkill = buildLocalizedArmorSkill(category);
  update['system.skill.name'] = String(localizedSkill.name ?? '');
  update['system.skill.description'] = String(localizedSkill.description ?? '');

  for (const [key, value] of Object.entries(buildSaveUpdate(preset?.saves ?? []))) {
    update[`system.saves.${key}`] = value;
  }
}

function addShieldPresetUpdate(update, base, _category, preset) {
  const defBonus = Number(preset?.defBonus ?? 0) || 0;
  update['system.defBonus'] = defBonus;
  update['system.defense'] = defBonus;
  update['system.weight'] = Number(preset?.weight ?? 2) || 0;
  update['system.description'] = localizePresetDescription('shield', base, String(preset?.description ?? ''));

  const localizedSkill = buildLocalizedShieldSkill(base, preset);
  update['system.skill.name'] = String(localizedSkill.name ?? '');
  update['system.skill.description'] = String(localizedSkill.description ?? '');

  for (const [key, value] of Object.entries(buildSaveUpdate(preset?.saves ?? []))) {
    update[`system.saves.${key}`] = value;
  }
}

function addWeaponPresetUpdate(update, base, preset) {
  update['system.range'] = normalizeRange(preset?.range ?? 'melee');
  update['system.damage'] = String(preset?.damage ?? '1d6');
  update['system.damageType'] = normalizeDamageType(preset?.damageType ?? 'bludgeoning');
  update['system.precisionBase'] = String(preset?.precisionBase ?? 'PRC').toUpperCase();
  update['system.precisionBonus'] = Number(preset?.precisionBonus ?? 0) || 0;
  update['system.weight'] = Number(preset?.weight ?? 1) || 1;
  update['system.tags'] = Array.isArray(preset?.tags) ? Array.from(preset.tags) : [];
  update['system.description'] = localizePresetDescription('weapon', base, String(preset?.description ?? ''));

  const skills = Array.isArray(preset?.skills) ? preset.skills.slice(0, 3) : [];
  for (let index = 0; index < 3; index += 1) {
    const skill = skills[index] ?? {};
    const localized = localizePresetSkill(
      'weapon',
      base,
      index,
      String(skill?.name ?? ''),
      String(skill?.description ?? '')
    );
    update[`system.skills.${index}.name`] = String(localized.name ?? '');
    update[`system.skills.${index}.description`] = String(localized.description ?? '');
    update[`system.skills.${index}.learned`] = false;
  }
}

function buildSaveUpdate(presetSaves) {
  const result = Object.fromEntries(ITEM_SAVE_KEYS.map((key) => [key, 0]));
  for (const entry of Array.isArray(presetSaves) ? presetSaves : []) {
    const key = String(entry?.key ?? entry?.type ?? '');
    if (!key || !(key in result)) continue;
    result[key] = Number(entry?.value ?? 0) || 0;
  }
  return result;
}
