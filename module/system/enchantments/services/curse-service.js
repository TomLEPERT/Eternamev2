/**
 * Service de génération des malédictions d’enchantement.
 *
 * Responsabilités :
 * - choisir un côté disponible pour une malédiction ;
 * - respecter un côté préféré quand c’est possible ;
 * - éviter de dupliquer une malédiction déjà présente ;
 * - sélectionner aléatoirement une définition de malédiction compatible ;
 * - créer une entrée d’enchantement de famille `curse` depuis une définition du registre.
 *
 * Ce fichier doit rester dédié à la génération de malédictions.
 * Il ne doit pas appliquer les bonus, modifier l’item, consommer un catalyseur
 * ou gérer le dialogue d’enchantement.
 */

import { getRegisteredCursesForSide } from "../registry.js";
import { createEnchantmentEntryFromDefinition } from "./generation-service.js";
import { normalizeEnchantingData } from "./entry-service.js";

const ENCHANTMENT_SIDES = Object.freeze({
  PREFIX: "prefix",
  SUFFIX: "suffix",
  RANDOM: "random"
});

/**
 * Sélectionne un élément aléatoire dans une liste.
 *
 * Si la liste est vide ou invalide, la fonction retourne `null`.
 *
 * @param {Array} [entries=[]] - Liste d’éléments candidats.
 * @returns {*|null} Élément sélectionné ou `null`.
 */
function randomElement(entries = []) {
  if (!Array.isArray(entries) || !entries.length) return null;

  return entries[Math.floor(Math.random() * entries.length)] ?? null;
}

/**
 * Détermine les côtés utilisables pour générer une malédiction.
 *
 * La fonction :
 * - recalcule les données d’enchantement avec les entrées fournies ;
 * - lit les slots préfixes et suffixes disponibles ;
 * - respecte le côté préféré si possible ;
 * - bascule vers l’autre côté si le côté préféré est plein ;
 * - retourne les deux côtés si les deux sont possibles.
 *
 * Important :
 * la fonction retourne actuellement `["prefix", "suffix"]` même si aucun slot
 * n’est disponible. Cela permet aux malédictions d’être générées malgré une
 * capacité pleine. Si les malédictions doivent consommer des slots, remplace
 * le dernier retour par `[]`.
 *
 * @param {Item} item - Item enchanté.
 * @param {Array<object>} [entries=[]] - Entrées d’enchantement actuelles.
 * @param {string} [preferredSide="random"] - Côté préféré : prefix, suffix ou random.
 * @returns {("prefix"|"suffix")[]} Liste des côtés candidats.
 */
function availableSideList(
  item,
  entries = [],
  preferredSide = ENCHANTMENT_SIDES.RANDOM
) {
  const normalized = normalizeEnchantingData({
    ...(item?.system?.enchanting ?? {}),
    entries
  });

  const prefixAvailable = Number(normalized?.derived?.prefixAvailable ?? 0) || 0;
  const suffixAvailable = Number(normalized?.derived?.suffixAvailable ?? 0) || 0;
  const preferred = normalizeSide(preferredSide);

  if (preferred === ENCHANTMENT_SIDES.PREFIX && prefixAvailable > 0) {
    return [ENCHANTMENT_SIDES.PREFIX];
  }

  if (preferred === ENCHANTMENT_SIDES.SUFFIX && suffixAvailable > 0) {
    return [ENCHANTMENT_SIDES.SUFFIX];
  }

  if (
    preferred === ENCHANTMENT_SIDES.PREFIX
    && prefixAvailable <= 0
    && suffixAvailable > 0
  ) {
    return [ENCHANTMENT_SIDES.SUFFIX];
  }

  if (
    preferred === ENCHANTMENT_SIDES.SUFFIX
    && suffixAvailable <= 0
    && prefixAvailable > 0
  ) {
    return [ENCHANTMENT_SIDES.PREFIX];
  }

  if (prefixAvailable > 0 && suffixAvailable <= 0) {
    return [ENCHANTMENT_SIDES.PREFIX];
  }

  if (suffixAvailable > 0 && prefixAvailable <= 0) {
    return [ENCHANTMENT_SIDES.SUFFIX];
  }

  if (prefixAvailable > 0 && suffixAvailable > 0) {
    return [ENCHANTMENT_SIDES.PREFIX, ENCHANTMENT_SIDES.SUFFIX];
  }

  return [ENCHANTMENT_SIDES.PREFIX, ENCHANTMENT_SIDES.SUFFIX];
}

/**
 * Crée une entrée de malédiction aléatoire.
 *
 * La fonction :
 * - récupère les malédictions déjà utilisées ;
 * - choisit les côtés candidats selon la disponibilité ;
 * - cherche une définition de malédiction non utilisée ;
 * - choisit une définition au hasard ;
 * - crée une entrée de famille `curse` au rang 1 ;
 * - ajoute `operation: "curse"` dans les données de source.
 *
 * @param {Item} item - Item à maudire.
 * @param {Array<object>} [entries=[]] - Entrées d’enchantement existantes.
 * @param {string} [preferredSide="random"] - Côté préféré : prefix, suffix ou random.
 * @param {object} [source={}] - Données de source à copier dans l’entrée.
 * @returns {object|null} Entrée de malédiction créée, ou `null` si aucune définition n’est disponible.
 */
export function buildRandomCurseEntry(
  item,
  entries = [],
  preferredSide = ENCHANTMENT_SIDES.RANDOM,
  source = {}
) {
  const usedDefinitionIds = getUsedCurseDefinitionIds(entries);

  for (const side of availableSideList(item, entries, preferredSide)) {
    const availableDefinitions = getRegisteredCursesForSide(side).filter((definition) => {
      return !usedDefinitionIds.has(String(definition?.id ?? ""));
    });

    const definition = randomElement(availableDefinitions);

    if (!definition) continue;

    return createEnchantmentEntryFromDefinition(definition, {
      rank: 1,
      family: "curse",
      source: {
        ...source,
        operation: "curse"
      }
    });
  }

  return null;
}

/**
 * Récupère les ids de définitions de malédictions déjà utilisées.
 *
 * Seules les entrées de famille `curse` sont prises en compte.
 * Cela évite qu’un affixe avec le même id bloque accidentellement une malédiction.
 *
 * @param {Array<object>} [entries=[]] - Entrées existantes.
 * @returns {Set<string>} Ids de définitions de malédictions déjà utilisées.
 */
function getUsedCurseDefinitionIds(entries = []) {
  return new Set(
    (Array.isArray(entries) ? entries : [])
      .filter((entry) => String(entry?.family ?? "") === "curse")
      .map((entry) => String(entry?.definitionId ?? "").trim())
      .filter(Boolean)
  );
}

/**
 * Normalise un côté d’enchantement.
 *
 * Toute valeur inconnue revient à `random`.
 *
 * @param {unknown} value - Valeur brute.
 * @returns {"prefix"|"suffix"|"random"} Côté normalisé.
 */
function normalizeSide(value) {
  const normalized = String(value ?? ENCHANTMENT_SIDES.RANDOM).trim().toLowerCase();

  return Object.values(ENCHANTMENT_SIDES).includes(normalized)
    ? normalized
    : ENCHANTMENT_SIDES.RANDOM;
}