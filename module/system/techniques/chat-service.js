/**
 * Service d’envoi des techniques dans le chat Foundry.
 *
 * Responsabilités :
 * - préparer le contexte d’une carte de technique ;
 * - vérifier l’état de validation de la technique ;
 * - afficher les statistiques principales de la technique ;
 * - afficher les composants utilisés par la technique ;
 * - afficher le type d’usage : attaque ou rituel ;
 * - rendre le template Handlebars de carte de chat ;
 * - créer le message de chat associé à l’acteur.
 *
 * Ce fichier doit rester dédié à la publication dans le chat.
 * Il ne doit pas gérer les jets, modifier les items ou appliquer les effets de technique.
 */

import { clampTechniquePower } from "./stat-definitions.js";
import { buildTechniquePowerSummary } from "./power-service.js";
import { buildTechniqueReadableSummary } from "./summary-service.js";
import { buildTechniqueValidationSummary } from "./validation-service.js";
import { buildTechniqueXpSummary } from "./xp-service.js";
import {
  getTechniqueLinkedAttributeLabel,
  getTechniqueUsageLabelKey,
  normalizeTechniqueUsageType
} from "./usage-service.js";

const TECHNIQUE_CHAT_TEMPLATE = "systems/eternamev2/templates/chat/technique-use-card.hbs";
const MAX_CHAT_STATISTICS = 4;

/**
 * Détermine l’état de validation affiché dans la carte de chat.
 *
 * L’état peut être :
 * - `error` si la technique possède au moins une erreur bloquante ;
 * - `warning` si elle possède seulement des avertissements ;
 * - `success` si elle ne possède aucun message de validation.
 *
 * @param {Item} item - Technique à analyser.
 * @returns {"error"|"warning"|"success"} État de validation.
 */
function getValidationState(item) {
  const validation = buildTechniqueValidationSummary(item);

  if (validation.errors.length) return "error";
  if (validation.warnings.length) return "warning";

  return "success";
}

/**
 * Publie une technique dans le chat.
 *
 * La fonction prépare une carte de chat lisible contenant :
 * - le nom de l’acteur ;
 * - le nom et l’image de la technique ;
 * - la description ;
 * - le résumé court ;
 * - la puissance ;
 * - le coût XP ;
 * - les métiers liés ;
 * - la statistique principale ;
 * - les premières statistiques ;
 * - les composants ;
 * - l’état de validation ;
 * - le type d’usage.
 *
 * @param {Actor} actor - Acteur utilisant la technique.
 * @param {Item} technique - Item technique à publier.
 * @param {object} [options={}] - Options de publication.
 * @param {string} [options.usageType] - Type d’usage forcé : attack ou ritual.
 * @param {string} [options.attributeKey] - Attribut lié utilisé pour un rituel.
 * @returns {Promise<void>}
 */
export async function postTechniqueToChat(actor, technique, options = {}) {
  if (!actor || !technique) return;

  const context = buildTechniqueChatContext(actor, technique, options);
  const content = await foundry.applications.handlebars.renderTemplate(
    TECHNIQUE_CHAT_TEMPLATE,
    context
  );

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content
  });
}

/**
 * Construit le contexte complet de la carte de chat d’une technique.
 *
 * @param {Actor} actor - Acteur utilisant la technique.
 * @param {Item} technique - Technique publiée.
 * @param {object} [options={}] - Options de publication.
 * @returns {object} Contexte prêt pour le template de chat.
 */
function buildTechniqueChatContext(actor, technique, options = {}) {
  const summary = getTechniqueReadableSummaryForChat(technique);
  const statistics = Array.isArray(summary.statistics) ? summary.statistics : [];
  const mainStatistic = statistics.find((entry) => entry?.isMain) ?? statistics[0] ?? null;

  const validationState = getValidationState(technique);
  const usageType = normalizeTechniqueUsageType(
    options.usageType ?? technique.system?.usageType ?? "attack"
  );

  const linkedAttributeLabel = usageType === "ritual"
    ? getTechniqueLinkedAttributeLabel(
        options.attributeKey ?? technique.system?.linkedAttributeKey ?? "magic"
      )
    : "";

  return {
    actorName: actor.name,
    itemId: technique.id,
    img: technique.img,
    name: technique.name,
    description: String(technique.system?.description ?? ""),
    headline: String(summary.headline ?? ""),
    power: clampTechniquePower(technique.system?.power ?? 0),
    totalXp: getTechniqueTotalXpForChat(technique),
    linkedProfessions: Array.isArray(summary.professions) ? summary.professions : [],
    mainStatisticLabel: mainStatistic ? String(mainStatistic.label ?? "") : "",
    mainStatisticValue: mainStatistic ? String(mainStatistic.finalValue ?? "") : "",
    statistics: statistics.slice(0, MAX_CHAT_STATISTICS).map((entry) => ({
      label: String(entry?.label ?? ""),
      value: String(entry?.finalValue ?? "")
    })),
    components: Array.isArray(summary.componentSections)
      ? summary.componentSections.filter((section) => {
          return Array.isArray(section?.entries) && section.entries.length;
        })
      : [],
    validationLabel: getValidationLabel(validationState),
    validationState,
    usageTypeLabel: game.i18n.localize(getTechniqueUsageLabelKey(usageType)),
    linkedAttributeLabel
  };
}

/**
 * Récupère ou reconstruit le résumé lisible utilisé par la carte de chat.
 *
 * Si le résumé dérivé existe déjà, il est réutilisé.
 * Sinon, les résumés XP et puissance sont recalculés pour éviter une carte vide.
 *
 * @param {Item} technique - Technique publiée.
 * @returns {object} Résumé lisible.
 */
function getTechniqueReadableSummaryForChat(technique) {
  const summary = technique.system?.derived?.summary;

  if (summary && typeof summary === "object") {
    return summary;
  }

  const xpSummary = buildTechniqueXpSummary(technique.system ?? {});
  const powerSummary = buildTechniquePowerSummary(technique.system ?? {});

  return buildTechniqueReadableSummary(technique, powerSummary, xpSummary);
}

/**
 * Récupère le coût total XP affiché dans la carte de chat.
 *
 * Si la valeur dérivée existe, elle est utilisée.
 * Sinon, le coût est recalculé depuis les données système.
 *
 * @param {Item} technique - Technique publiée.
 * @returns {number} Coût total XP.
 */
function getTechniqueTotalXpForChat(technique) {
  const derivedTotal = Number(technique.system?.derived?.totalXp);

  if (Number.isFinite(derivedTotal)) {
    return derivedTotal;
  }

  return buildTechniqueXpSummary(technique.system ?? {}).totalXp;
}

/**
 * Renvoie le libellé localisé associé à l’état de validation.
 *
 * @param {"error"|"warning"|"success"} validationState - État de validation.
 * @returns {string} Libellé localisé.
 */
function getValidationLabel(validationState) {
  if (validationState === "error") {
    return game.i18n.localize("ETERN.TECHNIQUE.ACTOR.INVALID");
  }

  if (validationState === "warning") {
    return game.i18n.localize("ETERN.TECHNIQUE.ACTOR.WARNING");
  }

  return game.i18n.localize("ETERN.TECHNIQUE.ACTOR.READY");
}