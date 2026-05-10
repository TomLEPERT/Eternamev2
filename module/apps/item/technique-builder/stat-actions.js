/**
 * Sous-module du constructeur de technique : Stat actions.
 *
 * Responsabilités :
 * - gérer une famille d’actions du builder de technique ;
 * - normaliser les petites mutations de formulaire côté fiche ;
 * - laisser le calcul XP, les résumés et la validation aux services de technique.
 *
 * Ce fichier doit rester un contrôleur UI ciblé.
 */

import { TECHNIQUE_POWER_THRESHOLDS, normalizeTechniqueStatId } from '../../../system/techniques/stat-definitions.js';
import { updateBuilderDocument } from './helpers.js';

export function bindTechniqueStatisticActions(sheet, root) {
  bindTechniqueStatButtons(sheet, root);
  bindTechniqueProfessionCheckboxes(sheet, root);
  bindTechniquePowerEnhancements(sheet, root);
  refreshTechniqueProfessionCheckboxLimit(root);
}

function bindTechniqueStatButtons(sheet, root) {
  for (const button of root.querySelectorAll('[data-action="technique-add-stat"]')) {
    if (button.dataset.boundTechniqueAddStat === '1') continue;
    button.dataset.boundTechniqueAddStat = '1';
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      const statId = normalizeTechniqueStatId(button.dataset.statId ?? 'damage');
      const next = foundry.utils.deepClone(sheet.document.system?.statistics ?? []);
      next.push({ id: foundry.utils.randomID(), statId });

      const currentMain = String(sheet.document.system?.mainStatisticId ?? '');
      const changes = { 'system.statistics': next };
      if (!currentMain) changes['system.mainStatisticId'] = next[0]?.id ?? '';

      await updateBuilderDocument(sheet, changes, button, { renderSheet: true });
    });
  }

  for (const button of root.querySelectorAll('[data-action="technique-remove-stat"]')) {
    if (button.dataset.boundTechniqueRemoveStat === '1') continue;
    button.dataset.boundTechniqueRemoveStat = '1';
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      const statEntryId = String(button.dataset.statEntryId ?? '').trim();
      if (!statEntryId) return;

      const next = foundry.utils.deepClone(sheet.document.system?.statistics ?? [])
        .filter((entry) => String(entry?.id ?? '') !== statEntryId);

      const currentMain = String(sheet.document.system?.mainStatisticId ?? '');
      const changes = { 'system.statistics': next };
      if (currentMain === statEntryId) changes['system.mainStatisticId'] = next[0]?.id ?? '';

      const nextEnhancements = foundry.utils.deepClone(sheet.document.system?.powerEnhancements ?? []).map((entry, index) => ({
        threshold: Number(entry?.threshold ?? TECHNIQUE_POWER_THRESHOLDS[index] ?? 0) || 0,
        statisticId: String(entry?.statisticId ?? '') === statEntryId ? '' : String(entry?.statisticId ?? '')
      }));

      changes['system.powerEnhancements'] = nextEnhancements;
      await updateBuilderDocument(sheet, changes, button, { renderSheet: true });
    });
  }
}

function bindTechniqueProfessionCheckboxes(sheet, root) {
  const fields = Array.from(root.querySelectorAll('[data-technique-profession-id]'));
  for (const field of fields) {
    if (field.dataset.boundTechniqueProfession === '1') continue;
    field.dataset.boundTechniqueProfession = '1';
    field.addEventListener('change', async () => {
      const selected = fields
        .filter((input) => input instanceof HTMLInputElement && input.checked)
        .map((input) => String(input.dataset.techniqueProfessionId ?? '').trim())
        .filter(Boolean);

      if (selected.length > 2) {
        if (field instanceof HTMLInputElement) field.checked = false;
        ui.notifications?.warn(game.i18n.localize('ETERN.TECHNIQUE.VALIDATION.MAX_SOURCE_PROFESSIONS'));
        refreshTechniqueProfessionCheckboxLimit(root);
        return;
      }

      refreshTechniqueProfessionCheckboxLimit(root);
      await updateBuilderDocument(sheet, { 'system.professionIds': selected }, field, { renderSheet: true });
    });
  }
}

function bindTechniquePowerEnhancements(sheet, root) {
  for (const field of root.querySelectorAll('[data-technique-power-threshold]')) {
    if (field.dataset.boundTechniquePowerThreshold === '1') continue;
    field.dataset.boundTechniquePowerThreshold = '1';
    field.addEventListener('change', async () => {
      const entryIndex = Number(field.dataset.enhancementIndex ?? -1);
      if (entryIndex < 0) return;

      const next = foundry.utils.deepClone(sheet.document.system?.powerEnhancements ?? []);
      next[entryIndex] ??= { threshold: TECHNIQUE_POWER_THRESHOLDS[entryIndex] ?? 0, statisticId: '' };
      next[entryIndex].statisticId = String(field.value ?? '').trim();
      await updateBuilderDocument(sheet, { 'system.powerEnhancements': next }, field, { renderSheet: true });
    });
  }
}

function refreshTechniqueProfessionCheckboxLimit(root) {
  const fields = Array.from(root.querySelectorAll('[data-technique-profession-id]'))
    .filter((input) => input instanceof HTMLInputElement);
  const selectedCount = fields.filter((input) => input.checked).length;

  for (const input of fields) {
    input.disabled = !input.checked && selectedCount >= 2;
  }
}
