/**
 * Service de résolution des identifiants de presets d’équipement.
 *
 * Responsabilités :
 * - normaliser une valeur libre en identifiant technique stable ;
 * - retirer les accents, espaces et caractères spéciaux ;
 * - vérifier qu’un preset existe pour un type d’item donné ;
 * - renvoyer un fallback si l’identifiant est invalide ou inconnu.
 *
 * Ce fichier sert principalement à accepter des valeurs anciennes,
 * saisies manuellement ou importées, puis à les convertir vers les ids canoniques.
 *
 * Il ne doit pas contenir les définitions complètes des presets.
 * Les données sources doivent rester dans les fichiers constants dédiés :
 * - armors.js ;
 * - shields.js ;
 * - weapons.js.
 */

import { ARMOR_PRESETS } from "../constants/armors.js";
import { SHIELD_PRESETS } from "../constants/shields.js";
import { WEAPON_PRESETS } from "../constants/weapons.js";

/**
 * Registre des ids de presets disponibles par type d’item.
 *
 * Les ids sont construits depuis les objets de presets officiels afin d’éviter
 * de maintenir deux listes séparées.
 *
 * @type {Record<string, Set<string>>}
 */
const PRESET_IDS_BY_TYPE = {
  armor: new Set(Object.keys(ARMOR_PRESETS)),
  shield: new Set(Object.keys(SHIELD_PRESETS)),
  weapon: new Set(Object.keys(WEAPON_PRESETS))
};

/**
 * Normalise une valeur libre en token de preset.
 *
 * La fonction :
 * - convertit la valeur en chaîne ;
 * - retire les accents ;
 * - remplace les caractères non alphanumériques par `_` ;
 * - retire les `_` en début et fin ;
 * - convertit en minuscules.
 *
 * Exemple :
 * `"Cuir clouté"` devient `"cuir_cloute"`.
 *
 * @param {unknown} value - Valeur brute à normaliser.
 * @returns {string} Token normalisé.
 */
function normalizePresetToken(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

/**
 * Résout l’id canonique d’un preset d’item.
 *
 * Si la valeur normalisée correspond à un preset connu pour le type demandé,
 * elle est renvoyée.
 *
 * Sinon, la fonction renvoie le fallback fourni.
 *
 * @param {unknown} type - Type d’item : armor, shield ou weapon.
 * @param {unknown} value - Valeur brute du preset à résoudre.
 * @param {string} [fallback=""] - Id utilisé si la valeur est invalide ou inconnue.
 * @returns {string} Id de preset valide ou fallback.
 */
export function resolvePresetBaseId(type, value, fallback = "") {
  const normalizedType = String(type ?? "").trim();
  const normalized = normalizePresetToken(value);
  const allowedValues = PRESET_IDS_BY_TYPE[normalizedType] ?? new Set();

  if (normalized && allowedValues.has(normalized)) {
    return normalized;
  }

  return String(fallback ?? "");
}