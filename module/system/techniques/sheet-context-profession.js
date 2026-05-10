/**
 * Construit le contexte Handlebars des fiches de métier.
 *
 * Responsabilités :
 * - préparer les sections éditables d’un item de type `profession` ;
 * - fournir le catalogue des statistiques utilisables par les passifs et modules de métier ;
 * - construire les sections : passifs, clés, conditions, mécaniques et états ;
 * - activer les options propres à chaque section, comme les entrées universelles,
 *   les entrées actives ou les références d’états.
 *
 * Ce fichier doit rester un builder de contexte.
 * Il ne doit pas modifier l’item, créer de documents, gérer les événements DOM
 * ou contenir la logique de calcul des techniques.
 */

import { getTechniqueStatIds } from "./stat-definitions.js";
import {
  buildBuilderSectionContext,
  buildTechniqueStatCatalog
} from "./sheet-context-builder.js";

const PROFESSION_SECTION_CONFIGS = Object.freeze([
  {
    key: "passives",
    labelKey: "ETERN.PROFESSION.SECTION.PASSIVES",
    emptyLabelKey: "ETERN.PROFESSION.EMPTY.PASSIVES",
    withActive: true
  },
  {
    key: "keys",
    labelKey: "ETERN.PROFESSION.SECTION.KEYS",
    emptyLabelKey: "ETERN.PROFESSION.EMPTY.KEYS",
    withUniversal: true
  },
  {
    key: "conditions",
    labelKey: "ETERN.PROFESSION.SECTION.CONDITIONS",
    emptyLabelKey: "ETERN.PROFESSION.EMPTY.CONDITIONS",
    withUniversal: true
  },
  {
    key: "mechanics",
    labelKey: "ETERN.PROFESSION.SECTION.MECHANICS",
    emptyLabelKey: "ETERN.PROFESSION.EMPTY.MECHANICS",
    withUniversal: true
  },
  {
    key: "states",
    labelKey: "ETERN.PROFESSION.SECTION.STATES",
    emptyLabelKey: "ETERN.PROFESSION.EMPTY.STATES",
    withUniversal: true,
    withStateReference: true
  }
]);

/**
 * Construit le contexte complet d’une fiche de métier.
 *
 * Si l’item fourni n’est pas un métier, la fonction renvoie un objet vide.
 *
 * @param {Item} item - Item métier à préparer.
 * @returns {{professionSections?: object[]}} Contexte Handlebars de la fiche métier.
 */
export function buildProfessionSheetContext(item) {
  if (item?.type !== "profession") return {};

  const statCatalog = buildTechniqueStatCatalog(getTechniqueStatIds());

  return {
    professionSections: buildProfessionSections(item, statCatalog)
  };
}

/**
 * Construit toutes les sections éditables d’un métier.
 *
 * Chaque section reçoit :
 * - sa clé système ;
 * - son label localisé ;
 * - les entrées existantes dans `item.system` ;
 * - ses options d’affichage ;
 * - le catalogue des statistiques utilisables.
 *
 * @param {Item} item - Item métier.
 * @param {object[]} statCatalog - Catalogue des statistiques de technique.
 * @returns {object[]} Sections prêtes pour le template.
 */
function buildProfessionSections(item, statCatalog) {
  return PROFESSION_SECTION_CONFIGS.map((config) => {
    return buildBuilderSectionContext(
      config.key,
      game.i18n.localize(config.labelKey),
      item.system?.[config.key],
      {
        emptyLabelKey: config.emptyLabelKey,
        statCatalog,
        withActive: Boolean(config.withActive),
        withUniversal: Boolean(config.withUniversal),
        withStateReference: Boolean(config.withStateReference)
      }
    );
  });
}