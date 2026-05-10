/**
 * Builders de contexte partagés pour les fiches de métiers et de techniques.
 *
 * Responsabilités :
 * - préparer les sections éditables des métiers ;
 * - préparer les sections de composants des techniques ;
 * - transformer les entrées système en données prêtes pour Handlebars ;
 * - construire le catalogue des statistiques de technique ;
 * - construire les choix de statistique principale et d’amélioration de puissance ;
 * - enrichir les entrées avec leurs métadonnées de référence, de source, de progression et de slots.
 *
 * Ce fichier est un fichier de préparation de contexte.
 * Il ne doit pas modifier les documents, créer d’items, gérer le DOM ou appliquer des règles métier.
 */

import { asArray } from '../../utils/arrays.js';
import { toInteger, toPositiveInteger } from '../../utils/numbers.js';
import {
  getTechniqueStatDefinition,
  TECHNIQUE_POWER_THRESHOLDS
} from "./stat-definitions.js";
import { buildTechniqueEntrySourceStatus } from "./source-sync-service.js";
import {
  getTechniqueModuleBonusTargetChoices,
  getTechniqueModuleProgressAttributeChoices,
  getTechniqueModuleSlotChoices,
  getTechniqueModuleStateChoices
} from "./module-entry-config.js";
import { buildTechniqueEntryDisplayMeta } from "./component-display-service.js";
import {
  buildTechniqueModuleReferenceMeta,
  buildTechniqueModuleReferenceUsageMap
} from "./module-reference-service.js";
import {
  buildProfessionProgressTrack,
  isProfessionProgressThresholdReached
} from "../../rules/professions/progress-track.js";

/**
 * Construit le contexte d’une section de composants pour une fiche technique.
 *
 * Cette fonction est utilisée pour les sections :
 * - clés ;
 * - conditions ;
 * - mécaniques ;
 * - états.
 *
 * Elle prépare à la fois :
 * - les entrées déjà présentes sur la technique ;
 * - les entrées disponibles depuis les composants de base ou les métiers sources.
 *
 * @param {Actor|null} actor - Acteur propriétaire de la technique.
 * @param {string[]} selectedProfessionIds - Métiers sélectionnés comme sources.
 * @param {string} key - Clé de section : keys, conditions, mechanics ou states.
 * @param {string} title - Titre localisé de la section.
 * @param {Array<object>} entries - Entrées déjà présentes sur la technique.
 * @param {Array<object>} sourceEntries - Entrées disponibles à l’ajout.
 * @param {object} options - Options d’affichage de la section.
 * @param {string} options.emptyLabelKey - Clé i18n du message vide.
 * @param {boolean} [options.withExtraStatisticSlots=false] - Affiche les slots statistiques bonus.
 * @returns {object} Contexte de section prêt pour Handlebars.
 */
export function buildTechniqueSectionContext(
  actor,
  selectedProfessionIds,
  key,
  title,
  entries,
  sourceEntries,
  {
    emptyLabelKey,
    withExtraStatisticSlots = false
  }
) {
  const baseEntries = buildBuilderEntries(entries, {
    withSource: true,
    sectionKey: key
  });

  const referenceUsage = buildTechniqueModuleReferenceUsageMap(baseEntries, key);

  const currentEntries = baseEntries.map((entry) => {
    const sourceStatus = buildTechniqueEntrySourceStatus(
      actor,
      key,
      entry,
      selectedProfessionIds
    );

    const displayMeta = buildTechniqueEntryDisplayMeta(entry);
    const referenceMeta = buildTechniqueModuleReferenceMeta(entry, key, referenceUsage);

    return {
      ...entry,
      ...displayMeta,
      ...buildReferenceDisplayContext(referenceMeta),
      sourceStatus: buildSourceStatusDisplayContext(sourceStatus)
    };
  });

  return {
    key,
    title,
    emptyLabel: game.i18n.localize(emptyLabelKey),
    withExtraStatisticSlots,
    entries: currentEntries,
    availableEntries: buildAvailableTechniqueEntries(sourceEntries, key, referenceUsage)
  };
}

