/**
 * Contexte et helpers du dialogue d’enchantement.
 *
 * Responsabilités :
 * - construire les choix de catalyseurs disponibles ;
 * - construire l’aperçu des règles d’un catalyseur ;
 * - construire les choix de qualité d’essence ;
 * - construire les choix de côté : aléatoire, préfixe ou suffixe ;
 * - lister les catalyseurs possédés par l’acteur parent ;
 * - rendre le contenu Handlebars du dialogue d’enchantement.
 *
 * Ce fichier doit rester dédié à la préparation du dialogue.
 * Il ne doit pas appliquer les enchantements, consommer les catalyseurs,
 * modifier les items ou générer les affixes.
 */

import { toPositiveInteger } from '../../utils/numbers.js';
import {
  ENCHANTMENT_CATALYST_DEFINITIONS,
  ESSENCE_QUALITIES,
  normalizeCatalystBase,
  normalizeEssenceQuality
} from "../constants/consumables.js";
import { getEssenceQualityBonus } from "./services/rank-service.js";
import { getEnchantmentCatalystRule } from "./catalysts.js";
import { localize, localizeIfAvailable } from "../i18n/localization.js";

const ENCHANTMENT_DIALOG_TEMPLATE = "systems/eternamev2/templates/dialogs/enchantment-dialog.hbs";
const DEFAULT_CATALYST_BASE = "brutal_shard";
const DEFAULT_SIDE = "random";

/**
 * Construit un dataset HTML pour l’aperçu d’un catalyseur.
 *
 * Les booléens sont convertis en `"1"` ou `"0"` afin d’être faciles
 * à exploiter depuis le DOM ou les handlers d’interface.
 *
 * @param {string} [base=DEFAULT_CATALYST_BASE] - Base de catalyseur.
 * @returns {object} Dataset prêt pour un template.
 */
export function buildCatalystPreviewDataset(base = DEFAULT_CATALYST_BASE) {
  const preview = getCatalystPreview(base);

  return {
    label: preview.label,
    description: preview.description,
    operation: preview.operationLabel,

    extraSuccesses: String(preview.extraSuccesses),
    hasExtraSuccesses: toDatasetBoolean(preview.hasExtraSuccesses),

    minimumEntries: String(preview.minimumEntries),
    hasMinimumEntries: toDatasetBoolean(preview.hasMinimumEntries),

    requiresEssenceTag: toDatasetBoolean(preview.requiresEssenceTag),
    forcedCurse: toDatasetBoolean(preview.forcedCurse),
    curseOnNaturalOne: toDatasetBoolean(preview.curseOnNaturalOne)
  };
}

/**
 * Construit les choix de bases de catalyseur.
 *
 * Chaque choix contient aussi un aperçu pré-calculé pour permettre
 * à l’interface d’actualiser rapidement le panneau de prévisualisation.
 *
 * @param {string} [selected=DEFAULT_CATALYST_BASE] - Base actuellement sélectionnée.
 * @returns {{value: string, label: string, selected: boolean, preview: object}[]} Choix de catalyseurs.
 */
export function buildCatalystChoices(selected = DEFAULT_CATALYST_BASE) {
  const current = normalizeCatalystBase(selected);

  return Object.entries(ENCHANTMENT_CATALYST_DEFINITIONS).map(([value, definition]) => ({
    value,
    label: localize(definition.labelKey),
    selected: value === current,
    preview: buildCatalystPreviewDataset(value)
  }));
}

/**
 * Construit l’aperçu complet d’un catalyseur.
 *
 * L’aperçu combine :
 * - les textes localisés du consommable catalyseur ;
 * - les règles mécaniques du catalyseur ;
 * - les flags utiles au dialogue.
 *
 * @param {string} [base=DEFAULT_CATALYST_BASE] - Base de catalyseur.
 * @returns {object} Aperçu du catalyseur.
 */
