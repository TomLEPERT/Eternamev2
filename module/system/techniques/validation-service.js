/**
 * Service de validation des techniques du système Etername.
 *
 * Responsabilités :
 * - vérifier qu’une technique respecte les contraintes de création ;
 * - produire les erreurs bloquantes ;
 * - produire les avertissements non bloquants ;
 * - vérifier les sources importées depuis les métiers ;
 * - vérifier les statistiques, la statistique principale et les seuils de puissance ;
 * - retourner un résumé utilisable directement par la fiche item.
 *
 * Ce fichier doit rester dédié à la validation.
 * Il ne doit pas contenir de logique de rendu, d’autosave ou de modification directe des items.
 */

import { asArray } from '../../utils/arrays.js';
import { uniqueIds } from '../../utils/ids.js';
import {
  TECHNIQUE_POWER_THRESHOLDS,
  isTechniqueStatScalable
} from "./stat-definitions.js";

import { buildTechniqueSlotBudget } from "./slot-budget-service.js";
import { normalizeTechniqueUsageType } from "./usage-service.js";
import { buildTechniqueEntrySourceStatus } from "./source-sync-service.js";

const STATE_APPLICATION_STAT_ID = "apply_state";
const TECHNIQUE_SECTION_KEYS = Object.freeze(["keys", "conditions", "mechanics", "states"]);

const MAX_TECHNIQUE_POWER = 10;
const MAX_SOURCE_PROFESSIONS = 2;
const MAX_CONDITIONS = 2;
const MAX_MECHANICS = 3;

/**
 * Construit le résumé de validation complet d’une technique.
 *
 * Le résumé distingue :
 * - les erreurs, qui rendent la technique invalide ;
 * - les avertissements, qui signalent un problème potentiel sans bloquer ;
 * - le budget de slots de statistiques ;
 * - les compteurs utiles pour l’affichage.
 *
 * @param {Item} item - Item technique ou héritage technique à valider.
 * @returns {{
 *   isValid: boolean,
 *   hasMessages: boolean,
 *   errors: object[],
 *   warnings: object[],
 *   slotBudget: object,
 *   counts: object
 * }} Résumé de validation prêt pour le contexte de fiche.
 */
export function buildTechniqueValidationSummary(item) {
  const system = item?.system ?? {};
  const actor = item?.parent;

  const professionIds = uniqueIds(system.professionIds);
  const keys = asArray(system.keys);
  const conditions = asArray(system.conditions);
  const mechanics = asArray(system.mechanics);
  const states = asArray(system.states);
  const statistics = asArray(system.statistics);
  const powerEnhancements = asArray(system.powerEnhancements);

  const mainStatisticId = String(system.mainStatisticId ?? "").trim();
  const power = normalizeTechniquePower(system.power);
  const usageType = normalizeTechniqueUsageType(system.usageType ?? "attack");

  const errors = [];
  const warnings = [];
  const slotBudget = buildTechniqueSlotBudget(system, actor);

  const requiresProfessionSource = item?.type === "technique";

  validateTechniqueBasics({
    system,
    professionIds,
    keys,
    conditions,
    mechanics,
    usageType,
    requiresProfessionSource,
    errors,
    warnings
  });

  validateTechniqueStatistics({
    statistics,
    mainStatisticId,
    power,
    slotBudget,
    errors,
    warnings
  });

  validatePowerEnhancements({
    power,
    powerEnhancements,
    statisticEntryIds: getStatisticEntryIds(statistics),
    errors,
    warnings
  });

  validateImportedSources({
    actor,
    system,
    professionIds,
    warnings
  });

  validateEquippedSourceProfessions({
    actor,
    professionIds,
    requiresProfessionSource,
    warnings
  });

  return {
    isValid: errors.length === 0,
    hasMessages: errors.length > 0 || warnings.length > 0,
    errors,
    warnings,
    slotBudget,
    counts: {
      professions: professionIds.length,
      keys: keys.length,
      conditions: conditions.length,
      mechanics: mechanics.length,
      states: states.length,
      statistics: statistics.length,
      power
    }
  };
}

/**
 * Vérifie les contraintes générales d’une technique.
 *
 * Cette validation couvre :
 * - la présence d’un métier source pour les techniques classiques ;
 * - l’attribut lié requis pour les rituels ;
 * - le nombre maximum de métiers sources ;
 * - la présence d’au moins une clé ;
 * - le nombre maximum de conditions et mécaniques ;
 * - les mécaniques dupliquées par nom.
 *
 * @param {object} params - Paramètres de validation.
 * @returns {void}
 */
