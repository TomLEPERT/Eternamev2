/**
 * Règles des catalyseurs d’enchantement.
 *
 * Responsabilités :
 * - déclarer les opérations mécaniques possibles des catalyseurs ;
 * - associer chaque base de catalyseur à une règle d’enchantement ;
 * - exposer un helper permettant de récupérer la règle d’un catalyseur ;
 * - fournir une règle de fallback si la base demandée est inconnue.
 *
 * Ce fichier doit rester un référentiel de règles.
 * Il ne doit pas appliquer les enchantements, modifier les items,
 * consommer les catalyseurs ou gérer le dialogue d’enchantement.
 */

const DEFAULT_CATALYST_BASE = "brutal_shard";

export const ENCHANTMENT_CATALYST_OPERATIONS = Object.freeze({
  addRandomAffix: "addRandomAffix",
  removeRandomAffix: "removeRandomAffix",
  clearUnlockedEntries: "clearUnlockedEntries",
  rerollSameTag: "rerollSameTag",
  lockRandomEntry: "lockRandomEntry",
  addForcedTagAffix: "addForcedTagAffix",
  addExistingTagAffix: "addExistingTagAffix",
  upgradeRandomAffix: "upgradeRandomAffix"
});

export const ENCHANTMENT_CATALYST_RULES = Object.freeze({
  brutal_shard: Object.freeze({
    operation: ENCHANTMENT_CATALYST_OPERATIONS.addRandomAffix
  }),

  unstable_powder: Object.freeze({
    operation: ENCHANTMENT_CATALYST_OPERATIONS.removeRandomAffix
  }),

  oblivion_crystal: Object.freeze({
    operation: ENCHANTMENT_CATALYST_OPERATIONS.clearUnlockedEntries
  }),

  shifting_stone: Object.freeze({
    operation: ENCHANTMENT_CATALYST_OPERATIONS.rerollSameTag
  }),

  inflexible_inkwell: Object.freeze({
    operation: ENCHANTMENT_CATALYST_OPERATIONS.lockRandomEntry,
    minimumEntries: 2
  }),

  primordial_orb: Object.freeze({
    operation: ENCHANTMENT_CATALYST_OPERATIONS.addForcedTagAffix,
    requiresEssenceTag: true
  }),

  master_fragment: Object.freeze({
    operation: ENCHANTMENT_CATALYST_OPERATIONS.addExistingTagAffix,
    curseOnNaturalOne: true
  }),

  dark_oath: Object.freeze({
    operation: ENCHANTMENT_CATALYST_OPERATIONS.addRandomAffix,
    extraSuccesses: 2,
    forcedCurse: true
  }),

  eternity_orb: Object.freeze({
    operation: ENCHANTMENT_CATALYST_OPERATIONS.upgradeRandomAffix
  })
});

/**
 * Récupère la règle d’un catalyseur d’enchantement.
 *
 * Si la base demandée n’existe pas dans le registre,
 * la règle du catalyseur par défaut `brutal_shard` est renvoyée.
 *
 * @param {unknown} base - Base de catalyseur demandée.
 * @returns {object} Règle du catalyseur.
 */
export function getEnchantmentCatalystRule(base) {
  const catalystBase = String(base ?? "").trim();

  return ENCHANTMENT_CATALYST_RULES[catalystBase]
    ?? ENCHANTMENT_CATALYST_RULES[DEFAULT_CATALYST_BASE];
}