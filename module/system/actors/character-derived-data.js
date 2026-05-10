/**
 * Service système d’acteur : Character derived data.
 *
 * Responsabilités :
 * - préparer ou normaliser les données acteur du système Etername ;
 * - composer les règles pures issues de `module/rules` ;
 * - séparer les données source des données calculées placées dans `system.derived`.
 *
 * Ce fichier doit rester un service métier et ne pas gérer le DOM.
 */

import { valueToIndex, indexStringToTarget, targetToIndexString } from '../../rules/derived/attributes.js';
import { deriveAttackBases, deriveInitiative } from '../../rules/derived/combat.js';
import { deriveExplorationPassive, deriveDefense, deriveArmorTraining } from '../../rules/derived/defense.js';
import {
  deriveHpState,
  deriveDestinyDiceBase,
  deriveFatigueMax,
  deriveAccustomanceState,
  clampResourceValue
} from '../../rules/derived/resources.js';
import { deriveMagicList } from '../../rules/derived/magic.js';
import { deriveMovement } from '../../rules/derived/movement.js';
import { deriveSaves } from '../../rules/derived/saves.js';
import { deriveProgressTracks, normalizeTrackBoxes, parseObjectivesText } from '../../rules/derived/progression.js';
import { mergeBonusTrees, normalizeBonusTree, toInt } from '../../rules/bonuses/bonus-tree.js';
import {
  getArmorDefenseValue,
  getArmorSaveBonuses,
  getEquippedArmorItem,
  getShieldDefenseValue,
  getShieldSaveBonuses
} from '../../rules/equipment/equipped-items.js';
import { getStateEffects } from '../../rules/states/state-effects.js';
import { deriveInventoryUsage } from '../../rules/derived/inventory.js';
import { collectEnchantingActorBonuses } from '../../rules/enchantments/actor-item-bonuses.js';
import { collectProfessionActorBonuses } from '../../rules/professions/actor-bonuses.js';
import { collectHeritageActorBonuses } from '../../rules/heritages/actor-bonuses.js';
import { ETERNAME_ATTRIBUTE_MAX_VALUE } from '../constants/attributes.js';
import { initializeCharacterSystemData } from './character-defaults.js';

