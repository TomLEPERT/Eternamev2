/**
 * Règle pure de profession : Actor bonuses.
 *
 * Responsabilités :
 * - calculer ou collecter les effets liés aux professions ;
 * - garder la progression métier séparée de l’interface ;
 * - fournir des données normalisées aux acteurs et techniques.
 *
 * Ce fichier doit rester indépendant des feuilles Foundry.
 */

import { normalizeBonusTree } from '../bonuses/bonus-tree.js';
import { applyActorBonusTarget } from '../bonuses/actor-bonus-targets.js';
import { isSupportedEnchantmentActorTarget } from '../../system/enchantments/supported-targets.js';
import { isProfessionProgressThresholdReached } from './progress-track.js';

const PROFESSION_ENTRY_SECTIONS = ['passives', 'keys', 'conditions', 'mechanics', 'states'];

function getSelectedProfessionIds(actor) {
  return new Set([
    String(actor?.system?.techniques?.professionSlots?.first ?? '').trim(),
    String(actor?.system?.techniques?.professionSlots?.second ?? '').trim()
  ].filter(Boolean));
}

function applyProfessionPassiveBonuses(tree, profession) {
  const passives = Array.isArray(profession?.system?.passives) ? profession.system.passives : [];

  for (const passive of passives) {
    if (!Boolean(passive?.isActive)) continue;
    if (!Boolean(passive?.hasActorBonuses)) continue;
    applyBonusEntries(tree, passive?.actorBonuses);
  }
}

function applyProfessionProgressRewards(tree, profession) {
  for (const sectionKey of PROFESSION_ENTRY_SECTIONS) {
    const entries = Array.isArray(profession?.system?.[sectionKey]) ? profession.system[sectionKey] : [];
    for (const entry of entries) {
      if (sectionKey === 'passives' && !Boolean(entry?.isActive)) continue;
      if (!Boolean(entry?.hasProgressRewards)) continue;
      if (!Boolean(entry?.hasProgressTrack)) continue;

      const rewards = Array.isArray(entry?.progressRewards) ? entry.progressRewards : [];
      for (const reward of rewards) {
        if (!isProfessionProgressThresholdReached(entry?.progressTrack, reward?.threshold)) continue;
        applyBonusEntry(tree, reward);
      }
    }
  }
}

function applyBonusEntries(tree, bonuses) {
  for (const bonus of Array.isArray(bonuses) ? bonuses : []) {
    applyBonusEntry(tree, bonus);
  }
}

function applyBonusEntry(tree, bonus) {
  const targetKey = String(bonus?.targetKey ?? '').trim();
  if (!isSupportedEnchantmentActorTarget(targetKey)) return;
  applyActorBonusTarget(tree, targetKey, bonus?.value);
}

export function collectProfessionActorBonuses(actor) {
  const result = normalizeBonusTree({});
  const selectedIds = getSelectedProfessionIds(actor);
  if (!selectedIds.size) return result;

  for (const item of actor?.items?.contents ?? []) {
    if (item?.type !== 'profession') continue;
    if (!selectedIds.has(String(item.id ?? ''))) continue;
    applyProfessionPassiveBonuses(result, item);
    applyProfessionProgressRewards(result, item);
  }

  return normalizeBonusTree(result);
}
