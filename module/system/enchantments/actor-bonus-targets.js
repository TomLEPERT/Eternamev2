/**
 * Choix de cibles de bonus d’acteur pour les enchantements.
 *
 * Responsabilités :
 * - construire les choix de bonus applicables à un acteur ;
 * - exposer les cibles d’attributs : valeur, index et dés bonus ;
 * - exposer les cibles principales : PV, initiative, fatigue, puissance, etc. ;
 * - exposer les cibles de combat : PRC, PRD, PRM et DEF ;
 * - exposer les cibles de sauvegardes ;
 * - marquer la cible actuellement sélectionnée pour les templates.
 *
 * Ce fichier doit rester dédié à la préparation des choix d’interface.
 * Il ne doit pas appliquer les bonus sur les acteurs.
 */

import { ETERNAME_ATTRIBUTES } from "../constants/attributes.js";
import {
  ITEM_SAVE_KEYS,
  ITEM_SAVE_LABEL_KEYS
} from "../constants/save-keys.js";

const CORE_TARGETS = Object.freeze([
  Object.freeze({
    value: "hpMax",
    labelKey: "ETERN.BONUSES.HP_MAX"
  }),
  Object.freeze({
    value: "initiative",
    labelKey: "ETERN.BONUSES.INITIATIVE"
  }),
  Object.freeze({
    value: "destinyDice",
    labelKey: "ETERN.BONUSES.DESTINY_DICE"
  }),
  Object.freeze({
    value: "fatigueMax",
    labelKey: "ETERN.BONUSES.FATIGUE_MAX"
  }),
  Object.freeze({
    value: "explorationPassive",
    labelKey: "ETERN.BONUSES.EXPLORATION"
  }),
  Object.freeze({
    value: "spellSlotsMax",
    labelKey: "ETERN.BONUSES.SPELL_SLOTS_MAX"
  }),
  Object.freeze({
    value: "psMax",
    labelKey: "ETERN.BONUSES.PS_MAX"
  }),
  Object.freeze({
    value: "power",
    labelKey: "ETERN.BONUSES.POWER"
  }),
  Object.freeze({
    value: "combat.prc",
    labelKey: "ETERN.ENCHANTING.ACTOR_TARGET.COMBAT_PRC"
  }),
  Object.freeze({
    value: "combat.prd",
    labelKey: "ETERN.ENCHANTING.ACTOR_TARGET.COMBAT_PRD"
  }),
  Object.freeze({
    value: "combat.prm",
    labelKey: "ETERN.ENCHANTING.ACTOR_TARGET.COMBAT_PRM"
  }),
  Object.freeze({
    value: "combat.def",
    labelKey: "ETERN.ENCHANTING.ACTOR_TARGET.COMBAT_DEF"
  })
]);

/**
 * Construit les choix de cibles de bonus d’acteur.
 *
 * Les choix générés comprennent :
 * - une option vide ;
 * - les bonus liés aux attributs ;
 * - les bonus principaux ;
 * - les bonus de combat ;
 * - les bonus de sauvegardes.
 *
 * Chaque choix contient :
 * - `value` : clé technique utilisée par les services de bonus ;
 * - `label` : libellé localisé affiché dans l’interface ;
 * - `selected` : état de sélection pour le template.
 *
 * @param {unknown} [selected=""] - Cible actuellement sélectionnée.
 * @returns {{value: string, label: string, selected: boolean}[]} Choix de cibles.
 */
export function getEnchantmentActorBonusTargetChoices(selected = "") {
  const current = String(selected ?? "").trim();

  return [
    {
      value: "",
      label: game.i18n.localize("ETERN.TECHNIQUE.MODULES.BONUS_TARGET.EMPTY"),
      selected: current === ""
    },
    ...buildAttributeTargetChoices(current),
    ...buildCoreTargetChoices(current),
    ...buildSaveTargetChoices(current)
  ];
}

/**
 * Construit les choix de bonus liés aux attributs.
 *
 * Pour chaque attribut, trois cibles sont disponibles :
 * - valeur brute ;
 * - index ;
 * - dés bonus.
 *
 * @param {string} current - Cible actuellement sélectionnée.
 * @returns {{value: string, label: string, selected: boolean}[]} Choix d’attributs.
 */
function buildAttributeTargetChoices(current) {
  return Object.entries(ETERNAME_ATTRIBUTES).flatMap(([attributeKey, definition]) => {
    const label = game.i18n.localize(definition.label);

    return [
      {
        value: `attributesValue.${attributeKey}`,
        label: `${label} · ${game.i18n.localize("ETERN.TECHNIQUE.MODULES.BONUS_TARGET.VALUE")}`,
        selected: current === `attributesValue.${attributeKey}`
      },
      {
        value: `attributesIndex.${attributeKey}`,
        label: `${label} · ${game.i18n.localize("ETERN.TECHNIQUE.MODULES.BONUS_TARGET.INDEX")}`,
        selected: current === `attributesIndex.${attributeKey}`
      },
      {
        value: `attributesDice.${attributeKey}`,
        label: `${label} · ${game.i18n.localize("ETERN.TECHNIQUE.MODULES.BONUS_TARGET.DICE")}`,
        selected: current === `attributesDice.${attributeKey}`
      }
    ];
  });
}

/**
 * Construit les choix de bonus principaux et de combat.
 *
 * @param {string} current - Cible actuellement sélectionnée.
 * @returns {{value: string, label: string, selected: boolean}[]} Choix principaux.
 */
function buildCoreTargetChoices(current) {
  return CORE_TARGETS.map((target) => ({
    value: target.value,
    label: game.i18n.localize(target.labelKey),
    selected: current === target.value
  }));
}

/**
 * Construit les choix de bonus de sauvegardes.
 *
 * @param {string} current - Cible actuellement sélectionnée.
 * @returns {{value: string, label: string, selected: boolean}[]} Choix de sauvegardes.
 */
function buildSaveTargetChoices(current) {
  return ITEM_SAVE_KEYS.map((saveKey) => {
    const value = `saves.${saveKey}`;

    return {
      value,
      label: game.i18n.localize(ITEM_SAVE_LABEL_KEYS[saveKey] ?? saveKey),
      selected: current === value
    };
  });
}