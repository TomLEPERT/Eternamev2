/**
 * Règle pure de bonus : Bonus tree.
 *
 * Responsabilités :
 * - normaliser ou agréger les bonus du système ;
 * - rester indépendante de l’interface Foundry ;
 * - fournir une API prévisible aux services d’acteurs, d’items et d’enchantements.
 *
 * Ce fichier doit rester testable sans fiche ni dialogue.
 */

import { ETERNAME_ATTRIBUTES } from '../../system/constants/attributes.js';

export function toInt(value) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

export function buildEmptyAttributeBonusMap() {
  return Object.fromEntries(Object.keys(ETERNAME_ATTRIBUTES).map((key) => [key, 0]));
}

export function buildEmptySaveBonusMap() {
  return {
    dodge: 0,
    parry: 0,
    pain: 0,
    cover: 0,
    armor: 0,
    fire: 0,
    ice: 0,
    lightning: 0,
    earth: 0,
    wind: 0,
    mental: 0,
    acid: 0,
    magic: 0
  };
}

export function mergeBonusTrees(base = {}, extra = {}) {
  const merged = {
    attributesValue: { ...buildEmptyAttributeBonusMap(), ...(base.attributesValue ?? {}) },
    attributesIndex: { ...buildEmptyAttributeBonusMap(), ...(base.attributesIndex ?? {}) },
    attributesDice: { ...buildEmptyAttributeBonusMap(), ...(base.attributesDice ?? {}) },
    hpMax: toInt(base.hpMax),
    initiative: toInt(base.initiative),
    destinyDice: toInt(base.destinyDice),
    fatigueMax: toInt(base.fatigueMax),
    explorationPassive: toInt(base.explorationPassive),
    spellSlotsMax: toInt(base.spellSlotsMax),
    psMax: toInt(base.psMax),
    power: toInt(base.power),
    combat: {
      prc: toInt(base?.combat?.prc),
      prd: toInt(base?.combat?.prd),
      prm: toInt(base?.combat?.prm),
      def: toInt(base?.combat?.def)
    },
    saves: { ...buildEmptySaveBonusMap(), ...(base.saves ?? {}) }
  };

  for (const key of Object.keys(merged.attributesValue)) {
    merged.attributesValue[key] += toInt(extra?.attributesValue?.[key]);
    merged.attributesIndex[key] += toInt(extra?.attributesIndex?.[key]);
    merged.attributesDice[key] += toInt(extra?.attributesDice?.[key]);
  }

  for (const key of ["hpMax", "initiative", "destinyDice", "fatigueMax", "explorationPassive", "spellSlotsMax", "psMax", "power"]) {
    merged[key] += toInt(extra?.[key]);
  }

  for (const key of ["prc", "prd", "prm", "def"]) merged.combat[key] += toInt(extra?.combat?.[key]);
  for (const key of Object.keys(merged.saves)) merged.saves[key] += toInt(extra?.saves?.[key]);
  return merged;
}

export function normalizeBonusTree(raw = {}) {
  return mergeBonusTrees({}, raw ?? {});
}
