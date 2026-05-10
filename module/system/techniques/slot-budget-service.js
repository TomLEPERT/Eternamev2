/**
 * Service de calcul du budget de slots statistiques des techniques.
 *
 * Responsabilités :
 * - calculer combien de statistiques une technique utilise ;
 * - distinguer les slots dédiés à la portée, à la durée et aux effets libres ;
 * - ajouter les slots bonus fournis par les passifs de métiers, conditions et mécaniques ;
 * - déterminer si les statistiques choisies tiennent dans le budget disponible ;
 * - préparer un détail lisible des sources de slots bonus pour l’interface.
 *
 * Ce fichier doit rester centré sur le calcul de budget.
 * La validation finale, les messages d’erreur et le rendu UI doivent rester dans leurs services dédiés.
 */

import { asArray } from '../../utils/arrays.js';
import { uniqueIds } from '../../utils/ids.js';
import { toPositiveInteger } from '../../utils/numbers.js';
import { getTechniqueStatisticCategory } from "./stat-definitions.js";
import {
  buildTechniqueSlotBadgeLabels,
  finalizeTechniqueSlotCounts,
  summarizeTechniqueSlotCounts
} from "./component-display-service.js";

const BASE_SLOT_COUNTS = Object.freeze({
  range: 1,
  duration: 1,
  free: 1,
  total: 3
});

const SLOT_TYPES = Object.freeze(["free", "range", "duration"]);

/**
 * Construit le budget complet de slots statistiques d’une technique.
 *
 * Une technique possède de base :
 * - 1 slot de portée ;
 * - 1 slot de durée ;
 * - 1 slot libre.
 *
 * Certains passifs de métiers, conditions ou mécaniques peuvent ajouter des slots.
 * Les statistiques de portée et de durée consomment d’abord leurs slots dédiés.
 * Les dépassements consomment ensuite des slots libres.
 *
 * @param {object} [system={}] - Données système de la technique.
 * @param {Actor|null} [actor=null] - Acteur propriétaire de la technique, utilisé pour lire les métiers sources.
 * @returns {object} Budget complet des slots statistiques.
 */
export function buildTechniqueSlotBudget(system = {}, actor = null) {
  const statistics = asArray(system.statistics);
  const conditions = asArray(system.conditions);
  const mechanics = asArray(system.mechanics);

  const passiveDetails = getTechniquePassiveSlotDetails(actor, system);
  const conditionDetails = getTechniqueComponentSlotDetails(conditions);
  const mechanicDetails = getTechniqueComponentSlotDetails(mechanics);

  const passiveSlots = mergeDetailCounts(passiveDetails);
  const conditionSlots = mergeDetailCounts(conditionDetails);
  const mechanicSlots = mergeDetailCounts(mechanicDetails);
  const extraSlots = mergeSlotCounts(passiveSlots, conditionSlots, mechanicSlots);

  const counts = countTechniqueStatisticsBySlotCategory(statistics);

  const baseSlots = { ...BASE_SLOT_COUNTS };
  const availableSlots = {
    range: baseSlots.range + extraSlots.range,
    duration: baseSlots.duration + extraSlots.duration,
    free: baseSlots.free + extraSlots.free
  };

  const usedDedicatedRangeSlots = Math.min(counts.range, availableSlots.range);
  const usedDedicatedDurationSlots = Math.min(counts.duration, availableSlots.duration);

  const overflowRangeSlots = Math.max(0, counts.range - availableSlots.range);
  const overflowDurationSlots = Math.max(0, counts.duration - availableSlots.duration);

  const usedFreeSlots = counts.effect + overflowRangeSlots + overflowDurationSlots;
  const fitsWithinSlots = usedFreeSlots <= availableSlots.free;
  const remainingFreeSlots = Math.max(0, availableSlots.free - usedFreeSlots);

  const remainingStatisticSlots =
    Math.max(0, availableSlots.range - usedDedicatedRangeSlots)
    + Math.max(0, availableSlots.duration - usedDedicatedDurationSlots)
    + remainingFreeSlots;

  const breakdownSections = buildBreakdownSections(
    passiveDetails,
    conditionDetails,
    mechanicDetails
  );

  return {
    baseStatisticSlots: baseSlots.total,
    extraStatisticSlots: sumSlotCounts(extraSlots),
    passiveExtraStatisticSlots: sumSlotCounts(passiveSlots),
    conditionExtraStatisticSlots: sumSlotCounts(conditionSlots),
    mechanicExtraStatisticSlots: sumSlotCounts(mechanicSlots),

    availableStatisticSlots: sumAvailableSlots(availableSlots),
    usedStatisticSlots: counts.total,
    remainingStatisticSlots,

    baseSlots,
    extraSlots,
    availableSlots,
    counts,

    freeSlots: availableSlots.free,
    usedFreeSlots,
    remainingFreeSlots,

    usedDedicatedRangeSlots,
    usedDedicatedDurationSlots,

    fitsWithinSlots,
    overflowSlots: Math.max(0, usedFreeSlots - availableSlots.free),

    breakdownSections,
    hasBreakdownSections: breakdownSections.length > 0
  };
}

