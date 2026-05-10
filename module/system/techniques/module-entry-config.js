/**
 * Configuration des entrées de modules utilisées par les métiers, techniques et héritages.
 *
 * Responsabilités :
 * - déclarer les types de slots statistiques disponibles pour les modules ;
 * - construire les choix de slots statistiques ;
 * - construire les choix de cibles pour les bonus acteur ;
 * - construire les choix d’attributs utilisés par les pistes de progression ;
 * - construire les choix d’états système pour les modules d’état ;
 * - fournir un accès rapide aux définitions d’états utilisées par les modules.
 *
 * Ce fichier prépare des listes de choix pour les fiches.
 * Il ne doit pas appliquer les bonus, modifier les acteurs ou contenir de logique de rendu DOM.
 */

import { ETERNAME_ATTRIBUTES } from "../constants/attributes.js";
import { ETERNAME_STATES } from "../constants/states.js";
import { ITEM_SAVE_KEYS, ITEM_SAVE_LABEL_KEYS } from "../constants/save-keys.js";

export const TECHNIQUE_MODULE_SLOT_TYPES = Object.freeze({
  free: "ETERN.TECHNIQUE.MODULES.SLOT_TYPE.FREE",
  range: "ETERN.TECHNIQUE.MODULES.SLOT_TYPE.RANGE",
  duration: "ETERN.TECHNIQUE.MODULES.SLOT_TYPE.DURATION"
});

const CORE_BONUS_TARGETS = Object.freeze({
  hpMax: "ETERN.BONUSES.HP_MAX",
  initiative: "ETERN.BONUSES.INITIATIVE",
  destinyDice: "ETERN.BONUSES.DESTINY_DICE",
  fatigueMax: "ETERN.BONUSES.FATIGUE_MAX",
  explorationPassive: "ETERN.BONUSES.EXPLORATION",
  spellSlotsMax: "ETERN.BONUSES.SPELL_SLOTS_MAX",
  psMax: "ETERN.BONUSES.PS_MAX",
  power: "ETERN.BONUSES.POWER"
});

const COMBAT_BONUS_TARGETS = Object.freeze({
  "combat.prc": "PRC",
  "combat.prd": "PRD",
  "combat.prm": "PRM",
  "combat.def": "DEF"
});

const STATE_DEFINITIONS_BY_ID = new Map(
  ETERNAME_STATES.map((state) => [state.id, state])
);

/**
 * Normalise le type de slot statistique d’un module.
 *
 * Valeurs autorisées :
 * - `free`
 * - `range`
 * - `duration`
 *
 * Toute valeur absente ou inconnue revient à `free`.
 *
 * @param {unknown} value - Type de slot brut.
 * @returns {"free"|"range"|"duration"} Type de slot normalisé.
 */
export function normalizeTechniqueModuleSlotType(value = "free") {
  const normalized = String(value ?? "").trim();

  return Object.hasOwn(TECHNIQUE_MODULE_SLOT_TYPES, normalized)
    ? normalized
    : "free";
}

/**
 * Construit les choix localisés pour un type de slot statistique.
 *
 * Cette fonction est utilisée par les templates lorsqu’un module peut ajouter
 * des slots statistiques supplémentaires à une technique.
 *
 * @param {unknown} [selected="free"] - Type actuellement sélectionné.
 * @returns {{value: string, label: string, selected: boolean}[]} Choix de slots.
 */
export function getTechniqueModuleSlotChoices(selected = "free") {
  const current = normalizeTechniqueModuleSlotType(selected);

  return Object.entries(TECHNIQUE_MODULE_SLOT_TYPES).map(([value, key]) => ({
    value,
    label: game.i18n.localize(key),
    selected: value === current
  }));
}

/**
 * Construit les choix de cibles possibles pour un bonus acteur.
 *
 * Les cibles incluent :
 * - les valeurs, index et dés des attributs ;
 * - les bonus principaux du personnage ;
 * - les valeurs de combat ;
 * - les sauvegardes.
 *
 * @param {unknown} [selected=""] - Cible actuellement sélectionnée.
 * @returns {{value: string, label: string, selected: boolean}[]} Choix de cibles de bonus.
 */
export function getTechniqueModuleBonusTargetChoices(selected = "") {
  const current = String(selected ?? "").trim();

  return [
    buildChoice(
      "",
      game.i18n.localize("ETERN.TECHNIQUE.MODULES.BONUS_TARGET.EMPTY"),
      current
    ),
    ...buildAttributeBonusTargetChoices(current),
    ...buildCoreBonusTargetChoices(current),
    ...buildCombatBonusTargetChoices(current),
    ...buildSaveBonusTargetChoices(current)
  ];
}

/**
 * Construit les choix d’attributs utilisés par une piste de progression.
 *
 * Le premier choix permet d’indiquer qu’aucun test n’est requis.
 *
 * @param {unknown} [selected=""] - Attribut actuellement sélectionné.
 * @returns {{value: string, label: string, selected: boolean}[]} Choix d’attributs.
 */