export function getCatalystPreview(base = DEFAULT_CATALYST_BASE) {
  const current = normalizeCatalystBase(base);
  const definition = ENCHANTMENT_CATALYST_DEFINITIONS[current]
    ?? ENCHANTMENT_CATALYST_DEFINITIONS[DEFAULT_CATALYST_BASE];

  const rule = getEnchantmentCatalystRule(current);
  const extraSuccesses = toPositiveInteger(rule.extraSuccesses);
  const minimumEntries = toPositiveInteger(rule.minimumEntries);

  return {
    value: current,
    label: localize(definition.labelKey),
    description: localize(definition.descriptionKey),
    operationLabel: getRuleOperationLabel(rule.operation),

    extraSuccesses,
    hasExtraSuccesses: extraSuccesses > 0,

    minimumEntries,
    hasMinimumEntries: minimumEntries > 0,

    requiresEssenceTag: Boolean(rule.requiresEssenceTag),
    forcedCurse: Boolean(rule.forcedCurse),
    curseOnNaturalOne: Boolean(rule.curseOnNaturalOne)
  };
}

/**
 * Construit les choix de qualité d’essence.
 *
 * Chaque choix indique aussi le bonus mécanique associé à la qualité.
 *
 * @param {string} [selected="none"] - Qualité actuellement sélectionnée.
 * @returns {{value: string, label: string, bonus: number, selected: boolean}[]} Choix de qualité d’essence.
 */
export function buildEssenceQualityChoices(selected = "none") {
  const current = normalizeEssenceQuality(selected);

  return Object.entries(ESSENCE_QUALITIES).map(([value, labelKey]) => ({
    value,
    label: localize(labelKey),
    bonus: getEssenceQualityBonus(value),
    selected: value === current
  }));
}

/**
 * Construit les choix de côté d’enchantement.
 *
 * Valeurs disponibles :
 * - `random` ;
 * - `prefix` ;
 * - `suffix`.
 *
 * @param {string} [selected=DEFAULT_SIDE] - Côté actuellement sélectionné.
 * @returns {{value: string, label: string, selected: boolean}[]} Choix de côté.
 */
export function buildSideChoices(selected = DEFAULT_SIDE) {
  const current = normalizeSideChoice(selected);

  return [
    {
      value: "random",
      label: localize("ETERN.ENCHANTING.DIALOG.RANDOM_SIDE"),
      selected: current === "random"
    },
    {
      value: "prefix",
      label: localize("ETERN.ENCHANTING.ENTRY.BADGE_PREFIX"),
      selected: current === "prefix"
    },
    {
      value: "suffix",
      label: localize("ETERN.ENCHANTING.ENTRY.BADGE_SUFFIX"),
      selected: current === "suffix"
    }
  ];
}

/**
 * Construit les choix de catalyseurs possédés par l’acteur.
 *
 * Le premier choix représente l’absence de catalyseur item.
 * Les choix suivants viennent de l’inventaire de l’acteur parent.
 *
 * @param {Item} item - Item à enchanter.
 * @param {string} [selected=""] - Id du catalyseur sélectionné.
 * @returns {object[]} Choix de sources catalyseur.
 */
export function buildCatalystSourceChoices(item, selected = "") {
  const selectedId = String(selected ?? "").trim();

  const choices = [{
    value: "",
    label: localize("ETERN.ENCHANTING.DIALOG.NO_CATALYST_ITEM"),
    selected: selectedId === "",
    catalystBase: "",
    essenceQuality: "none",
    essenceTag: ""
  }];

  for (const catalyst of getActorCatalysts(item?.parent)) {
    choices.push({
      value: catalyst.id,
      label: `${catalyst.name} ×${catalyst.quantity}`,
      selected: catalyst.id === selectedId,
      catalyst,
      catalystBase: catalyst.catalystBase,
      essenceQuality: catalyst.essenceQuality,
      essenceTag: catalyst.essenceTag
    });
  }

  return choices;
}