/**
 * Récupère les détails de slots bonus fournis par les passifs de métiers sélectionnés.
 *
 * Seuls les métiers présents dans `system.professionIds` sont inspectés.
 * Seuls leurs passifs actifs sont pris en compte.
 *
 * Attention :
 * cette fonction ne lit pas les passifs d’héritage. Si les héritages doivent aussi
 * fournir des slots statistiques aux techniques, il faudra ajouter une source dédiée.
 *
 * @param {Actor|null} actor - Acteur propriétaire de la technique.
 * @param {object} [system={}] - Données système de la technique.
 * @returns {object[]} Détails de slots bonus issus des passifs de métiers.
 */
function getTechniquePassiveSlotDetails(actor, system = {}) {
  if (!actor?.items) return [];

  const professionIds = uniqueIds(system.professionIds);

  return professionIds.flatMap((professionId) => {
    const profession = actor.items.get(professionId);

    if (profession?.type !== "profession") return [];

    const passiveEntries = asArray(profession.system?.passives);

    return passiveEntries
      .filter((entry) => entry?.isActive)
      .map((entry) => buildSlotDetailEntry(entry, {
        sourceLabel: profession.name
      }))
      .filter((entry) => entry.total > 0);
  });
}

/**
 * Récupère les détails de slots bonus fournis par des composants de technique.
 *
 * Cette fonction est utilisée pour les conditions et les mécaniques,
 * qui peuvent elles aussi ajouter des slots statistiques.
 *
 * @param {object[]} [entries=[]] - Conditions ou mécaniques de la technique.
 * @returns {object[]} Détails de slots bonus.
 */
function getTechniqueComponentSlotDetails(entries = []) {
  return asArray(entries)
    .map((entry) => buildSlotDetailEntry(entry, {
      sourceLabel: String(entry?.sourceLabel ?? "")
    }))
    .filter((entry) => entry.total > 0);
}

/**
 * Construit une entrée détaillée de slots bonus.
 *
 * L’entrée contient :
 * - son libellé ;
 * - son éventuelle source ;
 * - ses comptes de slots finalisés ;
 * - son total ;
 * - ses badges prêts pour l’affichage.
 *
 * @param {object} [entry={}] - Entrée source : passif, condition ou mécanique.
 * @param {object} [options={}] - Options de construction.
 * @param {string} [options.sourceLabel=""] - Nom de la source affichable.
 * @returns {object} Détail de slots bonus.
 */
function buildSlotDetailEntry(entry = {}, { sourceLabel = "" } = {}) {
  const rawSlots = entry?.statisticSlots ?? [];
  const counts = finalizeTechniqueSlotCounts(summarizeTechniqueSlotCounts(rawSlots));

  return {
    label: String(entry?.name ?? "").trim() || "—",
    sourceLabel: String(sourceLabel ?? "").trim(),
    counts,
    total: sumSlotCounts(counts),
    badges: buildTechniqueSlotBadgeLabels(rawSlots)
  };
}

/**
 * Construit les sections de détail du budget de slots.
 *
 * Les sections sont destinées à l’interface et indiquent quelles sources
 * ajoutent des slots supplémentaires.
 *
 * @param {object[]} passiveDetails - Slots issus des passifs de métiers.
 * @param {object[]} conditionDetails - Slots issus des conditions.
 * @param {object[]} mechanicDetails - Slots issus des mécaniques.
 * @returns {object[]} Sections de détail non vides.
 */
function buildBreakdownSections(passiveDetails, conditionDetails, mechanicDetails) {
  return [
    buildBreakdownSection(
      "passives",
      game.i18n.localize("ETERN.TECHNIQUE.SLOTS.PASSIVES"),
      passiveDetails
    ),
    buildBreakdownSection(
      "conditions",
      game.i18n.localize("ETERN.TECHNIQUE.SECTION.CONDITIONS"),
      conditionDetails
    ),
    buildBreakdownSection(
      "mechanics",
      game.i18n.localize("ETERN.TECHNIQUE.SECTION.MECHANICS"),
      mechanicDetails
    )
  ].filter((section) => section.total > 0);
}

