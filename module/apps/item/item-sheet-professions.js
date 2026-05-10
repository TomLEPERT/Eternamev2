/**
 * Extension de fiche item : Item sheet professions.
 *
 * Responsabilités :
 * - préparer ou synchroniser la section correspondante de l’ItemSheetV2 ;
 * - gérer les actions utilisateur liées à l’item affiché ;
 * - éviter de mélanger rendu, règles et persistance dans un même bloc.
 *
 * Ce fichier doit rester spécialisé par section de fiche item.
 */

import { getTechniqueModuleStateDefinition } from '../../system/techniques/module-entry-config.js';
import { updateBuilderDocument } from './technique-builder/helpers.js';
import { buildTechniqueModuleCanonicalStateReferenceKey, normalizeTechniqueModuleReferenceKey } from '../../system/techniques/module-reference-service.js';
import { normalizeProfessionProgressTrackData, parseProfessionProgressObjectives, toggleProfessionProgressBox } from '../../rules/professions/progress-track.js';
import { normalizeHeritageFeatureType } from '../../system/constants/heritages.js';

export function bindProfessionBuilderListeners(sheet, root) {
  const isProfession = sheet.document.type === 'profession';
  const isPassiveHeritage = sheet.document.type === 'heritage' && normalizeHeritageFeatureType(sheet.document.system?.featureType) === 'passive';
  if ((!isProfession && !isPassiveHeritage) || !root) return;
  bindProfessionEntryPathFields(sheet, root);
  bindProfessionArrayActions(sheet, root);
  bindProfessionProgressBoxes(sheet, root);
  bindProfessionImprovementRankButtons(sheet, root);
  bindProfessionStatePresetFields(sheet, root);
  bindProfessionReferenceActions(sheet, root);
  bindProfessionStateActions(sheet, root);
}

function bindProfessionEntryPathFields(sheet, root) {
  for (const field of root.querySelectorAll('[data-builder-path]')) {
    if (field.dataset.boundBuilderPath === '1') continue;
    field.dataset.boundBuilderPath = '1';
    const handler = async () => {
      const arrayKey = String(field.dataset.arrayKey ?? '').trim();
      const entryIndex = Number(field.dataset.entryIndex ?? -1);
      const path = String(field.dataset.builderPath ?? '').trim();
      if (!arrayKey || entryIndex < 0 || !path) return;
      const next = foundry.utils.deepClone(sheet.document.system?.[arrayKey] ?? []);
      const entry = next[entryIndex];
      if (!entry) return;
      const value = getInputValue(field);
      foundry.utils.setProperty(entry, path, value);
      applyProfessionCapabilityToggle(entry, path, value);
      if (path.startsWith('progressTrack.')) {
        entry.progressTrack = normalizeProfessionProgressTrackData(entry.progressTrack, { enabled: Boolean(entry.hasProgressTrack) });
      }
      await updateBuilderDocument(sheet, { [`system.${arrayKey}`]: next }, field, { renderSheet: true });
    };
    field.addEventListener('change', handler);
    if (!(field instanceof HTMLInputElement) || field.type !== 'checkbox') field.addEventListener('blur', handler);
  }
}

function bindProfessionArrayActions(sheet, root) {
  for (const button of root.querySelectorAll('[data-profession-array-action]')) {
    if (button.dataset.boundProfessionArrayAction === '1') continue;
    button.dataset.boundProfessionArrayAction = '1';
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      const arrayKey = String(button.dataset.arrayKey ?? '').trim();
      const entryIndex = Number(button.dataset.entryIndex ?? -1);
      const collectionPath = String(button.dataset.collectionPath ?? '').trim();
      const action = String(button.dataset.professionArrayAction ?? '').trim();
      if (!arrayKey || entryIndex < 0 || !collectionPath || !action) return;
      const next = foundry.utils.deepClone(sheet.document.system?.[arrayKey] ?? []);
      const entry = next[entryIndex];
      if (!entry) return;
      const collection = foundry.utils.getProperty(entry, collectionPath);
      if (!Array.isArray(collection)) return;

      if (action === 'add') {
        collection.push(createCollectionEntry(button.dataset.collectionType ?? 'slot', entry));
      } else if (action === 'remove') {
        const rowIndex = Number(button.dataset.collectionIndex ?? -1);
        if (rowIndex < 0 || rowIndex >= collection.length) return;
        collection.splice(rowIndex, 1);
      }

      await updateBuilderDocument(sheet, { [`system.${arrayKey}`]: next }, button, { renderSheet: true });
    });
  }
}

