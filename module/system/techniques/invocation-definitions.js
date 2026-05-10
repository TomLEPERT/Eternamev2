/**
 * Définitions système liées aux invocations.
 *
 * Responsabilités :
 * - déclarer les tailles d’invocation et leurs budgets ;
 * - déclarer les bonus de puissance disponibles ;
 * - déclarer les cibles possibles pour certains bonus ;
 * - déclarer les seuils de puissance d’invocation ;
 * - fournir des helpers de normalisation pour les tailles, bonus et cibles ;
 * - exposer les listes d’identifiants utilisées par les fiches et services d’invocation.
 *
 * Ce fichier doit rester un référentiel de données et de normalisation.
 * Il ne doit pas contenir de logique de fiche, de validation complexe ou d’application réelle des bonus.
 */

import { ETERNAME_ATTRIBUTES } from "../constants/attributes.js";
import { ITEM_SAVE_KEYS, ITEM_SAVE_LABEL_KEYS } from "../constants/save-keys.js";

const DEFAULT_INVOCATION_SIZE = "medium";
const DEFAULT_INVOCATION_POWER_BONUS_TYPE = "hp";

export const INVOCATION_ATTACK_BONUS_TARGETS = {
  prc: {
    labelKey: "ETERN.INVOCATION.POWER_BONUS.TARGET.ATTACK.PRC"
  },
  prd: {
    labelKey: "ETERN.INVOCATION.POWER_BONUS.TARGET.ATTACK.PRD"
  },
  prm: {
    labelKey: "ETERN.INVOCATION.POWER_BONUS.TARGET.ATTACK.PRM"
  }
};

/**
 * Cibles de bonus magiques pour les invocations.
 *
 * TODO nomenclature :
 * `canalisation` est une valeur française dans le code.
 * À terme, préférer `channeling`, avec alias ou migration si des données existent déjà.
 */
export const INVOCATION_MAGIC_BONUS_TARGETS = {
  canalisation: {
    labelKey: "ETERN.INVOCATION.POWER_BONUS.TARGET.MAGIC.CANALISATION"
  },
  fascination: {
    labelKey: "ETERN.INVOCATION.POWER_BONUS.TARGET.MAGIC.FASCINATION"
  }
};

export const INVOCATION_SIZE_DEFINITIONS = {
  tiny: {
    labelKey: "ETERN.INVOCATION.SIZE.TINY",
    pointBudget: 24,
    maxAttribute: 4,
    xpMultiplier: 1
  },
  small: {
    labelKey: "ETERN.INVOCATION.SIZE.SMALL",
    pointBudget: 30,
    maxAttribute: 5,
    xpMultiplier: 1
  },
  medium: {
    labelKey: "ETERN.INVOCATION.SIZE.MEDIUM",
    pointBudget: 36,
    maxAttribute: 6,
    xpMultiplier: 1
  },
  large: {
    labelKey: "ETERN.INVOCATION.SIZE.LARGE",
    pointBudget: 40,
    maxAttribute: 8,
    xpMultiplier: 2
  },
  huge: {
    labelKey: "ETERN.INVOCATION.SIZE.HUGE",
    pointBudget: 44,
    maxAttribute: 10,
    xpMultiplier: 3
  },
  colossal: {
    labelKey: "ETERN.INVOCATION.SIZE.COLOSSAL",
    pointBudget: 50,
    maxAttribute: 12,
    xpMultiplier: 4
  }
};

export const INVOCATION_POWER_BONUS_DEFINITIONS = {
  hp: {
    labelKey: "ETERN.INVOCATION.POWER_BONUS.HP",
    targetKind: null
  },
  attribute: {
    labelKey: "ETERN.INVOCATION.POWER_BONUS.ATTRIBUTE",
    targetKind: "attribute"
  },
  damage: {
    labelKey: "ETERN.INVOCATION.POWER_BONUS.DAMAGE",
    targetKind: null
  },
  defense: {
    labelKey: "ETERN.INVOCATION.POWER_BONUS.DEFENSE",
    targetKind: null
  },
  attack: {
    labelKey: "ETERN.INVOCATION.POWER_BONUS.ATTACK",
    targetKind: "attack"
  },
  save: {
    labelKey: "ETERN.INVOCATION.POWER_BONUS.SAVE",
    targetKind: "save"
  },
  magic: {
    labelKey: "ETERN.INVOCATION.POWER_BONUS.MAGIC",
    targetKind: "magic"
  }
};