/**
 * Construit le contexte d’une section du builder de métier.
 *
 * Cette fonction est utilisée pour les sections de métier :
 * - passifs ;
 * - clés ;
 * - conditions ;
 * - mécaniques ;
 * - états.
 *
 * @param {string} key - Clé système de la section.
 * @param {string} title - Titre localisé de la section.
 * @param {Array<object>} entries - Entrées présentes dans la section.
 * @param {object} options - Options d’affichage.
 * @param {boolean} [options.withActive=false] - Active le champ actif/inactif.
 * @param {boolean} [options.withUniversal=false] - Active le champ universel.
 * @param {boolean} [options.withStateReference=false] - Active la référence à un état système.
 * @param {string} options.emptyLabelKey - Clé i18n du message vide.
 * @param {Array<object>} [options.statCatalog=[]] - Catalogue des statistiques disponibles.
 * @returns {object} Contexte de section prêt pour Handlebars.
 */
export function buildBuilderSectionContext(
  key,
  title,
  entries,
  {
    withActive = false,
    withUniversal = false,
    withStateReference = false,
    emptyLabelKey,
    statCatalog = []
  }
) {
  const builtEntries = buildBuilderEntries(entries, {
    withActive,
    withUniversal,
    withStateReference,
    statCatalog,
    sectionKey: key
  });

  const usageMap = buildTechniqueModuleReferenceUsageMap(builtEntries, key);

  return {
    key,
    title,
    withActive,
    withUniversal,
    withStateReference,
    emptyLabel: game.i18n.localize(emptyLabelKey),
    entries: builtEntries.map((entry) => ({
      ...entry,
      ...buildReferenceDisplayContext(
        buildTechniqueModuleReferenceMeta(entry, key, usageMap)
      )
    }))
  };
}

/**
 * Transforme une liste d’entrées système en entrées prêtes pour les templates.
 *
 * Cette fonction est volontairement générique : elle sert autant aux modules de métier
 * qu’aux composants déjà présents sur une technique.
 *
 * Elle normalise :
 * - les identifiants ;
 * - le nom et la description ;
 * - le coût XP ;
 * - les références ;
 * - les états ;
 * - les slots statistiques ;
 * - les statistiques embarquées ;
 * - les compteurs ;
 * - les améliorations ;
 * - les bonus acteur ;
 * - la piste de progression ;
 * - les récompenses de progression ;
 * - les informations de source ;
 * - les possibilités de déplacement dans la liste.
 *
 * @param {Array<object>} entries - Entrées brutes.
 * @param {object} [options={}] - Options de construction.
 * @param {boolean} [options.withActive=false] - Inclut l’état actif.
 * @param {boolean} [options.withUniversal=false] - Inclut le flag universel.
 * @param {boolean} [options.withSource=false] - Inclut les informations de source métier.
 * @param {boolean} [options.withStateReference=false] - Inclut les choix d’états.
 * @param {Array<object>} [options.statCatalog=[]] - Catalogue des statistiques.
 * @param {string} [options.sectionKey=""] - Clé de section.
 * @returns {Array<object>} Entrées prêtes pour Handlebars.
 */
