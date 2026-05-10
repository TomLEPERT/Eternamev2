/**
 * Extension de fiche item : Item sheet invocations.
 *
 * Responsabilités :
 * - préparer ou synchroniser la section correspondante de l’ItemSheetV2 ;
 * - gérer les actions utilisateur liées à l’item affiché ;
 * - éviter de mélanger rendu, règles et persistance dans un même bloc.
 *
 * Ce fichier doit rester spécialisé par section de fiche item.
 */

import { createOrSyncInvocationActor, getLinkedInvocationActor, syncInvocationActorFromProfile } from '../../system/techniques/invocation-actor-service.js';
import { normalizeInvocationPowerBonusTarget, normalizeInvocationPowerBonusType } from '../../system/techniques/invocation-definitions.js';

export function bindInvocationBuilderListeners(sheet, root) {
  if (!root) return;
  bindInvocationActorButtons(sheet, root);
  bindAddPowerBoonButton(sheet, root);
  bindRemovePowerBoonButtons(sheet, root);
  bindPowerBoonFields(sheet, root);
}

function bindInvocationActorButtons(sheet, root) {
  bindButton(root, '[data-action="invocation-create-actor"]', 'boundInvocationCreateActor', async (event) => {
    event.preventDefault();
    if (!sheet.document.isOwner || !sheet.document.parent?.isOwner) return;
    const actor = await createOrSyncInvocationActor(sheet.document.parent, sheet.document);
    if (actor) actor.sheet?.render(true);
    sheet.render(false);
  });

  bindButton(root, '[data-action="invocation-sync-actor"]', 'boundInvocationSyncActor', async (event) => {
    event.preventDefault();
    if (!sheet.document.isOwner || !sheet.document.parent?.isOwner) return;
    const linkedActor = getLinkedInvocationActor(sheet.document);
    if (!linkedActor) {
      ui.notifications?.warn?.(game.i18n.localize('ETERN.INVOCATION.ACTOR.MISSING'));
      return;
    }
    await syncInvocationActorFromProfile(linkedActor, sheet.document.parent, sheet.document);
    linkedActor.sheet?.render(false);
    sheet.render(false);
  });

  bindButton(root, '[data-action="invocation-open-actor"]', 'boundInvocationOpenActor', async (event) => {
    event.preventDefault();
    const linkedActor = getLinkedInvocationActor(sheet.document);
    if (!linkedActor) {
      ui.notifications?.warn?.(game.i18n.localize('ETERN.INVOCATION.ACTOR.MISSING'));
      return;
    }
    linkedActor.sheet?.render(true);
  });
}

function bindButton(root, selector, datasetKey, handler) {
  for (const button of root.querySelectorAll(selector)) {
    if (button.dataset[datasetKey] === '1') continue;
    button.dataset[datasetKey] = '1';
    button.addEventListener('click', handler);
  }
}

function bindAddPowerBoonButton(sheet, root) {
  for (const button of root.querySelectorAll('[data-action="invocation-add-power-boon"]')) {
    if (button.dataset.boundInvocationAddPowerBoon === '1') continue;
    button.dataset.boundInvocationAddPowerBoon = '1';
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      const next = foundry.utils.deepClone(sheet.document.system?.powerBoons ?? []);
      next.push({ id: foundry.utils.randomID(), type: 'hp', notes: '' });
      await sheet.document.update({ 'system.powerBoons': next });
    });
  }
}

function bindRemovePowerBoonButtons(sheet, root) {
  for (const button of root.querySelectorAll('[data-action="invocation-remove-power-boon"]')) {
    if (button.dataset.boundInvocationRemovePowerBoon === '1') continue;
    button.dataset.boundInvocationRemovePowerBoon = '1';
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      const entryIndex = Number(button.dataset.entryIndex ?? -1);
      if (entryIndex < 0) return;
      const next = foundry.utils.deepClone(sheet.document.system?.powerBoons ?? []);
      next.splice(entryIndex, 1);
      await sheet.document.update({ 'system.powerBoons': next });
    });
  }
}

function bindPowerBoonFields(sheet, root) {
  for (const field of root.querySelectorAll('[data-invocation-power-boon-field]')) {
    if (field.dataset.boundInvocationPowerBoonField === '1') continue;
    field.dataset.boundInvocationPowerBoonField = '1';
    const handler = async () => {
      const entryIndex = Number(field.dataset.entryIndex ?? -1);
      const entryField = String(field.dataset.entryField ?? '').trim();
      if (entryIndex < 0 || !entryField) return;
      const next = foundry.utils.deepClone(sheet.document.system?.powerBoons ?? []);
      const entry = next[entryIndex];
      if (!entry) return;
      if (entryField === 'type') {
        entry.type = normalizeInvocationPowerBonusType(field.value ?? 'hp');
        entry.target = normalizeInvocationPowerBonusTarget(entry.type, entry.target ?? '');
      } else if (entryField === 'target') {
        entry.target = normalizeInvocationPowerBonusTarget(entry.type ?? 'hp', field.value ?? '');
      } else {
        entry[entryField] = field.value ?? '';
      }
      await sheet.document.update({ 'system.powerBoons': next });
    };
    field.addEventListener('change', handler);
    field.addEventListener('blur', handler);
  }
}
