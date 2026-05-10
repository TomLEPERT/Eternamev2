/**
 * Construit le contexte Handlebars des fiches de techniques.
 *
 * Responsabilités :
 * - préparer le contexte des items de type `technique` ;
 * - préparer le contexte des héritages dont la forme est `technique` ;
 * - construire les choix de métiers sources pour les techniques classiques ;
 * - exposer les statistiques sélectionnées, le catalogue de statistiques et la statistique principale ;
 * - exposer les résumés XP, puissance, lisibilité et budget de slots ;
 * - exposer les messages de validation localisés ;
 * - fusionner les composants de base et les composants venant des métiers sources ;
 * - préparer les sections affichées dans l’onglet Composants.
 *
 * Ce fichier doit rester un builder de contexte.
 * Il ne doit pas modifier l’item, créer de documents, gérer les événements DOM
 * ou contenir les règles profondes de calcul des techniques.
 */

import { asArray } from '../../utils/arrays.js';
import { uniqueIds } from '../../utils/ids.js';
import { getTechniqueStatIds } from "./stat-definitions.js";
import { buildTechniqueValidationSummary } from "./validation-service.js";
import { buildTechniqueProfessionSourceSections } from "./profession-source-service.js";
import { buildTechniqueBaseComponentSourceSections } from "./base-components.js";
import { buildTechniqueXpSummary } from "./xp-service.js";
import { buildTechniquePowerSummary } from "./power-service.js";
import { buildTechniqueReadableSummary } from "./summary-service.js";
import { buildTechniqueSlotBudget } from "./slot-budget-service.js";
import {
  getTechniqueLinkedAttributeChoices,
  getTechniqueUsageChoices,
  normalizeTechniqueLinkedAttributeKey,
  normalizeTechniqueUsageType
} from "./usage-service.js";
import { normalizeHeritageFeatureType } from "../constants/heritages.js";
import {
  buildTechniqueMainStatisticChoices,
  buildTechniquePowerEnhancementChoices,
  buildTechniqueSectionContext,
  buildTechniqueStatCatalog,
  buildSelectedTechniqueStatistics,
  localizeValidationMessage
} from "./sheet-context-builder.js";

const TECHNIQUE_SECTION_KEYS = Object.freeze([
  "keys",
  "conditions",
  "mechanics",
  "states"
]);

const TECHNIQUE_SECTION_CONFIGS = Object.freeze([
  {
    key: "keys",
    labelKey: "ETERN.TECHNIQUE.SECTION.KEYS",
    emptyLabelKey: "ETERN.TECHNIQUE.EMPTY.KEYS"
  },
  {
    key: "conditions",
    labelKey: "ETERN.TECHNIQUE.SECTION.CONDITIONS",
    emptyLabelKey: "ETERN.TECHNIQUE.EMPTY.CONDITIONS",
    withExtraStatisticSlots: true
  },
  {
    key: "mechanics",
    labelKey: "ETERN.TECHNIQUE.SECTION.MECHANICS",
    emptyLabelKey: "ETERN.TECHNIQUE.EMPTY.MECHANICS",
    withExtraStatisticSlots: true
  },
  {
    key: "states",
    labelKey: "ETERN.TECHNIQUE.SECTION.STATES",
    emptyLabelKey: "ETERN.TECHNIQUE.EMPTY.STATES"
  }
]);

/**
 * Construit le contexte complet d’une fiche technique.
 *
 * La fonction accepte deux types d’items :
 * - les items `technique` classiques ;
 * - les items `heritage` dont `featureType` vaut `technique`.
 *
 * Pour tout autre item, elle renvoie un objet vide.
 *
 * @param {Item} item - Item technique ou héritage technique.
 * @returns {object} Contexte Handlebars de la fiche technique.
 */
