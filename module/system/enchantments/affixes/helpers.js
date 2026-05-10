/**
 * Helpers de définition des affixes d’enchantement.
 *
 * Responsabilités :
 * - construire une définition d’affixe stable avec `defineAffix()` ;
 * - créer rapidement des effets d’affixe ciblant un acteur ;
 * - créer rapidement des effets d’affixe ciblant un item ;
 * - créer des effets fixes, par rang ou par table de valeurs ;
 * - fournir des raccourcis pour les effets spéciaux et les effets d’invocation.
 *
 * Ce fichier ne doit pas contenir de définitions concrètes d’affixes.
 * Il sert uniquement de boîte à outils pour les fichiers de registre :
 * - weapon-common.js ;
 * - weapon-sidearm.js ;
 * - weapon-wooden.js ;
 * - weapon-mechanical.js ;
 * - shields.js ;
 * - armors.js ;
 * - accessories.js ;
 * - consumables.js.
 */

const EFFECT_SCOPES = Object.freeze({
  actor: 'actor',
  item: 'item'
});

const EFFECT_VALUE_SOURCES = Object.freeze({
  rankValue: 'rankValue',
  valueTable: 'valueTable'
});

const DEFAULT_LOCALIZED_TEXT = Object.freeze({
  fr: '',
  en: ''
});

/**
 * Crée une définition d’affixe normalisée.
 *
 * Cette fonction garantit que la structure d’un affixe reste stable :
 * - les identifiants sont convertis en chaînes ;
 * - les tableaux sont toujours présents ;
 * - les tableaux et objets internes sont gelés ;
 * - les valeurs numériques sont normalisées ;
 * - les effets sont copiés et gelés.
 *
 * @param {object} [definition={}] - Données de définition de l’affixe.
 * @param {string} definition.id - Identifiant unique de l’affixe.
 * @param {string} [definition.side='prefix'] - Côté de l’affixe : prefix ou suffix.
 * @param {string[]} [definition.itemTypes=[]] - Types d’items compatibles.
 * @param {string[]} [definition.itemCategories=[]] - Catégories d’items compatibles.
 * @param {string[]} [definition.itemBases=[]] - Bases d’items compatibles.
 * @param {string[]} [definition.requiredItemTags=[]] - Tags requis sur l’item.
 * @param {string[]} [definition.excludedItemTags=[]] - Tags interdits sur l’item.
 * @param {string[]} [definition.tags=[]] - Tags thématiques de l’affixe.
 * @param {number} [definition.magicWeight=0] - Poids magique de l’affixe.
 * @param {{fr: string, en: string}} definition.label - Nom localisé.
 * @param {{fr: string, en: string}} definition.description - Description localisée.
 * @param {Array<*>} [definition.rankValues=[]] - Valeurs affichées selon le rang.
 * @param {Array<object>} [definition.effects=[]] - Effets mécaniques de l’affixe.
 * @returns {object} Définition d’affixe gelée.
 */
export function defineAffix({
  id,
  side = 'prefix',
  itemTypes = [],
  itemCategories = [],
  itemBases = [],
  requiredItemTags = [],
  excludedItemTags = [],
  tags = [],
  magicWeight = 0,
  label,
  description,
  rankValues = [],
  effects = []
} = {}) {
  return Object.freeze({
    id: String(id ?? ''),
    side: normalizeAffixSide(side),
    itemTypes: freezeStringArray(itemTypes),
    itemCategories: freezeStringArray(itemCategories),
    itemBases: freezeStringArray(itemBases),
    requiredItemTags: freezeStringArray(requiredItemTags),
    excludedItemTags: freezeStringArray(excludedItemTags),
    tags: freezeStringArray(tags),
    magicWeight: toFiniteNumber(magicWeight),
    label: freezeLocalizedText(label),
    description: freezeLocalizedText(description),
    rankValues: Object.freeze(Array.isArray(rankValues) ? [...rankValues] : []),
    effects: freezeEffects(effects)
  });
}

