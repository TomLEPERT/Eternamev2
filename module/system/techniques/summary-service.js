/**
 * Service de résumé lisible des techniques du système Etername.
 *
 * Responsabilités :
 * - construire une synthèse utilisateur d’une technique ;
 * - regrouper les métiers sources ;
 * - préparer les sections de composants : clés, conditions, mécaniques et états ;
 * - préparer les statistiques finales issues du résumé de puissance ;
 * - construire un titre court et un texte résumé pour l’affichage ;
 * - exposer les coûts XP calculés ailleurs.
 *
 * Ce fichier doit rester dédié à la transformation de données déjà calculées
 * en données lisibles pour les fiches, cartes ou aperçus.
 *
 * Il ne doit pas contenir :
 * - le calcul de puissance ;
 * - le calcul XP ;
 * - la validation de technique ;
 * - la logique d’utilisation ou de jet.
 */

import { asArray } from '../../utils/arrays.js';
import { getTechniqueStatDefinition } from "./stat-definitions.js";

/**
 * Construit un résumé lisible complet d’une technique.
 *
 * La fonction combine :
 * - les données de l’item technique ;
 * - le résumé de puissance ;
 * - le résumé XP ;
 * - les noms des métiers sources trouvés sur l’acteur parent.
 *
 * Le résultat est pensé pour être injecté dans un contexte de fiche ou de carte.
 *
 * @param {Item} item - Item technique ou héritage technique.
 * @param {object} powerSummary - Résumé de puissance déjà calculé.
 * @param {object} xpSummary - Résumé XP déjà calculé.
 * @returns {{
 *   professions: string[],
 *   componentSections: object[],
 *   statistics: object[],
 *   headline: string,
 *   shortText: string,
 *   totalXp: number,
 *   creationXp: number,
 *   powerXp: number
 * }} Résumé lisible de la technique.
 */
export function buildTechniqueReadableSummary(item, powerSummary = {}, xpSummary = {}) {
  const actor = item?.parent;
  const system = item?.system ?? {};

  const professionIds = Array.isArray(system.professionIds)
    ? system.professionIds
    : [];

  const professionNames = professionIds
    .map((professionId) => {
      const id = String(professionId ?? "").trim();

      return actor?.items?.get?.(id)?.name;
    })
    .filter(Boolean);

  const componentSections = [
    buildSection("ETERN.TECHNIQUE.SECTION.KEYS", system.keys),
    buildSection("ETERN.TECHNIQUE.SECTION.CONDITIONS", system.conditions),
    buildSection("ETERN.TECHNIQUE.SECTION.MECHANICS", system.mechanics),
    buildSection("ETERN.TECHNIQUE.SECTION.STATES", system.states)
  ];

  const statistics = buildReadableStatistics(powerSummary.statistics);

  const headline = buildHeadline(componentSections, statistics);

  return {
    professions: professionNames,
    componentSections,
    statistics,
    headline,
    shortText: buildShortText(componentSections, statistics),
    totalXp: Number(xpSummary.totalXp ?? 0) || 0,
    creationXp: Number(xpSummary.creationXp ?? 0) || 0,
    powerXp: Number(xpSummary.powerXp ?? 0) || 0
  };
}

/**
 * Prépare les statistiques lisibles d’une technique.
 *
 * Les statistiques reçues viennent normalement du résumé de puissance.
 * Cette fonction ajoute le label localisé tout en conservant `statId`,
 * afin de pouvoir identifier les statistiques sans dépendre du texte traduit.
 *
 * @param {Array<object>} statistics - Statistiques brutes issues du résumé de puissance.
 * @returns {object[]} Statistiques enrichies pour l’affichage.
 */
function buildReadableStatistics(statistics) {
  return asArray(statistics).map((entry) => {
    const statId = String(entry?.statId ?? "").trim();
    const definition = getTechniqueStatDefinition(statId);

    return {
      id: String(entry?.statisticId ?? "").trim(),
      statId,
      label: game.i18n.localize(definition.labelKey),
      finalValue: entry?.finalValue ?? "",
      baseValue: entry?.baseValue ?? "",
      isMain: Boolean(entry?.isMain),
      bonusRanks: Number(entry?.bonusRanks ?? 0) || 0,
      thresholdBonusRanks: Number(entry?.thresholdBonusRanks ?? 0) || 0,
      powerRanks: Number(entry?.powerRanks ?? 0) || 0,
      scalesWithPower: Boolean(entry?.scalesWithPower)
    };
  });
}

/**
 * Construit une section de composants lisible.
 *
 * Une section correspond par exemple aux clés, conditions, mécaniques ou états.
 * Les entrées sans nom sont ignorées.
 *
 * @param {string} labelKey - Clé i18n du titre de section.
 * @param {Array<object>} entries - Entrées brutes de la section.
 * @returns {{label: string, entries: object[]}} Section prête pour le template.
 */
function buildSection(labelKey, entries) {
  return {
    label: game.i18n.localize(labelKey),
    entries: asArray(entries)
      .map((entry) => ({
        name: String(entry?.name ?? "").trim(),
        xpCost: Math.trunc(Number(entry?.xpCost ?? 0) || 0),
        isUniversal: Boolean(entry?.isUniversal),
        sourceLabel: String(entry?.sourceLabel ?? "").trim()
      }))
      .filter((entry) => entry.name)
  };
}

/**
 * Construit le titre synthétique d’une technique.
 *
 * Le titre utilise :
 * - la première clé de technique ;
 * - la statistique principale ;
 * - la portée si elle existe ;
 * - la durée si elle existe.
 *
 * @param {object[]} componentSections - Sections de composants préparées.
 * @param {object[]} statistics - Statistiques lisibles préparées.
 * @returns {string} Titre synthétique.
 */
function buildHeadline(componentSections, statistics) {
  const headlineParts = [];

  const primaryKey = componentSections[0]?.entries?.[0]?.name;
  if (primaryKey) headlineParts.push(primaryKey);

  const mainStatistic = statistics.find((entry) => entry.isMain) ?? statistics[0];
  if (mainStatistic) {
    headlineParts.push(`${mainStatistic.label} ${mainStatistic.finalValue}`);
  }

  const rangeStatistic = statistics.find((entry) => entry.statId === "range");
  if (rangeStatistic) {
    headlineParts.push(`${rangeStatistic.label} ${rangeStatistic.finalValue}`);
  }

  const durationStatistic = statistics.find((entry) => entry.statId === "duration");
  if (durationStatistic) {
    headlineParts.push(`${durationStatistic.label} ${durationStatistic.finalValue}`);
  }

  return headlineParts.join(" • ");
}

/**
 * Construit un résumé court de la technique.
 *
 * Le résumé contient :
 * - la première clé de technique ;
 * - jusqu’à trois statistiques.
 *
 * @param {object[]} componentSections - Sections de composants préparées.
 * @param {object[]} statistics - Statistiques lisibles préparées.
 * @returns {string} Texte court.
 */
function buildShortText(componentSections, statistics) {
  const parts = [];

  const firstKey = componentSections[0]?.entries?.[0]?.name;
  if (firstKey) parts.push(firstKey);

  for (const entry of statistics.slice(0, 3)) {
    parts.push(`${entry.label} ${entry.finalValue}`);
  }

  return parts.join(" • ");
}

