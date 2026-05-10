/**
 * Helper de résolution du variant de fiche item.
 *
 * Responsabilités :
 * - déterminer quel variant de template utiliser selon le type d’item ;
 * - sécuriser les types inconnus en les redirigeant vers le variant `base` ;
 * - centraliser la liste des types d’items qui possèdent une fiche spécialisée.
 *
 * Ce fichier doit rester très léger.
 * Il ne doit pas contenir de logique de rendu, de préparation de contexte
 * ou de règles propres aux différents types d’items.
 */

const ITEM_SHEET_VARIANTS = Object.freeze(new Set([
  "weapon",
  "armor",
  "shield",
  "material",
  "consumable",
  "bag",
  "profession",
  "technique",
  "invocation",
  "heritage"
]));

/**
 * Résout le variant de fiche à utiliser pour un type d’item.
 *
 * Si le type est connu, la fonction renvoie ce type directement.
 * Si le type est absent ou inconnu, elle renvoie `base`.
 *
 * @param {unknown} itemType - Type d’item brut.
 * @returns {string} Variant de fiche item.
 */
export function getItemSheetVariant(itemType) {
  const normalizedType = String(itemType ?? "");

  return ITEM_SHEET_VARIANTS.has(normalizedType)
    ? normalizedType
    : "base";
}