export const INVOCATION_THRESHOLD_KEYS = Object.freeze([
  "rank3",
  "rank6",
  "rank9",
  "rank10"
]);

export const INVOCATION_THRESHOLD_VALUES = Object.freeze({
  rank3: 3,
  rank6: 6,
  rank9: 9,
  rank10: 10
});

export const INVOCATION_ATTRIBUTE_KEYS = Object.freeze(
  Object.keys(ETERNAME_ATTRIBUTES)
);

/**
 * Renvoie les ids de tailles d’invocation disponibles.
 *
 * @returns {string[]} Ids de tailles.
 */
export function getInvocationSizeIds() {
  return Object.keys(INVOCATION_SIZE_DEFINITIONS);
}

/**
 * Normalise une taille d’invocation.
 *
 * Toute valeur absente ou inconnue revient à `medium`.
 *
 * @param {unknown} value - Taille brute.
 * @returns {string} Taille valide.
 */
export function normalizeInvocationSize(value = DEFAULT_INVOCATION_SIZE) {
  const key = String(value ?? DEFAULT_INVOCATION_SIZE).trim();

  return key in INVOCATION_SIZE_DEFINITIONS
    ? key
    : DEFAULT_INVOCATION_SIZE;
}

/**
 * Récupère la définition d’une taille d’invocation.
 *
 * La fonction passe par `normalizeInvocationSize`, donc elle renvoie toujours
 * une définition valide.
 *
 * @param {unknown} size - Taille brute ou normalisée.
 * @returns {{labelKey: string, pointBudget: number, maxAttribute: number, xpMultiplier: number}} Définition de taille.
 */
export function getInvocationSizeDefinition(size = DEFAULT_INVOCATION_SIZE) {
  return INVOCATION_SIZE_DEFINITIONS[normalizeInvocationSize(size)];
}

/**
 * Renvoie les ids de bonus de puissance disponibles.
 *
 * @returns {string[]} Ids de bonus.
 */
export function getInvocationPowerBonusIds() {
  return Object.keys(INVOCATION_POWER_BONUS_DEFINITIONS);
}

/**
 * Normalise un type de bonus de puissance d’invocation.
 *
 * Toute valeur absente ou inconnue revient à `hp`.
 *
 * @param {unknown} value - Type brut.
 * @returns {string} Type de bonus valide.
 */
export function normalizeInvocationPowerBonusType(
  value = DEFAULT_INVOCATION_POWER_BONUS_TYPE
) {
  const key = String(value ?? DEFAULT_INVOCATION_POWER_BONUS_TYPE).trim();

  return key in INVOCATION_POWER_BONUS_DEFINITIONS
    ? key
    : DEFAULT_INVOCATION_POWER_BONUS_TYPE;
}

/**
 * Récupère la définition d’un bonus de puissance.
 *
 * @param {unknown} type - Type brut ou normalisé.
 * @returns {{labelKey: string, targetKind: string|null}} Définition du bonus.
 */
export function getInvocationPowerBonusDefinition(
  type = DEFAULT_INVOCATION_POWER_BONUS_TYPE
) {
  return INVOCATION_POWER_BONUS_DEFINITIONS[
    normalizeInvocationPowerBonusType(type)
  ] ?? INVOCATION_POWER_BONUS_DEFINITIONS.hp;
}

/**
 * Récupère le type de cible requis par un bonus de puissance.
 *
 * Valeurs possibles :
 * - `attribute`
 * - `attack`
 * - `save`
 * - `magic`
 * - `null`
 *
 * @param {unknown} type - Type de bonus.
 * @returns {string|null} Type de cible requis.
 */