/**
 * Crée un effet acteur dont la valeur vient de la valeur de rang.
 *
 * Exemple :
 * actorRank('combat.prc')
 *
 * @param {string} targetKey - Cible de bonus acteur.
 * @param {string} [notes=''] - Notes optionnelles.
 * @returns {object} Effet acteur gelé.
 */
export function actorRank(targetKey, notes = '') {
  return createRankEffect(EFFECT_SCOPES.actor, targetKey, notes);
}

/**
 * Crée un effet item dont la valeur vient de la valeur de rang.
 *
 * Exemple :
 * itemRank('defBonus')
 *
 * @param {string} targetKey - Cible de bonus item.
 * @param {string} [notes=''] - Notes optionnelles.
 * @returns {object} Effet item gelé.
 */
export function itemRank(targetKey, notes = '') {
  return createRankEffect(EFFECT_SCOPES.item, targetKey, notes);
}

/**
 * Crée un effet acteur avec une valeur fixe.
 *
 * Exemple :
 * actorFixed('hpMax', 2)
 *
 * @param {string} targetKey - Cible de bonus acteur.
 * @param {number} value - Valeur fixe.
 * @param {string} [notes=''] - Notes optionnelles.
 * @returns {object} Effet acteur gelé.
 */
export function actorFixed(targetKey, value, notes = '') {
  return createFixedEffect(EFFECT_SCOPES.actor, targetKey, value, notes);
}

/**
 * Crée un effet item avec une valeur fixe.
 *
 * Exemple :
 * itemFixed('damageDiceBonus', 1)
 *
 * @param {string} targetKey - Cible de bonus item.
 * @param {number} value - Valeur fixe.
 * @param {string} [notes=''] - Notes optionnelles.
 * @returns {object} Effet item gelé.
 */
export function itemFixed(targetKey, value, notes = '') {
  return createFixedEffect(EFFECT_SCOPES.item, targetKey, value, notes);
}

/**
 * Crée un effet acteur dont la valeur vient d’une table indexée par rang.
 *
 * Exemple :
 * actorTable('initiative', [1, 2, 3])
 *
 * @param {string} targetKey - Cible de bonus acteur.
 * @param {Array<*>} [valueTable=[]] - Table de valeurs par rang.
 * @param {string} [notes=''] - Notes optionnelles.
 * @returns {object} Effet acteur gelé.
 */
export function actorTable(targetKey, valueTable = [], notes = '') {
  return createTableEffect(EFFECT_SCOPES.actor, targetKey, valueTable, notes);
}

/**
 * Crée un effet item dont la valeur vient d’une table indexée par rang.
 *
 * Exemple :
 * itemTable('rangeMeters', [3, 3, 6, 6])
 *
 * @param {string} targetKey - Cible de bonus item.
 * @param {Array<*>} [valueTable=[]] - Table de valeurs par rang.
 * @param {string} [notes=''] - Notes optionnelles.
 * @returns {object} Effet item gelé.
 */
export function itemTable(targetKey, valueTable = [], notes = '') {
  return createTableEffect(EFFECT_SCOPES.item, targetKey, valueTable, notes);
}

/**
 * Crée un effet spécial acteur avec une valeur fixe.
 *
 * La cible finale sera préfixée par `special.`.
 *
 * Exemple :
 * specialFlag('undetectable', 1)
 * devient :
 * special.undetectable
 *
 * @param {string} targetKey - Nom de l’effet spécial.
 * @param {number} [value=1] - Valeur fixe.
 * @param {string} [notes=''] - Notes optionnelles.
 * @returns {object} Effet acteur gelé.
 */
export function specialFlag(targetKey, value = 1, notes = '') {
  return actorFixed(`special.${String(targetKey ?? '').trim()}`, value, notes);
}

/**
 * Crée un effet spécial acteur dont la valeur vient du rang.
 *
 * Exemple :
 * specialRank('lifeOnHit')
 * devient :
 * special.lifeOnHit
 *
 * @param {string} targetKey - Nom de l’effet spécial.
 * @param {string} [notes=''] - Notes optionnelles.
 * @returns {object} Effet acteur gelé.
 */
export function specialRank(targetKey, notes = '') {
  return actorRank(`special.${String(targetKey ?? '').trim()}`, notes);
}

