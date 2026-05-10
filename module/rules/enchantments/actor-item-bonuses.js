/**
 * Règle pure d’enchantement : Actor item bonuses.
 *
 * Responsabilités :
 * - extraire ou appliquer les effets de règle liés aux enchantements ;
 * - rester indépendante des dialogues et fiches ;
 * - produire des structures simples consommables par les acteurs et items.
 *
 * Ce fichier doit rester sans logique DOM.
 */

import { normalizeBonusTree } from '../bonuses/bonus-tree.js';
import { applyActorBonusTarget } from '../bonuses/actor-bonus-targets.js';
import { isEnchantableItemType } from '../../system/enchantments/constants.js';
import { isSupportedEnchantmentActorTarget } from '../../system/enchantments/supported-targets.js';

function buildEnchantingCollectionResult() {
  return {
    actorBonuses: normalizeBonusTree({})
  };
}

export function collectEnchantingEffects(actor) {
  const result = buildEnchantingCollectionResult();

  for (const item of actor.items.contents) {
    if (!isEnchantableItemType(item?.type)) continue;
    if (!Boolean(item.system?.equipped)) continue;

    const entries = Array.isArray(item.system?.enchanting?.entries) ? item.system.enchanting.entries : [];
    for (const entry of entries) {
      for (const bonus of Array.isArray(entry?.actorBonuses) ? entry.actorBonuses : []) {
        const targetKey = String(bonus?.targetKey ?? '').trim();
        if (!isSupportedEnchantmentActorTarget(targetKey)) continue;
        applyActorBonusTarget(result.actorBonuses, targetKey, bonus?.value);
      }
    }
  }

  result.actorBonuses = normalizeBonusTree(result.actorBonuses);
  return result;
}

export function collectEnchantingActorBonuses(actor) {
  return collectEnchantingEffects(actor).actorBonuses;
}
