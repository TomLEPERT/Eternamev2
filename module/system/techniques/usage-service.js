/**
 * Service lié au type d’usage des techniques du système Etername.
 *
 * Responsabilités :
 * - déclarer les types d’usage disponibles pour une technique ;
 * - normaliser le type d’usage : attaque ou rituel ;
 * - normaliser l’attribut lié aux techniques rituelles ;
 * - préparer les choix localisés pour les formulaires ;
 * - construire un proxy d’attaque à partir des statistiques dérivées d’une technique.
 *
 * Ce fichier doit rester centré sur l’usage des techniques.
 * Si la logique de proxy d’attaque grossit, elle devrait être déplacée dans un service dédié.
 */

import { ETERNAME_ATTRIBUTES } from "../constants/attributes.js";

const DEFAULT_TECHNIQUE_USAGE_TYPE = "attack";
const DEFAULT_LINKED_ATTRIBUTE_KEY = "magic";

const TECHNIQUE_USAGE_LABEL_KEYS = Object.freeze({
  attack: "ETERN.TECHNIQUE.USAGE.TYPE.ATTACK",
  ritual: "ETERN.TECHNIQUE.USAGE.TYPE.RITUAL"
});

export const TECHNIQUE_USAGE_TYPES = Object.freeze({
  ATTACK: "attack",
  RITUAL: "ritual"
});

const TECHNIQUE_USAGE_VALUES = new Set(Object.values(TECHNIQUE_USAGE_TYPES));

/**
 * Normalise le type d’usage d’une technique.
 *
 * Valeurs autorisées :
 * - `attack`
 * - `ritual`
 *
 * Si la valeur donnée est absente ou invalide, la fonction renvoie un fallback valide.
 *
 * @param {unknown} value - Type d’usage brut à normaliser.
 * @param {string} [fallback=TECHNIQUE_USAGE_TYPES.ATTACK] - Valeur utilisée si l’entrée est invalide.
 * @returns {"attack"|"ritual"} Type d’usage normalisé.
 */
export function normalizeTechniqueUsageType(
  value,
  fallback = TECHNIQUE_USAGE_TYPES.ATTACK
) {
  const normalized = String(value ?? "").trim().toLowerCase();
  const safeFallback = TECHNIQUE_USAGE_VALUES.has(fallback)
    ? fallback
    : DEFAULT_TECHNIQUE_USAGE_TYPE;

  return TECHNIQUE_USAGE_VALUES.has(normalized)
    ? normalized
    : safeFallback;
}

/**
 * Normalise l’attribut lié à une technique rituelle.
 *
 * La fonction vérifie que la clé existe dans `ETERNAME_ATTRIBUTES`.
 * Cela évite qu’un rituel pointe vers un attribut inexistant.
 *
 * @param {unknown} value - Clé d’attribut brute à normaliser.
 * @param {string} [fallback=DEFAULT_LINKED_ATTRIBUTE_KEY] - Attribut utilisé si l’entrée est invalide.
 * @returns {string} Clé d’attribut valide.
 */
export function normalizeTechniqueLinkedAttributeKey(
  value,
  fallback = DEFAULT_LINKED_ATTRIBUTE_KEY
) {
  const normalized = String(value ?? "").trim().toLowerCase();
  const safeFallback = fallback in ETERNAME_ATTRIBUTES
    ? fallback
    : DEFAULT_LINKED_ATTRIBUTE_KEY;

  return normalized in ETERNAME_ATTRIBUTES
    ? normalized
    : safeFallback;
}

/**
 * Renvoie la clé i18n correspondant au type d’usage d’une technique.
 *
 * @param {unknown} usageType - Type d’usage brut ou normalisé.
 * @returns {string} Clé i18n du type d’usage.
 */
export function getTechniqueUsageLabelKey(usageType) {
  const normalized = normalizeTechniqueUsageType(usageType);

  return TECHNIQUE_USAGE_LABEL_KEYS[normalized]
    ?? TECHNIQUE_USAGE_LABEL_KEYS.attack;
}

/**
 * Construit les choix localisés pour le champ de type d’usage d’une technique.
 *
 * Cette fonction est destinée aux contextes de fiche ou de formulaire.
 * Elle dépend de `game.i18n`, donc elle doit être appelée après l’initialisation de Foundry.
 *
 * @param {unknown} [selectedValue=TECHNIQUE_USAGE_TYPES.ATTACK] - Valeur actuellement sélectionnée.
 * @returns {{value: string, label: string, selected: boolean}[]} Choix localisés.
 */
export function getTechniqueUsageChoices(
  selectedValue = TECHNIQUE_USAGE_TYPES.ATTACK
) {
  const selected = normalizeTechniqueUsageType(selectedValue);

  return Object.values(TECHNIQUE_USAGE_TYPES).map((value) => ({
    value,
    label: game.i18n.localize(getTechniqueUsageLabelKey(value)),
    selected: selected === value
  }));
}

