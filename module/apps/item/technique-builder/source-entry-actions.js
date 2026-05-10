/**
 * Sous-module du constructeur de technique : Source entry actions.
 *
 * Responsabilités :
 * - gérer une famille d’actions du builder de technique ;
 * - normaliser les petites mutations de formulaire côté fiche ;
 * - laisser le calcul XP, les résumés et la validation aux services de technique.
 *
 * Ce fichier doit rester un contrôleur UI ciblé.
 */

import { mergeTechniqueComponentWithSource, resolveTechniqueComponentSource } from '../../../system/techniques/source-sync-service.js';
import { createTechniqueBaseComponentEntry, normalizeTechniqueBaseComponentSection } from '../../../system/techniques/base-components.js';
import { updateBuilderDocument } from './helpers.js';

const DRAG_MIME = 'application/x-eternamev2-technique-source';
const TECHNIQUE_SECTION_KEYS = new Set(['keys', 'conditions', 'mechanics', 'states']);

export function bindTechniqueSourceActions(sheet, root) {
  bindImportSourceEntryButtons(sheet, root);
  bindImportBaseEntryButtons(sheet, root);
  bindSyncSourceEntryButtons(sheet, root);
  bindSyncSourceSectionButtons(sheet, root);
  bindOpenSourceProfessionButtons(sheet, root);
  bindTechniqueSourceDrag(sheet, root);
  bindTechniqueDropZones(sheet, root);
}

function bindImportSourceEntryButtons(sheet, root) {
  for (const button of root.querySelectorAll('[data-action="technique-import-source-entry"]')) {
    if (button.dataset.boundTechniqueImport === '1') continue;
    button.dataset.boundTechniqueImport = '1';
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      const arrayKey = String(button.dataset.arrayKey ?? '').trim();
      const professionId = String(button.dataset.professionId ?? '').trim();
      const sourceEntryId = String(button.dataset.sourceEntryId ?? '').trim();
      if (!arrayKey || !professionId || !sourceEntryId) return;

      await importTechniqueSourceEntry(sheet, { arrayKey, professionId, sourceEntryId, activeElement: button });
    });
  }
}

function bindImportBaseEntryButtons(sheet, root) {
  for (const button of root.querySelectorAll('[data-action="technique-import-base-entry"]')) {
    if (button.dataset.boundTechniqueBaseImport === '1') continue;
    button.dataset.boundTechniqueBaseImport = '1';
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      const arrayKey = String(button.dataset.arrayKey ?? '').trim();
      const baseEntryId = String(button.dataset.baseEntryId ?? '').trim();
      if (!arrayKey || !baseEntryId) return;

      await importTechniqueBaseEntry(sheet, { arrayKey, baseEntryId, activeElement: button });
    });
  }
}

function bindSyncSourceEntryButtons(sheet, root) {
  for (const button of root.querySelectorAll('[data-action="technique-sync-source-entry"]')) {
    if (button.dataset.boundTechniqueSyncEntry === '1') continue;
    button.dataset.boundTechniqueSyncEntry = '1';
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      const arrayKey = String(button.dataset.arrayKey ?? '').trim();
      if (!arrayKey) return;

      const next = foundry.utils.deepClone(sheet.document.system?.[arrayKey] ?? []);
      const entryIndex = Number(button.dataset.entryIndex ?? -1);
      const entry = next[entryIndex];
      if (!entry) return;

      const selectedProfessionIds = Array.isArray(sheet.document.system?.professionIds) ? sheet.document.system.professionIds : [];
      const resolution = resolveTechniqueComponentSource(sheet.document.parent, arrayKey, entry, selectedProfessionIds);
      if (!resolution.profession || !resolution.sourceEntry) return;

      next[entryIndex] = mergeTechniqueComponentWithSource(entry, resolution.profession, resolution.sourceEntry);
      await updateBuilderDocument(sheet, { [`system.${arrayKey}`]: next }, button, { renderSheet: true });
    });
  }
}

function bindSyncSourceSectionButtons(sheet, root) {
  for (const button of root.querySelectorAll('[data-action="technique-sync-source-section"]')) {
    if (button.dataset.boundTechniqueSyncSection === '1') continue;
    button.dataset.boundTechniqueSyncSection = '1';
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      const arrayKey = String(button.dataset.arrayKey ?? '').trim();
      if (!arrayKey) return;

      const selectedProfessionIds = Array.isArray(sheet.document.system?.professionIds) ? sheet.document.system.professionIds : [];
      const next = foundry.utils.deepClone(sheet.document.system?.[arrayKey] ?? []).map((entry) => {
        const resolution = resolveTechniqueComponentSource(sheet.document.parent, arrayKey, entry, selectedProfessionIds);
        return resolution.profession && resolution.sourceEntry
          ? mergeTechniqueComponentWithSource(entry, resolution.profession, resolution.sourceEntry)
          : entry;
      });

      await updateBuilderDocument(sheet, { [`system.${arrayKey}`]: next }, button, { renderSheet: true });
    });
  }
}