/**
 * Crée un effet spécial acteur dont la valeur vient d’une table.
 *
 * Exemple :
 * specialTable('extraSaveBox', [0, 0, 1, 1])
 * devient :
 * special.extraSaveBox
 *
 * @param {string} targetKey - Nom de l’effet spécial.
 * @param {Array<*>} [valueTable=[]] - Table de valeurs par rang.
 * @param {string} [notes=''] - Notes optionnelles.
 * @returns {object} Effet acteur gelé.
 */
export function specialTable(targetKey, valueTable = [], notes = '') {
  return actorTable(`special.${String(targetKey ?? '').trim()}`, valueTable, notes);
}

/**
 * Crée un effet d’invocation dont la valeur vient du rang.
 *
 * La cible finale sera préfixée par `summon.`.
 *
 * Exemple :
 * summonRank('combat.prc')
 * devient :
 * summon.combat.prc
 *
 * @param {string} targetKey - Cible de bonus d’invocation.
 * @param {string} [notes=''] - Notes optionnelles.
 * @returns {object} Effet acteur gelé.
 */
export function summonRank(targetKey, notes = '') {
  return actorRank(`summon.${String(targetKey ?? '').trim()}`, notes);
}

/**
 * Crée un effet d’invocation avec une valeur fixe.
 *
 * Exemple :
 * summonFixed('hpMax', 2)
 * devient :
 * summon.hpMax
 *
 * @param {string} targetKey - Cible de bonus d’invocation.
 * @param {number} value - Valeur fixe.
 * @param {string} [notes=''] - Notes optionnelles.
 * @returns {object} Effet acteur gelé.
 */
export function summonFixed(targetKey, value, notes = '') {
  return actorFixed(`summon.${String(targetKey ?? '').trim()}`, value, notes);
}

/**
 * Crée un effet d’invocation dont la valeur vient d’une table.
 *
 * Exemple :
 * summonTable('damageDiceBonus', [1, 1, 2, 2])
 * devient :
 * summon.damageDiceBonus
 *
 * @param {string} targetKey - Cible de bonus d’invocation.
 * @param {Array<*>} [valueTable=[]] - Table de valeurs par rang.
 * @param {string} [notes=''] - Notes optionnelles.
 * @returns {object} Effet acteur gelé.
 */
export function summonTable(targetKey, valueTable = [], notes = '') {
  return actorTable(`summon.${String(targetKey ?? '').trim()}`, valueTable, notes);
}

/**
 * Crée un effet spécial item avec une valeur fixe.
 *
 * La cible finale sera préfixée par `special.`.
 *
 * Exemple :
 * itemSpecial('requirementReduction', 1)
 * devient :
 * special.requirementReduction
 *
 * @param {string} targetKey - Nom de l’effet spécial item.
 * @param {number} value - Valeur fixe.
 * @param {string} [notes=''] - Notes optionnelles.
 * @returns {object} Effet item gelé.
 */
export function itemSpecial(targetKey, value, notes = '') {
  return itemFixed(`special.${String(targetKey ?? '').trim()}`, value, notes);
}

/**
 * Crée un effet spécial item dont la valeur vient d’une table.
 *
 * Exemple :
 * itemSpecialTable('requirementReduction', [1, 1, 2, 2])
 * devient :
 * special.requirementReduction
 *
 * @param {string} targetKey - Nom de l’effet spécial item.
 * @param {Array<*>} [valueTable=[]] - Table de valeurs par rang.
 * @param {string} [notes=''] - Notes optionnelles.
 * @returns {object} Effet item gelé.
 */
export function itemSpecialTable(targetKey, valueTable = [], notes = '') {
  return itemTable(`special.${String(targetKey ?? '').trim()}`, valueTable, notes);
}

/**
 * Normalise le côté d’un affixe.
 *
 * Toute valeur différente de `suffix` devient `prefix`.
 *
 * @param {unknown} value - Côté brut.
 * @returns {'prefix'|'suffix'} Côté normalisé.
 */
function normalizeAffixSide(value) {
  return String(value ?? 'prefix').trim() === 'suffix'
    ? 'suffix'
    : 'prefix';
}

