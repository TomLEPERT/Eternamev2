/**
 * Service de localisation des presets d’items.
 *
 * Responsabilités :
 * - convertir les ids de presets en ids i18n stables ;
 * - localiser les noms de presets ;
 * - localiser les descriptions de presets ;
 * - localiser les compétences liées aux presets ;
 * - localiser les compétences liées aux catégories, comme les catégories d’armure ;
 * - fournir des fallbacks propres quand une clé i18n est absente.
 *
 * Ce fichier doit rester dédié à la localisation.
 * Il ne doit pas contenir les définitions complètes des presets,
 * la logique d’application des presets ou la préparation des fiches.
 */

const CATEGORY_SKILL_KEY_ALIASES = Object.freeze({
  armor: Object.freeze({
    light: Object.freeze(["light"]),
    medium: Object.freeze(["medium"]),
    heavy: Object.freeze(["heavy"]),
    natural: Object.freeze(["natural"])
  })
});

/**
 * Convertit une valeur libre en id de preset compatible avec les clés i18n.
 *
 * La fonction :
 * - convertit en chaîne ;
 * - retire les accents ;
 * - remplace les caractères non alphanumériques par `_` ;
 * - retire les `_` en début et fin ;
 * - passe en minuscules.
 *
 * Exemple :
 * `"Cuir clouté"` devient `"cuir_cloute"`.
 *
 * @param {unknown} value - Valeur brute.
 * @returns {string} Id normalisé.
 */
