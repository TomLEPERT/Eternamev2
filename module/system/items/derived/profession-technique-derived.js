/**
 * Préparation des données dérivées des métiers, techniques et héritages.
 *
 * Responsabilités :
 * - normaliser les données système des métiers ;
 * - normaliser les données système des techniques ;
 * - normaliser les données système des héritages passifs ou techniques ;
 * - préparer les entrées de builder : passifs, clés, conditions, mécaniques et états ;
 * - calculer les résumés dérivés des techniques : XP, puissance, résumé lisible et budget de slots ;
 * - garantir une structure stable pour les modules, bonus, compteurs et pistes de progression.
 *
 * Ce fichier doit rester centré sur la préparation de données.
 * Il ne doit pas gérer le DOM, les événements de fiche, la création d’items ou les messages de chat.
 */

import { asArray } from '../../../utils/arrays.js';
import { uniqueIds } from '../../../utils/ids.js';
import { toInteger, toPositiveInteger } from '../../../utils/numbers.js';
import {
  clampTechniquePower,
  normalizeTechniqueStatId,
  TECHNIQUE_POWER_THRESHOLDS
} from "../../techniques/stat-definitions.js";

import { buildTechniqueXpSummary } from "../../techniques/xp-service.js";
import {
  getTechniqueModuleStateDefinition,
  normalizeTechniqueModuleSlotType
} from "../../techniques/module-entry-config.js";

import {
  normalizeTechniqueModuleReferenceKey,
  resolveTechniqueModuleStateId
} from "../../techniques/module-reference-service.js";

import { buildTechniquePowerSummary } from "../../techniques/power-service.js";
import { buildTechniqueReadableSummary } from "../../techniques/summary-service.js";
import { buildTechniqueSlotBudget } from "../../techniques/slot-budget-service.js";

import {
  normalizeTechniqueLinkedAttributeKey,
  normalizeTechniqueUsageType
} from "../../techniques/usage-service.js";

import { normalizeProfessionProgressTrackData } from "../../../rules/professions/progress-track.js";

import {
  normalizeHeritageFeatureType,
  normalizeHeritageType
} from "../../constants/heritages.js";

const BUILDER_SECTION_KEYS = Object.freeze([
  "passives",
  "keys",
  "conditions",
  "mechanics",
  "states"
]);

const TECHNIQUE_COMPONENT_SECTION_KEYS = Object.freeze([
  "keys",
  "conditions",
  "mechanics",
  "states"
]);

/**
 * Prépare les données système d’un item métier.
 *
 * La fonction normalise :
 * - la description ;
 * - les passifs ;
 * - les clés ;
 * - les conditions ;
 * - les mécaniques ;
 * - les états ;
 * - les compteurs dérivés d’entrées.
 *
 * @param {Item} item - Item métier.
 * @param {object} system - Données système mutables de l’item.
 * @returns {void}
 */
export function prepareProfessionData(item, system) {
  system.description = String(system.description ?? "");

  system.passives = normalizeBuilderEntries(system.passives, {
    withActive: true,
    sectionKey: "passives"
  });

  system.keys = normalizeBuilderEntries(system.keys, {
    withUniversal: true,
    sectionKey: "keys"
  });

  system.conditions = normalizeBuilderEntries(system.conditions, {
    withUniversal: true,
    sectionKey: "conditions"
  });

  system.mechanics = normalizeBuilderEntries(system.mechanics, {
    withUniversal: true,
    sectionKey: "mechanics"
  });

  system.states = normalizeBuilderEntries(system.states, {
    withUniversal: true,
    sectionKey: "states"
  });

  system.derived ??= {};
  system.derived.entryCounts = buildEntryCounts(system);

  if (!String(item.name ?? "").trim()) {
    item.name = game.i18n.localize("ETERN.ITEM.DEFAULT_PROFESSION_NAME");
  }
}

