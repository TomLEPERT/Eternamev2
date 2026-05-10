/**
 * Service de jets d’attaque du système Etername.
 *
 * Responsabilités :
 * - préparer les données nécessaires à un jet d’attaque ;
 * - déterminer l’attribut utilisé pour le jet ;
 * - calculer le seuil de réussite selon le mode de jet, les états et la défense adverse ;
 * - déterminer le nombre de dés à lancer depuis la formule de dégâts ;
 * - intégrer les bonus spécifiques aux acteurs d’invocation ;
 * - préparer les informations de précision affichées dans le chat ;
 * - exécuter le jet et poster le résultat dans le chat.
 *
 * Ce fichier doit rester dédié aux jets d’attaque.
 * Il ne doit pas contenir la logique de fiche, de création d’armes, de validation des techniques
 * ou d’application réelle des dégâts.
 */

import { toInteger, toPositiveInteger } from '../../utils/numbers.js';
import { ETERNAME_ATTRIBUTES } from "../constants/attributes.js";
import {
  indexStringToTarget,
  targetToIndexString,
  valueToIndex
} from "../../rules/derived/attributes.js";
import {
  applyTargetDelta,
  modeToDelta,
  ROLL_MODES
} from "./modifiers.js";

const ATTACK_ROLL_TEMPLATE = "systems/eternamev2/templates/chat/attack-roll.hbs";
const DEFAULT_ATTACK_ATTRIBUTE = "strength";
const DEFAULT_ATTACK_DEF_COMPARISON = "equal";

export const ATTACK_DEF_COMPARISONS = Object.freeze({
  LOWER: "lower",
  EQUAL: "equal",
  HIGHER: "higher"
});

const ATTACK_DEF_COMPARISON_VALUES = new Set(
  Object.values(ATTACK_DEF_COMPARISONS)
);

const PRECISION_KEYS = Object.freeze(["prc", "prd", "prm"]);

const ATTRIBUTE_ABBR_TO_KEY = Object.fromEntries(
  Object.entries(ETERNAME_ATTRIBUTES).map(([key, meta]) => [
    String(meta.abbr ?? "").toLowerCase(),
    key
  ])
);

/**
 * Analyse une formule de dégâts pour en déduire le nombre de dés à lancer.
 *
 * Formats gérés :
 * - `3d6`
 * - `FOR d6`
 * - `FOR/2 d6`
 * - `HAB/2 d6`
 * - valeur numérique simple.
 *
 * Si la formule est invalide, la fonction renvoie 1.
 *
 * @param {unknown} value - Formule de dégâts brute.
 * @param {Actor} actor - Acteur attaquant, utilisé pour lire les attributs.
 * @returns {number} Nombre de dés d’attaque.
 */
function parseDamageDiceCount(value, actor) {
  const text = String(value ?? "").trim();
  const compact = text.toLowerCase().replace(/\s+/g, "");

  const attrMatch = compact.match(/^([a-zéûîôà]+)(?:\/(\d+))?d\d+(?:[+-]\d+)?$/i);

  if (attrMatch) {
    const attrKey = ATTRIBUTE_ABBR_TO_KEY[String(attrMatch[1] ?? "").toLowerCase()];
    const divisor = Math.max(1, Number(attrMatch[2] ?? 1) || 1);
    const attrTotal = Number(
      actor?.system?.derived?.attributes?.[attrKey]?.total
      ?? actor?.system?.attributes?.[attrKey]?.value
      ?? 0
    );

    if (attrKey && Number.isFinite(attrTotal) && attrTotal > 0) {
      return Math.max(1, Math.floor(attrTotal / divisor));
    }
  }

  const flatMatch = compact.match(/^(\d+)d\d+(?:[+-]\d+)?$/);

  if (flatMatch) {
    return Math.max(1, Number(flatMatch[1]));
  }

  const plain = Number(compact);

  return Number.isFinite(plain) && plain > 0
    ? Math.floor(plain)
    : 1;
}

/**
 * Récupère le bonus de dés de dégâts généré pour un acteur d’invocation.
 *
 * Ce bonus vient des bonus de puissance appliqués lors de la génération
 * ou synchronisation de l’acteur d’invocation.
 *
 * @param {Actor} actor - Acteur attaquant.
 * @returns {number} Bonus de dés de dégâts.
 */
function getInvocationActorDamageDiceBonus(actor) {
  if (String(actor?.type ?? "") !== "invocation") return 0;

  return toPositiveInteger(
    actor?.system?.invocation?.generatedBonuses?.damageDiceBonus
  );
}