function validateTechniqueBasics({
  system,
  professionIds,
  keys,
  conditions,
  mechanics,
  usageType,
  requiresProfessionSource,
  errors,
  warnings
}) {
  if (requiresProfessionSource && !professionIds.length) {
    warnings.push({ key: "ETERN.TECHNIQUE.VALIDATION.NO_SOURCE_PROFESSION" });
  }

  if (usageType === "ritual" && !String(system.linkedAttributeKey ?? "").trim()) {
    errors.push({ key: "ETERN.TECHNIQUE.VALIDATION.MISSING_LINKED_ATTRIBUTE" });
  }

  if (professionIds.length > MAX_SOURCE_PROFESSIONS) {
    errors.push({ key: "ETERN.TECHNIQUE.VALIDATION.MAX_SOURCE_PROFESSIONS" });
  }

  if (!keys.length) {
    warnings.push({ key: "ETERN.TECHNIQUE.VALIDATION.NO_KEY" });
  }

  if (conditions.length > MAX_CONDITIONS) {
    errors.push({ key: "ETERN.TECHNIQUE.VALIDATION.MAX_CONDITIONS" });
  }

  if (mechanics.length > MAX_MECHANICS) {
    errors.push({ key: "ETERN.TECHNIQUE.VALIDATION.MAX_MECHANICS" });
  }

  const duplicateMechanicNames = getDuplicateNames(mechanics);

  if (duplicateMechanicNames.length) {
    errors.push({
      key: "ETERN.TECHNIQUE.VALIDATION.DUPLICATE_MECHANICS",
      data: {
        names: duplicateMechanicNames.join(", ")
      }
    });
  }
}

/**
 * Vérifie les statistiques d’une technique.
 *
 * Cette validation couvre :
 * - la présence d’au moins une statistique ;
 * - la présence et la validité de la statistique principale ;
 * - la limite d’une seule application d’état ;
 * - le respect du budget de slots statistiques ;
 * - l’avertissement si la statistique principale ne scale pas avec la puissance.
 *
 * @param {object} params - Paramètres de validation.
 * @returns {void}
 */
function validateTechniqueStatistics({
  statistics,
  mainStatisticId,
  power,
  slotBudget,
  errors,
  warnings
}) {
  const statisticEntryIds = getStatisticEntryIds(statistics);
  const statisticStatIds = statistics.map((entry) => String(entry?.statId ?? "").trim());

  if (!statistics.length) {
    errors.push({ key: "ETERN.TECHNIQUE.VALIDATION.NO_STATISTICS" });
    return;
  }

  if (!mainStatisticId) {
    errors.push({ key: "ETERN.TECHNIQUE.VALIDATION.MISSING_MAIN_STATISTIC" });
  } else if (!statisticEntryIds.has(mainStatisticId)) {
    errors.push({ key: "ETERN.TECHNIQUE.VALIDATION.INVALID_MAIN_STATISTIC" });
  }

  const applyStateCount = statisticStatIds
    .filter((statId) => statId === STATE_APPLICATION_STAT_ID)
    .length;

  if (applyStateCount > 1) {
    errors.push({ key: "ETERN.TECHNIQUE.VALIDATION.MAX_STATE_APPLICATIONS" });
  }

  if (slotBudget.usedStatisticSlots > slotBudget.availableStatisticSlots) {
    errors.push({
      key: "ETERN.TECHNIQUE.VALIDATION.TOO_MANY_STATISTICS",
      data: {
        used: slotBudget.usedStatisticSlots,
        available: slotBudget.availableStatisticSlots
      }
    });
  } else if (!slotBudget.fitsWithinSlots) {
    errors.push({
      key: "ETERN.TECHNIQUE.VALIDATION.STATISTICS_DO_NOT_FIT_SLOTS",
      data: {
        freeUsed: slotBudget.usedFreeSlots,
        freeAvailable: slotBudget.freeSlots
      }
    });
  }

  if (!mainStatisticId) return;

  const mainEntry = statistics.find((entry) => {
    return String(entry?.id ?? "").trim() === mainStatisticId;
  });

  if (mainEntry && !isTechniqueStatScalable(mainEntry.statId ?? "damage") && power > 0) {
    warnings.push({ key: "ETERN.TECHNIQUE.VALIDATION.NON_SCALING_MAIN_STATISTIC" });
  }
}

/**
 * Vérifie les améliorations débloquées par les seuils de puissance.
 *
 * Cette validation couvre :
 * - les seuils débloqués mais sans statistique sélectionnée ;
 * - les seuils qui pointent vers une statistique inexistante ;
 * - les seuils verrouillés qui ont pourtant une statistique sélectionnée.
 *
 * @param {object} params - Paramètres de validation.
 * @returns {void}
 */