export function buildBuilderEntries(
  entries,
  {
    withActive = false,
    withUniversal = false,
    withSource = false,
    withStateReference = false,
    statCatalog = [],
    sectionKey = ""
  } = {}
) {
  return asArray(entries).map((entry, index, list) => {
    const xpCost = toInteger(entry?.xpCost);
    const extraStatisticSlots = toPositiveInteger(entry?.extraStatisticSlots);
    const stateChoices = withStateReference
      ? getTechniqueModuleStateChoices(entry?.stateId ?? "")
      : [];

    return {
      index,
      id: String(entry?.id ?? ""),
      name: String(entry?.name ?? ""),
      description: String(entry?.description ?? ""),

      xpCost,
      signedXpLabel: formatSignedXp(xpCost),

      referenceKey: String(entry?.referenceKey ?? ""),
      referencePreviewLabel: String(entry?.referenceKey ?? "")
        || game.i18n.localize("ETERN.TECHNIQUE.MODULES.REFERENCE_EMPTY"),

      stateId: String(entry?.stateId ?? ""),
      stateChoices,
      stateLabel: String(stateChoices.find((choice) => choice.selected)?.label ?? ""),

      extraStatisticSlots,
      statisticSlotSummary: extraStatisticSlots,
      statisticSlots: buildStatisticSlotEntries(entry?.statisticSlots),
      slotBadges: buildSlotBadges(entry?.statisticSlots),
      hasStatisticSlots: Boolean(entry?.hasStatisticSlots),

      statistics: buildEmbeddedStatisticEntries(entry?.statistics, statCatalog),
      hasStatistics: Boolean(entry?.hasStatistics),

      counter: buildCounterContext(entry?.counter),

      hasImprovements: Boolean(entry?.hasImprovements),
      improvements: buildImprovementEntries(entry?.improvements),

      actorBonuses: buildActorBonusEntries(entry?.actorBonuses),
      hasActorBonuses: Boolean(entry?.hasActorBonuses),

      progressTrack: buildProgressTrackContext(entry?.progressTrack),
      hasProgressTrack: Boolean(entry?.hasProgressTrack),

      progressRewards: buildProgressRewardEntries(entry?.progressRewards, entry?.progressTrack),
      hasProgressRewards: Boolean(entry?.hasProgressRewards),

      isGeneratedReference: Boolean(entry?.isGeneratedReference),
      isQuickAccess: Boolean(entry?.isQuickAccess),

      isActive: withActive ? Boolean(entry?.isActive) : false,
      isUniversal: withUniversal || withSource ? Boolean(entry?.isUniversal) : false,

      sourceLabel: withSource ? String(entry?.sourceLabel ?? "") : "",
      sourceProfessionId: withSource ? String(entry?.sourceProfessionId ?? "") : "",
      sourceEntryId: withSource ? String(entry?.sourceEntryId ?? "") : "",

      slotSummaryLabel: extraStatisticSlots > 0
        ? game.i18n.format("ETERN.TECHNIQUE.SLOTS.EXTRA_SOURCE_BADGE", {
            count: extraStatisticSlots
          })
        : "",

      sectionKey,
      canMoveUp: index > 0,
      canMoveDown: index < list.length - 1
    };
  });
}

/**
 * Construit le catalogue des statistiques disponibles pour les techniques.
 *
 * @param {string[]} statIds - Identifiants de statistiques.
 * @returns {Array<object>} Catalogue localisé de statistiques.
 */
export function buildTechniqueStatCatalog(statIds) {
  return asArray(statIds).map((statId) => {
    const definition = getTechniqueStatDefinition(statId);

    return {
      id: statId,
      value: statId,
      label: game.i18n.localize(definition.labelKey),
      baseValue: definition.baseValue,
      xpCost: definition.xpCost
    };
  });
}

/**
 * Prépare les statistiques sélectionnées sur une technique.
 *
 * Cette fonction fusionne les statistiques stockées sur l’item avec le résumé
 * de puissance déjà calculé, afin d’obtenir les valeurs finales affichables.
 *
 * @param {object} system - Données système de la technique.
 * @param {object} powerSummary - Résumé de puissance.
 * @returns {Array<object>} Statistiques sélectionnées et enrichies.
 */
