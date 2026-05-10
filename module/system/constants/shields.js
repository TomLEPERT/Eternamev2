/**
 * Constantes et presets liés aux boucliers du système Etername.
 *
 * Responsabilités :
 * - déclarer les catégories de boucliers disponibles ;
 * - fournir les clés i18n des sauvegardes modifiables par les boucliers ;
 * - définir les presets de boucliers créables rapidement depuis l’interface ;
 * - normaliser la structure des presets pour éviter la répétition.
 *
 * Ce fichier doit rester un fichier de données système.
 * Les calculs de défense, de parade ou d’encombrement doivent rester dans les règles dédiées.
 */

import { ITEM_SAVE_LABEL_KEYS } from "./save-keys.js";

export const SHIELD_CATEGORIES = {
  light: "ETERN.SHIELD.CATEGORY.LIGHT",
  medium: "ETERN.SHIELD.CATEGORY.MEDIUM",
  heavy: "ETERN.SHIELD.CATEGORY.HEAVY"
};

/**
 * Clés i18n des sauvegardes utilisables par les boucliers.
 *
 * Cette constante réutilise le référentiel commun des sauvegardes d’items
 * afin d’éviter de dupliquer les mêmes clés dans plusieurs fichiers.
 */
export const SHIELD_SAVE_KEYS = ITEM_SAVE_LABEL_KEYS;

/**
 * Crée un preset de bouclier dans un format commun.
 *
 * Cette fonction évite de répéter la même structure pour chaque bouclier.
 * Elle normalise les valeurs numériques pour empêcher les chaînes ou valeurs invalides
 * de se retrouver dans les données du preset.
 *
 * @param {string} category - Catégorie canonique du bouclier : light, medium ou heavy.
 * @param {number|string} defBonus - Bonus de défense accordé par le bouclier.
 * @param {number|string} weight - Poids ou encombrement du bouclier.
 * @param {{key: string, value: number|string}[]} [saves=[]] - Bonus de sauvegardes accordés par le bouclier.
 * @returns {{
 *   category: string,
 *   defBonus: number,
 *   weight: number,
 *   saves: {key: string, value: number}[],
 *   description: string,
 *   skill: {name: string, description: string}
 * }} Preset de bouclier normalisé.
 */
function createShieldPreset(category, defBonus, weight, saves = []) {
  return {
    category,
    defBonus: Number(defBonus ?? 0) || 0,
    weight: Number(weight ?? 0) || 0,
    saves: saves.map((entry) => ({
      key: String(entry.key ?? ""),
      value: Number(entry.value ?? 0) || 0
    })),
    description: "",
    skill: {
      name: "",
      description: ""
    }
  };
}

/**
 * Presets de boucliers disponibles pour la création rapide.
 *
 * Chaque entrée définit :
 * - sa catégorie ;
 * - son bonus de défense ;
 * - son poids ;
 * - ses bonus de sauvegarde ;
 * - une description vide ;
 * - une structure de compétence vide.
 *
 * Les clés des presets restent en anglais pour conserver une nomenclature interne stable.
 * Les noms affichés doivent passer par l’i18n ailleurs dans l’interface.
 */
export const SHIELD_PRESETS = {
  buckler: createShieldPreset("light", 1, 2, [
    { key: "parry", value: 1 }
  ]),

  large_shield: createShieldPreset("medium", 2, 2, [
    { key: "parry", value: 2 }
  ]),

  pavise: createShieldPreset("heavy", 3, 2, [
    { key: "parry", value: 3 }
  ])
};