function bindProfessionProgressBoxes(sheet, root) {
  for (const button of root.querySelectorAll('[data-profession-progress-box]')) {
    if (button.dataset.boundProfessionProgressBox === '1') continue;
    button.dataset.boundProfessionProgressBox = '1';
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      const arrayKey = String(button.dataset.arrayKey ?? '').trim();
      const entryIndex = Number(button.dataset.entryIndex ?? -1);
      const boxIndex = Number(button.dataset.boxIndex ?? -1);
      if (!arrayKey || entryIndex < 0 || boxIndex < 0) return;
      const next = foundry.utils.deepClone(sheet.document.system?.[arrayKey] ?? []);
      const entry = next[entryIndex];
      if (!entry?.hasProgressTrack) return;
      entry.progressTrack = toggleProfessionProgressBox(entry.progressTrack, boxIndex);
      await updateBuilderDocument(sheet, { [`system.${arrayKey}`]: next }, button, { renderSheet: true });
    });
  }
}

function bindProfessionImprovementRankButtons(sheet, root) {
  for (const button of root.querySelectorAll('[data-profession-improvement-rank]')) {
    if (button.dataset.boundProfessionImprovementRank === '1') continue;
    button.dataset.boundProfessionImprovementRank = '1';
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      const arrayKey = String(button.dataset.arrayKey ?? '').trim();
      const entryIndex = Number(button.dataset.entryIndex ?? -1);
      const improvementIndex = Number(button.dataset.improvementIndex ?? -1);
      const delta = Number(button.dataset.delta ?? 0);
      if (!arrayKey || entryIndex < 0 || improvementIndex < 0 || !delta) return;
      const next = foundry.utils.deepClone(sheet.document.system?.[arrayKey] ?? []);
      const improvement = next?.[entryIndex]?.improvements?.[improvementIndex];
      if (!improvement) return;
      improvement.rank = Math.max(0, Math.floor(Number(improvement.rank ?? 0) || 0) + delta);
      await updateBuilderDocument(sheet, { [`system.${arrayKey}`]: next }, button, { renderSheet: true });
    });
  }
}

function bindProfessionStatePresetFields(sheet, root) {
  for (const field of root.querySelectorAll('[data-builder-state-id]')) {
    if (field.dataset.boundBuilderStateId === '1') continue;
    field.dataset.boundBuilderStateId = '1';
    field.addEventListener('change', async () => {
      const arrayKey = String(field.dataset.arrayKey ?? '').trim();
      const entryIndex = Number(field.dataset.entryIndex ?? -1);
      if (!arrayKey || entryIndex < 0) return;
      const next = foundry.utils.deepClone(sheet.document.system?.[arrayKey] ?? []);
      const entry = next[entryIndex];
      if (!entry) return;
      const stateId = String(field.value ?? '').trim();
      entry.stateId = stateId;
      if (stateId) {
        applyStatePresetToEntry(entry, stateId);
      } else if (String(entry.referenceKey ?? '').trim().startsWith('state.')) {
        entry.referenceKey = normalizeTechniqueModuleReferenceKey('', { sectionKey: arrayKey, name: entry.name ?? '', stateId: '' });
      }
      await updateBuilderDocument(sheet, { [`system.${arrayKey}`]: next }, field, { renderSheet: true });
    });
  }
}


function applyProfessionCapabilityToggle(entry, path, value) {
  if (!(value === true || value === false)) return;

  switch (String(path ?? '')) {
    case 'hasStatisticSlots':
      entry.statisticSlots = value ? ensureCollection(entry.statisticSlots, 'slot') : [];
      if (!value) entry.extraStatisticSlots = 0;
      break;
    case 'hasStatistics':
      entry.statistics = value ? ensureCollection(entry.statistics, 'statistic') : [];
      break;
    case 'counter.enabled':
      entry.counter ??= {};
      entry.counter.enabled = value;
      if (!value) {
        entry.counter.label = '';
        entry.counter.current = 0;
        entry.counter.max = 0;
        entry.counter.resetNote = '';
      }
      break;
    case 'hasImprovements':
      entry.improvements = value ? ensureCollection(entry.improvements, 'improvement') : [];
      break;
    case 'hasActorBonuses':
      entry.actorBonuses = value ? ensureCollection(entry.actorBonuses, 'actor-bonus') : [];
      break;
    case 'hasProgressTrack':
      entry.progressTrack = value
        ? normalizeProgressTrack(entry.progressTrack, { enabled: true })
        : normalizeProgressTrack({}, { enabled: false });
      break;
    case 'hasProgressRewards':
      entry.progressRewards = value ? ensureCollection(entry.progressRewards, 'progress-reward') : [];
      break;
    default:
      break;
  }
}

