/**
 * Service de calcul de puissance des techniques du système Etername.
 *
 * Responsabilités :
 * - normaliser la puissance d’une technique ;
 * - déterminer les seuils de puissance débloqués ;
 * - appliquer les rangs de puissance à la statistique principale ;
 * - appliquer les bonus de seuil aux statistiques choisies ;
 * - calculer les valeurs finales des statistiques selon leurs rangs ;
 * - préparer un résumé complet utilisable par la fiche technique.
 *
 * Ce fichier doit rester dédié au calcul de puissance.
 * Il ne doit pas contenir de logique UI, de validation de formulaire ou de modification d’item.
 */

import { asArray } from '../../utils/arrays.js';
import { toPositiveInteger } from '../../utils/numbers.js';
import {
  clampTechniquePower,
  formatTechniqueStatisticValue,
  getTechniqueStatDefinition,
  getUnlockedTechniquePowerThresholds,
  isTechniqueStatScalable,
  TECHNIQUE_POWER_THRESHOLDS
} from "./stat-definitions.js";

const MAX_TECHNIQUE_POWER = 10;
const TECHNIQUE_POWER_COST_MULTIPLIER = 3;

/**
 * Construit le résumé de puissance complet d’une technique.
 *
 * La puissance agit de deux manières :
 * - elle ajoute des rangs à la statistique principale ;
 * - elle débloque des seuils qui peuvent ajouter des rangs bonus à des statistiques choisies.
 *
 * @param {object} [system={}] - Données système de la technique.
 * @returns {{
 *   power: number,
 *   mainStatisticId: string,
 *   unlockedThresholds: number[],
 *   availableBonusRanks: number,
 *   assignedBonusRanks: number,
 *   missingBonusRanks: number,
 *   stepCosts: object[],
 *   statistics: object[]
 * }} Résumé de puissance de la technique.
 */
export function buildTechniquePowerSummary(system = {}) {
  const power = clampTechniquePower(system.power ?? 0);
  const statisticEntries = asArray(system.statistics);
  const mainStatisticId = String(system.mainStatisticId ?? "").trim();

  const enhancementEntries = normalizeEnhancements(
    system.powerEnhancements,
    statisticEntries
  );

  const unlockedThresholds = getUnlockedTechniquePowerThresholds(power);
  const thresholdBonuses = countEnhancementRanks(enhancementEntries, unlockedThresholds);
  const thresholdLabelsByStatistic = buildThresholdLabelsByStatistic(
    enhancementEntries,
    unlockedThresholds
  );

  const assignedBonusRanks = sumMapValues(thresholdBonuses);
  const availableBonusRanks = unlockedThresholds.length;

  return {
    power,
    mainStatisticId,
    unlockedThresholds,
    availableBonusRanks,
    assignedBonusRanks,
    missingBonusRanks: Math.max(0, availableBonusRanks - assignedBonusRanks),
    stepCosts: buildTechniquePowerStepCosts(power),
    statistics: statisticEntries.map((entry) => {
      return buildStatisticPowerEntry(
        entry,
        mainStatisticId,
        power,
        thresholdBonuses,
        thresholdLabelsByStatistic
      );
    })
  };
}

/**
 * Construit le résumé de puissance d’une statistique de technique.
 *
 * Une statistique reçoit :
 * - ses rangs de puissance si elle est la statistique principale ;
 * - ses rangs bonus si elle est choisie par un ou plusieurs seuils débloqués ;
 * - une valeur finale formatée selon son nombre total de rangs.
 *
 * @param {object} entry - Entrée statistique brute.
 * @param {string} mainStatisticId - Id de la statistique principale.
 * @param {number} power - Puissance normalisée de la technique.
 * @param {Map<string, number>} [thresholdBonuses=new Map()] - Nombre de bonus de seuil par statistique.
 * @param {Map<string, number[]>} [thresholdLabelsByStatistic=new Map()] - Seuils appliqués par statistique.
 * @returns {object} Statistique enrichie par la puissance.
 */
export function buildStatisticPowerEntry(
  entry,
  mainStatisticId,
  power,
  thresholdBonuses = new Map(),
  thresholdLabelsByStatistic = new Map()
) {
  const statisticId = String(entry?.id ?? "").trim();
  const statId = String(entry?.statId ?? "damage").trim();

  const definition = getTechniqueStatDefinition(statId);
  const isMain = statisticId !== "" && statisticId === String(mainStatisticId ?? "");

  const thresholdBonusRanks = toPositiveInteger(
    thresholdBonuses.get(statisticId)
  );

  const powerRanks = isMain ? clampTechniquePower(power) : 0;
  const bonusRanks = powerRanks + thresholdBonusRanks;
  const totalRanks = 1 + bonusRanks;
  const scalesWithPower = isTechniqueStatScalable(statId);

  return {
    statisticId,
    statId,
    isMain,
    thresholdBonusRanks,
    powerRanks,
    bonusRanks,
    totalRanks,
    scalesWithPower,
    baseValue: String(definition.baseValue ?? ""),
    finalValue: formatTechniqueStatisticValue(statId, totalRanks),
    thresholdLabels: thresholdLabelsByStatistic.get(statisticId) ?? []
  };
}