/**
 * Construit les choix d’attributs utilisables pour une attaque.
 *
 * @param {string} [selectedKey=DEFAULT_ATTACK_ATTRIBUTE] - Attribut actuellement sélectionné.
 * @returns {{value: string, label: string, abbr: string, selected: boolean}[]} Choix d’attributs.
 */
export function getAttackAttributeChoices(selectedKey = DEFAULT_ATTACK_ATTRIBUTE) {
  return Object.entries(ETERNAME_ATTRIBUTES).map(([key, meta]) => ({
    value: key,
    label: game.i18n.localize(meta.label),
    abbr: meta.abbr,
    selected: key === selectedKey
  }));
}

/**
 * Construit les choix de comparaison entre l’attaque et la défense adverse.
 *
 * Cette comparaison sert à ajuster le seuil final :
 * - défense plus haute : attaque plus facile dans ta logique actuelle, delta -1 ;
 * - défense égale : aucun changement ;
 * - défense plus basse : attaque plus difficile, delta +1.
 *
 * À confirmer côté règle, car l’intitulé peut sembler contre-intuitif.
 *
 * @param {string} [selectedValue=ATTACK_DEF_COMPARISONS.EQUAL] - Choix actuellement sélectionné.
 * @returns {{value: string, label: string, selected: boolean}[]} Choix de comparaison.
 */
export function getAttackDefenseChoices(
  selectedValue = ATTACK_DEF_COMPARISONS.EQUAL
) {
  const selected = normalizeAttackDefenseComparison(selectedValue);

  return [
    {
      value: ATTACK_DEF_COMPARISONS.HIGHER,
      label: game.i18n.localize("ETERN.ATTACKS.DEF.HIGHER"),
      selected: selected === ATTACK_DEF_COMPARISONS.HIGHER
    },
    {
      value: ATTACK_DEF_COMPARISONS.EQUAL,
      label: game.i18n.localize("ETERN.ATTACKS.DEF.EQUAL"),
      selected: selected === ATTACK_DEF_COMPARISONS.EQUAL
    },
    {
      value: ATTACK_DEF_COMPARISONS.LOWER,
      label: game.i18n.localize("ETERN.ATTACKS.DEF.LOWER"),
      selected: selected === ATTACK_DEF_COMPARISONS.LOWER
    }
  ];
}

/**
 * Prépare les données nécessaires à un jet d’attaque.
 *
 * Cette fonction ne lance pas le jet.
 * Elle prépare seulement :
 * - l’attribut utilisé ;
 * - le nombre de dés ;
 * - le seuil de base ;
 * - le seuil ajusté par mode et états ;
 * - le seuil final après comparaison de défense ;
 * - les informations de précision ;
 * - les labels utiles pour le chat.
 *
 * @param {Actor} actor - Acteur attaquant.
 * @param {object} [attack={}] - Données de l’attaque ou proxy de technique.
 * @param {object} [options={}] - Options du jet.
 * @param {string} [options.attributeKey] - Attribut utilisé.
 * @param {string} [options.mode] - Mode de jet : normal, advantage ou disadvantage.
 * @param {string} [options.vsDefense] - Comparaison à la défense adverse.
 * @param {number} [options.diceCount] - Nombre de dés forcé.
 * @returns {object|null} Données de jet, ou `null` si l’attribut est introuvable.
 */
export function buildAttackRollData(actor, attack = {}, options = {}) {
  const attributeKey = String(options.attributeKey ?? DEFAULT_ATTACK_ATTRIBUTE);
  const attr = actor?.system?.attributes?.[attributeKey];

  if (!attr) return null;

  const derived = actor?.system?.derived?.attributes?.[attributeKey] ?? {};
  const effects = actor?.system?.derived?.stateEffects ?? {};

  const value = toFiniteNumber(derived.total ?? attr.value, 0);
  const index = String(derived.index ?? valueToIndex(value));
  const baseTarget = indexStringToTarget(index);

  const mode = normalizeRollMode(options.mode);
  const vsDefense = normalizeAttackDefenseComparison(options.vsDefense);
  const defenseDelta = getDefenseDelta(vsDefense);

  const stateShift = getAttackStateShift(effects);
  const threshold = applyTargetDelta(
    baseTarget,
    modeToDelta(mode, 1) + stateShift
  );

  const finalTarget = clampAttackFinalTarget(
    threshold.adjustedTarget + defenseDelta
  );

  const bonusDice = toInteger(derived.bonusDice);
  const invocationDamageDiceBonus = getInvocationActorDamageDiceBonus(actor);

  const baseDiceCount = Math.max(
    1,
    toInteger(options.diceCount ?? parseDamageDiceCount(attack.damage, actor)) + invocationDamageDiceBonus
  );

  const precision = buildAttackPrecisionContext(actor, attack);
  const meta = ETERNAME_ATTRIBUTES[attributeKey];

  return {
    actor,
    attack,
    attribute: {
      key: attributeKey,
      label: game.i18n.localize(meta?.label ?? attr.label ?? attributeKey),
      abbr: attr?.abbr ?? meta?.abbr ?? attributeKey,
      value,
      index,
      bonusDice
    },
    diceCount: baseDiceCount,
    mode,
    vsDefense,
    baseTarget,
    adjustedTarget: threshold.adjustedTarget,
    target: finalTarget,
    attackName: String(attack?.name ?? ""),
    damageLabel: buildDamageLabel(attack?.damage, invocationDamageDiceBonus),
    precision,
    defenseDelta,
    stateShift
  };
}