/**
 * Prépare les données système d’un item technique.
 *
 * La fonction normalise les composants, statistiques, puissance et sources,
 * puis calcule les données dérivées utilisées par les fiches et le chat.
 *
 * @param {Item} item - Item technique.
 * @param {object} system - Données système mutables de l’item.
 * @returns {void}
 */
export function prepareTechniqueData(item, system) {
  system.description = String(system.description ?? "");
  system.prepared = Boolean(system.prepared);
  system.usageType = normalizeTechniqueUsageType(system.usageType ?? "attack");
  system.linkedAttributeKey = normalizeTechniqueLinkedAttributeKey(system.linkedAttributeKey ?? "magic");
  system.professionIds = uniqueIds(system.professionIds);

  system.keys = normalizeBuilderEntries(system.keys, {
    withSource: true,
    sectionKey: "keys"
  });

  system.conditions = normalizeBuilderEntries(system.conditions, {
    withSource: true,
    sectionKey: "conditions"
  });

  system.mechanics = normalizeBuilderEntries(system.mechanics, {
    withSource: true,
    sectionKey: "mechanics"
  });

  system.states = normalizeBuilderEntries(system.states, {
    withSource: true,
    sectionKey: "states"
  });

  system.statistics = normalizeTechniqueStatistics(system.statistics);
  system.power = clampTechniquePower(system.power ?? 0);
  system.powerEnhancements = normalizeTechniquePowerEnhancements(
    system.powerEnhancements,
    system.statistics
  );

  system.mainStatisticId = normalizeMainStatisticId(
    system.mainStatisticId,
    system.statistics
  );

  const xpSummary = buildTechniqueXpSummary(system);
  const powerSummary = buildTechniquePowerSummary(system);
  const readableSummary = buildTechniqueReadableSummary(item, powerSummary, xpSummary);
  const slotBudget = buildTechniqueSlotBudget(system, item.parent ?? null);

  system.derived ??= {};
  system.derived.creationXp = xpSummary.creationXp;
  system.derived.powerXp = xpSummary.powerXp;
  system.derived.totalXp = xpSummary.totalXp;
  system.derived.xpBreakdown = xpSummary.breakdown;
  system.derived.powerSummary = powerSummary;
  system.derived.summary = readableSummary;
  system.derived.slotBudget = slotBudget;

  if (!String(item.name ?? "").trim()) {
    item.name = game.i18n.localize("ETERN.ITEM.DEFAULT_TECHNIQUE_NAME");
  }
}

/**
 * Prépare les données système d’un héritage.
 *
 * Un héritage peut être :
 * - passif : il utilise une liste de passifs ;
 * - technique : il réutilise la préparation complète des techniques.
 *
 * @param {Item} item - Item héritage.
 * @param {object} system - Données système mutables de l’item.
 * @returns {void}
 */
export function prepareHeritageData(item, system) {
  const hadName = Boolean(String(item.name ?? "").trim());

  system.description = String(system.description ?? "");
  system.heritageType = normalizeHeritageType(system.heritageType ?? "ancestral");
  system.featureType = normalizeHeritageFeatureType(system.featureType ?? "passive");
  system.active = Boolean(system.active);
  system.prepared = Boolean(system.prepared);

  if (system.featureType === "technique") {
    system.passives = [];
    prepareTechniqueData(item, system);
  } else {
    prepareHeritagePassiveData(system);
  }

  if (!hadName) {
    item.name = game.i18n.localize(
      getDefaultHeritageNameKey(system.heritageType, system.featureType)
    );
  }
}

/**
 * Prépare les données propres à un héritage passif.
 *
 * @param {object} system - Données système de l’héritage.
 * @returns {void}
 */
function prepareHeritagePassiveData(system) {
  system.passives = normalizeBuilderEntries(system.passives, {
    withActive: true,
    sectionKey: "passives"
  });

  const passiveXp = system.passives.reduce((total, entry) => {
    return total + Math.max(0, toInteger(entry?.xpCost));
  }, 0);

  system.derived ??= {};
  system.derived.entryCounts = {
    passives: system.passives.length
  };
  system.derived.totalXp = passiveXp;
  system.derived.summary = {
    headline: String(system.description ?? ""),
    shortText: String(system.description ?? ""),
    professions: [],
    componentSections: [],
    statistics: []
  };
}