export function buildTechniqueSheetContext(item) {
  const isTechniqueItem = item?.type === "technique";
  const isHeritageTechnique = isTechniqueHeritage(item);

  if (!isTechniqueItem && !isHeritageTechnique) return {};

  const actor = item.parent ?? null;
  const system = item.system ?? {};

  const selectedProfessionIds = getSelectedProfessionIds(item, isTechniqueItem);
  const equippedProfessionIds = getEquippedProfessionIds(actor);
  const professionChoices = buildProfessionChoices(
    actor,
    selectedProfessionIds,
    equippedProfessionIds,
    isTechniqueItem
  );

  const xpSummary = getTechniqueXpSummary(system);
  const powerSummary = getTechniquePowerSummary(system);
  const readableSummary = getTechniqueReadableSummary(item, powerSummary, xpSummary);
  const slotBudget = getTechniqueSlotBudget(system, actor);

  const selectedStatistics = buildSelectedTechniqueStatistics(system, powerSummary);
  const mainStatisticId = String(system.mainStatisticId ?? "");
  const mainStatisticChoices = buildTechniqueMainStatisticChoices(
    selectedStatistics,
    mainStatisticId
  );

  const statCatalog = buildTechniqueStatCatalog(getTechniqueStatIds());
  const powerEnhancements = asArray(system.powerEnhancements);

  const sourceSections = buildMergedSourceSections({
    actor,
    system,
    selectedProfessionIds,
    isTechniqueItem
  });

  const validation = buildLocalizedValidationSummary(item);
  const usageContext = buildTechniqueUsageContext(system);

  return {
    isTechniqueItem,
    isHeritageTechnique,

    techniqueProfessionChoices: professionChoices,

    selectedTechniqueStatistics: selectedStatistics,
    techniqueStatCatalog: statCatalog,
    mainStatisticChoices,

    techniqueSummary: buildTechniqueSummaryContext(xpSummary, readableSummary),

    techniqueValidation: validation,

    powerEnhancementChoices: buildTechniquePowerEnhancementChoices(
      system.power ?? 0,
      powerEnhancements,
      selectedStatistics
    ),

    techniquePowerSummary: buildTechniquePowerSummaryContext(powerSummary),

    techniqueReadableSummary: buildTechniqueReadableSummaryContext(readableSummary),

    techniqueSlotBudget: slotBudget,

    techniqueUsage: usageContext,

    techniqueSections: buildTechniqueSections({
      actor,
      selectedProfessionIds,
      system,
      sourceSections
    })
  };
}

/**
 * Détermine si un item d’héritage doit être traité comme une technique.
 *
 * @param {Item} item - Item à analyser.
 * @returns {boolean} `true` si l’item est un héritage technique.
 */
function isTechniqueHeritage(item) {
  return item?.type === "heritage"
    && normalizeHeritageFeatureType(item.system?.featureType) === "technique";
}

/**
 * Récupère les métiers sélectionnés comme sources d’une technique.
 *
 * Les héritages techniques ne dépendent pas des métiers sources,
 * donc ils renvoient toujours une liste vide.
 *
 * @param {Item} item - Item technique.
 * @param {boolean} isTechniqueItem - Indique si l’item est une technique classique.
 * @returns {string[]} Identifiants de métiers sources.
 */
function getSelectedProfessionIds(item, isTechniqueItem) {
  if (!isTechniqueItem) return [];

  return uniqueIds(item.system?.professionIds);
}

/**
 * Récupère les métiers équipés sur l’acteur.
 *
 * Ces ids permettent d’afficher, dans les choix de source,
 * quels métiers sont actuellement équipés par le personnage.
 *
 * @param {Actor|null} actor - Acteur propriétaire de la technique.
 * @returns {Set<string>} Identifiants des métiers équipés.
 */
function getEquippedProfessionIds(actor) {
  return new Set([
    String(actor?.system?.techniques?.professionSlots?.first ?? "").trim(),
    String(actor?.system?.techniques?.professionSlots?.second ?? "").trim()
  ].filter(Boolean));
}

/**
 * Construit les choix de métiers sources pour une technique classique.
 *
 * Chaque choix indique :
 * - l’id du métier ;
 * - son nom affichable ;
 * - s’il est sélectionné comme source ;
 * - s’il est actuellement équipé.
 *
 * Les héritages techniques ne reçoivent aucun choix de métier.
 *
 * @param {Actor|null} actor - Acteur propriétaire.
 * @param {string[]} selectedProfessionIds - Métiers sélectionnés comme sources.
 * @param {Set<string>} equippedProfessionIds - Métiers équipés.
 * @param {boolean} isTechniqueItem - Indique si l’item est une technique classique.
 * @returns {{value: string, label: string, selected: boolean, isEquipped: boolean}[]} Choix de métiers.
 */
function buildProfessionChoices(
  actor,
  selectedProfessionIds,
  equippedProfessionIds,
  isTechniqueItem
) {
  if (!isTechniqueItem || !actor?.items?.contents) return [];

  const selectedSet = new Set(selectedProfessionIds);

  return actor.items.contents
    .filter((ownedItem) => ownedItem.type === "profession")
    .map((ownedItem) => {
      const id = String(ownedItem.id ?? "");

      return {
        value: id,
        label: ownedItem.name,
        selected: selectedSet.has(id),
        isEquipped: equippedProfessionIds.has(id)
      };
    });
}