/**
 * Construit les choix localisés pour l’attribut lié d’une technique rituelle.
 *
 * Chaque choix contient :
 * - la clé interne de l’attribut ;
 * - son nom localisé ;
 * - son abréviation ;
 * - son état sélectionné.
 *
 * @param {unknown} [selectedKey=DEFAULT_LINKED_ATTRIBUTE_KEY] - Attribut actuellement sélectionné.
 * @returns {{value: string, label: string, abbr: string, selected: boolean}[]} Choix d’attributs localisés.
 */
export function getTechniqueLinkedAttributeChoices(
  selectedKey = DEFAULT_LINKED_ATTRIBUTE_KEY
) {
  const selected = normalizeTechniqueLinkedAttributeKey(selectedKey);

  return Object.entries(ETERNAME_ATTRIBUTES).map(([key, meta]) => ({
    value: key,
    label: game.i18n.localize(meta.label),
    abbr: meta.abbr,
    selected: key === selected
  }));
}

/**
 * Renvoie le libellé localisé de l’attribut lié à une technique.
 *
 * Si la clé est absente ou invalide, l’attribut magique est utilisé par défaut.
 *
 * @param {unknown} attributeKey - Clé brute ou normalisée d’un attribut.
 * @returns {string} Nom localisé de l’attribut.
 */
export function getTechniqueLinkedAttributeLabel(attributeKey) {
  const normalized = normalizeTechniqueLinkedAttributeKey(
    attributeKey,
    DEFAULT_LINKED_ATTRIBUTE_KEY
  );

  return game.i18n.localize(
    ETERNAME_ATTRIBUTES[normalized]?.label ?? ETERNAME_ATTRIBUTES.magic.label
  );
}

/**
 * Construit un proxy d’attaque à partir d’une technique.
 *
 * Ce proxy permet de réutiliser la logique d’attaque existante,
 * comme si la technique était une arme temporaire.
 *
 * La fonction lit les statistiques dérivées de la technique pour retrouver :
 * - la statistique principale ;
 * - la statistique de dégâts ;
 * - la statistique de précision ;
 * - la statistique de portée.
 *
 * @param {Item} technique - Item technique ou héritage technique.
 * @returns {{
 *   name: string,
 *   damage: string,
 *   range: string,
 *   precisionBase: string,
 *   precisionBonus: number,
 *   isTechnique: boolean,
 *   techniqueId: string
 * }} Proxy compatible avec la logique d’attaque.
 */
export function buildTechniqueAttackProxy(technique) {
  const summaryStatistics = Array.isArray(technique?.system?.derived?.summary?.statistics)
    ? technique.system.derived.summary.statistics
    : [];

  const statisticById = new Map(
    summaryStatistics.map((entry) => [
      String(entry?.id ?? ""),
      entry
    ])
  );

  const mainStatisticId = String(technique?.system?.mainStatisticId ?? "").trim();
  const mainStatistic = statisticById.get(mainStatisticId) ?? summaryStatistics[0] ?? null;

  const damageStatistic = summaryStatistics.find((entry) => {
    return String(entry?.statId ?? "") === "damage";
  }) ?? mainStatistic;

  const precisionStatistic = summaryStatistics.find((entry) => {
    const statId = String(entry?.statId ?? "").trim().toLowerCase();

    return ["prc", "prd", "prm"].includes(statId);
  }) ?? null;

  const rangeStatistic = summaryStatistics.find((entry) => {
    return String(entry?.statId ?? "") === "range";
  }) ?? null;

  return {
    name: technique?.name ?? game.i18n.localize("ETERN.ITEM.DEFAULT_TECHNIQUE_NAME"),
    damage: String(damageStatistic?.finalValue ?? mainStatistic?.finalValue ?? ""),
    range: String(rangeStatistic?.finalValue ?? ""),
    precisionBase: String(precisionStatistic?.statId ?? "").trim().toLowerCase(),
    precisionBonus: parseTechniqueFlatValue(precisionStatistic?.finalValue ?? ""),
    isTechnique: true,
    techniqueId: String(technique?.id ?? "")
  };
}

/**
 * Extrait une valeur numérique plate depuis une chaîne de statistique.
 *
 * Exemples :
 * - `"2"` devient `2` ;
 * - `"+2"` devient `2` ;
 * - `"-1"` devient `-1` ;
 * - `"2 + MAG/2"` devient `2` ;
 * - `"MAG/2"` devient `0`.
 *
 * Cette fonction sert surtout à récupérer un bonus fixe de précision.
 *
 * @param {unknown} value - Valeur brute à analyser.
 * @returns {number} Premier entier trouvé en début de chaîne, ou 0.
 */
function parseTechniqueFlatValue(value) {
  const match = String(value ?? "").trim().match(/^[+-]?\d+/);

  return match ? Number(match[0]) || 0 : 0;
}