/**
 * Normalise les entrées d’une section de builder.
 *
 * Cette fonction est utilisée pour :
 * - les passifs ;
 * - les clés ;
 * - les conditions ;
 * - les mécaniques ;
 * - les états.
 *
 * Elle garantit une structure commune pour les capacités optionnelles :
 * slots statistiques, statistiques, compteur, améliorations, bonus acteur,
 * piste de progression et récompenses.
 *
 * @param {Array<object>} entries - Entrées brutes.
 * @param {object} [options={}] - Options de normalisation.
 * @param {boolean} [options.withActive=false] - Ajoute le champ `isActive`.
 * @param {boolean} [options.withUniversal=false] - Ajoute le champ `isUniversal`.
 * @param {boolean} [options.withSource=false] - Ajoute les champs de source métier.
 * @param {string} [options.sectionKey=""] - Section courante.
 * @returns {object[]} Entrées normalisées.
 */
function normalizeBuilderEntries(
  entries,
  {
    withActive = false,
    withUniversal = false,
    withSource = false,
    sectionKey = ""
  } = {}
) {
  return asArray(entries).map((entry) => {
    const rawStatisticSlots = normalizeTechniqueStatisticSlots(
      entry?.statisticSlots,
      entry?.extraStatisticSlots
    );

    const hasStatisticSlots = normalizeCapabilityFlag(
      entry,
      "hasStatisticSlots",
      rawStatisticSlots.length > 0
    );

    const statisticSlots = hasStatisticSlots ? rawStatisticSlots : [];

    const rawStatistics = normalizeTechniqueStatistics(entry?.statistics);
    const hasStatistics = normalizeCapabilityFlag(
      entry,
      "hasStatistics",
      rawStatistics.length > 0
    );
    const statistics = hasStatistics ? rawStatistics : [];

    const counter = normalizeTechniqueCounter(entry?.counter);

    const rawImprovements = normalizeTechniqueImprovements(entry?.improvements);
    const hasImprovements = normalizeCapabilityFlag(
      entry,
      "hasImprovements",
      rawImprovements.length > 0
    );
    const improvements = hasImprovements ? rawImprovements : [];

    const rawActorBonuses = normalizeTechniqueActorBonuses(entry?.actorBonuses);
    const hasActorBonuses = normalizeCapabilityFlag(
      entry,
      "hasActorBonuses",
      rawActorBonuses.length > 0
    );
    const actorBonuses = hasActorBonuses ? rawActorBonuses : [];

    const rawProgressTrack = normalizeTechniqueProgressTrack(entry?.progressTrack);
    const hasProgressTrack = normalizeProgressTrackFlag(entry, rawProgressTrack);
    const progressTrack = hasProgressTrack
      ? { ...rawProgressTrack, enabled: true }
      : normalizeTechniqueProgressTrack({ enabled: false, thresholds: [] });

    const rawProgressRewards = normalizeTechniqueProgressRewards(entry?.progressRewards);
    const hasProgressRewards = normalizeCapabilityFlag(
      entry,
      "hasProgressRewards",
      rawProgressRewards.length > 0
    );
    const progressRewards = hasProgressRewards ? rawProgressRewards : [];

    const referenceData = normalizeBuilderEntryReference(entry, sectionKey);

    return {
      id: String(entry?.id ?? foundry.utils.randomID()),
      name: String(entry?.name ?? referenceData.fallbackName),
      description: String(entry?.description ?? referenceData.fallbackDescription),
      xpCost: toInteger(entry?.xpCost),
      referenceKey: referenceData.referenceKey,
      stateId: referenceData.resolvedStateId,
      isGeneratedReference: referenceData.isGeneratedReference,

      extraStatisticSlots: sumTechniqueStatisticSlotCounts(statisticSlots),
      isQuickAccess: Boolean(entry?.isQuickAccess),

      hasStatisticSlots,
      statisticSlots,

      hasStatistics,
      statistics,

      counter,

      hasImprovements,
      improvements,

      hasActorBonuses,
      actorBonuses,

      hasProgressTrack,
      progressTrack,

      hasProgressRewards,
      progressRewards,

      ...(withActive ? { isActive: Boolean(entry?.isActive) } : {}),
      ...(withUniversal || withSource ? { isUniversal: Boolean(entry?.isUniversal) } : {}),
      ...(withSource ? normalizeSourceFields(entry, sectionKey, referenceData.resolvedStateId) : {})
    };
  });
}