/**
 * Construit une section de détail pour une catégorie de sources de slots.
 *
 * @param {string} key - Identifiant interne de la section.
 * @param {string} label - Libellé localisé de la section.
 * @param {object[]} [entries=[]] - Entrées détaillées de la section.
 * @returns {object} Section de détail prête pour le template.
 */
function buildBreakdownSection(key, label, entries = []) {
  const totalCounts = mergeDetailCounts(entries);
  const total = sumSlotCounts(totalCounts);

  return {
    key,
    label,
    total,
    totalLabel: `+${total}`,
    totalBadges: buildTechniqueSlotBadgeLabels(expandCountsToPseudoEntries(totalCounts)),
    entries: asArray(entries)
  };
}

/**
 * Compte les statistiques d’une technique par catégorie de slot.
 *
 * Les statistiques de catégorie `range` utilisent les slots de portée.
 * Les statistiques de catégorie `duration` utilisent les slots de durée.
 * Toutes les autres statistiques utilisent des slots d’effet/libres.
 *
 * @param {object[]} statistics - Statistiques de la technique.
 * @returns {{total: number, range: number, duration: number, effect: number}} Compteurs de statistiques.
 */
function countTechniqueStatisticsBySlotCategory(statistics) {
  const counts = {
    total: 0,
    range: 0,
    duration: 0,
    effect: 0
  };

  for (const entry of asArray(statistics)) {
    counts.total += 1;

    const category = getTechniqueStatisticCategory(entry?.statId ?? "damage");

    if (category === "range") {
      counts.range += 1;
    } else if (category === "duration") {
      counts.duration += 1;
    } else {
      counts.effect += 1;
    }
  }

  return counts;
}

/**
 * Fusionne les comptes de slots d’une liste d’entrées détaillées.
 *
 * @param {object[]} [entries=[]] - Entrées contenant soit `counts`, soit directement des clés de slots.
 * @returns {{free: number, range: number, duration: number}} Comptes fusionnés.
 */
function mergeDetailCounts(entries = []) {
  return asArray(entries).reduce((total, entry) => {
    return mergeSlotCounts(total, entry?.counts ?? entry);
  }, createEmptySlotCounts());
}

/**
 * Convertit des comptes de slots en pseudo-entrées compatibles avec les badges.
 *
 * Cette fonction permet de réutiliser `buildTechniqueSlotBadgeLabels`,
 * qui attend une liste d’entrées avec `slotType` et `count`.
 *
 * @param {object} [counts={}] - Comptes de slots.
 * @returns {{slotType: string, count: number}[]} Pseudo-entrées de slots.
 */
function expandCountsToPseudoEntries(counts = {}) {
  return SLOT_TYPES.flatMap((slotType) => {
    const count = toPositiveInteger(counts?.[slotType]);

    return count > 0
      ? [{ slotType, count }]
      : [];
  });
}

/**
 * Fusionne plusieurs objets de comptes de slots.
 *
 * Les valeurs invalides ou négatives sont ramenées à 0 afin d’éviter
 * de propager NaN dans le budget final.
 *
 * @param {...object} counts - Objets de comptes à fusionner.
 * @returns {{free: number, range: number, duration: number}} Comptes fusionnés.
 */
function mergeSlotCounts(...counts) {
  return counts.reduce((total, current) => ({
    free: total.free + toPositiveInteger(current?.free),
    range: total.range + toPositiveInteger(current?.range),
    duration: total.duration + toPositiveInteger(current?.duration)
  }), createEmptySlotCounts());
}

/**
 * Additionne les slots disponibles.
 *
 * @param {{free?: number, range?: number, duration?: number}} slots - Slots disponibles.
 * @returns {number} Total de slots disponibles.
 */
function sumAvailableSlots(slots) {
  return toPositiveInteger(slots?.free)
    + toPositiveInteger(slots?.range)
    + toPositiveInteger(slots?.duration);
}

/**
 * Additionne les comptes de slots bonus.
 *
 * @param {{free?: number, range?: number, duration?: number}} counts - Comptes de slots.
 * @returns {number} Total de slots.
 */
function sumSlotCounts(counts) {
  return toPositiveInteger(counts?.free)
    + toPositiveInteger(counts?.range)
    + toPositiveInteger(counts?.duration);
}

/**
 * Crée un objet vide de comptes de slots.
 *
 * @returns {{free: number, range: number, duration: number}} Comptes initialisés à zéro.
 */
function createEmptySlotCounts() {
  return {
    free: 0,
    range: 0,
    duration: 0
  };
}


