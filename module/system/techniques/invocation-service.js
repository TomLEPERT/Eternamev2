/**
 * Service de préparation, normalisation et validation des invocations.
 *
 * Responsabilités :
 * - normaliser les attributs d’une invocation ;
 * - normaliser les bonus liés à la puissance de la technique d’invocation ;
 * - normaliser les seuils débloqués par la puissance ;
 * - construire un résumé complet d’une invocation pour sa fiche ;
 * - calculer le budget d’attributs selon la taille ;
 * - déterminer quels seuils et bonus sont actifs ;
 * - produire les erreurs et avertissements de validation.
 *
 * Ce fichier doit rester centré sur la logique des invocations.
 * Il ne doit pas gérer le DOM, les événements de fiche ou la création directe de documents.
 */

import { asArray } from '../../utils/arrays.js';
import { toPositiveInteger } from '../../utils/numbers.js';
import { ETERNAME_ATTRIBUTES } from "../constants/attributes.js";
import {
  INVOCATION_ATTRIBUTE_KEYS,
  INVOCATION_POWER_BONUS_DEFINITIONS,
  INVOCATION_THRESHOLD_KEYS,
  INVOCATION_THRESHOLD_VALUES,
  getInvocationPowerBonusTargetChoices,
  getInvocationPowerBonusTargetKind,
  getInvocationSizeDefinition,
  invocationPowerBonusRequiresTarget,
  normalizeInvocationPowerBonusTarget,
  normalizeInvocationPowerBonusType,
  normalizeInvocationSize
} from "./invocation-definitions.js";

const MAX_LINKED_TECHNIQUE_POWER = 10;

/**
 * Normalise les attributs d’une invocation.
 *
 * La fonction garantit que chaque attribut attendu existe et contient
 * un entier positif ou zéro.
 *
 * @param {object} [attributes={}] - Attributs bruts de l’invocation.
 * @returns {Record<string, number>} Attributs normalisés.
 */
export function normalizeInvocationAttributes(attributes = {}) {
  const normalized = {};

  for (const key of INVOCATION_ATTRIBUTE_KEYS) {
    normalized[key] = toPositiveInteger(attributes?.[key]);
  }

  return normalized;
}

/**
 * Normalise les bonus de puissance d’une invocation.
 *
 * Chaque bonus contient :
 * - un id ;
 * - un type normalisé ;
 * - une cible normalisée selon le type ;
 * - des notes libres.
 *
 * Attention :
 * si cette fonction est appelée uniquement pour construire un contexte d’affichage,
 * générer un `randomID()` pour une entrée sans id peut produire un nouvel id à chaque rendu.
 * Idéalement, les ids manquants doivent être créés au moment de l’écriture des données.
 *
 * @param {Array<object>} [entries=[]] - Bonus bruts.
 * @returns {{id: string, type: string, target: string, notes: string}[]} Bonus normalisés.
 */
export function normalizeInvocationPowerBoons(entries = []) {
  return asArray(entries).map((entry) => {
    const type = normalizeInvocationPowerBonusType(entry?.type ?? "hp");

    return {
      id: String(entry?.id ?? foundry.utils.randomID()),
      type,
      target: normalizeInvocationPowerBonusTarget(type, entry?.target ?? ""),
      notes: String(entry?.notes ?? "")
    };
  });
}

/**
 * Normalise les seuils de puissance d’une invocation.
 *
 * Chaque seuil peut référencer une technique débloquée par la puissance
 * de la technique liée à l’invocation.
 *
 * @param {object} [thresholds={}] - Seuils bruts.
 * @returns {Record<string, {techniqueId: string, notes: string}>} Seuils normalisés.
 */
export function normalizeInvocationThresholds(thresholds = {}) {
  const normalized = {};

  for (const key of INVOCATION_THRESHOLD_KEYS) {
    normalized[key] = {
      techniqueId: String(thresholds?.[key]?.techniqueId ?? ""),
      notes: String(thresholds?.[key]?.notes ?? "")
    };
  }

  return normalized;
}

/**
 * Construit le résumé complet d’une invocation.
 *
 * Le résumé contient :
 * - la taille et ses règles associées ;
 * - les points d’attributs dépensés et restants ;
 * - les dépassements de budget ou de cap ;
 * - la technique liée et sa puissance ;
 * - les seuils débloqués ;
 * - les lignes d’attributs pour l’affichage ;
 * - les bonus de puissance et leur état appliqué.
 *
 * @param {Item|object} itemOrSystem - Item invocation ou données système directes.
 * @param {Actor|null} [actor=null] - Acteur propriétaire, utilisé pour retrouver les techniques liées.
 * @returns {object} Résumé complet de l’invocation.
 */