function slugifyPresetId(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

/**
 * Localise une clé i18n avec fallback.
 *
 * Foundry renvoie généralement la clé elle-même si aucune traduction n’existe.
 * Cette fonction détecte ce cas et retourne le fallback fourni.
 *
 * @param {string} key - Clé i18n à localiser.
 * @param {unknown} [fallback=""] - Valeur utilisée si la clé n’existe pas.
 * @returns {string} Texte localisé ou fallback.
 */
function localizeOrFallback(key, fallback = "") {
  const localized = game.i18n.localize(key);

  return localized === key
    ? String(fallback ?? "")
    : localized;
}

/**
 * Construit l’id i18n d’un preset.
 *
 * Le paramètre `itemType` est conservé pour garder une signature cohérente
 * avec les autres helpers de localisation, même s’il n’est pas utilisé ici.
 *
 * @param {string} itemType - Type d’item.
 * @param {unknown} value - Base ou nom de preset.
 * @returns {string} Id de preset normalisé.
 */
export function getPresetId(itemType, value) {
  return slugifyPresetId(value);
}

/**
 * Localise le nom d’un preset.
 *
 * La clé attendue suit le format :
 *
 * ```txt
 * ETERN.<ITEM_TYPE>.PRESETS.<PRESET_ID>.NAME
 * ```
 *
 * Exemple :
 *
 * ```txt
 * ETERN.WEAPON.PRESETS.LONGSWORD.NAME
 * ```
 *
 * @param {string} itemType - Type d’item : weapon, armor, shield, etc.
 * @param {string} baseName - Base du preset.
 * @param {unknown} [fallback=""] - Fallback si la traduction est absente.
 * @returns {string} Nom localisé du preset.
 */
export function localizePresetName(itemType, baseName, fallback = "") {
  const presetId = getPresetId(itemType, baseName);
  const type = String(itemType ?? "").toUpperCase();

  return localizeOrFallback(
    `ETERN.${type}.PRESETS.${presetId}.NAME`,
    fallback || baseName
  );
}

/**
 * Localise la description d’un preset.
 *
 * La clé attendue suit le format :
 *
 * ```txt
 * ETERN.<ITEM_TYPE>.PRESETS.<PRESET_ID>.DESCRIPTION
 * ```
 *
 * @param {string} itemType - Type d’item.
 * @param {string} baseName - Base du preset.
 * @param {unknown} [fallback=""] - Fallback si la traduction est absente.
 * @returns {string} Description localisée du preset.
 */
export function localizePresetDescription(itemType, baseName, fallback = "") {
  const presetId = getPresetId(itemType, baseName);
  const type = String(itemType ?? "").toUpperCase();

  return localizeOrFallback(
    `ETERN.${type}.PRESETS.${presetId}.DESCRIPTION`,
    fallback
  );
}

/**
 * Localise une compétence liée à un preset.
 *
 * Les clés attendues suivent le format :
 *
 * ```txt
 * ETERN.<ITEM_TYPE>.PRESETS.<PRESET_ID>.SKILLS.<N>.NAME
 * ETERN.<ITEM_TYPE>.PRESETS.<PRESET_ID>.SKILLS.<N>.DESCRIPTION
 * ```
 *
 * L’index reçu est en base 0.
 * La clé i18n utilise un numéro en base 1.
 *
 * @param {string} itemType - Type d’item.
 * @param {string} baseName - Base du preset.
 * @param {number} index - Index de compétence en base 0.
 * @param {unknown} [fallbackName=""] - Nom de fallback.
 * @param {unknown} [fallbackDescription=""] - Description de fallback.
 * @returns {{name: string, description: string}} Compétence localisée.
 */
export function localizePresetSkill(
  itemType,
  baseName,
  index,
  fallbackName = "",
  fallbackDescription = ""
) {
  const presetId = getPresetId(itemType, baseName);
  const type = String(itemType ?? "").toUpperCase();
  const skillNumber = Number(index) + 1;
  const prefix = `ETERN.${type}.PRESETS.${presetId}.SKILLS.${skillNumber}`;

  return {
    name: localizeOrFallback(`${prefix}.NAME`, fallbackName),
    description: localizeOrFallback(`${prefix}.DESCRIPTION`, fallbackDescription)
  };
}

/**
 * Localise une compétence liée à une catégorie.
 *
 * Utilisé notamment pour les compétences d’armure par catégorie :
 * - light ;
 * - medium ;
 * - heavy ;
 * - natural.
 *
 * Les clés attendues suivent le format :
 *
 * ```txt
 * ETERN.<ITEM_TYPE>.SKILL.PRESETS.<CATEGORY>.NAME
 * ETERN.<ITEM_TYPE>.SKILL.PRESETS.<CATEGORY>.DESCRIPTION
 * ```
 *
 * Le système d’alias permet d’accepter plusieurs ids de catégorie si nécessaire.
 *
 * @param {string} itemType - Type d’item.
 * @param {string} category - Catégorie à localiser.
 * @param {unknown} [fallbackName=""] - Nom de fallback.
 * @param {unknown} [fallbackDescription=""] - Description de fallback.
 * @returns {{name: string, description: string}} Compétence de catégorie localisée.
 */
export function localizeCategorySkill(
  itemType,
  category,
  fallbackName = "",
  fallbackDescription = ""
) {
  const type = String(itemType ?? "").toLowerCase();
  const typeKey = type.toUpperCase();
  const categoryId = slugifyPresetId(category);
  const aliases = CATEGORY_SKILL_KEY_ALIASES[type]?.[categoryId] ?? [categoryId];

  for (const alias of aliases) {
    const prefix = `ETERN.${typeKey}.SKILL.PRESETS.${alias}`;
    const nameKey = `${prefix}.NAME`;
    const descriptionKey = `${prefix}.DESCRIPTION`;

    const localizedName = game.i18n.localize(nameKey);
    const localizedDescription = game.i18n.localize(descriptionKey);

    const hasName = localizedName !== nameKey;
    const hasDescription = localizedDescription !== descriptionKey;

    if (hasName || hasDescription) {
      return {
        name: hasName ? localizedName : String(fallbackName ?? ""),
        description: hasDescription ? localizedDescription : String(fallbackDescription ?? "")
      };
    }
  }

  return {
    name: String(fallbackName ?? ""),
    description: String(fallbackDescription ?? "")
  };
}