export function buildSelectedTechniqueStatistics(system, powerSummary) {
  const powerStatistics = asArray(powerSummary?.statistics);

  return asArray(system?.statistics).map((entry, index) => {
    const statId = String(entry?.statId ?? "damage");
    const definition = getTechniqueStatDefinition(statId);
    const powerEntry = powerStatistics.find((candidate) => {
      return String(candidate?.statisticId ?? "") === String(entry?.id ?? "");
    }) ?? null;

    return {
      index,
      id: String(entry?.id ?? ""),
      statId,
      label: game.i18n.localize(definition.labelKey),
      baseValue: powerEntry?.baseValue ?? definition.baseValue,
      xpCost: definition.xpCost,
      isMain: Boolean(powerEntry?.isMain),
      scalesWithPower: Boolean(powerEntry?.scalesWithPower),
      bonusRanks: toPositiveInteger(powerEntry?.bonusRanks),
      powerRanks: toPositiveInteger(powerEntry?.powerRanks),
      thresholdBonusRanks: toPositiveInteger(powerEntry?.thresholdBonusRanks),
      totalRanks: Math.max(1, toPositiveInteger(powerEntry?.totalRanks) || 1),
      finalValue: String(powerEntry?.finalValue ?? definition.baseValue)
    };
  });
}

/**
 * Construit les choix pour sélectionner la statistique principale d’une technique.
 *
 * @param {Array<object>} selectedStatistics - Statistiques présentes sur la technique.
 * @param {string} mainStatisticId - Id de la statistique principale actuelle.
 * @returns {Array<object>} Choix de statistique principale.
 */
export function buildTechniqueMainStatisticChoices(selectedStatistics, mainStatisticId) {
  return [
    {
      value: "",
      label: game.i18n.localize("ETERN.TECHNIQUE.MAIN_STATISTIC_EMPTY"),
      selected: mainStatisticId === ""
    },
    ...asArray(selectedStatistics).map((entry) => ({
      value: entry.id,
      label: entry.label,
      selected: entry.id === mainStatisticId
    }))
  ];
}

/**
 * Construit les choix d’amélioration pour les seuils de puissance.
 *
 * Chaque seuil peut cibler une statistique sélectionnée.
 * La recherche se fait par `threshold`, et non par index, pour éviter
 * les erreurs si le tableau `powerEnhancements` n’est pas trié.
 *
 * @param {number} power - Puissance actuelle de la technique.
 * @param {Array<object>} powerEnhancements - Améliorations configurées.
 * @param {Array<object>} selectedStatistics - Statistiques disponibles comme cibles.
 * @returns {Array<object>} Choix d’amélioration par seuil.
 */
export function buildTechniquePowerEnhancementChoices(
  power,
  powerEnhancements,
  selectedStatistics
) {
  const normalizedPower = toPositiveInteger(power);
  const enhancements = asArray(powerEnhancements);

  return TECHNIQUE_POWER_THRESHOLDS.map((threshold, index) => {
    const enhancement = enhancements.find((entry) => {
      return Number(entry?.threshold ?? 0) === threshold;
    });

    const current = String(enhancement?.statisticId ?? "");

    return {
      index,
      threshold,
      unlocked: threshold <= normalizedPower,
      choices: [
        {
          value: "",
          label: game.i18n.localize("ETERN.TECHNIQUE.POWER.NO_BONUS_STATISTIC"),
          selected: current === ""
        },
        ...asArray(selectedStatistics).map((entry) => ({
          value: entry.id,
          label: entry.label,
          selected: entry.id === current
        }))
      ]
    };
  });
}

/**
 * Localise un message de validation.
 *
 * Les messages de validation sont stockés sous forme :
 * `{ key, data }`.
 *
 * @param {object} message - Message de validation brut.
 * @returns {string} Message localisé.
 */
export function localizeValidationMessage(message) {
  const key = String(message?.key ?? "");

  return key ? game.i18n.format(key, message?.data ?? {}) : "";
}

/**
 * Prépare les entrées disponibles à l’ajout dans une section de technique.
 *
 * Ces entrées peuvent venir :
 * - des composants de base ;
 * - des métiers sources sélectionnés.
 *
 * @param {Array<object>} sourceEntries - Entrées sources disponibles.
 * @param {string} key - Section concernée.
 * @param {Map<string, number>} referenceUsage - Carte d’usage des références.
 * @returns {Array<object>} Entrées disponibles enrichies.
 */