/**
 * Récupère ou calcule le résumé XP d’une technique.
 *
 * Si les données dérivées existent déjà, elles sont réutilisées.
 * Sinon, le résumé est recalculé depuis les données système.
 *
 * @param {object} system - Données système de la technique.
 * @returns {object} Résumé XP.
 */
function getTechniqueXpSummary(system) {
  if (system?.derived?.xpBreakdown) {
    return {
      breakdown: system.derived.xpBreakdown,
      creationXp: Number(system?.derived?.creationXp ?? 0) || 0,
      powerXp: Number(system?.derived?.powerXp ?? 0) || 0,
      totalXp: Number(system?.derived?.totalXp ?? 0) || 0
    };
  }

  return buildTechniqueXpSummary(system);
}

/**
 * Récupère ou calcule le résumé de puissance d’une technique.
 *
 * @param {object} system - Données système de la technique.
 * @returns {object} Résumé de puissance.
 */
function getTechniquePowerSummary(system) {
  return system?.derived?.powerSummary ?? buildTechniquePowerSummary(system);
}

/**
 * Récupère ou calcule le résumé lisible d’une technique.
 *
 * @param {Item} item - Item technique.
 * @param {object} powerSummary - Résumé de puissance.
 * @param {object} xpSummary - Résumé XP.
 * @returns {object} Résumé lisible.
 */
function getTechniqueReadableSummary(item, powerSummary, xpSummary) {
  return item.system?.derived?.summary
    ?? buildTechniqueReadableSummary(item, powerSummary, xpSummary);
}

/**
 * Récupère ou calcule le budget de slots statistiques d’une technique.
 *
 * @param {object} system - Données système de la technique.
 * @param {Actor|null} actor - Acteur propriétaire.
 * @returns {object} Budget de slots statistiques.
 */
function getTechniqueSlotBudget(system, actor) {
  return system?.derived?.slotBudget
    ?? buildTechniqueSlotBudget(system, actor);
}

/**
 * Construit les sections de sources disponibles pour les composants.
 *
 * Les sources sont composées de deux blocs :
 * - les composants de base disponibles pour tout le monde ;
 * - les composants venant des métiers sélectionnés, uniquement pour les techniques classiques.
 *
 * @param {object} params - Paramètres de construction.
 * @param {Actor|null} params.actor - Acteur propriétaire.
 * @param {object} params.system - Données système de la technique.
 * @param {string[]} params.selectedProfessionIds - Métiers sélectionnés.
 * @param {boolean} params.isTechniqueItem - Indique si l’item est une technique classique.
 * @returns {{keys: object[], conditions: object[], mechanics: object[], states: object[]}} Sections fusionnées.
 */
function buildMergedSourceSections({
  actor,
  system,
  selectedProfessionIds,
  isTechniqueItem
}) {
  const baseSourceSections = buildTechniqueBaseComponentSourceSections(system);

  const professionSourceSections = isTechniqueItem
    ? buildTechniqueProfessionSourceSections(actor, selectedProfessionIds, system)
    : createEmptySourceSections();

  return mergeTechniqueSourceSections(baseSourceSections, professionSourceSections);
}

/**
 * Construit le résumé de validation localisé d’une technique.
 *
 * Les erreurs et avertissements bruts sont convertis en messages localisés
 * avant d’être envoyés au template.
 *
 * @param {Item} item - Item technique.
 * @returns {object} Résumé de validation localisé.
 */
function buildLocalizedValidationSummary(item) {
  const validation = buildTechniqueValidationSummary(item);

  return {
    ...validation,
    errors: validation.errors.map(localizeValidationMessage),
    warnings: validation.warnings.map(localizeValidationMessage)
  };
}

/**
 * Construit le contexte lié au type d’usage de la technique.
 *
 * Le contexte distingue :
 * - les techniques d’attaque ;
 * - les techniques rituelles ;
 * - l’attribut lié utilisé par les rituels.
 *
 * @param {object} system - Données système de la technique.
 * @returns {object} Contexte d’usage.
 */
function buildTechniqueUsageContext(system) {
  const usageType = normalizeTechniqueUsageType(system?.usageType ?? "attack");
  const linkedAttributeKey = normalizeTechniqueLinkedAttributeKey(
    system?.linkedAttributeKey ?? "magic"
  );

  return {
    type: usageType,
    usageChoices: getTechniqueUsageChoices(usageType),
    linkedAttributeKey,
    linkedAttributeChoices: getTechniqueLinkedAttributeChoices(linkedAttributeKey),
    isAttack: usageType === "attack",
    isRitual: usageType === "ritual"
  };
}

