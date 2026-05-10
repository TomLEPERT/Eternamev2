/**
 * Helpers communs pour les définitions d’enchantements.
 *
 * Responsabilités :
 * - lire les textes localisés d’une définition ;
 * - formater les textes de définition avec des variables ;
 * - récupérer une valeur dépendante du rang ;
 * - découper et normaliser les tags d’enchantement ;
 * - comparer les tags requis, partagés ou exclus ;
 * - vérifier si un item correspond aux contraintes d’une définition ;
 * - convertir des abréviations d’attributs ou de sauvegardes vers leurs clés système.
 *
 * Ce fichier doit rester dédié aux helpers de définition.
 * Il ne doit pas contenir le registre des enchantements, l’application des bonus,
 * le rendu de fiche ou la génération d’entrées.
 */

import { ETERNAME_ATTRIBUTES } from "../constants/attributes.js";
import { normalizeEnchantmentTag } from "./tags.js";

/**
 * Table de conversion des abréviations d’attributs vers les clés système.
 *
 * Exemple :
 * - FOR → strength ;
 * - AGI → agility ;
 * - MAG → magic.
 */
const ATTRIBUTE_ABBR_TO_KEY = Object.freeze(
  Object.fromEntries(
    Object.entries(ETERNAME_ATTRIBUTES).map(([key, definition]) => [
      String(definition.abbr ?? "").toUpperCase(),
      key
    ])
  )
);

/**
 * Table de conversion des abréviations ou noms courts de sauvegardes vers les clés système.
 *
 * Ces clés sont utilisées notamment dans les définitions textuelles d’enchantements
 * ou dans des règles écrites avec une nomenclature plus proche du français.
 */
const SAVE_ABBR_TO_KEY = Object.freeze({
  ESQ: "dodge",
  PARADE: "parry",
  DOULEUR: "pain",
  COUVERT: "cover",
  ARMURE: "armor",
  FEU: "fire",
  GLACE: "ice",
  FOUDRE: "lightning",
  TERRE: "earth",
  VENT: "wind",
  MENTAL: "mental",
  ACIDE: "acid",
  MAGIQUE: "magic",
  MAGIE: "magic"
});

/**
 * Récupère un texte localisé depuis une définition d’enchantement.
 *
 * La fonction accepte deux formats :
 *
 * ```js
 * label: "Texte direct"
 * ```
 *
 * ou :
 *
 * ```js
 * label: {
 *   fr: "Texte français",
 *   en: "English text"
 * }
 * ```
 *
 * Si la langue Foundry est française, `fr` est prioritaire.
 * Sinon, `en` est prioritaire.
 *
 * @param {object} [definition={}] - Définition d’enchantement.
 * @param {string} [key="label"] - Champ texte à lire.
 * @returns {string} Texte localisé ou chaîne vide.
 */
export function getDefinitionLocaleText(definition = {}, key = "label") {
  const value = definition?.[key];

  if (value && typeof value === "object") {
    const lang = String(game.i18n.lang ?? "").startsWith("fr") ? "fr" : "en";

    return String(value[lang] ?? value.fr ?? value.en ?? "");
  }

  return String(value ?? "");
}

/**
 * Formate un texte de définition avec des variables.
 *
 * Exemple :
 *
 * ```js
 * formatDefinitionText("Ajoute {value} dégâts de {type}.", {
 *   value: 2,
 *   type: "feu"
 * });
 * ```
 *
 * devient :
 *
 * ```txt
 * Ajoute 2 dégâts de feu.
 * ```
 *
 * Les tokens absents sont remplacés par une chaîne vide.
 *
 * @param {string} [template=""] - Texte avec tokens `{token}`.
 * @param {object} [data={}] - Données de remplacement.
 * @returns {string} Texte formaté.
 */
export function formatDefinitionText(template = "", data = {}) {
  return String(template ?? "").replace(/\{(\w+)\}/g, (_match, token) => {
    return String(data?.[token] ?? "");
  });
}