function bindOpenSourceProfessionButtons(sheet, root) {
  for (const button of root.querySelectorAll('[data-action="technique-open-source-profession"]')) {
    if (button.dataset.boundTechniqueOpenSource === '1') continue;
    button.dataset.boundTechniqueOpenSource = '1';
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      const professionId = String(button.dataset.professionId ?? '').trim();
      if (!professionId) return;

      const profession = sheet.document.parent?.items?.get?.(professionId);
      profession?.sheet?.render(true);
    });
  }
}

function bindTechniqueSourceDrag(sheet, root) {
  for (const row of root.querySelectorAll('[data-technique-source-draggable="1"]')) {
    if (row.dataset.boundTechniqueDrag === '1') continue;
    row.dataset.boundTechniqueDrag = '1';
    row.setAttribute('draggable', 'true');
    row.addEventListener('dragstart', (event) => {
      const payload = buildTechniqueSourceDragPayload(sheet, row);
      if (!payload || !event.dataTransfer) return;

      row.classList.add('builder-row--dragging');
      event.dataTransfer.effectAllowed = 'copy';
      const encoded = JSON.stringify(payload);
      event.dataTransfer.setData(DRAG_MIME, encoded);
      event.dataTransfer.setData('text/plain', encoded);
    });
    row.addEventListener('dragend', () => {
      row.classList.remove('builder-row--dragging');
      clearTechniqueDropZoneState(root);
    });
  }
}

function bindTechniqueDropZones(sheet, root) {
  for (const zone of root.querySelectorAll('[data-technique-drop-array-key]')) {
    if (zone.dataset.boundTechniqueDropZone === '1') continue;
    zone.dataset.boundTechniqueDropZone = '1';

    const showState = (payload) => {
      const arrayKey = String(zone.dataset.techniqueDropArrayKey ?? '').trim();
      const isValid = payload && String(payload.arrayKey ?? '') === arrayKey;
      zone.classList.toggle('technique-drop-zone--active', Boolean(isValid));
      zone.classList.toggle('technique-drop-zone--invalid', Boolean(payload) && !isValid);
    };

    zone.addEventListener('dragenter', (event) => {
      showState(readTechniqueSourceDropPayload(event));
    });

    zone.addEventListener('dragover', (event) => {
      const payload = readTechniqueSourceDropPayload(event);
      if (!payload) return;

      event.preventDefault();
      event.dataTransfer.dropEffect = String(payload.arrayKey ?? '') === String(zone.dataset.techniqueDropArrayKey ?? '') ? 'copy' : 'none';
      showState(payload);
    });

    zone.addEventListener('dragleave', (event) => {
      if (event.currentTarget === event.target) {
        zone.classList.remove('technique-drop-zone--active', 'technique-drop-zone--invalid');
      }
    });

    zone.addEventListener('drop', async (event) => {
      zone.classList.remove('technique-drop-zone--active', 'technique-drop-zone--invalid');

      const payload = readTechniqueSourceDropPayload(event);
      if (!payload) return;

      event.preventDefault();
      await importTechniqueSourceEntry(sheet, {
        arrayKey: String(zone.dataset.techniqueDropArrayKey ?? '').trim(),
        professionId: String(payload.professionId ?? ''),
        sourceEntryId: String(payload.sourceEntryId ?? ''),
        activeElement: zone
      });
    });
  }
}

function buildTechniqueSourceDragPayload(sheet, row) {
  const arrayKey = String(row.dataset.arrayKey ?? '').trim();
  const sourceEntryId = String(row.dataset.sourceEntryId ?? '').trim();
  const professionId = String(row.dataset.professionId ?? sheet.document?.id ?? '').trim();
  if (!TECHNIQUE_SECTION_KEYS.has(arrayKey) || !professionId || !sourceEntryId) return null;

  return {
    type: 'eternamev2.technique-source-entry',
    itemId: String(sheet.document?.id ?? ''),
    actorId: String(sheet.document?.parent?.id ?? ''),
    professionId,
    arrayKey,
    sourceEntryId
  };
}