/**
 * Normalise les améliorations de seuil de puissance.
 *
 * Chaque seuil attendu est reconstruit dans l’ordre de `TECHNIQUE_POWER_THRESHOLDS`.
 * La recherche se fait par `threshold`, pas par index, afin d’éviter les erreurs
 * si le tableau stocké est désordonné.
 *
 * Une amélioration est conservée seulement si elle cible une statistique existante.
 *
 * @param {Array<object>} entries - Améliorations brutes.
 * @param {Array<object>} statistics - Statistiques présentes sur la technique.
 * @returns {{threshold: number, statisticId: string}[]} Améliorations normalisées.
 */
function normalizeEnhancements(entries, statistics) {
  const enhancementEntries = asArray(entries);
  const statisticIds = new Set(
    asArray(statistics)
      .map((entry) => String(entry?.id ?? "").trim())
      .filter(Boolean)
  );

  return TECHNIQUE_POWER_THRESHOLDS.map((threshold) => {
    const enhancement = enhancementEntries.find((entry) => {
      return Number(entry?.threshold ?? 0) === threshold;
    });

    const statisticId = String(enhancement?.statisticId ?? "").trim();

    return {
      threshold,
      statisticId: statisticIds.has(statisticId) ? statisticId : ""
    };
  });
}

/**
 * Compte le nombre de rangs bonus accordés par les seuils débloqués.
 *
 * Chaque seuil débloqué qui cible une statistique ajoute 1 rang bonus
 * à cette statistique.
 *
 * @param {{threshold: number, statisticId: string}[]} enhancementEntries - Améliorations normalisées.
 * @param {number[]} unlockedThresholds - Seuils actuellement débloqués.
 * @returns {Map<string, number>} Nombre de rangs bonus par statistique.
 */
function countEnhancementRanks(enhancementEntries, unlockedThresholds) {
  const unlockedSet = new Set(unlockedThresholds);
  const counts = new Map();

  for (const entry of asArray(enhancementEntries)) {
    const threshold = Number(entry?.threshold ?? 0);

    if (!unlockedSet.has(threshold)) continue;

    const statisticId = String(entry?.statisticId ?? "").trim();

    if (!statisticId) continue;

    counts.set(statisticId, (counts.get(statisticId) ?? 0) + 1);
  }

  return counts;
}

/**
 * Construit la liste des seuils appliqués à chaque statistique.
 *
 * Cette fonction sert à afficher précisément quels seuils de puissance
 * donnent un bonus à une statistique donnée.
 *
 * @param {{threshold: number, statisticId: string}[]} enhancementEntries - Améliorations normalisées.
 * @param {number[]} unlockedThresholds - Seuils actuellement débloqués.
 * @returns {Map<string, number[]>} Seuils appliqués par statistique.
 */
function buildThresholdLabelsByStatistic(enhancementEntries, unlockedThresholds) {
  const unlockedSet = new Set(unlockedThresholds);
  const labelsByStatistic = new Map();

  for (const entry of asArray(enhancementEntries)) {
    const threshold = Number(entry?.threshold ?? 0);

    if (!unlockedSet.has(threshold)) continue;

    const statisticId = String(entry?.statisticId ?? "").trim();

    if (!statisticId) continue;

    const labels = labelsByStatistic.get(statisticId) ?? [];
    labels.push(threshold);
    labelsByStatistic.set(statisticId, labels);
  }

  return labelsByStatistic;
}

/**
 * Construit les coûts de chaque niveau de puissance.
 *
 * Le coût affiché ici est le coût du niveau individuel,
 * pas le coût cumulé.
 *
 * @param {number} currentPower - Puissance actuelle de la technique.
 * @returns {{power: number, unlocked: boolean, xpCost: number}[]} Coûts par niveau.
 */
function buildTechniquePowerStepCosts(currentPower) {
  const power = clampTechniquePower(currentPower);

  return Array.from({ length: MAX_TECHNIQUE_POWER }, (_, index) => {
    const stepPower = index + 1;

    return {
      power: stepPower,
      unlocked: stepPower <= power,
      xpCost: stepPower * TECHNIQUE_POWER_COST_MULTIPLIER
    };
  });
}

/**
 * Additionne les valeurs numériques d’une Map.
 *
 * @param {Map<string, number>} map - Map à additionner.
 * @returns {number} Somme des valeurs.
 */
function sumMapValues(map) {
  return Array.from(map.values()).reduce((total, value) => {
    return total + toPositiveInteger(value);
  }, 0);
}