function buildAvailableTechniqueEntries(sourceEntries, key, referenceUsage) {
  return asArray(sourceEntries).map((entry) => {
    const displayMeta = buildTechniqueEntryDisplayMeta(entry);
    const referenceMeta = buildTechniqueModuleReferenceMeta(entry, key, referenceUsage);
    const isBaseComponent = Boolean(entry.isBaseComponent);

    return {
      ...entry,
      ...displayMeta,
      ...buildReferenceDisplayContext(referenceMeta),
      sourceKind: String(entry.sourceKind ?? (isBaseComponent ? "base" : "profession")),
      isBaseComponent,
      sourceLabel: String(entry.sourceLabel ?? entry.professionName ?? ""),
      professionName: String(entry.professionName ?? entry.sourceLabel ?? ""),
      universalLabel: entry.isUniversal
        ? game.i18n.localize("ETERN.PROFESSION.UNIVERSAL")
        : "",
      baseComponentLabel: isBaseComponent
        ? game.i18n.localize("ETERN.TECHNIQUE.BASE_COMPONENTS.SOURCE_LABEL")
        : "",
      referenceLabel: String(entry.referenceKey ?? ""),
      slotBonusLabel: Number(entry.extraStatisticSlots ?? 0) > 0
        ? game.i18n.format("ETERN.TECHNIQUE.SLOTS.EXTRA_SOURCE_BADGE", {
            count: Number(entry.extraStatisticSlots ?? 0) || 0
          })
        : "",
      addLabel: buildAvailableEntryAddLabel(entry),
      dragLabel: isBaseComponent
        ? ""
        : game.i18n.localize("ETERN.TECHNIQUE.DRAG_HINT"),
      canDrag: !isBaseComponent,
      canOpenSource: Boolean(entry.professionId) && !isBaseComponent
    };
  });
}

/**
 * Construit le libellé du bouton d’ajout d’une entrée disponible.
 *
 * @param {object} entry - Entrée disponible.
 * @returns {string} Libellé localisé.
 */
function buildAvailableEntryAddLabel(entry) {
  if (entry.alreadyAdded) {
    return game.i18n.localize("ETERN.TECHNIQUE.ACTION.ALREADY_ADDED");
  }

  if (entry.isBaseComponent) {
    return game.i18n.localize("ETERN.TECHNIQUE.ACTION.ADD_BASE_COMPONENT");
  }

  return game.i18n.localize("ETERN.TECHNIQUE.ACTION.ADD_FROM_PROFESSION");
}

/**
 * Construit le contexte d’affichage du statut de source d’une entrée.
 *
 * Cette fonction adapte les données renvoyées par `source-sync-service.js`
 * au format attendu par les templates.
 *
 * @param {object} sourceStatus - Statut brut de synchronisation.
 * @returns {object} Statut localisé pour le template.
 */
function buildSourceStatusDisplayContext(sourceStatus) {
  return {
    canSync: Boolean(sourceStatus?.canSync),
    badgeLabel: sourceStatus?.badgeKey
      ? game.i18n.localize(sourceStatus.badgeKey)
      : "",
    badgeClass: String(sourceStatus?.badgeClass ?? ""),
    message: sourceStatus?.syncMessageKey
      ? game.i18n.localize(sourceStatus.syncMessageKey)
      : ""
  };
}

/**
 * Construit le contexte d’affichage d’une référence de module.
 *
 * Cette fonction indique si une référence est manquante, dupliquée,
 * générée automatiquement ou liée à un état système.
 *
 * @param {object} [referenceMeta={}] - Métadonnées de référence.
 * @returns {object} Contexte d’affichage de référence.
 */