/**
 * Normalise les références, états et textes de fallback d’une entrée.
 *
 * @param {object} entry - Entrée brute.
 * @param {string} sectionKey - Section de l’entrée.
 * @returns {object} Données de référence normalisées.
 */
function normalizeBuilderEntryReference(entry, sectionKey) {
  const resolvedStateId = resolveTechniqueModuleStateId({
    stateId: entry?.stateId ?? "",
    referenceKey: entry?.referenceKey ?? ""
  });

  const referenceKey = normalizeTechniqueModuleReferenceKey(entry?.referenceKey ?? "", {
    sectionKey,
    name: entry?.name ?? "",
    stateId: resolvedStateId
  });

  const stateDefinition = sectionKey === "states" && resolvedStateId
    ? getTechniqueModuleStateDefinition(resolvedStateId)
    : null;

  const fallbackName = stateDefinition
    ? game.i18n.localize(stateDefinition.nameKey)
    : "";

  const fallbackDescription = stateDefinition
    ? game.i18n.localize(stateDefinition.descriptionKey)
    : "";

  return {
    resolvedStateId,
    referenceKey,
    fallbackName,
    fallbackDescription,
    isGeneratedReference: !String(entry?.referenceKey ?? "").trim() && Boolean(referenceKey)
  };
}

/**
 * Normalise les champs de source d’une entrée importée depuis un métier.
 *
 * @param {object} entry - Entrée brute.
 * @param {string} sectionKey - Section de l’entrée.
 * @param {string} resolvedStateId - État résolu de l’entrée.
 * @returns {object} Champs de source normalisés.
 */
function normalizeSourceFields(entry, sectionKey, resolvedStateId) {
  const rawSourceReferenceKey = String(entry?.sourceReferenceKey ?? "").trim();

  const sourceReferenceKey = rawSourceReferenceKey
    ? normalizeTechniqueModuleReferenceKey(rawSourceReferenceKey, {
        sectionKey,
        name: "",
        stateId: resolvedStateId
      })
    : "";

  return {
    sourceProfessionId: String(entry?.sourceProfessionId ?? ""),
    sourceEntryId: String(entry?.sourceEntryId ?? ""),
    sourceReferenceKey,
    sourceLabel: String(entry?.sourceLabel ?? "")
  };
}

/**
 * Normalise un flag de capacité optionnelle.
 *
 * Si le flag existe explicitement, il est conservé.
 * Sinon, une valeur héritée est utilisée.
 *
 * @param {object} entry - Entrée brute.
 * @param {string} flag - Nom du flag.
 * @param {boolean} [legacyValue=false] - Valeur de fallback.
 * @returns {boolean} Flag normalisé.
 */
function normalizeCapabilityFlag(entry, flag, legacyValue = false) {
  return typeof entry?.[flag] === "boolean"
    ? Boolean(entry[flag])
    : Boolean(legacyValue);
}

/**
 * Détermine si une piste de progression doit être active.
 *
 * @param {object} entry - Entrée brute.
 * @param {object} progressTrack - Piste normalisée.
 * @returns {boolean} `true` si la piste doit être conservée.
 */