export function getInvocationPowerBonusTargetKind(
  type = DEFAULT_INVOCATION_POWER_BONUS_TYPE
) {
  return getInvocationPowerBonusDefinition(type)?.targetKind ?? null;
}

/**
 * Construit les choix de cible disponibles pour un bonus de puissance.
 *
 * Les choix dépendent du `targetKind` du bonus :
 * - attribut ;
 * - attaque ;
 * - sauvegarde ;
 * - magie.
 *
 * Les fonctions appelantes peuvent ensuite localiser les `labelKey`.
 *
 * @param {unknown} type - Type de bonus.
 * @returns {{value: string, labelKey: string}[]} Choix de cibles disponibles.
 */
export function getInvocationPowerBonusTargetChoices(
  type = DEFAULT_INVOCATION_POWER_BONUS_TYPE
) {
  const targetKind = getInvocationPowerBonusTargetKind(type);

  if (targetKind === "attribute") {
    return buildAttributeTargetChoices();
  }

  if (targetKind === "attack") {
    return buildDefinitionTargetChoices(INVOCATION_ATTACK_BONUS_TARGETS);
  }

  if (targetKind === "save") {
    return buildSaveTargetChoices();
  }

  if (targetKind === "magic") {
    return buildDefinitionTargetChoices(INVOCATION_MAGIC_BONUS_TARGETS);
  }

  return [];
}

/**
 * Normalise la cible d’un bonus de puissance.
 *
 * Si le bonus ne demande pas de cible, la fonction renvoie une chaîne vide.
 * Si la cible donnée est invalide, la première cible disponible est utilisée.
 *
 * @param {unknown} type - Type de bonus.
 * @param {unknown} value - Cible brute.
 * @returns {string} Cible valide ou chaîne vide.
 */
export function normalizeInvocationPowerBonusTarget(
  type = DEFAULT_INVOCATION_POWER_BONUS_TYPE,
  value = ""
) {
  const normalizedType = normalizeInvocationPowerBonusType(type);
  const choices = getInvocationPowerBonusTargetChoices(normalizedType);
  const target = String(value ?? "").trim();

  if (!choices.length) return "";

  const validTargets = new Set(
    choices.map((entry) => String(entry.value ?? ""))
  );

  if (validTargets.has(target)) return target;

  return String(choices[0]?.value ?? "");
}

/**
 * Indique si un type de bonus demande une cible.
 *
 * @param {unknown} type - Type de bonus.
 * @returns {boolean} `true` si au moins une cible est disponible.
 */
export function invocationPowerBonusRequiresTarget(
  type = DEFAULT_INVOCATION_POWER_BONUS_TYPE
) {
  return getInvocationPowerBonusTargetChoices(type).length > 0;
}

/**
 * Construit les choix de cibles d’attribut.
 *
 * @returns {{value: string, labelKey: string}[]} Choix d’attributs.
 */
function buildAttributeTargetChoices() {
  return Object.entries(ETERNAME_ATTRIBUTES).map(([value, meta]) => ({
    value,
    labelKey: meta.label
  }));
}

/**
 * Construit des choix de cibles depuis une table de définitions.
 *
 * @param {Record<string, {labelKey: string}>} definitions - Définitions de cibles.
 * @returns {{value: string, labelKey: string}[]} Choix de cibles.
 */
function buildDefinitionTargetChoices(definitions) {
  return Object.entries(definitions).map(([value, meta]) => ({
    value,
    labelKey: meta.labelKey
  }));
}

/**
 * Construit les choix de cibles de sauvegarde.
 *
 * Les sauvegardes viennent du référentiel commun `save-keys.js`,
 * ce qui évite de dupliquer les clés dans plusieurs fichiers.
 *
 * @returns {{value: string, labelKey: string}[]} Choix de sauvegardes.
 */
function buildSaveTargetChoices() {
  return ITEM_SAVE_KEYS.map((saveKey) => ({
    value: saveKey,
    labelKey: ITEM_SAVE_LABEL_KEYS[saveKey] ?? saveKey
  }));
}