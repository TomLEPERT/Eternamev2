/**
 * Service d’affichage des composants de techniques.
 *
 * Responsabilités :
 * - formater les coûts XP des composants ;
 * - résumer les slots statistiques accordés par un module ;
 * - construire les badges de slots affichables ;
 * - localiser le nom d’un état lié à un module ;
 * - préparer les métadonnées d’affichage communes aux entrées de builder.
 *
 * Ce fichier doit rester centré sur la présentation des données déjà calculées.
 * Il ne doit pas contenir la logique de validation, de synchronisation ou d’application des bonus.
 */

import { asArray } from '../../utils/arrays.js';
import { toInteger, toPositiveInteger } from '../../utils/numbers.js';
import {
  TECHNIQUE_MODULE_SLOT_TYPES,
  getTechniqueModuleStateDefinition,
  normalizeTechniqueModuleSlotType
} from "./module-entry-config.js";

/**
 * Formate un coût XP avec son signe.
 *
 * Exemples :
 * - `2` devient `+2 XP` ;
 * - `0` devient `+0 XP` ;
 * - `-1` devient `-1 XP`.
 *
 * Les coûts négatifs doivent rester possibles, car certaines conditions
 * peuvent réduire le coût d’une technique.
 *
 * @param {unknown} xpCost - Coût XP brut.
 * @returns {string} Coût XP formaté.
 */
export function buildTechniqueSignedXpLabel(xpCost = 0) {
  const value = toInteger(xpCost);

  return `${value >= 0 ? "+" : ""}${value} XP`;
}

/**
 * Résume les slots statistiques accordés par une liste d’entrées.
 *
 * Chaque entrée peut utiliser :
 * - `slotType` ou `type` pour le type de slot ;
 * - `count` ou `amount` pour la quantité.
 *
 * Les types de slots sont normalisés via `normalizeTechniqueModuleSlotType`.
 * Les quantités sont forcées à au moins 1, car une entrée présente représente
 * un bonus de slot effectif.
 *
 * @param {Array<object>} [entries=[]] - Entrées de slots brutes.
 * @returns {{free: number, range: number, duration: number, total: number}} Résumé des slots.
 */
export function summarizeTechniqueSlotCounts(entries = []) {
  return asArray(entries).reduce((total, entry) => {
    const slotType = normalizeTechniqueModuleSlotType(
      entry?.slotType ?? entry?.type ?? "free"
    );

    const count = toPositiveInteger(entry?.count ?? entry?.amount ?? 1, 1);

    total[slotType] += count;
    total.total += count;

    return total;
  }, createEmptySlotCounts());
}

/**
 * Finalise un objet de comptes de slots.
 *
 * Cette fonction garantit que les compteurs sont des entiers positifs
 * et recalcule toujours `total` depuis les valeurs normalisées.
 *
 * @param {object} [counts={}] - Comptes de slots bruts.
 * @returns {{free: number, range: number, duration: number, total: number}} Comptes finalisés.
 */
export function finalizeTechniqueSlotCounts(counts = {}) {
  const free = toPositiveInteger(counts?.free);
  const range = toPositiveInteger(counts?.range);
  const duration = toPositiveInteger(counts?.duration);

  return {
    free,
    range,
    duration,
    total: free + range + duration
  };
}

/**
 * Construit les libellés de badges pour les slots statistiques.
 *
 * Les badges sont localisés et seuls les types de slots ayant une quantité
 * supérieure à 0 sont retournés.
 *
 * Exemple de sortie :
 * - `["1 Libre", "2 Portée"]`
 *
 * @param {Array<object>} [entries=[]] - Entrées de slots brutes.
 * @returns {string[]} Libellés de badges localisés.
 */
export function buildTechniqueSlotBadgeLabels(entries = []) {
  const counts = finalizeTechniqueSlotCounts(
    summarizeTechniqueSlotCounts(entries)
  );

  return [
    buildSlotBadgeLabel("free", counts.free),
    buildSlotBadgeLabel("range", counts.range),
    buildSlotBadgeLabel("duration", counts.duration)
  ].filter(Boolean);
}

/**
 * Construit le libellé localisé d’un état système.
 *
 * Si l’état est inconnu ou absent, la fonction renvoie une chaîne vide.
 *
 * @param {unknown} stateId - Identifiant d’état brut.
 * @returns {string} Libellé localisé de l’état, ou chaîne vide.
 */
export function buildTechniqueStateLabel(stateId = "") {
  const definition = getTechniqueModuleStateDefinition(stateId);

  return definition
    ? game.i18n.localize(definition.nameKey)
    : "";
}

/**
 * Prépare les métadonnées d’affichage communes d’une entrée de technique.
 *
 * Cette fonction ajoute :
 * - le coût XP formaté ;
 * - le label d’état localisé ;
 * - les badges de slots statistiques ;
 * - un booléen indiquant si des badges existent.
 *
 * @param {object} [entry={}] - Entrée de composant brute.
 * @returns {{
 *   signedXpLabel: string,
 *   stateLabel: string,
 *   slotBadges: string[],
 *   hasSlotBadges: boolean
 * }} Métadonnées d’affichage.
 */
export function buildTechniqueEntryDisplayMeta(entry = {}) {
  const slotBadges = buildTechniqueSlotBadgeLabels(entry?.statisticSlots ?? []);

  return {
    signedXpLabel: buildTechniqueSignedXpLabel(entry?.xpCost ?? 0),
    stateLabel: buildTechniqueStateLabel(entry?.stateId ?? ""),
    slotBadges,
    hasSlotBadges: slotBadges.length > 0
  };
}

/**
 * Construit le libellé d’un badge de slot.
 *
 * Si la quantité est inférieure ou égale à 0, aucun badge n’est produit.
 *
 * @param {"free"|"range"|"duration"} slotType - Type de slot.
 * @param {number} count - Quantité de slots.
 * @returns {string} Badge localisé ou chaîne vide.
 */
function buildSlotBadgeLabel(slotType, count) {
  if (count <= 0) return "";

  const labelKey = TECHNIQUE_MODULE_SLOT_TYPES[slotType];

  return `${count} ${game.i18n.localize(labelKey)}`;
}

/**
 * Crée un objet vide de comptes de slots.
 *
 * @returns {{free: number, range: number, duration: number, total: number}} Comptes initialisés.
 */
function createEmptySlotCounts() {
  return {
    free: 0,
    range: 0,
    duration: 0,
    total: 0
  };
}


