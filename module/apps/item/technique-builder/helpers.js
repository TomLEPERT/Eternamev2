/**
 * Sous-module du constructeur de technique : Helpers.
 *
 * Responsabilités :
 * - gérer une famille d’actions du builder de technique ;
 * - normaliser les petites mutations de formulaire côté fiche ;
 * - laisser le calcul XP, les résumés et la validation aux services de technique.
 *
 * Ce fichier doit rester un contrôleur UI ciblé.
 */

export function createBuilderEntry({ withActive = false, active = false } = {}) {
  return {
    id: foundry.utils.randomID(),
    name: '',
    description: '',
    xpCost: 0,
    referenceKey: '',
    stateId: '',
    extraStatisticSlots: 0,
    isQuickAccess: false,
    hasStatisticSlots: false,
    statisticSlots: [],
    hasStatistics: false,
    statistics: [],
    counter: {
      enabled: false,
      label: '',
      current: 0,
      max: 0,
      resetNote: ''
    },
    hasImprovements: false,
    improvements: [],
    hasActorBonuses: false,
    actorBonuses: [],
    hasProgressTrack: false,
    progressTrack: {
      enabled: false,
      label: '',
      current: 0,
      testAttributeKey: '',
      notes: '',
      objectivesText: '',
      boxes: [],
      thresholds: []
    },
    hasProgressRewards: false,
    progressRewards: [],
    ...(withActive ? { isActive: Boolean(active) } : {})
  };
}

export function getInputValue(field) {
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

export async function updateBuilderDocument(sheet, changes, activeElement = null, { renderSheet = true, renderParentActor = true } = {}) {
  if (!sheet?.document || !changes || !Object.keys(changes).length) return;

  if (typeof sheet._updateItemDocument === 'function') {
    await sheet._updateItemDocument(changes, activeElement, { renderSheet, renderParentActor });
    return;
  }

  await sheet.document.update(changes);
}

export async function updateArrayEntryCollection(sheet, element, mutate, options = {}) {
  const arrayKey = String(element.dataset.arrayKey ?? '').trim();
  const entryIndex = Number(element.dataset.entryIndex ?? -1);
  if (!arrayKey || entryIndex < 0) return;

  const next = foundry.utils.deepClone(sheet.document.system?.[arrayKey] ?? []);
  if (!next[entryIndex]) return;

  mutate(next, entryIndex);
  await updateBuilderDocument(sheet, { [`system.${arrayKey}`]: next }, element, options);
}
