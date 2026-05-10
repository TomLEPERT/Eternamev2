/**
 * Helpers génériques liés aux identifiants internes.
 *
 * Responsabilités :
 * - nettoyer les listes d’identifiants issues des formulaires ou des presets ;
 * - supprimer les entrées vides et les doublons ;
 * - conserver une nomenclature interne stable et prévisible.
 */

import { asArray } from './arrays.js';

/**
 * Normalise une liste d’identifiants textuels.
 *
 * @param {unknown} values - Liste brute.
 * @returns {string[]} Identifiants uniques non vides.
 */
export function uniqueIds(values) {
  return Array.from(new Set(
    asArray(values)
      .map((value) => String(value ?? '').trim())
      .filter(Boolean)
  ));
}
