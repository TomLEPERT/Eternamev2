/**
 * Extension de fiche acteur : Actor sheet context attacks.
 *
 * Responsabilités :
 * - ajouter à l’ActorSheetV2 les comportements propres à cette section ;
 * - lire ou mettre à jour uniquement les champs nécessaires à l’interface ;
 * - conserver les calculs de règles dans les modules `rules` ou `system`.
 *
 * Ce fichier doit rester un module UI spécialisé et ne pas devenir un service métier.
 */

import { WEAPON_TAG_LABELS } from '../../system/constants/weapons.js';
import { localizeDamageType, localizeRange } from '../../system/nomenclature.js';

export function buildCharacterAttackContext(actor) {
  const invocationDamageSuffix = getInvocationDamageLabelSuffix(actor);

  const manualAttacks = (actor.system?.attacks ?? []).map((attack, index) => ({
    id: attack.id ?? String(index),
    name: String(attack.name ?? ''),
    range: localizeRange(attack.range ?? 'melee'),
    damage: `${String(attack.damage ?? '1d6')}${invocationDamageSuffix}`,
    type: localizeDamageType(attack.type ?? attack.damageType ?? ''),
    attackIndex: index,
    isManual: true,
    editable: true
  }));

  const weaponAttacks = actor.items.contents
    .filter((item) => item.type === 'weapon')
    .map((item) => ({
      id: item.id,
      itemId: item.id,
      name: item.name,
      range: localizeRange(item.system?.range ?? 'melee'),
      damage: `${String(item.system?.damage ?? '')}${invocationDamageSuffix}`,
      type: localizeDamageType(item.system?.damageType ?? ''),
      precisionBase: String(item.system?.precisionBase ?? 'PRC').toUpperCase(),
      precisionBonus: Number(item.system?.precisionBonus ?? 0) || 0,
      attackIndex: -1,
      isManual: false,
      isWeapon: true,
      editable: false,
      equipped: Boolean(item.system?.equipped),
      tags: (Array.isArray(item.system?.tags) ? item.system.tags : []).map((tag) => game.i18n.localize(WEAPON_TAG_LABELS[tag] ?? tag))
    }));

  return {
    attackRows: [...weaponAttacks, ...manualAttacks]
  };
}

function getInvocationDamageLabelSuffix(actor) {
  if (String(actor?.type ?? '') !== 'invocation') return '';
  const bonus = Math.max(0, Math.floor(Number(actor?.system?.invocation?.generatedBonuses?.damageDiceBonus ?? 0) || 0));
  return bonus > 0 ? ` + ${bonus}d6` : '';
}