function normalizeProgressTrackFlag(entry, progressTrack) {
  return normalizeCapabilityFlag(
    entry,
    "hasProgressTrack",
    progressTrack.enabled
      || progressTrack.objectivesText.length > 0
      || progressTrack.current > 0
      || progressTrack.thresholds.length > 0
  );
}

/**
 * Normalise les statistiques d’une technique ou d’un module.
 *
 * @param {Array<object>} entries - Statistiques brutes.
 * @returns {{id: string, statId: string}[]} Statistiques normalisées.
 */
function normalizeTechniqueStatistics(entries) {
  return asArray(entries).map((entry) => ({
    id: String(entry?.id ?? foundry.utils.randomID()),
    statId: normalizeTechniqueStatId(entry?.statId ?? "damage")
  }));
}

/**
 * Normalise les slots statistiques d’un module.
 *
 * Supporte aussi l’ancien champ `extraStatisticSlots` comme fallback de slots libres.
 *
 * @param {Array<object>} entries - Slots bruts.
 * @param {number} [legacyFreeSlots=0] - Ancien compteur de slots libres.
 * @returns {{id: string, slotType: string, count: number}[]} Slots normalisés.
 */
function normalizeTechniqueStatisticSlots(entries, legacyFreeSlots = 0) {
  const normalized = asArray(entries)
    .map((entry) => ({
      id: String(entry?.id ?? foundry.utils.randomID()),
      slotType: normalizeTechniqueModuleSlotType(entry?.slotType),
      count: Math.max(1, toInteger(entry?.count ?? 1))
    }))
    .filter((entry) => entry.count > 0);

  if (normalized.length) return normalized;

  const fallbackCount = toPositiveInteger(legacyFreeSlots);

  return fallbackCount > 0
    ? [{ id: foundry.utils.randomID(), slotType: "free", count: fallbackCount }]
    : [];
}

/**
 * Additionne les quantités de slots statistiques.
 *
 * @param {Array<object>} entries - Slots statistiques.
 * @returns {number} Total des slots.
 */
function sumTechniqueStatisticSlotCounts(entries) {
  return asArray(entries).reduce((total, entry) => {
    return total + Math.max(1, toInteger(entry?.count ?? 1));
  }, 0);
}

/**
 * Normalise le compteur d’un module.
 *
 * @param {object} counter - Compteur brut.
 * @returns {object} Compteur normalisé.
 */
function normalizeTechniqueCounter(counter) {
  return {
    enabled: Boolean(counter?.enabled),
    label: String(counter?.label ?? ""),
    current: toPositiveInteger(counter?.current),
    max: toPositiveInteger(counter?.max),
    resetNote: String(counter?.resetNote ?? "")
  };
}

/**
 * Normalise les améliorations d’un module.
 *
 * @param {Array<object>} entries - Améliorations brutes.
 * @returns {object[]} Améliorations normalisées.
 */
function normalizeTechniqueImprovements(entries) {
  return asArray(entries).map((entry) => ({
    id: String(entry?.id ?? foundry.utils.randomID()),
    label: String(entry?.label ?? ""),
    xpStep: Math.max(1, toInteger(entry?.xpStep ?? 1)),
    rank: toPositiveInteger(entry?.rank),
    notes: String(entry?.notes ?? "")
  }));
}

/**
 * Normalise les bonus acteur d’un module.
 *
 * @param {Array<object>} entries - Bonus bruts.
 * @returns {object[]} Bonus acteur normalisés.
 */
function normalizeTechniqueActorBonuses(entries) {
  return asArray(entries).map((entry) => ({
    id: String(entry?.id ?? foundry.utils.randomID()),
    targetKey: String(entry?.targetKey ?? ""),
    value: toInteger(entry?.value),
    notes: String(entry?.notes ?? "")
  }));
}

/**
 * Normalise la piste de progression d’un module.
 *
 * @param {object} track - Piste brute.
 * @returns {object} Piste normalisée.
 */
