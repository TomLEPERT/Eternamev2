/**
 * Règle pure d’héritage : Actor bonuses.
 *
 * Responsabilités :
 * - collecter les effets accordés par les héritages ;
 * - transformer les données d’items en bonus acteur normalisés ;
 * - éviter toute dépendance directe au rendu de fiche.
 *
 * Ce fichier doit rester un service de règles pur.
 */

import { normalizeBonusTree } from '../bonuses/bonus-tree.js';
import { applyActorBonusTarget } from '../bonuses/actor-bonus-targets.js';
import { isSupportedEnchantmentActorTarget } from '../../system/enchantments/supported-targets.js';
import { normalizeHeritageFeatureType } from '../../system/constants/heritages.js';
import { isProfessionProgressThresholdReached } from '../professions/progress-track.js';

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

function applyHeritagePassiveBonuses(tree, heritage) {
  const passives = Array.isArray(heritage?.system?.passives) ? heritage.system.passives : [];
  const shouldEnableLegacySinglePassive = shouldTreatSinglePassiveAsActive(passives);

  for (const passive of passives) {
    if (!isHeritagePassiveEntryEnabled(passive, shouldEnableLegacySinglePassive)) continue;
    if (!Boolean(passive?.hasActorBonuses)) continue;
    applyBonusEntries(tree, passive?.actorBonuses);
  }
}

function applyHeritageProgressRewards(tree, heritage) {
  const passives = Array.isArray(heritage?.system?.passives) ? heritage.system.passives : [];
  const shouldEnableLegacySinglePassive = shouldTreatSinglePassiveAsActive(passives);

  for (const passive of passives) {
    if (!isHeritagePassiveEntryEnabled(passive, shouldEnableLegacySinglePassive)) continue;
    if (!Boolean(passive?.hasProgressRewards)) continue;
    if (!Boolean(passive?.hasProgressTrack)) continue;

    const rewards = Array.isArray(passive?.progressRewards) ? passive.progressRewards : [];
    for (const reward of rewards) {
      if (!isProfessionProgressThresholdReached(passive?.progressTrack, reward?.threshold)) continue;
      applyBonusEntry(tree, reward);
    }
  }
}

function shouldTreatSinglePassiveAsActive(passives) {
  return passives.length === 1 && !Boolean(passives[0]?.isActive);
}

function isHeritagePassiveEntryEnabled(passive, shouldEnableLegacySinglePassive = false) {
  return Boolean(passive?.isActive) || Boolean(shouldEnableLegacySinglePassive);
}

export function collectHeritageActorBonuses(actor) {
  const result = normalizeBonusTree({});

  for (const item of actor?.items?.contents ?? []) {
    if (item?.type !== 'heritage') continue;
    if (normalizeHeritageFeatureType(item.system?.featureType) !== 'passive') continue;
    if (!Boolean(item.system?.active)) continue;

    applyHeritagePassiveBonuses(result, item);
    applyHeritageProgressRewards(result, item);
  }

  return normalizeBonusTree(result);
}
