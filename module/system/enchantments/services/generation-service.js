/**
 * Factory d’entrées d’enchantement depuis les définitions du registre.
 *
 * Responsabilités :
 * - créer une entrée d’enchantement depuis une définition enregistrée ;
 * - appliquer le rang de l’enchantement ;
 * - localiser le nom et la description de la définition ;
 * - remplacer les variables de description, comme `{value}` ;
 * - convertir les effets de définition en bonus acteur ou bonus item ;
 * - renseigner les informations de source : catalyseur, essence et opération.
 *
 * Ce fichier doit rester dédié à la conversion définition → entrée.
 * Il ne doit pas choisir aléatoirement les affixes, appliquer les bonus,
 * modifier les items ou gérer l’interface.
 */

import { asArray } from '../../../utils/arrays.js';
import {
  createDefaultEnchantmentActorBonus,
  createDefaultEnchantmentItemBonus,
  createDefaultEnchantmentSource,
  createCustomEnchantmentEntry
} from "./entry-service.js";

import {
  formatDefinitionText,
  getDefinitionLocaleText,
  getRankValue
} from "../definition-helpers.js";

import {
  isSupportedEnchantmentActorTarget,
  isSupportedEnchantmentItemTarget
} from "../supported-targets.js";

const MIN_ENCHANTMENT_RANK = 1;
const MAX_ENCHANTMENT_RANK = 7;

/**
 * Résout la valeur numérique d’un effet selon sa configuration.
 *
 * Sources possibles :
 * - `rankValue` : utilise la valeur de rang déjà calculée depuis la définition ;
 * - `valueTable` : lit une table de valeurs selon le rang ;
 * - `value` : utilise une valeur fixe.
 *
 * Le rang reçu est en 1-based.
 * La lecture de `valueTable` est donc convertie en index 0-based.
 *
 * @param {object} [effect={}] - Effet de définition.
 * @param {unknown} [rankValue=0] - Valeur associée au rang courant.
 * @param {number} [rank=1] - Rang courant, en 1-based.
 * @returns {number|unknown} Valeur résolue.
 */
function resolveEffectValue(effect = {}, rankValue = 0, rank = 1) {
  if (effect.valueSource === "rankValue") {
    return rankValue;
  }

  if (effect.valueSource === "valueTable") {
    const values = Array.isArray(effect.valueTable)
      ? effect.valueTable
      : [];

    if (!values.length) return 0;

    const index = Math.max(
      0,
      Math.min(values.length - 1, Math.floor(Number(rank) || 1) - 1)
    );

    return values[index];
  }

  if (Number.isFinite(Number(effect.value))) {
    return Number(effect.value);
  }

  return 0;
}

/**
 * Construit une ligne de bonus depuis un effet de définition.
 *
 * Selon `effect.scope`, la ligne produite est :
 * - un bonus item ;
 * - un bonus acteur.
 *
 * Les cibles non supportées sont ignorées.
 *
 * @param {object} [effect={}] - Effet de définition.
 * @param {unknown} [rankValue=0] - Valeur calculée pour le rang courant.
 * @param {number} [rank=1] - Rang courant.
 * @returns {{actorBonus?: object, itemBonus?: object}|null} Bonus construit ou `null`.
 */
function buildEffectBonus(effect = {}, rankValue = 0, rank = 1) {
  const targetKey = String(effect.targetKey ?? "").trim();
  const value = resolveEffectValue(effect, rankValue, rank);

  if (effect.scope === "item") {
    if (!isSupportedEnchantmentItemTarget(targetKey)) return null;

    const row = createDefaultEnchantmentItemBonus();

    row.targetKey = targetKey;
    row.value = toFiniteNumber(value, 0);
    row.notes = String(effect.notes ?? "");

    return { itemBonus: row };
  }

  if (!isSupportedEnchantmentActorTarget(targetKey)) return null;

  const row = createDefaultEnchantmentActorBonus();

  row.targetKey = targetKey;
  row.value = Math.trunc(toFiniteNumber(value, 0));
  row.notes = String(effect.notes ?? "");

  return { actorBonus: row };
}

/**
 * Crée une entrée d’enchantement depuis une définition du registre.
 *
 * La fonction :
 * - crée une entrée personnalisée de base ;
 * - la marque comme entrée venant du registre ;
 * - applique le rang ;
 * - récupère la valeur de rang ;
 * - localise le label et la description ;
 * - copie les tags et le poids magique ;
 * - prépare la source ;
 * - convertit les effets en bonus acteur ou item.
 *
 * @param {object} definition - Définition d’enchantement du registre.
 * @param {object} [options={}] - Options de création.
 * @param {number} [options.rank=1] - Rang de l’enchantement.
 * @param {object} [options.source={}] - Données de source : catalyseur, essence, opération.
 * @param {string} [options.family="affix"] - Famille de l’entrée : affix ou curse.
 * @returns {object} Entrée d’enchantement prête à être ajoutée à l’item.
 */
export function createEnchantmentEntryFromDefinition(
  definition,
  {
    rank = 1,
    source = {},
    family = "affix"
  } = {}
) {
  const entry = createCustomEnchantmentEntry({
    family,
    side: definition?.side ?? "prefix"
  });

  entry.rank = clampEnchantmentRank(rank);

  const rankValue = getRankValue(definition, entry.rank - 1);
  const localizedLabel = getDefinitionLocaleText(definition, "label");
  const localizedDescription = formatDefinitionText(
    getDefinitionLocaleText(definition, "description"),
    { value: rankValue }
  );

  entry.sourceType = "registry";
  entry.definitionId = String(definition?.id ?? "");
  entry.label = localizedLabel;
  entry.description = localizedDescription;
  entry.tagsText = Array.isArray(definition?.tags)
    ? definition.tags.join(", ")
    : "";
  entry.magicWeight = toFiniteNumber(definition?.magicWeight, 0);

  entry.source = {
    ...createDefaultEnchantmentSource(),
    catalystBase: String(source?.catalystBase ?? ""),
    essenceQuality: String(source?.essenceQuality ?? "none"),
    essenceTag: String(source?.essenceTag ?? ""),
    operation: String(source?.operation ?? "")
  };

  entry.actorBonuses = [];
  entry.itemBonuses = [];

  for (const effect of asArray(definition?.effects)) {
    const mapped = buildEffectBonus(effect, rankValue, entry.rank);

    if (!mapped) continue;

    if (mapped.actorBonus) {
      entry.actorBonuses.push(mapped.actorBonus);
    }

    if (mapped.itemBonus) {
      entry.itemBonuses.push(mapped.itemBonus);
    }
  }

  return entry;
}

/**
 * Borne un rang d’enchantement.
 *
 * @param {unknown} value - Rang brut.
 * @returns {number} Rang entre 1 et 7.
 */
function clampEnchantmentRank(value) {
  const numericValue = Math.floor(Number(value) || MIN_ENCHANTMENT_RANK);

  return Math.max(
    MIN_ENCHANTMENT_RANK,
    Math.min(MAX_ENCHANTMENT_RANK, numericValue)
  );
}


/**
 * Convertit une valeur en nombre fini.
 *
 * @param {unknown} value - Valeur brute.
 * @param {number} [fallback=0] - Valeur utilisée si l’entrée est invalide.
 * @returns {number} Nombre fini.
 */
function toFiniteNumber(value, fallback = 0) {
  const numericValue = Number(value ?? fallback);

  return Number.isFinite(numericValue)
    ? numericValue
    : fallback;
}