/**
 * Convertit un tableau en tableau de chaînes gelé.
 *
 * @param {unknown} values - Valeurs brutes.
 * @returns {readonly string[]} Tableau gelé.
 */
function freezeStringArray(values) {
  return Object.freeze(
    Array.isArray(values)
      ? values.map((value) => String(value ?? '').trim()).filter(Boolean)
      : []
  );
}

/**
 * Gèle un texte localisé.
 *
 * Si l’entrée est invalide, un texte vide français / anglais est utilisé.
 *
 * @param {unknown} value - Texte localisé brut.
 * @returns {{fr: string, en: string}} Texte localisé gelé.
 */
function freezeLocalizedText(value) {
  if (!value || typeof value !== 'object') {
    return DEFAULT_LOCALIZED_TEXT;
  }

  return Object.freeze({
    fr: String(value.fr ?? ''),
    en: String(value.en ?? '')
  });
}

/**
 * Gèle une liste d’effets.
 *
 * Chaque effet est copié avant d’être gelé.
 * Si un effet contient une `valueTable`, elle est aussi copiée et gelée.
 *
 * @param {unknown} effects - Effets bruts.
 * @returns {readonly object[]} Effets gelés.
 */
function freezeEffects(effects) {
  return Object.freeze(
    Array.isArray(effects)
      ? effects.map((effect) => freezeEffect(effect))
      : []
  );
}

/**
 * Gèle un effet individuel.
 *
 * @param {object} effect - Effet brut.
 * @returns {object} Effet gelé.
 */
function freezeEffect(effect = {}) {
  const cloned = { ...effect };

  if (Array.isArray(cloned.valueTable)) {
    cloned.valueTable = Object.freeze([...cloned.valueTable]);
  }

  return Object.freeze(cloned);
}

/**
 * Crée un effet dont la valeur vient de la valeur de rang.
 *
 * @param {'actor'|'item'} scope - Portée de l’effet.
 * @param {string} targetKey - Cible de l’effet.
 * @param {string} [notes=''] - Notes optionnelles.
 * @returns {object} Effet gelé.
 */
function createRankEffect(scope, targetKey, notes = '') {
  return Object.freeze({
    scope,
    targetKey: String(targetKey ?? '').trim(),
    valueSource: EFFECT_VALUE_SOURCES.rankValue,
    notes: String(notes ?? '')
  });
}

/**
 * Crée un effet avec une valeur fixe.
 *
 * @param {'actor'|'item'} scope - Portée de l’effet.
 * @param {string} targetKey - Cible de l’effet.
 * @param {number} value - Valeur fixe.
 * @param {string} [notes=''] - Notes optionnelles.
 * @returns {object} Effet gelé.
 */
function createFixedEffect(scope, targetKey, value, notes = '') {
  return Object.freeze({
    scope,
    targetKey: String(targetKey ?? '').trim(),
    value: toFiniteNumber(value),
    notes: String(notes ?? '')
  });
}

/**
 * Crée un effet avec une table de valeurs par rang.
 *
 * @param {'actor'|'item'} scope - Portée de l’effet.
 * @param {string} targetKey - Cible de l’effet.
 * @param {Array<*>} [valueTable=[]] - Table de valeurs.
 * @param {string} [notes=''] - Notes optionnelles.
 * @returns {object} Effet gelé.
 */
function createTableEffect(scope, targetKey, valueTable = [], notes = '') {
  return Object.freeze({
    scope,
    targetKey: String(targetKey ?? '').trim(),
    valueSource: EFFECT_VALUE_SOURCES.valueTable,
    valueTable: Object.freeze(Array.isArray(valueTable) ? [...valueTable] : []),
    notes: String(notes ?? '')
  });
}

/**
 * Convertit une valeur en nombre fini.
 *
 * Les valeurs invalides deviennent 0.
 *
 * @param {unknown} value - Valeur brute.
 * @returns {number} Nombre normalisé.
 */
function toFiniteNumber(value) {
  const numericValue = Number(value ?? 0);

  return Number.isFinite(numericValue)
    ? numericValue
    : 0;
}