function validatePowerEnhancements({
  power,
  powerEnhancements,
  statisticEntryIds,
  errors,
  warnings
}) {
  for (const threshold of TECHNIQUE_POWER_THRESHOLDS) {
    const enhancement = powerEnhancements.find((entry) => {
      return Number(entry?.threshold ?? 0) === threshold;
    });

    const selectedStatisticId = String(enhancement?.statisticId ?? "").trim();

    if (threshold <= power && !selectedStatisticId) {
      warnings.push({
        key: "ETERN.TECHNIQUE.VALIDATION.EMPTY_UNLOCKED_THRESHOLD",
        data: { threshold }
      });
    }

    if (selectedStatisticId && !statisticEntryIds.has(selectedStatisticId)) {
      errors.push({
        key: "ETERN.TECHNIQUE.VALIDATION.INVALID_THRESHOLD_STATISTIC",
        data: { threshold }
      });
    }

    if (threshold > power && selectedStatisticId) {
      warnings.push({
        key: "ETERN.TECHNIQUE.VALIDATION.LOCKED_THRESHOLD_SELECTED",
        data: { threshold }
      });
    }
  }
}

/**
 * Vérifie l’état des entrées importées depuis les métiers sources.
 *
 * Cette validation signale :
 * - une source importée manquante ;
 * - une source importée obsolète ;
 * - une source provenant d’un métier qui n’est plus sélectionné.
 *
 * @param {object} params - Paramètres de validation.
 * @returns {void}
 */
function validateImportedSources({
  actor,
  system,
  professionIds,
  warnings
}) {
  for (const sectionKey of TECHNIQUE_SECTION_KEYS) {
    for (const entry of asArray(system[sectionKey])) {
      const sourceStatus = buildTechniqueEntrySourceStatus(
        actor,
        sectionKey,
        entry,
        professionIds
      );

      const name = String(entry?.name ?? "") || "—";

      if (sourceStatus.isMissing) {
        warnings.push({
          key: "ETERN.TECHNIQUE.VALIDATION.MISSING_IMPORTED_SOURCE",
          data: { name }
        });
      } else if (sourceStatus.isOutdated) {
        warnings.push({
          key: "ETERN.TECHNIQUE.VALIDATION.OUTDATED_IMPORTED_SOURCE",
          data: { name }
        });
      } else if (sourceStatus.hasSource && !sourceStatus.isFromSelectedProfession) {
        warnings.push({
          key: "ETERN.TECHNIQUE.VALIDATION.SOURCE_NOT_SELECTED",
          data: { name }
        });
      }
    }
  }
}

/**
 * Vérifie que les métiers sources d’une technique sont équipés par le personnage.
 *
 * Cette validation ne concerne que :
 * - les techniques classiques ;
 * - les acteurs de type personnage.
 *
 * Les techniques d’héritage ne nécessitent pas de métier source équipé.
 *
 * @param {object} params - Paramètres de validation.
 * @returns {void}
 */
function validateEquippedSourceProfessions({
  actor,
  professionIds,
  requiresProfessionSource,
  warnings
}) {
  if (!requiresProfessionSource || actor?.type !== "character") return;

  const equippedIds = new Set([
    String(actor.system?.techniques?.professionSlots?.first ?? "").trim(),
    String(actor.system?.techniques?.professionSlots?.second ?? "").trim()
  ].filter(Boolean));

  const notEquippedNames = professionIds
    .filter((professionId) => !equippedIds.has(professionId))
    .map((professionId) => actor.items.get(professionId)?.name)
    .filter(Boolean);

  if (notEquippedNames.length) {
    warnings.push({
      key: "ETERN.TECHNIQUE.VALIDATION.SOURCE_NOT_EQUIPPED",
      data: {
        names: notEquippedNames.join(", ")
      }
    });
  }
}


/**
 * Normalise la puissance d’une technique.
 *
 * La puissance est bornée entre 0 et `MAX_TECHNIQUE_POWER`.
 *
 * @param {unknown} value - Valeur brute de puissance.
 * @returns {number} Puissance normalisée.
 */
function normalizeTechniquePower(value) {
  const numericValue = Number(value ?? 0);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;

  return Math.max(0, Math.min(MAX_TECHNIQUE_POWER, Math.floor(safeValue)));
}

/**
 * Construit l’ensemble des ids d’entrées statistiques.
 *
 * Ces ids sont utilisés pour vérifier :
 * - la statistique principale ;
 * - les statistiques ciblées par les seuils de puissance.
 *
 * @param {Array<{id?: string}>} statistics - Liste des statistiques de la technique.
 * @returns {Set<string>} Ensemble des ids statistiques valides.
 */
function getStatisticEntryIds(statistics) {
  return new Set(
    asArray(statistics)
      .map((entry) => String(entry?.id ?? "").trim())
      .filter(Boolean)
  );
}

/**
 * Trouve les noms dupliqués dans une liste d’entrées.
 *
 * La comparaison est insensible à la casse.
 * Les entrées sans nom sont ignorées.
 *
 * @param {Array<{name?: string}>} entries - Entrées à analyser.
 * @returns {string[]} Liste triée des noms présents plusieurs fois.
 */
function getDuplicateNames(entries) {
  const counts = new Map();

  for (const entry of asArray(entries)) {
    const key = String(entry?.name ?? "").trim().toLowerCase();

    if (!key) continue;

    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([name]) => name)
    .sort((left, right) => left.localeCompare(right, game.i18n.lang));
}