/**
 * Récupère une valeur dépendante du rang dans une définition.
 *
 * Par défaut, cette fonction traite `rank` comme un index 0-based :
 * - rank 0 → première valeur ;
 * - rank 1 → deuxième valeur ;
 * - rank 2 → troisième valeur.
 *
 * Si tes rangs sont en 1-based côté interface, il faudra appeler cette fonction
 * avec `rank - 1` ou adapter la logique ici.
 *
 * @param {object} [definition={}] - Définition contenant `rankValues`.
 * @param {number} [rank=0] - Rang ou index demandé.
 * @returns {unknown|string} Valeur du rang, ou chaîne vide.
 */
export function getRankValue(definition = {}, rank = 0) {
  const values = Array.isArray(definition?.rankValues)
    ? definition.rankValues
    : [];

  if (!values.length) return "";

  const index = Math.max(
    0,
    Math.min(values.length - 1, Math.floor(Number(rank) || 0))
  );

  return values[index];
}

/**
 * Découpe et normalise une liste de tags.
 *
 * La fonction accepte :
 * - un tableau de tags ;
 * - une chaîne de tags séparés par des virgules.
 *
 * Chaque tag est ensuite normalisé avec `normalizeEnchantmentTag`.
 *
 * @param {string[]|string} [tags=[]] - Tags bruts.
 * @returns {string[]} Tags normalisés.
 */
export function splitTags(tags = []) {
  if (Array.isArray(tags)) {
    return tags
      .flatMap((entry) => String(entry ?? "").split(","))
      .map((entry) => normalizeEnchantmentTag(entry))
      .filter(Boolean);
  }

  return String(tags ?? "")
    .split(",")
    .map((entry) => normalizeEnchantmentTag(entry))
    .filter(Boolean);
}

/**
 * Vérifie si au moins un tag est partagé entre deux listes.
 *
 * Si `requiredTags` est vide, la fonction renvoie `true`.
 * Cela permet d’interpréter une absence de contrainte comme une compatibilité.
 *
 * @param {string[]|string} [candidateTags=[]] - Tags du candidat.
 * @param {string[]|string} [requiredTags=[]] - Tags recherchés.
 * @returns {boolean} `true` si au moins un tag est partagé.
 */
export function hasAnySharedTag(candidateTags = [], requiredTags = []) {
  const left = new Set(splitTags(candidateTags));
  const right = splitTags(requiredTags);

  if (!right.length) return true;

  return right.some((tag) => left.has(tag));
}

/**
 * Vérifie si tous les tags requis sont présents.
 *
 * Si `requiredTags` est vide, la fonction renvoie `true`.
 *
 * @param {string[]|string} [candidateTags=[]] - Tags du candidat.
 * @param {string[]|string} [requiredTags=[]] - Tags requis.
 * @returns {boolean} `true` si tous les tags requis sont présents.
 */
export function hasAllRequiredTags(candidateTags = [], requiredTags = []) {
  const left = new Set(splitTags(candidateTags));
  const right = splitTags(requiredTags);

  if (!right.length) return true;

  return right.every((tag) => left.has(tag));
}

/**
 * Vérifie qu’aucun tag exclu n’est présent.
 *
 * @param {string[]|string} [candidateTags=[]] - Tags du candidat.
 * @param {string[]|string} [excludedTags=[]] - Tags interdits.
 * @returns {boolean} `true` si aucun tag exclu n’est présent.
 */
export function hasNoExcludedTags(candidateTags = [], excludedTags = []) {
  const left = new Set(splitTags(candidateTags));
  const right = splitTags(excludedTags);

  return !right.some((tag) => left.has(tag));
}

/**
 * Vérifie si la catégorie de l’item correspond aux catégories autorisées.
 *
 * Si la définition ne précise aucune catégorie, toutes les catégories sont acceptées.
 *
 * @param {Item} item - Item candidat.
 * @param {object} [definition={}] - Définition d’enchantement.
 * @returns {boolean} `true` si la catégorie est compatible.
 */
function matchesItemCategory(item, definition = {}) {
  const categories = normalizeStringList(definition?.itemCategories);

  if (!categories.length) return true;

  const category = normalizeToken(item?.system?.category);

  return categories.includes(category);
}