function readTechniqueSourceDropPayload(event) {
  const transfer = event.dataTransfer;
  if (!transfer) return null;

  const raw = transfer.getData(DRAG_MIME) || transfer.getData('text/plain');
  if (!raw) return null;

  try {
    const payload = JSON.parse(raw);
    return payload?.type === 'eternamev2.technique-source-entry' ? payload : null;
  } catch {
    return null;
  }
}

async function importTechniqueSourceEntry(sheet, { arrayKey, professionId, sourceEntryId, activeElement = null }) {
  const normalizedArrayKey = String(arrayKey ?? '').trim();
  const normalizedProfessionId = String(professionId ?? '').trim();
  const normalizedSourceEntryId = String(sourceEntryId ?? '').trim();
  if (!TECHNIQUE_SECTION_KEYS.has(normalizedArrayKey) || !normalizedProfessionId || !normalizedSourceEntryId) return;
  if (sheet.document.type !== 'technique') return;

  const actor = sheet.document.parent;
  if (!actor) return;

  const profession = actor.items.get(normalizedProfessionId);
  if (!profession || profession.type !== 'profession') return;

  const sourceEntry = (Array.isArray(profession.system?.[normalizedArrayKey]) ? profession.system[normalizedArrayKey] : [])
    .find((entry) => String(entry?.id ?? '') === normalizedSourceEntryId);
  if (!sourceEntry) return;

  const currentProfessionIds = Array.isArray(sheet.document.system?.professionIds)
    ? sheet.document.system.professionIds.map((value) => String(value ?? '').trim()).filter(Boolean)
    : [];

  const nextProfessionIds = [...currentProfessionIds];
  if (!nextProfessionIds.includes(normalizedProfessionId)) {
    if (nextProfessionIds.length >= 2) {
      ui.notifications?.warn(game.i18n.localize('ETERN.TECHNIQUE.DROP.MAX_PROFESSIONS'));
      return;
    }

    nextProfessionIds.push(normalizedProfessionId);
  }

  const next = foundry.utils.deepClone(sheet.document.system?.[normalizedArrayKey] ?? []);
  const hasDuplicate = next.some((entry) => (
    String(entry?.sourceProfessionId ?? '') === normalizedProfessionId
    && String(entry?.sourceEntryId ?? '') === normalizedSourceEntryId
  ));

  if (hasDuplicate) {
    ui.notifications?.info(game.i18n.localize('ETERN.TECHNIQUE.ACTION.ALREADY_ADDED'));
    return;
  }

  next.push(mergeTechniqueComponentWithSource({ id: foundry.utils.randomID() }, profession, sourceEntry));
  const changes = { [`system.${normalizedArrayKey}`]: next };
  if (nextProfessionIds.length !== currentProfessionIds.length || nextProfessionIds.some((value, index) => value !== currentProfessionIds[index])) {
    changes['system.professionIds'] = nextProfessionIds;
  }

  await updateBuilderDocument(sheet, changes, activeElement, { renderSheet: true });
}


async function importTechniqueBaseEntry(sheet, { arrayKey, baseEntryId, activeElement = null }) {
  const normalizedArrayKey = normalizeTechniqueBaseComponentSection(arrayKey);
  const normalizedBaseEntryId = String(baseEntryId ?? '').trim();
  if (!TECHNIQUE_SECTION_KEYS.has(normalizedArrayKey) || !normalizedBaseEntryId) return;
  if (!['technique', 'heritage'].includes(sheet.document?.type)) return;
  if (sheet.document.type === 'heritage' && String(sheet.document.system?.featureType ?? '') !== 'technique') return;

  const componentEntry = createTechniqueBaseComponentEntry(normalizedArrayKey, normalizedBaseEntryId);
  if (!componentEntry) return;

  const next = foundry.utils.deepClone(sheet.document.system?.[normalizedArrayKey] ?? []);
  const referenceKey = String(componentEntry.referenceKey ?? '').trim();
  const hasDuplicate = referenceKey && next.some((entry) => String(entry?.referenceKey ?? '').trim() === referenceKey);

  if (hasDuplicate) {
    ui.notifications?.info(game.i18n.localize('ETERN.TECHNIQUE.ACTION.ALREADY_ADDED'));
    return;
  }

  next.push(componentEntry);
  await updateBuilderDocument(sheet, { [`system.${normalizedArrayKey}`]: next }, activeElement, { renderSheet: true });
}

function clearTechniqueDropZoneState(root) {
  for (const zone of root.querySelectorAll('[data-technique-drop-array-key]')) {
    zone.classList.remove('technique-drop-zone--active', 'technique-drop-zone--invalid');
  }
}
