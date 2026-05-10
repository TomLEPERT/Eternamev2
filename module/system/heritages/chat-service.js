/**
 * Service d’envoi des héritages dans le chat Foundry.
 *
 * Responsabilités :
 * - préparer les données d’affichage d’un héritage ;
 * - normaliser le type d’héritage : ancestral ou culturel ;
 * - normaliser le type de fonctionnalité : passif ou technique ;
 * - sécuriser les textes injectés dans le HTML ;
 * - construire une carte de chat simple pour l’héritage ;
 * - créer le message de chat associé à l’acteur.
 *
 * Ce fichier doit rester dédié à la publication des héritages dans le chat.
 * Il ne doit pas gérer la logique de fiche, les jets, l’application des bonus
 * ou la préparation dérivée des données d’héritage.
 */

import {
  normalizeHeritageFeatureType,
  normalizeHeritageType
} from "../constants/heritages.js";

const EMPTY_HERITAGE_DESCRIPTION_KEY = "ETERN.HERITAGE.EMPTY_DESCRIPTION";

/**
 * Échappe une valeur texte avant injection dans du HTML.
 *
 * Cette fonction protège contre l’injection HTML involontaire dans les cartes de chat.
 *
 * @param {unknown} value - Valeur brute à sécuriser.
 * @returns {string} Texte échappé pour HTML.
 */
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Formate une description pour l’affichage dans le chat.
 *
 * La description est :
 * - sécurisée avec `escapeHtml` ;
 * - nettoyée ;
 * - convertie en HTML simple avec des `<br>` pour les retours ligne.
 *
 * Si la description est vide, une phrase localisée est affichée.
 *
 * @param {unknown} description - Description brute de l’héritage.
 * @returns {string} Description HTML sécurisée.
 */
function formatDescription(description) {
  const escaped = escapeHtml(description).trim();

  return escaped
    ? escaped.replace(/\n/g, "<br>")
    : game.i18n.localize(EMPTY_HERITAGE_DESCRIPTION_KEY);
}

/**
 * Construit le contexte d’affichage d’une carte de chat d’héritage.
 *
 * @param {Actor} actor - Acteur propriétaire de l’héritage.
 * @param {Item} heritage - Item héritage à publier.
 * @returns {object} Contexte sécurisé pour la carte de chat.
 */
function buildHeritageChatContext(actor, heritage) {
  const heritageType = normalizeHeritageType(heritage.system?.heritageType);
  const featureType = normalizeHeritageFeatureType(heritage.system?.featureType);

  return {
    actorName: String(actor.name ?? ""),
    heritageName: String(heritage.name ?? ""),
    img: String(heritage.img ?? ""),
    heritageType,
    featureType,
    heritageTypeLabel: game.i18n.localize(`ETERN.HERITAGE.TYPE.${heritageType.toUpperCase()}`),
    featureTypeLabel: game.i18n.localize(`ETERN.HERITAGE.FEATURE_TYPE.${featureType.toUpperCase()}`),
    description: formatDescription(heritage.system?.description)
  };
}

/**
 * Construit le HTML de la carte de chat d’un héritage.
 *
 * Le HTML est volontairement simple.
 * À terme, cette fonction peut être remplacée par un template Handlebars dédié.
 *
 * @param {object} context - Contexte de chat construit par `buildHeritageChatContext`.
 * @returns {string} HTML de carte de chat.
 */
function renderHeritageChatCard(context) {
  return `
    <article class="etername-chat-card heritage-chat-card">
      <header class="chat-card-header">
        <img src="${escapeHtml(context.img)}" alt="" width="36" height="36"/>
        <div>
          <h2>${escapeHtml(context.heritageName)}</h2>
          <p>${escapeHtml(context.actorName)}</p>
        </div>
      </header>

      <div class="chat-card-badges">
        <span>${escapeHtml(context.heritageTypeLabel)}</span>
        <span>${escapeHtml(context.featureTypeLabel)}</span>
      </div>

      <p>${context.description}</p>
    </article>
  `;
}

/**
 * Publie un héritage dans le chat.
 *
 * La fonction :
 * - vérifie que l’acteur et l’héritage existent ;
 * - prépare un contexte d’affichage ;
 * - rend une carte HTML ;
 * - crée un message de chat Foundry.
 *
 * @param {Actor} actor - Acteur propriétaire de l’héritage.
 * @param {Item} heritage - Item héritage à publier.
 * @returns {Promise<void>}
 */
export async function postHeritageToChat(actor, heritage) {
  if (!actor || !heritage) return;

  const context = buildHeritageChatContext(actor, heritage);
  const content = renderHeritageChatCard(context);

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content
  });
}