/**
 * Vérifie si la base de l’item correspond aux bases autorisées.
 *
 * Si la définition ne précise aucune base, toutes les bases sont acceptées.
 *
 * @param {Item} item - Item candidat.
 * @param {object} [definition={}] - Définition d’enchantement.
 * @returns {boolean} `true` si la base est compatible.
 */
function matchesItemBase(item, definition = {}) {
  const bases = normalizeStringList(definition?.itemBases);

  if (!bases.length) return true;

  const base = normalizeToken(item?.system?.base);

  return bases.includes(base);
}

/**
 * Vérifie si les tags de l’item respectent les contraintes de la définition.
 *
 * La fonction vérifie :
 * - tous les tags requis ;
 * - aucun tag exclu.
 *
 * @param {Item} item - Item candidat.
 * @param {object} [definition={}] - Définition d’enchantement.
 * @returns {boolean} `true` si les tags sont compatibles.
 */
function matchesItemTags(item, definition = {}) {
  const itemTags = splitTags(item?.system?.tags ?? []);

  return hasAllRequiredTags(itemTags, definition?.requiredItemTags ?? [])
    && hasNoExcludedTags(itemTags, definition?.excludedItemTags ?? []);
}

/**
 * Vérifie si un item correspond à une définition d’enchantement.
 *
 * Les contraintes vérifiées sont :
 * - type d’item ;
 * - catégorie ;
 * - base ;
 * - tags requis ;
 * - tags exclus.
 *
 * @param {Item} item - Item candidat.
 * @param {object} [definition={}] - Définition d’enchantement.
 * @returns {boolean} `true` si l’item est compatible avec la définition.
 */
export function itemMatchesEnchantmentDefinition(item, definition = {}) {
  const itemType = normalizeToken(item?.type);
  const definitionTypes = normalizeStringList(definition?.itemTypes);

  if (definitionTypes.length && !definitionTypes.includes(itemType)) return false;
  if (!matchesItemCategory(item, definition)) return false;
  if (!matchesItemBase(item, definition)) return false;
  if (!matchesItemTags(item, definition)) return false;

  return true;
}

/**
 * Convertit une abréviation d’attribut vers sa clé système.
 *
 * Exemple :
 * - FOR → strength ;
 * - AGI → agility ;
 * - MAG → magic.
 *
 * Si l’abréviation est inconnue, la fonction renvoie une chaîne vide.
 *
 * @param {string} [value=""] - Abréviation d’attribut.
 * @returns {string} Clé système d’attribut ou chaîne vide.
 */
export function normalizeAttributeAbbr(value = "") {
  const normalized = String(value ?? "").trim().toUpperCase();

  return ATTRIBUTE_ABBR_TO_KEY[normalized] ?? "";
}

/**
 * Convertit une abréviation ou un nom court de sauvegarde vers sa clé système.
 *
 * Exemple :
 * - ESQ → dodge ;
 * - ARMURE → armor ;
 * - FEU → fire.
 *
 * Si la valeur est inconnue, la fonction renvoie une chaîne vide.
 *
 * @param {string} [value=""] - Abréviation ou nom court de sauvegarde.
 * @returns {string} Clé système de sauvegarde ou chaîne vide.
 */
export function normalizeSaveAbbr(value = "") {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return SAVE_ABBR_TO_KEY[normalized] ?? "";
}

/**
 * Normalise une valeur en token de comparaison simple.
 *
 * Utilisé pour comparer les types, catégories et bases.
 *
 * @param {unknown} value - Valeur brute.
 * @returns {string} Token normalisé.
 */
function normalizeToken(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

/**
 * Normalise une liste de chaînes en tokens comparables.
 *
 * @param {unknown} values - Valeur ou liste de valeurs.
 * @returns {string[]} Liste normalisée.
 */
function normalizeStringList(values) {
  return (Array.isArray(values) ? values : [])
    .map((value) => normalizeToken(value))
    .filter(Boolean);
}