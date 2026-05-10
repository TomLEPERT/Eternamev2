/**
 * Préparation des données dérivées des invocations.
 *
 * Responsabilités :
 * - normaliser les champs principaux d’un item invocation ;
 * - normaliser la taille de l’invocation ;
 * - normaliser les attributs d’invocation ;
 * - normaliser les bonus de puissance ;
 * - normaliser les seuils débloqués par puissance ;
 * - construire le résumé dérivé de l’invocation ;
 * - construire le résumé de validation ;
 * - appliquer un nom par défaut si l’item n’en possède pas.
 *
 * Ce fichier doit rester dédié à la préparation des données d’invocation.
 * Il ne doit pas gérer la création de l’acteur d’invocation, la synchronisation,
 * le rendu de fiche ou les événements DOM.
 */

import { toPositiveInteger } from '../../../utils/numbers.js';
import {
  buildInvocationSummary,
  buildInvocationValidation,
  normalizeInvocationAttributes,
  normalizeInvocationPowerBoons,
  normalizeInvocationThresholds
} from "../../techniques/invocation-service.js";

import { normalizeInvocationSize } from "../../techniques/invocation-definitions.js";

/**
 * Prépare les données système d’un item invocation.
 *
 * La fonction normalise :
 * - la description ;
 * - les notes MJ ou notes libres ;
 * - l’id de technique liée ;
 * - l’id d’acteur d’invocation généré ;
 * - la taille ;
 * - le coût de création de base ;
 * - les attributs ;
 * - les bonus de puissance ;
 * - les seuils de techniques débloquées.
 *
 * Elle ajoute ensuite dans `system.derived` :
 * - `summary` : résumé complet de l’invocation ;
 * - `validation` : erreurs et avertissements de validation.
 *
 * @param {Item} item - Item invocation à préparer.
 * @param {object} system - Données système mutables de l’invocation.
 * @returns {void}
 */
export function prepareInvocationData(item, system) {
  system.description = String(system.description ?? "");
  system.notes = String(system.notes ?? "");
  system.techniqueId = String(system.techniqueId ?? "");
  system.actorId = String(system.actorId ?? "");
  system.size = normalizeInvocationSize(system.size ?? "medium");
  system.baseCreationXp = toPositiveInteger(system.baseCreationXp);
  system.attributes = normalizeInvocationAttributes(system.attributes ?? {});
  system.powerBoons = normalizeInvocationPowerBoons(system.powerBoons ?? []);
  system.thresholds = normalizeInvocationThresholds(system.thresholds ?? {});

  const actor = item.parent ?? null;
  const summary = buildInvocationSummary(item, actor);
  const validation = buildInvocationValidation(item);

  system.derived ??= {};
  system.derived.summary = summary;
  system.derived.validation = validation;

  if (!String(item.name ?? "").trim()) {
    item.name = game.i18n.localize("ETERN.ITEM.DEFAULT_INVOCATION_NAME");
  }
}