/**
 * Construit le résumé XP court envoyé au template.
 *
 * @param {object} xpSummary - Résumé XP.
 * @param {object} readableSummary - Résumé lisible.
 * @returns {object} Résumé synthétique.
 */
function buildTechniqueSummaryContext(xpSummary, readableSummary) {
  return {
    creationXp: Number(xpSummary.creationXp ?? 0) || 0,
    powerXp: Number(xpSummary.powerXp ?? 0) || 0,
    totalXp: Number(xpSummary.totalXp ?? 0) || 0,
    breakdown: xpSummary.breakdown ?? {},
    headline: String(readableSummary.headline ?? ""),
    shortText: String(readableSummary.shortText ?? "")
  };
}

/**
 * Construit le contexte de puissance envoyé au template.
 *
 * @param {object} powerSummary - Résumé de puissance.
 * @returns {object} Contexte de puissance.
 */
function buildTechniquePowerSummaryContext(powerSummary) {
  return {
    power: Number(powerSummary.power ?? 0) || 0,
    availableBonusRanks: Number(powerSummary.availableBonusRanks ?? 0) || 0,
    assignedBonusRanks: Number(powerSummary.assignedBonusRanks ?? 0) || 0,
    missingBonusRanks: Number(powerSummary.missingBonusRanks ?? 0) || 0,
    stepCosts: asArray(powerSummary.stepCosts)
  };
}

/**
 * Construit le résumé lisible envoyé au template.
 *
 * @param {object} readableSummary - Résumé lisible brut.
 * @returns {object} Résumé lisible sécurisé.
 */
function buildTechniqueReadableSummaryContext(readableSummary) {
  return {
    professions: asArray(readableSummary.professions),
    headline: String(readableSummary.headline ?? ""),
    shortText: String(readableSummary.shortText ?? ""),
    componentSections: asArray(readableSummary.componentSections)
  };
}

/**
 * Construit les sections de composants affichées dans la fiche technique.
 *
 * Chaque section reçoit :
 * - l’acteur ;
 * - les métiers sources sélectionnés ;
 * - la clé de section ;
 * - le label localisé ;
 * - les entrées déjà présentes sur la technique ;
 * - les sources disponibles ;
 * - les options propres à la section.
 *
 * @param {object} params - Paramètres de construction.
 * @param {Actor|null} params.actor - Acteur propriétaire.
 * @param {string[]} params.selectedProfessionIds - Métiers sélectionnés.
 * @param {object} params.system - Données système de la technique.
 * @param {object} params.sourceSections - Sources disponibles par section.
 * @returns {object[]} Sections prêtes pour le template.
 */
function buildTechniqueSections({
  actor,
  selectedProfessionIds,
  system,
  sourceSections
}) {
  return TECHNIQUE_SECTION_CONFIGS.map((config) => {
    return buildTechniqueSectionContext(
      actor,
      selectedProfessionIds,
      config.key,
      game.i18n.localize(config.labelKey),
      system?.[config.key],
      sourceSections[config.key],
      {
        emptyLabelKey: config.emptyLabelKey,
        withExtraStatisticSlots: Boolean(config.withExtraStatisticSlots)
      }
    );
  });
}

/**
 * Fusionne plusieurs sources de composants de technique.
 *
 * Chaque source doit pouvoir contenir les sections :
 * - `keys`
 * - `conditions`
 * - `mechanics`
 * - `states`
 *
 * Les entrées sont concaténées dans l’ordre des sources reçues.
 *
 * @param {...object} sources - Sources à fusionner.
 * @returns {{keys: object[], conditions: object[], mechanics: object[], states: object[]}} Sources fusionnées.
 */
function mergeTechniqueSourceSections(...sources) {
  return TECHNIQUE_SECTION_KEYS.reduce((result, sectionKey) => {
    result[sectionKey] = sources.flatMap((source) => {
      return Array.isArray(source?.[sectionKey])
        ? source[sectionKey]
        : [];
    });

    return result;
  }, {});
}

/**
 * Crée une structure vide de sections de sources.
 *
 * @returns {{keys: object[], conditions: object[], mechanics: object[], states: object[]}} Sections vides.
 */
function createEmptySourceSections() {
  return {
    keys: [],
    conditions: [],
    mechanics: [],
    states: []
  };
}


