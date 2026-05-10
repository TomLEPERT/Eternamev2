/**
 * Sous-module du dialogue d’enchantement : Form state.
 *
 * Responsabilités :
 * - isoler une partie du comportement DOM ou formulaire du dialogue ;
 * - garder le dialogue principal lisible ;
 * - éviter de dupliquer la logique de sélection et de validation d’enchantement.
 *
 * Ce fichier ne doit pas contenir de règles d’enchantement lourdes.
 */

import { normalizeCatalystBase, normalizeEssenceQuality } from '../../../system/constants/consumables.js';
import { buildEnchantmentRankResult } from '../../../system/enchantments/services/rank-service.js';
import { localize } from '../../../system/i18n/localization.js';
import { findClosestElement, getEventDialogForm, isFormElement, isInputElement, isSelectElement } from './dom-utils.js';

export function getCurrentDialogConfig(form) {
  const sourceSelect = form?.querySelector?.('[name="catalystItemId"]');
  const sourceOption = getSelectedOption(sourceSelect);
  const sourceBase = sourceOption?.dataset?.catalystBase ?? '';
  const sourceQuality = sourceOption?.dataset?.essenceQuality ?? '';
  const sourceTag = sourceOption?.dataset?.essenceTag ?? '';

  const baseValue = getNamedFormValue(form, 'catalystBase', 'brutal_shard');
  const qualityValue = getNamedFormValue(form, 'essenceQuality', 'none');
  const tagValue = getNamedFormValue(form, 'essenceTag', '');
  const successValue = getNamedFormValue(form, 'successCount', '0');

  return {
    catalystItemId: String(sourceSelect?.value ?? '').trim(),
    catalystBase: normalizeCatalystBase(sourceBase || baseValue || 'brutal_shard'),
    essenceQuality: normalizeEssenceQuality(sourceQuality || qualityValue || 'none'),
    essenceTag: String(sourceTag || tagValue || '').trim(),
    successCount: Math.max(0, Math.floor(Number(successValue ?? 0) || 0))
  };
}

export function syncDialogPreview(form) {
  if (!isFormElement(form)) return;

  const config = getCurrentDialogConfig(form);
  const qualityField = form.querySelector('[name="essenceQuality"]');
  const tagField = form.querySelector('[name="essenceTag"]');
  const sourceSelect = form.querySelector('[name="catalystItemId"]');
  const manualFields = form.querySelectorAll('[data-manual-catalyst-field]');
  const hasSource = Boolean(sourceSelect?.value);

  setNamedRadioValue(form, 'catalystBase', config.catalystBase);
  if (isSelectElement(qualityField) && qualityField.value !== config.essenceQuality) qualityField.value = config.essenceQuality;
  if (isInputElement(tagField) && hasSource && tagField.value !== config.essenceTag) tagField.value = config.essenceTag;
  for (const field of manualFields) field.disabled = hasSource;

  const rank = buildEnchantmentRankResult(config);
  setText(form, '[data-enchantment-success-preview]', localize('ETERN.ENCHANTING.DIALOG.SUCCESS_PREVIEW_NO_CHA', {
    successes: rank.successCount,
    quality: rank.qualityBonus,
    catalyst: rank.catalystBonus,
    total: rank.totalSuccesses,
    rank: rank.rank
  }));

  form.dataset.previewCatalystBase = config.catalystBase;
}

export function parseEnchantmentFormResult(form, item) {
  const data = new foundry.applications.ux.FormDataExtended(form).object;
  const catalystItemId = String(data.catalystItemId ?? '').trim();
  const catalystItem = catalystItemId && item?.parent instanceof Actor ? item.parent.items.get(catalystItemId) : null;

  return {
    catalystItemId,
    catalystBase: normalizeCatalystBase(catalystItem?.system?.catalystBase ?? data.catalystBase ?? 'brutal_shard'),
    essenceQuality: normalizeEssenceQuality(catalystItem?.system?.essenceQuality ?? data.essenceQuality ?? 'none'),
    essenceTag: String(catalystItem?.system?.essenceTag ?? data.essenceTag ?? '').trim(),
    successCount: Math.max(0, Math.floor(Number(data.successCount ?? 0) || 0)),
    failureMargin: Math.max(0, Math.floor(Number(data.failureMargin ?? 0) || 0)),
    preferredSide: String(data.preferredSide ?? 'random').trim().toLowerCase(),
    naturalOne: Boolean(data.naturalOne)
  };
}

export function syncDialogPreviewFromEvent(event) {
  const target = event?.currentTarget ?? event?.target ?? null;
  const form = findClosestElement(target, '.enchantment-dialog-form') ?? getEventDialogForm(event);
  if (form) syncDialogPreview(form);
}

function getSelectedOption(select) {
  return select?.selectedOptions?.[0] ?? null;
}

function getNamedFormField(form, name) {
  const fields = Array.from(form?.querySelectorAll?.(`[name="${CSS.escape(name)}"]`) ?? []);
  if (!fields.length) return null;
  const checked = fields.find((field) => String(field?.type ?? '').toLowerCase() === 'radio' && field.checked);
  return checked ?? fields[0] ?? null;
}

function getNamedFormValue(form, name, fallback = '') {
  const field = getNamedFormField(form, name);
  if (!field) return fallback;
  if (String(field?.type ?? '').toLowerCase() === 'radio') {
    const checked = Array.from(form?.querySelectorAll?.(`[name="${CSS.escape(name)}"]`) ?? [])
      .find((candidate) => String(candidate?.type ?? '').toLowerCase() === 'radio' && candidate.checked);
    return checked?.value ?? fallback;
  }
  return field.value ?? fallback;
}

function setNamedRadioValue(form, name, value) {
  const fields = Array.from(form?.querySelectorAll?.(`[name="${CSS.escape(name)}"]`) ?? []);
  const normalizedValue = String(value ?? '');
  for (const field of fields) {
    if (String(field?.type ?? '').toLowerCase() === 'radio') field.checked = String(field.value ?? '') === normalizedValue;
  }
}

function setText(root, selector, value = '') {
  const element = root?.querySelector?.(selector);
  if (element) element.textContent = String(value ?? '');
}