function ensureCollection(collection, collectionType) {
  return Array.isArray(collection) && collection.length
    ? collection
    : [createCollectionEntry(collectionType)];
}

function normalizeProgressTrack(track, { enabled }) {
  return normalizeProfessionProgressTrackData(track, { enabled });
}

function createCollectionEntry(collectionType, entry = {}) {
  switch (String(collectionType ?? '')) {
    case 'statistic':
      return { id: foundry.utils.randomID(), statId: 'damage' };
    case 'improvement':
      return { id: foundry.utils.randomID(), label: '', xpStep: 1, rank: 0, notes: '' };
    case 'actor-bonus':
      return { id: foundry.utils.randomID(), targetKey: '', value: 0, notes: '' };
    case 'progress-threshold':
      return { id: foundry.utils.randomID(), target: 0, label: '', notes: '' };
    case 'progress-reward':
      return { id: foundry.utils.randomID(), threshold: getNextProgressRewardThreshold(entry), targetKey: '', value: 0, notes: '' };
    case 'slot':
    default:
      return { id: foundry.utils.randomID(), slotType: 'free', count: 1 };
  }
}


function getNextProgressRewardThreshold(entry = {}) {
  const objectives = parseProfessionProgressObjectives(entry?.progressTrack);
  const used = new Set((Array.isArray(entry?.progressRewards) ? entry.progressRewards : [])
    .map((reward) => Math.floor(Number(reward?.threshold ?? 0) || 0))
    .filter((threshold) => threshold > 0));

  const nextObjective = objectives.find((objective) => !used.has(objective));
  if (nextObjective) return nextObjective;

  const highestUsed = used.size ? Math.max(...used) : 0;
  return Math.max(1, Math.min(12, highestUsed + 1));
}

function getInputValue(field) {
  if (field instanceof HTMLInputElement) {
    if (field.type === 'checkbox') return field.checked;
    if (field.type === 'number') {
      const value = Number(field.value ?? 0);
      return Number.isFinite(value) ? value : 0;
    }
    return field.value ?? '';
  }

  if (field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) {
    return field.value ?? '';
  }

  return '';
}

function bindProfessionReferenceActions(sheet, root) {
  for (const button of root.querySelectorAll('[data-profession-reference-action]')) {
    if (button.dataset.boundProfessionReferenceAction === '1') continue;
    button.dataset.boundProfessionReferenceAction = '1';
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      const arrayKey = String(button.dataset.arrayKey ?? '').trim();
      const entryIndex = Number(button.dataset.entryIndex ?? -1);
      if (!arrayKey || entryIndex < 0) return;
      const next = foundry.utils.deepClone(sheet.document.system?.[arrayKey] ?? []);
      const entry = next[entryIndex];
      if (!entry) return;
      entry.referenceKey = normalizeTechniqueModuleReferenceKey('', { sectionKey: arrayKey, name: entry.name ?? '', stateId: entry.stateId ?? '' });
      await updateBuilderDocument(sheet, { [`system.${arrayKey}`]: next }, button, { renderSheet: true });
    });
  }
}

function bindProfessionStateActions(sheet, root) {
  for (const button of root.querySelectorAll('[data-profession-state-action="sync"]')) {
    if (button.dataset.boundProfessionStateAction === '1') continue;
    button.dataset.boundProfessionStateAction = '1';
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      const arrayKey = String(button.dataset.arrayKey ?? '').trim();
      const entryIndex = Number(button.dataset.entryIndex ?? -1);
      if (!arrayKey || entryIndex < 0) return;
      const next = foundry.utils.deepClone(sheet.document.system?.[arrayKey] ?? []);
      const entry = next[entryIndex];
      if (!entry) return;
      const stateId = String(entry.stateId ?? '').trim();
      if (!stateId) return;
      applyStatePresetToEntry(entry, stateId);
      await updateBuilderDocument(sheet, { [`system.${arrayKey}`]: next }, button, { renderSheet: true });
    });
  }
}

function applyStatePresetToEntry(entry, stateId) {
  const definition = getTechniqueModuleStateDefinition(stateId);
  if (!definition) return;
  entry.stateId = stateId;
  entry.name = game.i18n.localize(definition.nameKey);
  entry.description = game.i18n.localize(definition.descriptionKey);
  entry.referenceKey = buildTechniqueModuleCanonicalStateReferenceKey(stateId);
}