/**
 * Exécute un jet d’attaque et poste le résultat dans le chat.
 *
 * La fonction :
 * - prépare les données du jet ;
 * - lance les dés ;
 * - compte les succès selon le seuil final ;
 * - rend le template de chat ;
 * - crée le message de chat Foundry ;
 * - renvoie le résultat complet.
 *
 * @param {Actor} actor - Acteur attaquant.
 * @param {object} attack - Données de l’attaque ou proxy de technique.
 * @param {object} [options={}] - Options du jet.
 * @returns {Promise<object|null>} Résultat du jet, ou `null` si le jet est impossible.
 */
export async function executeAttackRoll(actor, attack, options = {}) {
  const data = buildAttackRollData(actor, attack, options);

  if (!data) return null;

  const formula = `${data.diceCount}d6`;
  const roll = await new Roll(formula).evaluate();

  const dice = (roll.dice?.[0]?.results ?? []).map((result, index) => {
    const value = Number(result?.result ?? 0);

    return {
      index,
      value,
      success: value >= data.target
    };
  });

  const successes = dice.reduce((sum, die) => {
    return sum + (die.success ? 1 : 0);
  }, 0);

  const content = await foundry.applications.handlebars.renderTemplate(
    ATTACK_ROLL_TEMPLATE,
    {
      attackName: data.attackName || game.i18n.localize("ETERN.ATTACKS.TITLE"),
      attribute: data.attribute,
      dice,
      successes,
      modeLabel: game.i18n.localize(`ETERN.ROLL.MODE.${data.mode.toUpperCase()}`),
      targetLabel: targetToIndexString(data.target),
      baseTargetLabel: targetToIndexString(data.baseTarget),
      adjustedTargetLabel: targetToIndexString(data.adjustedTarget),
      hasBaseShift: data.baseTarget !== data.adjustedTarget,
      hasDefenseShift: data.adjustedTarget !== data.target,
      defenseLabel: game.i18n.localize(`ETERN.ATTACKS.DEF.${data.vsDefense.toUpperCase()}`),
      formulaLabel: formula,
      precision: data.precision,
      hasPrecision: Number.isFinite(data.precision?.total),
      stateShift: data.stateShift,
      hasStateShift: data.stateShift !== 0
    }
  );

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    rolls: [roll],
    content
  });

  return {
    ...data,
    roll,
    dice,
    successes
  };
}

/**
 * Normalise un mode de jet.
 *
 * Toute valeur inconnue revient au mode normal.
 *
 * @param {unknown} mode - Mode brut.
 * @returns {"normal"|"advantage"|"disadvantage"} Mode normalisé.
 */
function normalizeRollMode(mode) {
  const normalized = String(mode ?? ROLL_MODES.NORMAL).trim();

  return Object.values(ROLL_MODES).includes(normalized)
    ? normalized
    : ROLL_MODES.NORMAL;
}

/**
 * Normalise la comparaison entre attaque et défense.
 *
 * Toute valeur inconnue revient à `equal`.
 *
 * @param {unknown} value - Valeur brute.
 * @returns {"lower"|"equal"|"higher"} Comparaison normalisée.
 */
function normalizeAttackDefenseComparison(value) {
  const normalized = String(value ?? DEFAULT_ATTACK_DEF_COMPARISON).trim();

  return ATTACK_DEF_COMPARISON_VALUES.has(normalized)
    ? normalized
    : DEFAULT_ATTACK_DEF_COMPARISON;
}