/**
 * Rend le contenu HTML du dialogue d’enchantement.
 *
 * Cette fonction prépare le contexte initial du dialogue :
 * - item ciblé ;
 * - choix de catalyseurs ;
 * - aperçu du catalyseur par défaut ;
 * - catalyseurs possédés par l’acteur ;
 * - choix de qualité d’essence ;
 * - choix du côté d’enchantement.
 *
 * @param {Item} item - Item à enchanter.
 * @returns {Promise<string>} HTML rendu du dialogue.
 */
export async function renderEnchantmentDialogContent(item) {
  const catalystSourceChoices = buildCatalystSourceChoices(item);
  const defaultCatalystBase = DEFAULT_CATALYST_BASE;

  return foundry.applications.handlebars.renderTemplate(
    ENCHANTMENT_DIALOG_TEMPLATE,
    {
      itemName: item?.name ?? game.i18n.localize("ETERN.ITEM.DEFAULT_ITEM_NAME"),
      itemUuid: item?.uuid ?? "",

      catalystChoices: buildCatalystChoices(defaultCatalystBase),
      catalystPreview: getCatalystPreview(defaultCatalystBase),
      catalystSourceChoices,

      essenceQualityChoices: buildEssenceQualityChoices("none"),
      sideChoices: buildSideChoices(DEFAULT_SIDE),

      hasActorCatalysts: catalystSourceChoices.length > 1,
      actorHasCatalysts: catalystSourceChoices.length > 1
    }
  );
}

/**
 * Localise l’opération mécanique d’une règle de catalyseur.
 *
 * Si aucune clé i18n n’existe pour l’opération, la valeur brute est utilisée.
 *
 * @param {string} [operation=""] - Opération brute.
 * @returns {string} Label localisé ou fallback.
 */
function getRuleOperationLabel(operation = "") {
  const normalizedOperation = String(operation ?? "").trim();
  const key = `ETERN.ENCHANTING.DIALOG.OPERATION.${normalizedOperation.toUpperCase()}`;

  return localizeIfAvailable(key, normalizedOperation);
}

/**
 * Récupère les catalyseurs d’enchantement présents dans l’inventaire d’un acteur.
 *
 * Seuls les consommables de catégorie `enchantmentCatalyst`
 * avec une quantité strictement positive sont retournés.
 *
 * @param {Actor|null} actor - Acteur propriétaire.
 * @returns {object[]} Catalyseurs disponibles.
 */
function getActorCatalysts(actor) {
  if (!(actor instanceof Actor)) return [];

  return actor.items.contents
    .filter((item) => {
      return item.type === "consumable"
        && item.system?.category === "enchantmentCatalyst";
    })
    .map((item) => ({
      id: item.id,
      name: item.name,
      quantity: toPositiveInteger(item.system?.quantity),
      catalystBase: normalizeCatalystBase(item.system?.catalystBase ?? DEFAULT_CATALYST_BASE),
      essenceQuality: normalizeEssenceQuality(item.system?.essenceQuality ?? "none"),
      essenceTag: String(item.system?.essenceTag ?? "").trim()
    }))
    .filter((item) => item.quantity > 0);
}

/**
 * Normalise un choix de côté.
 *
 * Toute valeur inconnue revient à `random`.
 *
 * @param {unknown} value - Valeur brute.
 * @returns {"random"|"prefix"|"suffix"} Côté normalisé.
 */
function normalizeSideChoice(value) {
  const normalized = String(value ?? DEFAULT_SIDE).trim().toLowerCase();

  return ["random", "prefix", "suffix"].includes(normalized)
    ? normalized
    : DEFAULT_SIDE;
}

/**
 * Convertit un booléen en valeur de dataset HTML.
 *
 * @param {unknown} value - Valeur brute.
 * @returns {"1"|"0"} Valeur de dataset.
 */
function toDatasetBoolean(value) {
  return value ? "1" : "0";
}

