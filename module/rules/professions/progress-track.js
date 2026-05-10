/**
 * Règle pure de profession : Progress track.
 *
 * Responsabilités :
 * - calculer ou collecter les effets liés aux professions ;
 * - garder la progression métier séparée de l’interface ;
 * - fournir des données normalisées aux acteurs et techniques.
 *
 * Ce fichier doit rester indépendant des feuilles Foundry.
 */

import { normalizeTrackBoxes, parseObjectivesText } from '../derived/progression.js';

export const PROFESSION_PROGRESS_BOX_COUNT = 12;

export function parseProfessionProgressObjectives(track = {}) {
  const explicitText = String(track?.objectivesText ?? '').trim();
  if (explicitText) return parseObjectivesText(explicitText);

  if (Array.isArray(track?.objectives) && track.objectives.length) {
    return sanitizeObjectives(track.objectives);
  }

  if (Array.isArray(track?.thresholds) && track.thresholds.length) {
    return sanitizeObjectives(track.thresholds.map((threshold) => threshold?.target));
  }

  return [];
}

export function normalizeProfessionProgressBoxes(value, current = 0) {
  const hasStoredBoxes = Array.isArray(value) && value.length > 0;
  const boxes = normalizeTrackBoxes(value).slice(0, PROFESSION_PROGRESS_BOX_COUNT);
  while (boxes.length < PROFESSION_PROGRESS_BOX_COUNT) boxes.push(false);

  if (!hasStoredBoxes) {
    const currentValue = clampProgressLevel(current);
    if (currentValue > 0) boxes[currentValue - 1] = true;
  }

  return boxes;
}

export function getProfessionProgressCurrent(boxes) {
  const list = normalizeProfessionProgressBoxes(boxes, 0);
  for (let index = list.length - 1; index >= 0; index -= 1) {
    if (list[index]) return index + 1;
  }
  return 0;
}

export function getProfessionProgressCompletedObjectiveCount(objectives = [], boxes = []) {
  const current = getProfessionProgressCurrent(boxes);
  return sanitizeObjectives(objectives).filter((objective) => objective <= current).length;
}

export function isProfessionProgressThresholdReached(track = {}, threshold = 0) {
  const target = clampProgressLevel(threshold);
  if (target <= 0) return false;
  const boxes = normalizeProfessionProgressBoxes(track?.boxes, track?.current);
  const current = getProfessionProgressCurrent(boxes);
  return current >= target;
}

export function buildProfessionProgressTrack(track = {}) {
  const objectives = parseProfessionProgressObjectives(track);
  const boxes = normalizeProfessionProgressBoxes(track?.boxes, track?.current);
  const current = getProfessionProgressCurrent(boxes);
  const maxObjective = objectives.length ? Math.max(...objectives) : PROFESSION_PROGRESS_BOX_COUNT;
  const objectiveSet = new Set(objectives);
  const completedObjectiveCount = getProfessionProgressCompletedObjectiveCount(objectives, boxes);
  const objectiveCount = objectives.length;

  return {
    enabled: Boolean(track?.enabled),
    label: String(track?.label ?? ''),
    current,
    max: maxObjective,
    valueLabel: `${current} / ${maxObjective}`,
    objectiveCount,
    completedObjectiveCount,
    completedObjectivesLabel: `${completedObjectiveCount} / ${objectiveCount}`,
    objectivesText: objectives.join(', '),
    objectives,
    testAttributeKey: String(track?.testAttributeKey ?? ''),
    notes: String(track?.notes ?? ''),
    boxes,
    slots: Array.from({ length: PROFESSION_PROGRESS_BOX_COUNT }, (_, index) => ({
      index,
      value: index + 1,
      checked: Boolean(boxes[index]),
      isObjective: objectiveSet.has(index + 1),
      isReachedObjective: objectiveSet.has(index + 1) && (index + 1) <= current
    }))
  };
}

export function normalizeProfessionProgressTrackData(track = {}, { enabled = Boolean(track?.enabled) } = {}) {
  const display = buildProfessionProgressTrack({ ...track, enabled });
  return {
    enabled,
    label: display.label,
    current: display.current,
    testAttributeKey: display.testAttributeKey,
    notes: display.notes,
    objectivesText: display.objectivesText,
    boxes: display.boxes,
    thresholds: Array.isArray(track?.thresholds) ? track.thresholds : []
  };
}

export function setProfessionProgressLevel(track = {}, level = 0) {
  const normalizedLevel = clampProgressLevel(level);
  const boxes = Array.from({ length: PROFESSION_PROGRESS_BOX_COUNT }, (_, index) => index + 1 === normalizedLevel);
  return normalizeProfessionProgressTrackData({
    ...track,
    boxes,
    current: normalizedLevel
  }, { enabled: true });
}

export function toggleProfessionProgressBox(track = {}, boxIndex = 0) {
  const normalizedIndex = Math.floor(Number(boxIndex ?? -1));
  if (!Number.isInteger(normalizedIndex) || normalizedIndex < 0 || normalizedIndex >= PROFESSION_PROGRESS_BOX_COUNT) {
    return normalizeProfessionProgressTrackData(track, { enabled: true });
  }

  const boxes = normalizeProfessionProgressBoxes(track?.boxes, track?.current);
  boxes[normalizedIndex] = !boxes[normalizedIndex];

  return normalizeProfessionProgressTrackData({
    ...track,
    boxes,
    current: getProfessionProgressCurrent(boxes)
  }, { enabled: true });
}

function sanitizeObjectives(values) {
  return Array.from(new Set((Array.isArray(values) ? values : [])
    .map((entry) => Number(entry))
    .filter((entry) => Number.isInteger(entry) && entry >= 1 && entry <= PROFESSION_PROGRESS_BOX_COUNT)))
    .sort((a, b) => a - b);
}

function clampProgressLevel(value) {
  const number = Math.floor(Number(value ?? 0) || 0);
  return Math.max(0, Math.min(PROFESSION_PROGRESS_BOX_COUNT, number));
}