export function prepareCharacterDerivedData(actor) {
  const system = actor.system;
  if (!system) return;

  initializeCharacterSystemData(system, actor.type);

  const attributes = system.attributes ?? {};
  const enchantingBonuses = collectEnchantingActorBonuses(actor);
  const professionBonuses = collectProfessionActorBonuses(actor);
  const heritageBonuses = collectHeritageActorBonuses(actor);
  const itemBonuses = normalizeBonusTree(mergeBonusTrees(mergeBonusTrees(enchantingBonuses, professionBonuses), heritageBonuses));
  const totalBonuses = normalizeBonusTree(mergeBonusTrees(system.bonuses, itemBonuses));
  const stateEffects = getStateEffects(system);

  system.derived = buildEmptyDerivedData({
    totalBonuses,
    itemBonuses,
    enchantingBonuses,
    professionBonuses,
    heritageBonuses,
    stateEffects
  });

  for (const [key, attr] of Object.entries(attributes)) {
    const value = Number(attr?.value ?? 0);
    const safeValue = Math.max(0, Math.min(ETERNAME_ATTRIBUTE_MAX_VALUE, Number.isFinite(value) ? value : 0));
    const ticks = Number(attr?.ticks ?? 0);
    const totalValue = Math.max(0, Math.min(ETERNAME_ATTRIBUTE_MAX_VALUE, safeValue + toInt(totalBonuses.attributesValue?.[key])));
    const target = Math.max(2, Math.min(6, indexStringToTarget(valueToIndex(totalValue)) - toInt(totalBonuses.attributesIndex?.[key])));

    attr.value = safeValue;
    attr.ticks = Math.max(0, Math.min(4, Number.isFinite(ticks) ? Math.floor(ticks) : 0));

    system.derived.attributes[key] = {
      value: safeValue,
      total: totalValue,
      bonusValue: toInt(totalBonuses.attributesValue?.[key]),
      bonusIndex: toInt(totalBonuses.attributesIndex?.[key]),
      bonusDice: Math.max(0, Math.min(4 - attr.ticks, toInt(totalBonuses.attributesDice?.[key]))),
      index: Number.isFinite(target) ? targetToIndexString(target) : valueToIndex(totalValue)
    };
  }

  const derivedAttributes = Object.fromEntries(
    Object.entries(system.derived.attributes).map(([key, attr]) => [key, { ...attributes[key], value: attr.total }])
  );
  const equippedArmorItem = getEquippedArmorItem(actor, derivedAttributes);
  system.defense.armor = getArmorDefenseValue(actor, derivedAttributes);
  system.defense.shield = getShieldDefenseValue(actor);

  const hpState = deriveHpState(derivedAttributes, system.resources.hp);
  applyHpBonuses(hpState, totalBonuses, stateEffects);

  const accustomance = deriveAccustomanceState(system.accustomance, system.accustomanceDisabled);
  const destinyBase = deriveDestinyDiceBase(derivedAttributes) + toInt(totalBonuses.destinyDice);
  const fatigueMax = deriveFatigueMax(derivedAttributes) + toInt(totalBonuses.fatigueMax);
  const initiative = deriveInitiative(derivedAttributes) + toInt(totalBonuses.initiative);
  const exploration = deriveExplorationPassive(derivedAttributes) + toInt(totalBonuses.explorationPassive);
  const defense = deriveDefense(derivedAttributes, system.defense);
  defense.bonus += toInt(totalBonuses.combat?.def) + toInt(stateEffects.defenseModifier);
  defense.total = Math.max(0, defense.base + defense.shield + defense.bonus);

  const armorTraining = deriveArmorTraining(system.armorTraining, equippedArmorItem);
  const attacks = deriveAttackBases(derivedAttributes);
  attacks.prc += toInt(totalBonuses.power) + toInt(totalBonuses.combat?.prc) + toInt(stateEffects.attackModifier);
  attacks.prd += toInt(totalBonuses.power) + toInt(totalBonuses.combat?.prd) + toInt(stateEffects.attackModifier);
  attacks.prm += toInt(totalBonuses.power) + toInt(totalBonuses.combat?.prm) + toInt(stateEffects.attackModifier);

  const saves = buildDerivedSaves(actor, system, derivedAttributes, totalBonuses, stateEffects);
  const progressTracks = deriveProgressTracks(system.progressTracks);
  const magic = buildDerivedMagic(system, derivedAttributes, totalBonuses);
  const movement = buildDerivedMovement(system, equippedArmorItem, stateEffects);
  const inventory = deriveInventoryUsage(actor, derivedAttributes);
  const renown = buildRenownDerivedData(system);

  Object.assign(system.derived, {
    hp: hpState,
    accustomance,
    destinyBase,
    destinyDiceBase: destinyBase,
    fatigueMax,
    initiative,
    exploration,
    explorationPassive: exploration,
    defense,
    armorTraining,
    attacks,
    saves,
    progressTracks,
    magic,
    movement,
    inventory,
    renown
  });

  normalizeCharacterSourceData(system, { hpState, accustomance, destinyBase, fatigueMax });
}

function buildEmptyDerivedData({ totalBonuses, itemBonuses, enchantingBonuses, professionBonuses, heritageBonuses, stateEffects }) {
  return {
    attributes: {},
    hp: {},
    accustomance: {},
    destinyBase: 0,
    destinyDiceBase: 0,
    fatigueMax: 0,
    initiative: 0,
    exploration: 0,
    explorationPassive: 0,
    defense: {},
    armorTraining: {},
    attacks: {},
    saves: {},
    progressTracks: [],
    magic: [],
    movement: {},
    inventory: {},
    renown: {},
    bonuses: totalBonuses,
    itemBonuses,
    enchantingBonuses,
    professionBonuses,
    heritageBonuses,
    stateEffects
  };
}

function applyHpBonuses(hpState, totalBonuses, stateEffects) {
  const hpBonus = toInt(totalBonuses.hpMax);
  const totalHpBonus = hpBonus + toInt(stateEffects.hpMaxModifier);
  if (totalHpBonus === 0) return;

  hpState.max = Math.max(0, Math.min(12, hpState.max + totalHpBonus));
  hpState.usableSlots = Math.max(0, Math.min(12 - (hpState.severeWounds * 3), hpState.usableSlots + totalHpBonus));
  hpState.boxes = hpState.boxes.map((checked, index) => index < hpState.usableSlots ? Boolean(checked) : false);
  hpState.current = hpState.boxes.slice(0, hpState.usableSlots).filter(Boolean).length;
  hpState.slots = hpState.boxes.map((checked, index) => ({
    index,
    checked,
    disabled: index >= hpState.usableSlots,
    disabledByMax: index >= hpState.max,
    disabledByWound: index >= hpState.woundDisabledFrom
  }));
}