export function getTechniqueModuleProgressAttributeChoices(selected = "") {
  const current = String(selected ?? "").trim();

  return [
    buildChoice(
      "",
      game.i18n.localize("ETERN.TECHNIQUE.MODULES.PROGRESS_TRACK.NO_TEST"),
      current
    ),
    ...Object.entries(ETERNAME_ATTRIBUTES).map(([key, definition]) => {
      return buildChoice(key, game.i18n.localize(definition.label), current);
    })
  ];
}

/**
 * Construit les choix d’états système pour un module.
 *
 * Cette fonction est utilisée par les modules d’état afin de lier une entrée
 * à un état connu du système, comme brûlure, gel, peur, silence, etc.
 *
 * @param {unknown} [selected=""] - État actuellement sélectionné.
 * @returns {{value: string, label: string, selected: boolean}[]} Choix d’états.
 */
export function getTechniqueModuleStateChoices(selected = "") {
  const current = String(selected ?? "").trim();

  return [
    buildChoice(
      "",
      game.i18n.localize("ETERN.TECHNIQUE.MODULES.STATE.EMPTY"),
      current
    ),
    ...ETERNAME_STATES.map((state) => {
      return buildChoice(state.id, game.i18n.localize(state.nameKey), current);
    })
  ];
}

/**
 * Récupère la définition système d’un état utilisable par un module.
 *
 * La fonction renvoie `null` si l’id ne correspond à aucun état connu.
 *
 * @param {unknown} stateId - Identifiant d’état à rechercher.
 * @returns {object|null} Définition de l’état, ou `null`.
 */
export function getTechniqueModuleStateDefinition(stateId = "") {
  const normalized = String(stateId ?? "").trim();

  return STATE_DEFINITIONS_BY_ID.get(normalized) ?? null;
}

/**
 * Construit les choix de bonus liés aux attributs.
 *
 * Pour chaque attribut, trois cibles sont proposées :
 * - valeur ;
 * - index ;
 * - dés.
 *
 * @param {string} current - Valeur actuellement sélectionnée.
 * @returns {{value: string, label: string, selected: boolean}[]} Choix de bonus d’attributs.
 */
function buildAttributeBonusTargetChoices(current) {
  return Object.entries(ETERNAME_ATTRIBUTES).flatMap(([attributeKey, definition]) => {
    const label = game.i18n.localize(definition.label);

    return [
      buildChoice(
        `attributesValue.${attributeKey}`,
        `${label} · ${game.i18n.localize("ETERN.TECHNIQUE.MODULES.BONUS_TARGET.VALUE")}`,
        current
      ),
      buildChoice(
        `attributesIndex.${attributeKey}`,
        `${label} · ${game.i18n.localize("ETERN.TECHNIQUE.MODULES.BONUS_TARGET.INDEX")}`,
        current
      ),
      buildChoice(
        `attributesDice.${attributeKey}`,
        `${label} · ${game.i18n.localize("ETERN.TECHNIQUE.MODULES.BONUS_TARGET.DICE")}`,
        current
      )
    ];
  });
}

/**
 * Construit les choix de bonus généraux du personnage.
 *
 * Ces cibles correspondent aux ressources ou valeurs globales :
 * PV max, initiative, dés de destin, fatigue, PS, puissance, etc.
 *
 * @param {string} current - Valeur actuellement sélectionnée.
 * @returns {{value: string, label: string, selected: boolean}[]} Choix de bonus généraux.
 */
function buildCoreBonusTargetChoices(current) {
  return Object.entries(CORE_BONUS_TARGETS).map(([value, labelKey]) => {
    return buildChoice(value, game.i18n.localize(labelKey), current);
  });
}

/**
 * Construit les choix de bonus de combat.
 *
 * Les labels sont volontairement des abréviations système courtes.
 *
 * @param {string} current - Valeur actuellement sélectionnée.
 * @returns {{value: string, label: string, selected: boolean}[]} Choix de bonus de combat.
 */
function buildCombatBonusTargetChoices(current) {
  return Object.entries(COMBAT_BONUS_TARGETS).map(([value, label]) => {
    return buildChoice(value, label, current);
  });
}

/**
 * Construit les choix de bonus de sauvegarde.
 *
 * Les sauvegardes viennent du référentiel commun `save-keys.js`.
 *
 * @param {string} current - Valeur actuellement sélectionnée.
 * @returns {{value: string, label: string, selected: boolean}[]} Choix de sauvegardes.
 */
function buildSaveBonusTargetChoices(current) {
  return ITEM_SAVE_KEYS.map((saveKey) => {
    const value = `saves.${saveKey}`;
    const labelKey = ITEM_SAVE_LABEL_KEYS[saveKey] ?? saveKey;

    return buildChoice(value, game.i18n.localize(labelKey), current);
  });
}

/**
 * Construit une option de sélection standard.
 *
 * Cette fonction garde un format homogène pour tous les choix :
 * `{ value, label, selected }`.
 *
 * @param {string} value - Valeur de l’option.
 * @param {string} label - Libellé affiché.
 * @param {string} current - Valeur actuellement sélectionnée.
 * @returns {{value: string, label: string, selected: boolean}} Option de sélection.
 */
function buildChoice(value, label, current) {
  return {
    value,
    label,
    selected: value === current
  };
}