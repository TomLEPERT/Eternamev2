/**
 * Service de jets d’attributs du système Etername.
 *
 * Responsabilités :
 * - préparer les données nécessaires à un jet d’attribut ;
 * - récupérer les valeurs de base et dérivées de l’attribut ;
 * - appliquer les modificateurs de seuil liés au mode de jet ;
 * - appliquer les désavantages venant des états actifs ;
 * - exécuter le jet de dés ;
 * - construire et poster la carte de résultat dans le chat.
 *
 * Ce fichier doit rester dédié aux jets d’attributs.
 * Il ne doit pas contenir la logique de calcul des attributs dérivés,
 * ni la logique détaillée des états, ni la gestion DOM des dialogues.
 */

import { toPositiveInteger } from '../../utils/numbers.js';
import {
  indexStringToTarget,
  targetToIndexString,
  valueToIndex
} from "../../rules/derived/attributes.js";
import { ETERNAME_ATTRIBUTES } from "../constants/attributes.js";
import {
  applyTargetDelta,
  modeToDelta,
  ROLL_MODES
} from "./modifiers.js";

const ATTRIBUTE_ROLL_TEMPLATE = "systems/eternamev2/templates/chat/attribute-roll.hbs";
const BASE_ATTRIBUTE_DICE = 3;

/**
 * Récupère le nom localisé d’un attribut.
 *
 * Si l’attribut existe dans le référentiel système, son label i18n est utilisé.
 * Sinon, la fonction revient à l’abréviation stockée sur l’acteur, puis à la clé brute.
 *
 * @param {string} key - Clé interne de l’attribut.
 * @param {object} [attr={}] - Données d’attribut stockées sur l’acteur.
 * @returns {string} Label affichable.
 */
function getAttributeLabel(key, attr = {}) {
  const meta = ETERNAME_ATTRIBUTES[key];

  return meta
    ? game.i18n.localize(meta.label)
    : attr?.abbr ?? key;
}

/**
 * Récupère l’abréviation d’un attribut.
 *
 * Priorité :
 * - abréviation stockée sur l’acteur ;
 * - abréviation du référentiel système ;
 * - clé brute.
 *
 * @param {string} key - Clé interne de l’attribut.
 * @param {object} [attr={}] - Données d’attribut stockées sur l’acteur.
 * @returns {string} Abréviation affichable.
 */
function getAttributeAbbr(key, attr = {}) {
  const meta = ETERNAME_ATTRIBUTES[key];

  return attr?.abbr ?? meta?.abbr ?? key;
}

/**
 * Calcule le décalage de seuil causé par les états actifs de l’acteur.
 *
 * Un décalage positif rend le jet plus difficile.
 *
 * Effets actuellement pris en compte :
 * - désavantage sur tous les tests ;
 * - désavantage spécifique à la perception.
 *
 * @param {Actor} actor - Acteur qui effectue le jet.
 * @param {string} attributeKey - Attribut testé.
 * @returns {number} Décalage de seuil causé par les états.
 */
function getAttributeStateShift(actor, attributeKey) {
  const effects = actor?.system?.derived?.stateEffects ?? {};
  let shift = 0;

  if (effects.allTestsDisadvantage) shift += 1;
  if (attributeKey === "perception" && effects.perceptionDisadvantage) shift += 1;

  return shift;
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
 * Convertit une valeur en nombre fini.
 *
 * @param {unknown} value - Valeur brute.
 * @param {number} [fallback=0] - Valeur utilisée si l’entrée est invalide.
 * @returns {number} Nombre valide.
 */
function toFiniteNumber(value, fallback = 0) {
  const numericValue = Number(value ?? fallback);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

/**
 * Prépare les données nécessaires à un jet d’attribut.
 *
 * Cette fonction ne lance pas le jet.
 * Elle prépare seulement :
 * - l’attribut testé ;
 * - le nombre de dés ;
 * - le seuil de réussite ;
 * - les modificateurs liés aux états et au mode de jet.
 *
 * @param {Actor} actor - Acteur qui effectue le jet.
 * @param {string} attributeKey - Clé de l’attribut testé.
 * @param {object} [options={}] - Options du jet.
 * @param {string} [options.mode] - Mode de jet : normal, advantage ou disadvantage.
 * @returns {object|null} Données du jet, ou `null` si l’attribut est introuvable.
 */
export function buildAttributeRollData(actor, attributeKey, options = {}) {
  const attr = actor?.system?.attributes?.[attributeKey];

  if (!attr) return null;

  const derived = actor?.system?.derived?.attributes?.[attributeKey] ?? {};

  const value = toFiniteNumber(derived.total ?? attr.value, 0);
  const ticks = toPositiveInteger(attr.ticks);
  const bonusDice = Math.floor(toFiniteNumber(derived.bonusDice, 0));
  const index = String(derived.index ?? valueToIndex(value));

  const mode = normalizeRollMode(options.mode);
  const baseTarget = indexStringToTarget(index);

  const stateShift = getAttributeStateShift(actor, attributeKey);
  const userShift = modeToDelta(mode, 1);
  const threshold = applyTargetDelta(baseTarget, userShift + stateShift);

  return {
    actor,
    attributeKey,
    attribute: {
      key: attributeKey,
      label: getAttributeLabel(attributeKey, attr),
      abbr: getAttributeAbbr(attributeKey, attr),
      value,
      ticks,
      index,
      bonusDice
    },
    mode,
    diceCount: Math.max(0, BASE_ATTRIBUTE_DICE + ticks + bonusDice),
    threshold,
    stateShift
  };
}

/**
 * Exécute un jet d’attribut et poste son résultat dans le chat.
 *
 * La fonction :
 * - prépare les données du jet ;
 * - lance les dés ;
 * - détermine les succès selon le seuil ajusté ;
 * - rend le template de chat ;
 * - crée le message de chat Foundry ;
 * - renvoie les données complètes du jet.
 *
 * @param {Actor} actor - Acteur qui effectue le jet.
 * @param {string} attributeKey - Clé de l’attribut testé.
 * @param {object} [options={}] - Options du jet.
 * @returns {Promise<object|null>} Résultat du jet, ou `null` si le jet est impossible.
 */
export async function executeAttributeRoll(actor, attributeKey, options = {}) {
  const data = buildAttributeRollData(actor, attributeKey, options);

  if (!data) return null;

  const formula = `${data.diceCount}d6`;
  const roll = await new Roll(formula).evaluate();

  const dieResults = (roll.dice?.[0]?.results ?? []).map((result, index) => {
    const value = Number(result?.result ?? 0);
    const success = value >= data.threshold.adjustedTarget;

    return {
      index,
      value,
      success
    };
  });

  const successes = dieResults.reduce((total, die) => {
    return total + (die.success ? 1 : 0);
  }, 0);

  const content = await foundry.applications.handlebars.renderTemplate(
    ATTRIBUTE_ROLL_TEMPLATE,
    {
      actorName: actor.name,
      attribute: data.attribute,
      mode: data.mode,
      modeLabel: game.i18n.localize(`ETERN.ROLL.MODE.${data.mode.toUpperCase()}`),
      diceCount: data.diceCount,
      targetLabel: targetToIndexString(data.threshold.adjustedTarget),
      baseTargetLabel: targetToIndexString(data.threshold.baseTarget),
      thresholdAdjusted: data.threshold.adjustedTarget !== data.threshold.baseTarget,
      dice: dieResults,
      successes,
      hasSuccesses: successes > 0,
      formulaLabel: formula,
      ticksLabel: data.attribute.ticks,
      rollTotal: roll.total,
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
    dice: dieResults,
    successes
  };
}