function normalizeTechniqueProgressTrack(track) {
  const normalizedThresholds = asArray(track?.thresholds).map((entry) => ({
    id: String(entry?.id ?? foundry.utils.randomID()),
    target: toPositiveInteger(entry?.target),
    label: String(entry?.label ?? ""),
    notes: String(entry?.notes ?? "")
  }));

  return normalizeProfessionProgressTrackData(
    {
      ...(track ?? {}),
      thresholds: normalizedThresholds
    },
    {
      enabled: Boolean(track?.enabled)
    }
  );
}

/**
 * Normalise les récompenses de progression d’un module.
 *
 * @param {Array<object>} entries - Récompenses brutes.
 * @returns {object[]} Récompenses normalisées.
 */
function normalizeTechniqueProgressRewards(entries) {
  return asArray(entries).map((entry) => ({
    id: String(entry?.id ?? foundry.utils.randomID()),
    threshold: toPositiveInteger(entry?.threshold),
    targetKey: String(entry?.targetKey ?? ""),
    value: toInteger(entry?.value),
    notes: String(entry?.notes ?? "")
  }));
}

/**
 * Normalise les améliorations de puissance d’une technique.
 *
 * La résolution se fait par `threshold`, pas par index.
 * Un fallback par index est conservé pour les anciennes données sans champ `threshold`.
 *
 * @param {Array<object>} entries - Améliorations brutes.
 * @param {Array<object>} statistics - Statistiques disponibles.
 * @returns {{threshold: number, statisticId: string}[]} Améliorations normalisées.
 */
function normalizeTechniquePowerEnhancements(entries, statistics) {
  const enhancementEntries = asArray(entries);
  const statisticIds = new Set(
    asArray(statistics)
      .map((entry) => String(entry?.id ?? ""))
      .filter(Boolean)
  );

  return TECHNIQUE_POWER_THRESHOLDS.map((threshold, index) => {
    const enhancement = enhancementEntries.find((entry) => {
      return Number(entry?.threshold ?? 0) === threshold;
    }) ?? enhancementEntries[index];

    const statisticId = String(enhancement?.statisticId ?? "");

    return {
      threshold,
      statisticId: statisticIds.has(statisticId) ? statisticId : ""
    };
  });
}

/**
 * Normalise l’id de statistique principale d’une technique.
 *
 * Si l’id courant est invalide, la première statistique disponible devient principale.
 *
 * @param {string} currentId - Id courant.
 * @param {Array<object>} statistics - Statistiques disponibles.
 * @returns {string} Id de statistique principale.
 */
function normalizeMainStatisticId(currentId, statistics) {
  const validStatisticIds = new Set(
    asArray(statistics).map((entry) => String(entry.id ?? ""))
  );

  const normalizedId = String(currentId ?? "");

  return validStatisticIds.has(normalizedId)
    ? normalizedId
    : String(statistics[0]?.id ?? "");
}

/**
 * Construit la clé i18n du nom par défaut d’un héritage.
 *
 * @param {"ancestral"|"cultural"} heritageType - Type d’héritage.
 * @param {"passive"|"technique"} featureType - Forme de l’héritage.
 * @returns {string} Clé i18n.
 */
function getDefaultHeritageNameKey(heritageType, featureType) {
  const origin = heritageType === "cultural" ? "CULTURAL" : "ANCESTRAL";
  const form = featureType === "technique" ? "TECHNIQUE" : "PASSIVE";

  return `ETERN.ITEM.DEFAULT_${origin}_${form}_HERITAGE_NAME`;
}

/**
 * Construit les compteurs d’entrées d’un métier.
 *
 * @param {object} system - Données système du métier.
 * @returns {Record<string, number>} Compteurs par section.
 */
function buildEntryCounts(system) {
  return Object.fromEntries(
    BUILDER_SECTION_KEYS.map((sectionKey) => [
      sectionKey,
      asArray(system?.[sectionKey]).length
    ])
  );
}