export function buildInvocationSummary(itemOrSystem, actor = null) {
  const source = itemOrSystem?.system ?? itemOrSystem ?? {};

  const size = normalizeInvocationSize(source.size ?? "medium");
  const sizeDefinition = getInvocationSizeDefinition(size);

  const attributes = normalizeInvocationAttributes(source.attributes ?? {});
  const totalAllocated = getInvocationAllocatedAttributePoints(attributes);
  const remainingPoints = sizeDefinition.pointBudget - totalAllocated;
  const highestAttribute = getHighestInvocationAttribute(attributes);

  const baseCreationXp = toPositiveInteger(source.baseCreationXp);
  const scaledCreationXp = baseCreationXp * Number(sizeDefinition.xpMultiplier ?? 1);

  const linkedTechniqueId = String(source.techniqueId ?? "").trim();
  const linkedTechnique = actor?.items?.get?.(linkedTechniqueId) ?? null;
  const linkedTechniquePower = clampLinkedTechniquePower(linkedTechnique?.system?.power);

  const thresholds = normalizeInvocationThresholds(source.thresholds ?? {});

  return {
    size,
    sizeDefinition,

    baseCreationXp,
    scaledCreationXp,

    totalAllocated,
    remainingPoints,
    highestAttribute,

    isOverBudget: totalAllocated > sizeDefinition.pointBudget,
    exceedsAttributeCap: highestAttribute > sizeDefinition.maxAttribute,

    linkedTechniqueId,
    linkedTechnique,
    linkedTechniquePower,

    thresholdSummaries: buildInvocationThresholdSummaries({
      actor,
      thresholds,
      linkedTechniquePower
    }),

    attributeRows: buildInvocationAttributeRows(attributes, sizeDefinition),

    powerBoons: buildInvocationPowerBoonSummaries(
      source.powerBoons ?? [],
      linkedTechniquePower
    )
  };
}

/**
 * Construit le résumé de validation d’une invocation.
 *
 * La validation vérifie :
 * - le dépassement du budget d’attributs ;
 * - le dépassement du maximum d’attribut autorisé par la taille ;
 * - l’existence de la technique liée ;
 * - les cibles requises pour les bonus de puissance ;
 * - le nombre de bonus par rapport à la puissance disponible.
 *
 * @param {Item} item - Item invocation à valider.
 * @returns {{
 *   isValid: boolean,
 *   hasMessages: boolean,
 *   errors: object[],
 *   warnings: object[],
 *   summary: object
 * }} Résumé de validation.
 */
export function buildInvocationValidation(item) {
  const actor = item?.parent ?? null;
  const summary = buildInvocationSummary(item, actor);

  const errors = [];
  const warnings = [];

  if (summary.isOverBudget) {
    errors.push({
      key: "ETERN.INVOCATION.VALIDATION.OVER_BUDGET",
      data: {
        used: summary.totalAllocated,
        budget: summary.sizeDefinition.pointBudget
      }
    });
  }

  if (summary.exceedsAttributeCap) {
    errors.push({
      key: "ETERN.INVOCATION.VALIDATION.OVER_CAP",
      data: {
        max: summary.sizeDefinition.maxAttribute
      }
    });
  }

  if (summary.linkedTechniqueId && !summary.linkedTechnique) {
    warnings.push({
      key: "ETERN.INVOCATION.VALIDATION.MISSING_TECHNIQUE"
    });
  }

  for (const entry of summary.powerBoons ?? []) {
    if (entry.hasTarget && !entry.target) {
      errors.push({
        key: "ETERN.INVOCATION.VALIDATION.POWER_BONUS_TARGET_REQUIRED",
        data: {
          type: entry.typeLabel
        }
      });
    }
  }

  const linkedPower = clampLinkedTechniquePower(summary.linkedTechniquePower);

  if ((summary.powerBoons?.length ?? 0) > linkedPower) {
    warnings.push({
      key: "ETERN.INVOCATION.VALIDATION.POWER_BONUS_OVERFLOW",
      data: {
        count: summary.powerBoons.length,
        applied: linkedPower
      }
    });
  }

  return {
    isValid: errors.length === 0,
    hasMessages: errors.length > 0 || warnings.length > 0,
    errors,
    warnings,
    summary
  };
}

/**
 * Localise la cible d’un bonus de puissance d’invocation.
 *
 * La cible dépend du type de bonus.
 * Par exemple, certains bonus ciblent un attribut, une sauvegarde ou une statistique.
 *
 * @param {string} type - Type de bonus.
 * @param {string} target - Cible brute du bonus.
 * @returns {string} Libellé localisé de la cible, ou chaîne vide.
 */
function localizeInvocationPowerBonusTarget(type, target) {
  const normalizedType = normalizeInvocationPowerBonusType(type);
  const normalizedTarget = normalizeInvocationPowerBonusTarget(normalizedType, target);

  if (!normalizedTarget) return "";

  const choice = getInvocationPowerBonusTargetChoices(normalizedType).find((entry) => {
    return String(entry.value ?? "") === normalizedTarget;
  });

  return choice
    ? game.i18n.localize(choice.labelKey)
    : normalizedTarget;
}

/**
 * Indique si un bonus de puissance est actuellement appliqué.
 *
 * Les bonus sont appliqués dans l’ordre de la liste.
 * Une invocation liée à une technique de puissance 3 applique donc les 3 premiers bonus.
 *
 * @param {number} linkedTechniquePower - Puissance de la technique liée.
 * @param {number} index - Position du bonus dans la liste.
 * @returns {boolean} `true` si le bonus est appliqué.
 */
