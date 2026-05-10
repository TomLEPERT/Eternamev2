/**
 * Préparation des données dérivées des consommables.
 *
 * Responsabilités :
 * - normaliser la catégorie du consommable ;
 * - normaliser le type de concoction ;
 * - normaliser la qualité d’essence ;
 * - normaliser la base de catalyseur d’enchantement ;
 * - appliquer la description d’un catalyseur si elle est vide ;
 * - appliquer un nom par défaut selon la catégorie du consommable ;
 * - préparer les données d’enchantement pour les consommables compatibles.
 *
 * Ce fichier doit rester dédié aux consommables.
 * Il ne doit pas contenir la logique d’utilisation des potions, d’application des effets,
 * de création d’enchantements ou de gestion des ressources d’acteur.
 */

import {
  getCatalystDefinition,
  normalizeCatalystBase,
  normalizeConsumableCategory,
  normalizeConcoctionType,
  normalizeEssenceQuality
} from "../../constants/consumables.js";
import { prepareEnchantingData } from "./shared-derived.js";

/**
 * Prépare les données système d’un item consommable.
 *
 * La fonction normalise :
 * - `category` ;
 * - `concoctionType` ;
 * - `essenceQuality` ;
 * - `catalystBase`.
 *
 * Elle applique ensuite :
 * - les données d’enchantement si le consommable n’est pas un catalyseur ;
 * - la description localisée du catalyseur si nécessaire ;
 * - un nom par défaut selon la catégorie.
 *
 * @param {Item} item - Item consommable à préparer.
 * @param {object} system - Données système mutables du consommable.
 * @returns {void}
 */
export function prepareConsumableData(item, system) {
  system.category = normalizeConsumableCategory(system.category ?? "misc");
  system.concoctionType = normalizeConcoctionType(system.concoctionType ?? "healingPotion");
  system.essenceQuality = normalizeEssenceQuality(system.essenceQuality ?? "none");
  system.catalystBase = normalizeCatalystBase(system.catalystBase ?? "brutal_shard");

  if (system.category !== "enchantmentCatalyst") {
    prepareEnchantingData(item, system);
  }

  applyCatalystDescription(system);
  applyDefaultConsumableName(item, system);
}

/**
 * Applique la description localisée d’un catalyseur d’enchantement.
 *
 * La description est appliquée seulement si :
 * - le consommable est un catalyseur d’enchantement ;
 * - la description actuelle est vide.
 *
 * @param {object} system - Données système du consommable.
 * @returns {void}
 */
function applyCatalystDescription(system) {
  if (system.category !== "enchantmentCatalyst") return;
  if (String(system.description ?? "").trim()) return;

  const catalyst = getCatalystDefinition(system.catalystBase);

  system.description = game.i18n.localize(catalyst.descriptionKey);
}

/**
 * Applique un nom par défaut au consommable si son nom est vide.
 *
 * Le nom dépend de la catégorie :
 * - catalyseur d’enchantement : nom localisé de la base de catalyseur ;
 * - concoction : nom générique de concoction ;
 * - autre consommable : nom générique de consommable.
 *
 * @param {Item} item - Item consommable.
 * @param {object} system - Données système du consommable.
 * @returns {void}
 */
function applyDefaultConsumableName(item, system) {
  if (String(item.name ?? "").trim()) return;

  if (system.category === "enchantmentCatalyst") {
    const catalyst = getCatalystDefinition(system.catalystBase);
    item.name = game.i18n.localize(catalyst.labelKey);
    return;
  }

  if (system.category === "concoction") {
    item.name = game.i18n.localize("ETERN.ITEM.DEFAULT_CONCOCTION_NAME");
    return;
  }

  item.name = game.i18n.localize("ETERN.ITEM.DEFAULT_CONSUMABLE_NAME");
}