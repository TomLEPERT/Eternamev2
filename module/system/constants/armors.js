/**
 * Constantes et presets liés aux armures du système Etername.
 *
 * Responsabilités :
 * - déclarer les catégories d’armures disponibles ;
 * - exposer les clés i18n des sauvegardes utilisables par les armures ;
 * - définir les presets d’armures créables rapidement depuis l’interface ;
 * - normaliser la structure des presets pour éviter la répétition.
 *
 * Ce fichier ne doit contenir que des données système stables.
 * Les calculs de défense, d’encombrement ou de sauvegardes doivent rester dans les règles dédiées.
 */

import { ITEM_SAVE_LABEL_KEYS } from "./save-keys.js";

export const ARMOR_CATEGORIES = {
  natural: "ETERN.ARMOR.CATEGORY.NATURAL",
  light: "ETERN.ARMOR.CATEGORY.LIGHT",
  medium: "ETERN.ARMOR.CATEGORY.MEDIUM",
  heavy: "ETERN.ARMOR.CATEGORY.HEAVY"
};

/**
 * Clés i18n des sauvegardes utilisables par les armures.
 *
 * Cette constante réutilise le référentiel commun des sauvegardes d’items
 * afin d’éviter de dupliquer les mêmes clés dans plusieurs fichiers.
 */
export const ARMOR_SAVE_KEYS = ITEM_SAVE_LABEL_KEYS;

/**
 * Presets de compétence ou de maîtrise liés aux catégories d’armure.
 *
 * Actuellement, les entrées sont vides.
 * À conserver seulement si elles servent de structure d’initialisation ailleurs.
 *
 * Si ces données sont affichées à l’utilisateur, préférer des clés i18n plutôt que du texte direct.
 */
export const ARMOR_SKILL_PRESETS = {
  light: { name: "", description: "" },
  medium: { name: "", description: "" },
  heavy: { name: "", description: "" },
  natural: { name: "", description: "" }
};

/**
 * Crée un preset d’armure dans un format commun.
 *
 * Cette fonction évite de répéter la même structure pour chaque armure.
 * Elle normalise aussi les valeurs numériques afin d’éviter que des chaînes
 * ou valeurs invalides ne se retrouvent dans les données finales.
 *
 * @param {string} category - Catégorie canonique de l’armure : natural, light, medium ou heavy.
 * @param {string} defFormula - Formule de défense utilisée par l’armure.
 * @param {number|string} weight - Poids ou encombrement de l’armure.
 * @param {{key: string, value: number|string}[]} [saves=[]] - Bonus de sauvegardes accordés par l’armure.
 * @returns {{
 *   category: string,
 *   defFormula: string,
 *   weight: number,
 *   saves: {key: string, value: number}[],
 *   description: string
 * }} Preset d’armure normalisé.
 */
function createArmorPreset(category, defFormula, weight, saves = []) {
  return {
    category,
    defFormula: String(defFormula ?? ""),
    weight: Number(weight ?? 0) || 0,
    saves: saves.map((entry) => ({
      key: String(entry.key ?? ""),
      value: Number(entry.value ?? 0) || 0
    })),
    description: ""
  };
}

/**
 * Presets d’armures disponibles pour la création rapide.
 *
 * Chaque entrée représente une armure prédéfinie avec :
 * - sa catégorie ;
 * - sa formule de défense ;
 * - son poids ;
 * - ses bonus de sauvegarde ;
 * - une description vide pouvant être complétée ailleurs.
 *
 * Les clés des presets restent en anglais pour conserver une nomenclature interne stable.
 * Les noms affichés doivent passer par l’i18n ailleurs dans l’interface.
 */
export const ARMOR_PRESETS = {
  padded_armor: createArmorPreset("light", "2 + AGI/2", 1, [
    { key: "armor", value: 1 }
  ]),

  leather_armor: createArmorPreset("light", "3 + AGI/2", 1, [
    { key: "armor", value: 2 }
  ]),

  studded_leather_armor: createArmorPreset("light", "3 + AGI/2", 2, [
    { key: "armor", value: 3 }
  ]),

  feather_armor: createArmorPreset("light", "1 + AGI/2", 2, [
    { key: "dodge", value: 2 }
  ]),

  hide_armor: createArmorPreset("medium", "3 + AGI/2", 1, [
    { key: "armor", value: 3 },
    { key: "ice", value: 3 }
  ]),

  mail_shirt: createArmorPreset("medium", "4 + AGI/2", 2, [
    { key: "armor", value: 4 }
  ]),

  scale_armor: createArmorPreset("medium", "4 + AGI/2", 2, [
    { key: "armor", value: 4 }
  ]),

  shell_armor: createArmorPreset("medium", "4 + AGI/2", 2, [
    { key: "armor", value: 4 }
  ]),

  half_plate_armor: createArmorPreset("medium", "5 + AGI/2", 2, [
    { key: "armor", value: 5 }
  ]),

  furred_hauberk: createArmorPreset("heavy", "7", 2, [
    { key: "armor", value: 5 },
    { key: "ice", value: 5 }
  ]),

  chainmail: createArmorPreset("heavy", "8", 2, [
    { key: "armor", value: 6 }
  ]),

  full_plate: createArmorPreset("heavy", "10", 2, [
    { key: "armor", value: 7 }
  ]),

  feathers: createArmorPreset("natural", "1 + AGI/2", 0, [
    { key: "dodge", value: 2 }
  ]),

  scales: createArmorPreset("natural", "4 + AGI/2", 0, [
    { key: "armor", value: 5 }
  ]),

  hides_and_furs: createArmorPreset("natural", "2 + AGI/2", 0, [
    { key: "armor", value: 3 },
    { key: "ice", value: 5 }
  ]),

  carapace: createArmorPreset("natural", "4 + AGI/2", 0, [
    { key: "armor", value: 5 }
  ])
};