/**
 * Calcule le delta de seuil lié à la comparaison de défense.
 *
 * @param {"lower"|"equal"|"higher"} vsDefense - Comparaison de défense.
 * @returns {number} Delta de seuil.
 */
function getDefenseDelta(vsDefense) {
  if (vsDefense === ATTACK_DEF_COMPARISONS.HIGHER) return -1;
  if (vsDefense === ATTACK_DEF_COMPARISONS.LOWER) return 1;

  return 0;
}

/**
 * Calcule le décalage de seuil causé par les états actifs.
 *
 * Un décalage positif rend le jet plus difficile.
 *
 * @param {object} effects - Effets d’états dérivés de l’acteur.
 * @returns {number} Décalage de seuil.
 */
function getAttackStateShift(effects = {}) {
  return (effects.attackDisadvantage ? 1 : 0)
    + (effects.allTestsDisadvantage ? 1 : 0)
    + (effects.blindAttackDisadvantage ? 1 : 0);
}

/**
 * Borne le seuil final d’une attaque.
 *
 * La version actuelle force le seuil final entre 2 et 6.
 * Cela conserve le comportement de ton code actuel.
 *
 * Si tu veux préserver le seuil impossible `7` comme dans `clampTarget()`,
 * il faudra remplacer cette logique par `clampTarget()`.
 *
 * @param {unknown} value - Seuil final brut.
 * @returns {number} Seuil final borné.
 */
function clampAttackFinalTarget(value) {
  const numericValue = Number(value ?? 6);

  if (!Number.isFinite(numericValue)) return 6;

  return Math.max(2, Math.min(6, Math.floor(numericValue)));
}

/**
 * Prépare les informations de précision affichées pour une attaque.
 *
 * La précision ne modifie pas le jet dans ce service.
 * Elle est seulement calculée et affichée dans la carte de chat.
 *
 * @param {Actor} actor - Acteur attaquant.
 * @param {object} attack - Données de l’attaque.
 * @returns {{key: string, base: number|null, bonus: number, total: number|null, label: string}} Contexte de précision.
 */
function buildAttackPrecisionContext(actor, attack = {}) {
  const precisionBaseKey = String(attack?.precisionBase ?? "").trim().toLowerCase();

  const precisionMap = {
    prc: Number(actor?.system?.derived?.attacks?.prc ?? 0),
    prd: Number(actor?.system?.derived?.attacks?.prd ?? 0),
    prm: Number(actor?.system?.derived?.attacks?.prm ?? 0)
  };

  const precisionBaseValue = PRECISION_KEYS.includes(precisionBaseKey)
    && Number.isFinite(precisionMap[precisionBaseKey])
    ? precisionMap[precisionBaseKey]
    : null;

  const precisionBonus = toInteger(attack?.precisionBonus);
  const precisionTotal = precisionBaseValue == null
    ? null
    : precisionBaseValue + precisionBonus;

  const precisionLabel = precisionBaseKey
    ? `${precisionBaseKey.toUpperCase()}${precisionBonus ? ` ${precisionBonus > 0 ? "+" : ""}${precisionBonus}` : ""}${precisionTotal != null ? ` → ${precisionTotal}` : ""}`
    : "";

  return {
    key: precisionBaseKey ? precisionBaseKey.toUpperCase() : "",
    base: precisionBaseValue,
    bonus: precisionBonus,
    total: precisionTotal,
    label: precisionLabel
  };
}

/**
 * Construit le label de dégâts affiché dans le chat.
 *
 * Si l’acteur est une invocation et possède un bonus de dés de dégâts,
 * le bonus est ajouté visuellement au label.
 *
 * @param {unknown} damage - Formule de dégâts brute.
 * @param {number} invocationDamageDiceBonus - Bonus de dés d’invocation.
 * @returns {string} Label de dégâts affichable.
 */
function buildDamageLabel(damage, invocationDamageDiceBonus) {
  const baseLabel = String(damage ?? "");

  return invocationDamageDiceBonus > 0
    ? `${baseLabel} + ${invocationDamageDiceBonus}d6`
    : baseLabel;
}


/**
 * Convertit une valeur en nombre fini.
 *
 * @param {unknown} value - Valeur brute.
 * @param {number} [fallback=0] - Valeur utilisée si l’entrée est invalide.
 * @returns {number} Nombre valide.
 */
function toFiniteNumber(value, fallback = 0) {
  const numericValue = Number(value ?? fallback);

  return Number.isFinite(numericValue)
    ? numericValue
    : fallback;
}