function buildDerivedSaves(actor, system, derivedAttributes, totalBonuses, stateEffects) {
  const armorSaveBonuses = getArmorSaveBonuses(actor);
  const shieldSaveBonuses = getShieldSaveBonuses(actor);
  const saves = deriveSaves(system.saves, derivedAttributes);

  for (const [saveKey, save] of Object.entries(saves)) {
    save.bonusGear = toInt(save.bonusGear) + toInt(armorSaveBonuses?.[saveKey]) + toInt(shieldSaveBonuses?.[saveKey]);
    save.bonusOther = toInt(save.bonusOther) + toInt(totalBonuses.saves?.[saveKey]) + toInt(stateEffects.saveModifier);
    save.total = Math.max(0, Math.min(12, toInt(save.base) + toInt(save.bonus) + toInt(save.bonusGear) + toInt(save.bonusOther)));
    save.slots = Array.from({ length: 12 }, (_, index) => ({
      index,
      saveKey,
      checked: Boolean(system.saves?.[saveKey]?.boxes?.[index]),
      disabled: index >= save.total
    }));
  }

  return saves;
}

function buildDerivedMagic(system, derivedAttributes, totalBonuses) {
  return deriveMagicList(system.magic, derivedAttributes).map((entry) => ({
    ...entry,
    max: Number.isFinite(entry.max)
      ? Math.max(0, entry.max + (entry.type === 'canalisation' ? toInt(totalBonuses.spellSlotsMax) : entry.type === 'serment' ? toInt(totalBonuses.psMax) : 0))
      : entry.max
  }));
}

function buildDerivedMovement(system, equippedArmorItem, stateEffects) {
  const movement = deriveMovement(system.identity, system.armorTraining, equippedArmorItem, system.movement);
  movement.base = Math.max(0, Math.floor(movement.base * Number(stateEffects.movementMultiplier ?? 1)));
  movement.modes = (movement.modes ?? []).map((mode) => ({
    ...mode,
    value: Math.max(0, Math.floor(Number(mode?.value ?? 0) * Number(stateEffects.movementMultiplier ?? 1)))
  }));
  return movement;
}

function buildRenownDerivedData(system) {
  const positive = Math.max(0, Math.floor(Number(system.renown?.positive ?? 0) || 0));
  const negative = Math.max(0, Math.floor(Number(system.renown?.negative ?? 0) || 0));
  return { positive, negative, scope: positive + negative };
}

/**
 * Normalise uniquement les champs persistants qui restent éditables par l’utilisateur.
 *
 * Les résultats calculés comme la magie maximale, la marche, la défense ou les labels
 * restent dans `system.derived`. Cette fonction évite donc de recopier des valeurs
 * dérivées dans la source du document.
 *
 * @param {object} system - Données système persistantes de l’acteur.
 * @param {object} derivedState - Valeurs dérivées nécessaires à la normalisation.
 * @returns {void}
 */
function normalizeCharacterSourceData(system, { hpState, accustomance, destinyBase, fatigueMax }) {
  system.accustomance.boxes = accustomance.boxes;
  system.accustomanceDisabled = accustomance.disabled;

  system.resources.hp.value = clampResourceValue(system.resources.hp.value, hpState.max, 0);
  system.resources.hp.boxes = hpState.boxes;
  system.resources.hp.severeWounds = hpState.severeWounds;
  system.resources.hp.progression ??= { name: '', objectives: [] };

  system.progressTracks = (Array.isArray(system.progressTracks) ? system.progressTracks : []).map((track) => ({
    id: String(track?.id ?? foundry.utils.randomID()),
    name: String(track?.name ?? ''),
    objectivesText: String(track?.objectivesText ?? ''),
    objectives: parseObjectivesText(track?.objectivesText ?? track?.objectives),
    boxes: normalizeTrackBoxes(track?.boxes)
  }));

  system.resources.destiny.value = clampResourceValue(system.resources.destiny.value, destinyBase, destinyBase);
  system.resources.fatigue.value = clampResourceValue(system.resources.fatigue.value, fatigueMax, 0);
}