function buildReferenceDisplayContext(referenceMeta = {}) {
  const hasReferenceKey = Boolean(referenceMeta?.hasReferenceKey);
  const hasDuplicateReference = Boolean(referenceMeta?.hasDuplicateReference);
  const isBuiltInStateReference = Boolean(referenceMeta?.isBuiltInStateReference);
  const isGeneratedReference = Boolean(referenceMeta?.isGeneratedReference);

  let statusKey = "ETERN.TECHNIQUE.MODULES.REFERENCE_STATUS.CUSTOM";
  let statusClass = "builder-inline-badge--muted";

  if (!hasReferenceKey) {
    statusKey = "ETERN.TECHNIQUE.MODULES.REFERENCE_STATUS.MISSING";
    statusClass = "builder-inline-badge--warning";
  } else if (hasDuplicateReference) {
    statusKey = "ETERN.TECHNIQUE.MODULES.REFERENCE_STATUS.DUPLICATE";
    statusClass = "builder-inline-badge--warning";
  } else if (isBuiltInStateReference) {
    statusKey = "ETERN.TECHNIQUE.MODULES.REFERENCE_STATUS.BUILTIN_STATE";
    statusClass = "builder-inline-badge--success";
  } else if (isGeneratedReference) {
    statusKey = "ETERN.TECHNIQUE.MODULES.REFERENCE_STATUS.AUTO";
    statusClass = "builder-inline-badge--muted";
  }

  return {
    resolvedReferenceKey: String(referenceMeta?.referenceKey ?? ""),
    referenceStatusLabel: game.i18n.localize(statusKey),
    referenceStatusClass: statusClass,
    referencePreviewLabel: game.i18n.format(
      "ETERN.TECHNIQUE.MODULES.REFERENCE_PREVIEW",
      {
        reference: String(referenceMeta?.referenceKey ?? "—")
      }
    ),
    hasDuplicateReference
  };
}

/**
 * Construit les entrées de slots statistiques d’un module.
 *
 * @param {Array<object>} statisticSlots - Slots bruts.
 * @returns {Array<object>} Slots prêts pour le template.
 */
function buildStatisticSlotEntries(statisticSlots) {
  return asArray(statisticSlots).map((slot, slotIndex) => ({
    index: slotIndex,
    id: String(slot?.id ?? ""),
    slotType: String(slot?.slotType ?? "free"),
    count: Math.max(1, toPositiveInteger(slot?.count) || 1),
    slotChoices: getTechniqueModuleSlotChoices(slot?.slotType ?? "free")
  }));
}

/**
 * Construit les badges de slots statistiques.
 *
 * @param {Array<object>} statisticSlots - Slots bruts.
 * @returns {string[]} Badges localisés.
 */
function buildSlotBadges(statisticSlots = []) {
  return asArray(statisticSlots).map((slot) => {
    const slotType = String(slot?.slotType ?? "free");
    const count = Math.max(1, toPositiveInteger(slot?.count) || 1);

    return game.i18n.format(
      `ETERN.TECHNIQUE.SLOTS.BADGE.${slotType.toUpperCase()}`,
      { count }
    );
  });
}

/**
 * Construit les statistiques embarquées dans une entrée de builder.
 *
 * Ces statistiques sont utilisées notamment par les passifs et certains modules.
 *
 * @param {Array<object>} statistics - Statistiques brutes.
 * @param {Array<object>} statCatalog - Catalogue des statistiques.
 * @returns {Array<object>} Statistiques prêtes pour le template.
 */
function buildEmbeddedStatisticEntries(statistics, statCatalog) {
  return asArray(statistics).map((stat, statIndex) => ({
    index: statIndex,
    id: String(stat?.id ?? ""),
    statId: String(stat?.statId ?? "damage"),
    statChoices: asArray(statCatalog).map((choice) => ({
      ...choice,
      selected: choice.value === String(stat?.statId ?? "damage")
    }))
  }));
}

