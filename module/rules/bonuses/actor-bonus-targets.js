/**
 * Règle pure de bonus : Actor bonus targets.
 *
 * Responsabilités :
 * - normaliser ou agréger les bonus du système ;
 * - rester indépendante de l’interface Foundry ;
 * - fournir une API prévisible aux services d’acteurs, d’items et d’enchantements.
 *
 * Ce fichier doit rester testable sans fiche ni dialogue.
 */

import { toInt } from './bonus-tree.js';

export function applyActorBonusTarget(tree, targetKey, rawValue) {
  const value = toInt(rawValue);
  if (!value) return false;

  const normalizedTarget = String(targetKey ?? '').trim();

  if (normalizedTarget.startsWith('attributesValue.')) {
    const key = normalizedTarget.slice('attributesValue.'.length);
    if (key in tree.attributesValue) {
      tree.attributesValue[key] += value;
      return true;
    }
    return false;
  }

  if (normalizedTarget.startsWith('attributesIndex.')) {
    const key = normalizedTarget.slice('attributesIndex.'.length);
    if (key in tree.attributesIndex) {
      tree.attributesIndex[key] += value;
      return true;
    }
    return false;
  }

  if (normalizedTarget.startsWith('attributesDice.')) {
    const key = normalizedTarget.slice('attributesDice.'.length);
    if (key in tree.attributesDice) {
      tree.attributesDice[key] += value;
      return true;
    }
    return false;
  }

  if (normalizedTarget.startsWith('combat.')) {
    const key = normalizedTarget.slice('combat.'.length);
    if (key in tree.combat) {
      tree.combat[key] += value;
      return true;
    }
    return false;
  }

  if (normalizedTarget.startsWith('saves.')) {
    const key = normalizedTarget.slice('saves.'.length);
    if (key in tree.saves) {
      tree.saves[key] += value;
      return true;
    }
    return false;
  }

  if (normalizedTarget in tree) {
    tree[normalizedTarget] += value;
    return true;
  }

  return false;
}