function isInvocationPowerBonusApplied(linkedTechniquePower = 0, index = 0) {
  return index < clampLinkedTechniquePower(linkedTechniquePower);
}

/**
 * Construit les résumés des seuils d’invocation.
 *
 * Chaque seuil indique :
 * - sa valeur de puissance requise ;
 * - s’il est débloqué ;
 * - la technique associée ;
 * - les notes saisies.
 *
 * @param {object} params - Paramètres de construction.
 * @param {Actor|null} params.actor - Acteur propriétaire.
 * @param {object} params.thresholds - Seuils normalisés.
 * @param {number} params.linkedTechniquePower - Puissance de la technique liée.
 * @returns {object[]} Résumés de seuils.
 */
function buildInvocationThresholdSummaries({
  actor,
  thresholds,
  linkedTechniquePower
}) {
  return INVOCATION_THRESHOLD_KEYS.map((key) => {
    const threshold = INVOCATION_THRESHOLD_VALUES[key];
    const techniqueId = String(thresholds[key]?.techniqueId ?? "");
    const technique = actor?.items?.get?.(techniqueId) ?? null;

    return {
      key,
      threshold,
      unlocked: linkedTechniquePower >= threshold,
      techniqueId,
      techniqueName: technique?.name ?? "",
      notes: String(thresholds[key]?.notes ?? "")
    };
  });
}

/**
 * Construit les lignes d’attributs affichées sur la fiche d’invocation.
 *
 * Chaque ligne indique :
 * - la clé d’attribut ;
 * - son nom localisé ;
 * - son abréviation ;
 * - sa valeur ;
 * - si elle dépasse le maximum autorisé par la taille.
 *
 * @param {Record<string, number>} attributes - Attributs normalisés.
 * @param {object} sizeDefinition - Définition de taille de l’invocation.
 * @returns {object[]} Lignes d’attributs.
 */
function buildInvocationAttributeRows(attributes, sizeDefinition) {
  return INVOCATION_ATTRIBUTE_KEYS.map((key) => {
    const value = Number(attributes[key] ?? 0) || 0;

    return {
      key,
      label: game.i18n.localize(ETERNAME_ATTRIBUTES[key]?.label ?? key),
      abbr: String(ETERNAME_ATTRIBUTES[key]?.abbr ?? key).toUpperCase(),
      value,
      exceedsCap: value > sizeDefinition.maxAttribute
    };
  });
}

/**
 * Construit les résumés des bonus de puissance de l’invocation.
 *
 * @param {Array<object>} powerBoons - Bonus bruts.
 * @param {number} linkedTechniquePower - Puissance de la technique liée.
 * @returns {object[]} Bonus enrichis pour l’affichage.
 */
function buildInvocationPowerBoonSummaries(powerBoons, linkedTechniquePower) {
  return normalizeInvocationPowerBoons(powerBoons).map((entry, index) => {
    const targetKind = getInvocationPowerBonusTargetKind(entry.type);
    const targetLabel = localizeInvocationPowerBonusTarget(entry.type, entry.target);

    return {
      index,
      id: entry.id,
      type: entry.type,
      target: entry.target,
      targetKind,
      hasTarget: invocationPowerBonusRequiresTarget(entry.type),
      targetLabel,
      typeLabel: game.i18n.localize(
        INVOCATION_POWER_BONUS_DEFINITIONS[entry.type]?.labelKey ?? entry.type
      ),
      notes: entry.notes,
      isApplied: isInvocationPowerBonusApplied(linkedTechniquePower, index)
    };
  });
}

/**
 * Calcule le total des points d’attributs dépensés par une invocation.
 *
 * @param {Record<string, number>} attributes - Attributs normalisés.
 * @returns {number} Total dépensé.
 */
function getInvocationAllocatedAttributePoints(attributes) {
  return INVOCATION_ATTRIBUTE_KEYS.reduce((sum, key) => {
    return sum + (Number(attributes[key] ?? 0) || 0);
  }, 0);
}

/**
 * Récupère la plus haute valeur d’attribut d’une invocation.
 *
 * @param {Record<string, number>} attributes - Attributs normalisés.
 * @returns {number} Plus haute valeur d’attribut.
 */
function getHighestInvocationAttribute(attributes) {
  return INVOCATION_ATTRIBUTE_KEYS.reduce((max, key) => {
    return Math.max(max, Number(attributes[key] ?? 0) || 0);
  }, 0);
}

/**
 * Normalise la puissance de la technique liée à une invocation.
 *
 * La puissance est bornée entre 0 et 10.
 *
 * @param {unknown} value - Puissance brute.
 * @returns {number} Puissance normalisée.
 */
function clampLinkedTechniquePower(value) {
  const numericValue = Number(value ?? 0);

  if (!Number.isFinite(numericValue)) return 0;

  return Math.max(
    0,
    Math.min(MAX_LINKED_TECHNIQUE_POWER, Math.floor(numericValue))
  );
}