/**
 * Construit le contexte d’un compteur de module.
 *
 * @param {object} counter - Données brutes du compteur.
 * @returns {object} Compteur prêt pour le template.
 */
function buildCounterContext(counter) {
  return {
    enabled: Boolean(counter?.enabled),
    label: String(counter?.label ?? ""),
    current: toPositiveInteger(counter?.current),
    max: toPositiveInteger(counter?.max),
    resetNote: String(counter?.resetNote ?? "")
  };
}

/**
 * Construit les entrées d’amélioration d’un module.
 *
 * @param {Array<object>} improvements - Améliorations brutes.
 * @returns {Array<object>} Améliorations prêtes pour le template.
 */
function buildImprovementEntries(improvements) {
  return asArray(improvements).map((improvement, improvementIndex) => {
    const xpStep = Math.max(1, toPositiveInteger(improvement?.xpStep) || 1);
    const rank = toPositiveInteger(improvement?.rank);

    return {
      index: improvementIndex,
      id: String(improvement?.id ?? ""),
      label: String(improvement?.label ?? ""),
      xpStep,
      rank,
      cumulativeXp: xpStep * rank,
      nextXp: xpStep * (rank + 1),
      notes: String(improvement?.notes ?? "")
    };
  });
}

/**
 * Construit les bonus acteur d’un module.
 *
 * @param {Array<object>} actorBonuses - Bonus bruts.
 * @returns {Array<object>} Bonus prêts pour le template.
 */
function buildActorBonusEntries(actorBonuses) {
  return asArray(actorBonuses).map((bonus, bonusIndex) => ({
    index: bonusIndex,
    id: String(bonus?.id ?? ""),
    targetKey: String(bonus?.targetKey ?? ""),
    value: toInteger(bonus?.value),
    notes: String(bonus?.notes ?? ""),
    targetChoices: getTechniqueModuleBonusTargetChoices(bonus?.targetKey ?? "")
  }));
}

/**
 * Construit le contexte de piste de progression d’un module.
 *
 * @param {object} progressTrack - Données brutes de piste.
 * @returns {object} Piste de progression prête pour le template.
 */
function buildProgressTrackContext(progressTrack) {
  return {
    ...buildProfessionProgressTrack(progressTrack),
    attributeChoices: getTechniqueModuleProgressAttributeChoices(
      progressTrack?.testAttributeKey ?? ""
    )
  };
}

/**
 * Construit les récompenses de progression d’un module.
 *
 * @param {Array<object>} progressRewards - Récompenses brutes.
 * @param {object} progressTrack - Piste de progression associée.
 * @returns {Array<object>} Récompenses prêtes pour le template.
 */
function buildProgressRewardEntries(progressRewards, progressTrack) {
  return asArray(progressRewards).map((reward, rewardIndex) => {
    const threshold = toPositiveInteger(reward?.threshold);
    const isReached = isProfessionProgressThresholdReached(progressTrack, threshold);

    return {
      index: rewardIndex,
      id: String(reward?.id ?? ""),
      threshold,
      targetKey: String(reward?.targetKey ?? ""),
      value: toInteger(reward?.value),
      notes: String(reward?.notes ?? ""),
      targetChoices: getTechniqueModuleBonusTargetChoices(reward?.targetKey ?? ""),
      isReached,
      reachedLabel: game.i18n.localize(
        isReached
          ? "ETERN.TECHNIQUE.MODULES.PROGRESS_REWARD_REACHED"
          : "ETERN.TECHNIQUE.MODULES.PROGRESS_REWARD_LOCKED"
      )
    };
  });
}

/**
 * Formate un coût XP signé.
 *
 * Exemple :
 * - `2` devient `+2` ;
 * - `0` devient `0` ;
 * - `-1` devient `-1`.
 *
 * @param {unknown} value - Valeur brute.
 * @returns {string} Coût XP formaté.
 */
function formatSignedXp(value) {
  const amount = toInteger(value);

  return amount > 0 ? `+${amount}` : `${amount}`;
}


