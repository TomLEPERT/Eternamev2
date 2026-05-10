/**
 * Règle pure de donnée dérivée : Resources.
 *
 * Responsabilités :
 * - calculer une valeur de jeu à partir des données source ;
 * - éviter toute écriture directe dans les documents Foundry ;
 * - rester réutilisable par les fiches, jets et préparateurs de données.
 *
 * Ce fichier ne doit pas contenir de rendu ni de persistance.
 */

export const PROGRESSION_BOX_COUNT = 12;

export function normalizeProgressionBoxes(boxes, size = PROGRESSION_BOX_COUNT) {
  const source = Array.isArray(boxes) ? boxes : [];
  const normalized = Array.from({ length: size }, (_, index) => Boolean(source[index]));
  return normalized;
}

export function robustnessToHpMax(robustness) {
  const r = Number(robustness ?? 0);
  if (!Number.isFinite(r) || r <= 0) return 0;
  if (r <= 2) return 1;
  if (r <= 4) return 2;
  if (r <= 6) return 3;
  if (r <= 9) return 4;
  if (r <= 12) return 5;
  if (r <= 16) return 6;
  return 7;
}

export function deriveHpMax(attributes) {
  return robustnessToHpMax(attributes?.robustness?.value);
}

export function deriveHpUsableSlots(hpMax, severeWounds, size = PROGRESSION_BOX_COUNT) {
  const safeMax = Math.max(0, Math.min(size, Number(hpMax ?? 0) || 0));
  const safeWounds = Math.max(0, Math.min(4, Number(severeWounds ?? 0) || 0));
  const woundLimit = Math.max(0, size - (safeWounds * 3));
  return Math.max(0, Math.min(safeMax, woundLimit));
}

export function deriveHpState(attributes, hp = {}) {
  const max = deriveHpMax(attributes);
  const severeWounds = Math.max(0, Math.min(4, Number(hp?.severeWounds ?? 0) || 0));
  const boxes = normalizeProgressionBoxes(hp?.boxes);
  const usableSlots = deriveHpUsableSlots(max, severeWounds);
  const woundDisabledFrom = Math.max(0, PROGRESSION_BOX_COUNT - (severeWounds * 3));

  const sanitizedBoxes = boxes.map((checked, index) => (index < usableSlots ? Boolean(checked) : false));
  const current = sanitizedBoxes.slice(0, usableSlots).filter(Boolean).length;

  const slots = sanitizedBoxes.map((checked, index) => {
    const disabledByMax = index >= max;
    const disabledByWound = index >= woundDisabledFrom;
    const disabled = index >= usableSlots;
    return {
      index,
      checked,
      disabled,
      disabledByMax,
      disabledByWound
    };
  });

  return {
    max,
    current,
    severeWounds,
    usableSlots,
    woundDisabledFrom,
    boxes: sanitizedBoxes,
    slots
  };
}

export function deriveDestinyDiceBase(attributes) {
  const chance = Number(attributes?.chance?.value ?? 0);
  const base = 1 + Math.floor(Number.isFinite(chance) ? chance / 2 : 0);
  return Math.max(0, base);
}

export function deriveFatigueMax(attributes) {
  const robustness = Number(attributes?.robustness?.value ?? 0);
  return 15 + (Number.isFinite(robustness) ? Math.floor(robustness) * 2 : 0);
}

export function clampResourceValue(value, max, fallback = 0) {
  const resolvedMax = Number(max ?? 0);
  const resolvedFallback = Number(fallback ?? 0);
  let current = Number(value ?? resolvedFallback);

  if (!Number.isFinite(current)) current = resolvedFallback;
  if (!Number.isFinite(resolvedMax)) return Math.max(0, current);
  return Math.max(0, Math.min(current, resolvedMax));
}


export function normalizeProgressionTrack(track, size = PROGRESSION_BOX_COUNT) {
  return {
    name: String(track?.name ?? ""),
    objectives: Array.isArray(track?.objectives) ? track.objectives.map((v) => String(v ?? "")) : [],
    boxes: normalizeProgressionBoxes(track?.boxes, size)
  };
}


export function deriveAccustomanceState(track = {}, disabled = 0, size = PROGRESSION_BOX_COUNT) {
  const safeTrack = normalizeProgressionTrack(track, size);
  const safeDisabled = Math.max(0, Math.min(Math.max(0, size - 1), Number(disabled ?? 0) || 0));
  const usableSlots = Math.max(1, size - safeDisabled);

  const boxes = safeTrack.boxes.map((checked, index) => (index < usableSlots ? Boolean(checked) : false));
  const slots = boxes.map((checked, index) => ({
    index,
    checked,
    disabled: index >= usableSlots
  }));

  return {
    ...safeTrack,
    disabled: safeDisabled,
    usableSlots,
    unlocked: usableSlots,
    boxes,
    slots,
    current: boxes.slice(0, usableSlots).filter(Boolean).length
  };
}
