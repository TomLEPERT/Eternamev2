/**
 * Service système d’acteur : Character defaults.
 *
 * Responsabilités :
 * - préparer ou normaliser les données acteur du système Etername ;
 * - composer les règles pures issues de `module/rules` ;
 * - séparer les données source des données calculées placées dans `system.derived`.
 *
 * Ce fichier doit rester un service métier et ne pas gérer le DOM.
 */

import { buildEmptyAttributeBonusMap, buildEmptySaveBonusMap } from '../../rules/bonuses/bonus-tree.js';

export function initializeCharacterSystemData(system, actorType = 'character') {
  system.resources ??= {};
  system.resources.hp ??= { value: 0, max: 0 };
  system.resources.destiny ??= { value: 0 };
  system.resources.fatigue ??= { value: 0 };
  system.defense ??= { armor: 0, shield: 0, bonus: 0 };
  system.armorTraining ??= { light: false, medium: false, heavy: false };
  system.attacks ??= [];
  system.saves ??= {};
  system.progressTracks ??= [];
  system.accustomance ??= { name: '', objectives: [], boxes: Array(12).fill(false) };
  system.accustomanceDisabled ??= 11;
  system.movement ??= { base: 0, modes: [] };
  system.inventory ??= { notes: '' };
  system.techniques ??= { professionSlots: { first: '', second: '' } };
  system.techniques.professionSlots ??= { first: '', second: '' };

  if (actorType === 'invocation') {
    system.invocation ??= {
      sourceActorId: '',
      profileItemId: '',
      sourceTechniqueId: '',
      sourceInvocationSize: 'medium',
      generatedFromPower: 0,
      generatedBonuses: { damageDiceBonus: 0, magicTypes: [], appliedPowerBoons: [] }
    };
    system.invocation.generatedBonuses ??= { damageDiceBonus: 0, magicTypes: [], appliedPowerBoons: [] };
  }

  system.wealth ??= { pp: 0, rc: 0, po: 0, pa: 0, pc: 0, lifeStyle: '' };
  system.stateResistance ??= { attr: 'robustness' };
  system.states ??= {};
  system.bonuses ??= {
    attributesValue: buildEmptyAttributeBonusMap(),
    attributesIndex: buildEmptyAttributeBonusMap(),
    attributesDice: buildEmptyAttributeBonusMap(),
    hpMax: 0,
    initiative: 0,
    destinyDice: 0,
    fatigueMax: 0,
    explorationPassive: 0,
    spellSlotsMax: 0,
    psMax: 0,
    power: 0,
    combat: { prc: 0, prd: 0, prm: 0, def: 0 },
    saves: buildEmptySaveBonusMap()
  };
}
