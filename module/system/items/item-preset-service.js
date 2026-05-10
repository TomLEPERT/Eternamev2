/**
 * Service d’application des presets d’équipement.
 *
 * Responsabilités :
 * - résoudre un preset d’item depuis son type et sa base ;
 * - créer un snapshot d’item après application d’un preset ;
 * - appliquer les données d’un preset sur un item existant ;
 * - construire les données système finales d’une arme, armure ou bouclier ;
 * - préserver les champs personnalisés lors d’un changement de preset ;
 * - localiser les descriptions et compétences fournies par les presets.
 *
 * Ce fichier doit rester dédié à la transformation des données d’item.
 * Il ne doit pas gérer le rendu de fiche, les événements DOM, les jets ou l’application
 * des bonus en jeu.
 */

import {
  localizeCategorySkill,
  localizePresetDescription,
  localizePresetName,
  localizePresetSkill
} from "../i18n/preset-localization.js";

import {
  normalizeDamageType,
  normalizeRange
} from "../nomenclature.js";

import { ITEM_SAVE_KEYS } from "../constants/save-keys.js";
import { resolvePresetBaseId } from "./preset-id-mapping.js";

import {
  getDefaultBaseForItemType,
  getDefaultCategoryForItemType,
  getItemPreset,
  getItemPresetConfig
} from "./preset-registry.js";

/**
 * Résout un preset d’item.
 *
 * La fonction récupère :
 * - la configuration du type d’item ;
 * - la base canonique du preset ;
 * - le preset cloné correspondant.
 *
 * @param {string} type - Type d’item : weapon, armor ou shield.
 * @param {string} baseName - Base de preset demandée.
 * @returns {{config: object, baseName: string, preset: object|null}|null} Preset résolu, ou `null`.
 */
export function getResolvedItemPreset(type, baseName) {
  const config = getItemPresetConfig(type);

  if (!config) return null;

  const defaultBase = getDefaultBaseForItemType(type) ?? "";
  const resolvedBaseName = resolvePresetBaseId(type, baseName, defaultBase);

  return {
    config,
    baseName: resolvedBaseName,
    preset: getItemPreset(type, resolvedBaseName)
  };
}

/**
 * Crée un snapshot d’item après application d’un preset.
 *
 * Cette fonction permet de construire les données finales sans modifier directement
 * l’item d’origine.
 *
 * @param {string} type - Type d’item.
 * @param {string} baseName - Base de preset à appliquer.
 * @param {object} [seed={}] - Données initiales utilisées comme point de départ.
 * @returns {{name: string, img: string, system: object, preset: object|null}|null} Snapshot d’item.
 */
export function createPresetItemSnapshot(type, baseName, seed = {}) {
  const itemData = applyItemPreset(
    type,
    {
      name: String(seed.name ?? ""),
      type,
      img: seed.img,
      system: foundry.utils.deepClone(seed.system ?? {})
    },
    baseName
  );

  if (!itemData) return null;

  const resolved = getResolvedItemPreset(type, itemData.system?.base ?? baseName);

  return {
    name: itemData.name,
    img: itemData.img,
    system: foundry.utils.deepClone(itemData.system ?? {}),
    preset: foundry.utils.deepClone(resolved?.preset ?? null)
  };
}

/**
 * Applique un preset à des données d’item.
 *
 * La fonction :
 * - résout la base de preset ;
 * - clone les données système existantes ;
 * - applique les valeurs du preset ;
 * - remplace le nom par le nom localisé du preset ;
 * - garantit une image valide.
 *
 * @param {string} type - Type d’item.
 * @param {object} itemData - Données d’item à transformer.
 * @param {string} baseName - Base de preset à appliquer.
 * @returns {object} Données d’item transformées.
 */
export function applyItemPreset(type, itemData, baseName) {
  const resolved = getResolvedItemPreset(type, baseName);

  if (!resolved?.config) return itemData;

  const nextItem = {
    ...itemData,
    type,
    name: itemData?.name,
    img: itemData?.img,
    system: foundry.utils.deepClone(itemData?.system ?? {})
  };

  nextItem.system = buildPresetSystemData(
    type,
    resolved.baseName,
    nextItem.system,
    resolved.preset
  );

  nextItem.name = localizePresetName(type, resolved.baseName, resolved.baseName);
  nextItem.img = String(nextItem.img ?? resolved.config.defaultImage ?? "icons/svg/item-bag.svg");

  return nextItem;
}

/**
 * Construit les données système finales après application d’un preset.
 *
 * Cette fonction applique :
 * - les champs communs à tous les items ;
 * - la base et la catégorie ;
 * - les champs propres aux armures, boucliers ou armes ;
 * - l’état partagé final.
 *
 * @param {string} type - Type d’item.
 * @param {string} baseName - Base de preset.
 * @param {object} [currentSystem={}] - Données système actuelles.
 * @param {object|null} [presetOverride=null] - Preset déjà résolu, si disponible.
 * @returns {object} Données système finales.
 */
export function buildPresetSystemData(
  type,
  baseName,
  currentSystem = {},
  presetOverride = null
) {
  const resolved = getResolvedItemPreset(type, baseName);
  const preset = presetOverride
    ? foundry.utils.deepClone(presetOverride)
    : foundry.utils.deepClone(resolved?.preset ?? null);

  const config = resolved?.config;

  if (!config) {
    return foundry.utils.deepClone(currentSystem ?? {});
  }

  const system = foundry.utils.deepClone(currentSystem ?? {});

  applySharedItemDefaults(system);

  system.base = resolved.baseName;
  system.category = config.normalizeCategory?.(
    preset?.category ?? system.category ?? config.defaultCategory,
    config.defaultCategory
  ) ?? String(preset?.category ?? system.category ?? config.defaultCategory ?? "");

  if (type === "armor") {
    applyArmorPresetSystemData(system, resolved.baseName, preset, config);
  } else if (type === "shield") {
    applyShieldPresetSystemData(system, resolved.baseName, preset);
  } else if (type === "weapon") {
    applyWeaponPresetSystemData(system, resolved.baseName, preset);
  }

  applySharedItemDefaults(system);

  return system;
}

/**
 * Construit le payload d’update pour changer ou réappliquer un preset sur un item.
 *
 * En mode `preserve`, la fonction conserve les champs personnalisés :
 * - nom personnalisé ;
 * - description personnalisée ;
 * - compétences personnalisées ;
 * - tags d’arme personnalisés ;
 * - quantité, emplacement, équipement et enchantements.
 *
 * @param {Item} item - Item à mettre à jour.
 * @param {string} baseName - Base de preset à appliquer.
 * @param {object} [options={}] - Options de construction.
 * @param {string} [options.mode="preserve"] - Mode d’application.
 * @param {string|null} [options.category] - Catégorie forcée.
 * @param {boolean} [options.preserveName=true] - Conserve le nom personnalisé.
 * @returns {{name: string, img: string, system: object}} Payload d’update.
 */
export function buildPresetUpdatePayload(item, baseName, options = {}) {
  const mode = String(options.mode ?? "preserve");
  const currentSystem = foundry.utils.deepClone(item.system ?? {});
  const categoryOverride = options.category != null
    ? String(options.category)
    : null;

  if (categoryOverride !== null) {
    currentSystem.category = categoryOverride;
  }

  const snapshot = createPresetItemSnapshot(item.type, baseName, {
    name: item.name,
    img: item.img,
    system: currentSystem
  });

  if (!snapshot) {
    return {
      name: item.name,
      img: item.img,
      system: currentSystem
    };
  }

  if (categoryOverride !== null) {
    snapshot.system.category = categoryOverride;
  }

  if (mode === "preserve") {
    preserveCustomFields(item.type, snapshot, currentSystem, item.name, {
      preserveName: options.preserveName !== false
    });
  }

  return {
    name: snapshot.name,
    img: snapshot.img,
    system: snapshot.system
  };
}

/**
 * Détermine si un texte courant doit être remplacé par le texte localisé du preset.
 *
 * Le remplacement est autorisé si :
 * - le texte courant est vide ;
 * - le texte courant correspond encore au texte brut du preset.
 *
 * @param {unknown} currentValue - Valeur actuellement stockée.
 * @param {unknown} presetValue - Valeur brute du preset.
 * @returns {boolean} `true` si le texte peut être remplacé.
 */
export function shouldReplacePresetText(currentValue, presetValue) {
  const current = String(currentValue ?? "");
  const preset = String(presetValue ?? "");

  return !current || current === preset;
}

/**
 * Construit la compétence localisée liée à une catégorie d’armure.
 *
 * @param {string} category - Catégorie d’armure.
 * @returns {{name: string, description: string}} Compétence localisée.
 */
export function buildLocalizedArmorSkill(category) {
  const config = getItemPresetConfig("armor");
  const defaultCategory = getDefaultCategoryForItemType("armor");

  const normalizedCategory = config?.normalizeCategory?.(
    category ?? defaultCategory,
    defaultCategory
  ) ?? defaultCategory;

  const skillPreset = config?.skillPresets?.[normalizedCategory]
    ?? config?.skillPresets?.natural
    ?? { name: "", description: "" };

  return localizeCategorySkill(
    "armor",
    normalizedCategory,
    skillPreset.name,
    skillPreset.description
  );
}

/**
 * Construit la compétence localisée d’un bouclier.
 *
 * @param {string} baseName - Base de bouclier.
 * @param {object|null} [preset=null] - Preset déjà résolu.
 * @returns {{name: string, description: string}} Compétence localisée.
 */
export function buildLocalizedShieldSkill(baseName, preset = null) {
  const resolved = getResolvedItemPreset("shield", baseName);
  const sourcePreset = preset ?? resolved?.preset ?? {};

  return localizePresetSkill(
    "shield",
    resolved?.baseName ?? String(baseName ?? ""),
    0,
    String(sourcePreset.skill?.name ?? ""),
    String(sourcePreset.skill?.description ?? "")
  );
}

/**
 * Construit les compétences localisées d’une arme.
 *
 * Si des compétences courantes existent, elles sont utilisées comme base.
 * Sinon, les compétences du preset sont utilisées.
 *
 * Les textes sont remplacés seulement s’ils ne semblent pas personnalisés.
 *
 * @param {string} baseName - Base d’arme.
 * @param {Array<object>|null} currentSkills - Compétences actuellement stockées.
 * @param {Array<object>} presetSkills - Compétences du preset.
 * @returns {object[]} Compétences localisées.
 */
export function buildLocalizedWeaponSkills(baseName, currentSkills, presetSkills) {
  const sourceSkills = Array.isArray(currentSkills) && currentSkills.length
    ? currentSkills.slice(0, 3)
    : foundry.utils.deepClone(presetSkills ?? []);

  return sourceSkills.map((skill, index) => {
    const presetSkill = presetSkills?.[index] ?? {};

    const localizedSkill = localizePresetSkill(
      "weapon",
      String(baseName ?? ""),
      index,
      String(presetSkill?.name ?? skill?.name ?? ""),
      String(presetSkill?.description ?? skill?.description ?? "")
    );

    return {
      ...skill,
      name: shouldReplacePresetText(skill?.name, presetSkill?.name)
        ? localizedSkill.name
        : String(skill?.name ?? localizedSkill.name ?? ""),
      description: shouldReplacePresetText(skill?.description, presetSkill?.description)
        ? localizedSkill.description
        : String(skill?.description ?? localizedSkill.description ?? "")
    };
  });
}

/**
 * Applique les données de preset propres aux armures.
 *
 * @param {object} system - Données système à modifier.
 * @param {string} baseName - Base du preset.
 * @param {object} preset - Preset d’armure.
 * @param {object} config - Configuration du registre d’armure.
 * @returns {void}
 */
function applyArmorPresetSystemData(system, baseName, preset, config) {
  system.defFormula = String(preset?.defFormula ?? system.defFormula ?? "2 + AGI/2");
  system.defBonus = toFiniteNumber(preset?.defBonus ?? system.defBonus, 0);
  system.weight = toFiniteNumber(preset?.weight ?? system.weight, 1);
  system.saves = normalizeSaves(null, preset?.saves ?? []);

  const localizedSkill = buildLocalizedArmorSkill(system.category ?? config.defaultCategory);

  system.skill = {
    name: String(localizedSkill.name ?? ""),
    description: String(localizedSkill.description ?? "")
  };

  system.description = localizePresetDescription(
    "armor",
    baseName,
    preset?.description ?? ""
  );
}

/**
 * Applique les données de preset propres aux boucliers.
 *
 * @param {object} system - Données système à modifier.
 * @param {string} baseName - Base du preset.
 * @param {object} preset - Preset de bouclier.
 * @returns {void}
 */
function applyShieldPresetSystemData(system, baseName, preset) {
  system.defBonus = toFiniteNumber(preset?.defBonus ?? system.defBonus ?? system.defense, 0);
  system.defense = system.defBonus;
  system.weight = toFiniteNumber(preset?.weight ?? system.weight, 2);
  system.saves = normalizeSaves(null, preset?.saves ?? []);

  const localizedSkill = buildLocalizedShieldSkill(baseName, preset);

  system.skill = {
    name: String(localizedSkill.name ?? ""),
    description: String(localizedSkill.description ?? "")
  };

  system.description = localizePresetDescription(
    "shield",
    baseName,
    String(preset?.description ?? "")
  );
}

/**
 * Applique les données de preset propres aux armes.
 *
 * @param {object} system - Données système à modifier.
 * @param {string} baseName - Base du preset.
 * @param {object} preset - Preset d’arme.
 * @returns {void}
 */
function applyWeaponPresetSystemData(system, baseName, preset) {
  system.range = normalizeRange(preset?.range ?? system.range ?? "melee");
  system.damage = String(preset?.damage ?? system.damage ?? "1d6");
  system.damageType = normalizeDamageType(
    preset?.damageType ?? system.damageType ?? "bludgeoning"
  );
  system.precisionBase = String(preset?.precisionBase ?? system.precisionBase ?? "PRC").toUpperCase();
  system.precisionBonus = toFiniteNumber(preset?.precisionBonus ?? system.precisionBonus, 0);
  system.weight = toFiniteNumber(preset?.weight ?? system.weight, 1);
  system.tags = Array.isArray(preset?.tags)
    ? Array.from(preset.tags)
    : Array.from(system.tags ?? []);

  system.skills = buildLocalizedWeaponSkills(baseName, null, preset?.skills ?? []);

  while (system.skills.length < 3) {
    system.skills.push({
      name: "",
      description: "",
      learned: false
    });
  }

  system.description = localizePresetDescription(
    "weapon",
    baseName,
    String(preset?.description ?? "")
  );
}

/**
 * Applique les champs communs à tous les items de preset.
 *
 * Cette fonction est appelée avant et après l’application spécifique du preset
 * afin de garantir une structure finale stable.
 *
 * @param {object} system - Données système à normaliser.
 * @returns {void}
 */
function applySharedItemDefaults(system) {
  system.quantity = Math.max(1, Math.floor(Number(system.quantity ?? 1) || 1));
  system.location = String(system.location ?? "backpack");
  system.description = String(system.description ?? "");
  system.equipped = Boolean(system.equipped);

  system.weight = toFiniteNumber(system.weight, 1);
}

/**
 * Normalise les sauvegardes d’un item.
 *
 * La fonction accepte :
 * - un tableau `{ key, value }` ou `{ type, value }` ;
 * - un objet `{ armor: 2, fire: 1 }`.
 *
 * Les sauvegardes absentes reviennent à 0.
 *
 * @param {Array<object>|object|null} currentSaves - Sauvegardes actuelles prioritaires.
 * @param {Array<object>|object} fallbackSaves - Sauvegardes de fallback, généralement celles du preset.
 * @returns {Record<string, number>} Sauvegardes normalisées.
 */
function normalizeSaves(currentSaves, fallbackSaves) {
  const result = Object.fromEntries(
    ITEM_SAVE_KEYS.map((key) => [key, 0])
  );

  applySaveValues(result, fallbackSaves);
  applySaveValues(result, currentSaves);

  return result;
}

/**
 * Applique des valeurs de sauvegarde dans une table cible.
 *
 * @param {Record<string, number>} target - Table de sauvegardes à modifier.
 * @param {Array<object>|object|null} saves - Sauvegardes à appliquer.
 * @returns {void}
 */
function applySaveValues(target, saves) {
  if (Array.isArray(saves)) {
    for (const entry of saves) {
      const key = String(entry?.key ?? entry?.type ?? "");

      if (!key || !(key in target)) continue;

      target[key] = toFiniteNumber(entry?.value, 0);
    }

    return;
  }

  if (saves && typeof saves === "object") {
    for (const key of Object.keys(target)) {
      if (!(key in saves)) continue;

      target[key] = toFiniteNumber(saves[key], target[key]);
    }
  }
}

/**
 * Préserve les champs personnalisés d’un item après application d’un preset.
 *
 * @param {string} itemType - Type d’item.
 * @param {object} snapshot - Snapshot généré par le preset.
 * @param {object} currentSystem - Données système actuelles.
 * @param {string} [currentName=""] - Nom actuel de l’item.
 * @param {object} [options={}] - Options de préservation.
 * @returns {void}
 */
function preserveCustomFields(
  itemType,
  snapshot,
  currentSystem,
  currentName = "",
  options = {}
) {
  if (options.preserveName !== false && shouldPreserveCustomName(itemType, currentName, currentSystem)) {
    snapshot.name = preserveString(currentName, snapshot.name);
  }

  snapshot.system.quantity = currentSystem.quantity ?? snapshot.system.quantity;
  snapshot.system.location = currentSystem.location ?? snapshot.system.location;
  snapshot.system.equipped = currentSystem.equipped ?? snapshot.system.equipped;
  snapshot.system.enchanting = foundry.utils.deepClone(
    currentSystem.enchanting ?? snapshot.system.enchanting
  );

  if (itemType === "armor") {
    preserveArmorCustomFields(snapshot, currentSystem);
    return;
  }

  if (itemType === "shield") {
    preserveShieldCustomFields(snapshot, currentSystem);
    return;
  }

  if (itemType === "weapon") {
    preserveWeaponCustomFields(snapshot, currentSystem);
  }
}

/**
 * Préserve les champs personnalisés d’une armure.
 *
 * @param {object} snapshot - Snapshot généré.
 * @param {object} currentSystem - Données système actuelles.
 * @returns {void}
 */
function preserveArmorCustomFields(snapshot, currentSystem) {
  if (shouldPreserveCustomDescription("armor", currentSystem.description, currentSystem.base)) {
    snapshot.system.description = preserveString(
      currentSystem.description,
      snapshot.system.description
    );
  }

  if (shouldPreserveCustomArmorSkill(currentSystem)) {
    snapshot.system.skill = {
      name: preserveString(currentSystem.skill?.name, snapshot.system.skill?.name),
      description: preserveString(
        currentSystem.skill?.description,
        snapshot.system.skill?.description
      )
    };
  }
}

/**
 * Préserve les champs personnalisés d’un bouclier.
 *
 * @param {object} snapshot - Snapshot généré.
 * @param {object} currentSystem - Données système actuelles.
 * @returns {void}
 */
function preserveShieldCustomFields(snapshot, currentSystem) {
  if (shouldPreserveCustomDescription("shield", currentSystem.description, currentSystem.base)) {
    snapshot.system.description = preserveString(
      currentSystem.description,
      snapshot.system.description
    );
  }

  if (shouldPreserveCustomShieldSkill(currentSystem)) {
    snapshot.system.skill = {
      name: preserveString(currentSystem.skill?.name, snapshot.system.skill?.name),
      description: preserveString(
        currentSystem.skill?.description,
        snapshot.system.skill?.description
      )
    };
  }
}

/**
 * Préserve les champs personnalisés d’une arme.
 *
 * @param {object} snapshot - Snapshot généré.
 * @param {object} currentSystem - Données système actuelles.
 * @returns {void}
 */
function preserveWeaponCustomFields(snapshot, currentSystem) {
  if (shouldPreserveCustomDescription("weapon", currentSystem.description, currentSystem.base)) {
    snapshot.system.description = preserveString(
      currentSystem.description,
      snapshot.system.description
    );
  }

  if (shouldPreserveCustomWeaponSkills(currentSystem)) {
    snapshot.system.skills = cloneArrayOrDefault(
      currentSystem.skills,
      snapshot.system.skills
    );
  }

  if (Array.isArray(currentSystem.tags)) {
    snapshot.system.tags = cloneArrayOrDefault(
      currentSystem.tags,
      snapshot.system.tags
    );
  }
}

/**
 * Détermine si le nom actuel est personnalisé.
 *
 * @param {string} itemType - Type d’item.
 * @param {string} currentName - Nom actuel.
 * @param {object} [currentSystem={}] - Données système actuelles.
 * @returns {boolean} `true` si le nom doit être préservé.
 */
function shouldPreserveCustomName(itemType, currentName, currentSystem = {}) {
  const name = String(currentName ?? "").trim();

  if (!name) return false;

  const baseName = String(currentSystem?.base ?? "");
  const localizedCurrent = baseName
    ? localizePresetName(itemType, baseName, baseName)
    : "";

  return name !== baseName && name !== localizedCurrent;
}

/**
 * Détermine si une description est personnalisée.
 *
 * @param {string} itemType - Type d’item.
 * @param {string} currentDescription - Description actuelle.
 * @param {string} baseName - Base actuelle.
 * @returns {boolean} `true` si la description doit être préservée.
 */
function shouldPreserveCustomDescription(itemType, currentDescription, baseName) {
  const current = String(currentDescription ?? "").trim();

  if (!current) return false;

  const localized = localizePresetDescription(
    itemType,
    String(baseName ?? ""),
    ""
  );

  return current !== localized;
}

/**
 * Détermine si la compétence d’armure actuelle est personnalisée.
 *
 * @param {object} [currentSystem={}] - Données système actuelles.
 * @returns {boolean} `true` si la compétence doit être préservée.
 */
function shouldPreserveCustomArmorSkill(currentSystem = {}) {
  const localized = buildLocalizedArmorSkill(
    currentSystem.category ?? getDefaultCategoryForItemType("armor")
  );

  return (
    String(currentSystem?.skill?.name ?? "").trim() !== String(localized.name ?? "").trim()
    || String(currentSystem?.skill?.description ?? "").trim() !== String(localized.description ?? "").trim()
  );
}

/**
 * Détermine si la compétence de bouclier actuelle est personnalisée.
 *
 * @param {object} [currentSystem={}] - Données système actuelles.
 * @returns {boolean} `true` si la compétence doit être préservée.
 */
function shouldPreserveCustomShieldSkill(currentSystem = {}) {
  const localized = buildLocalizedShieldSkill(
    currentSystem.base ?? getDefaultBaseForItemType("shield")
  );

  return (
    String(currentSystem?.skill?.name ?? "").trim() !== String(localized.name ?? "").trim()
    || String(currentSystem?.skill?.description ?? "").trim() !== String(localized.description ?? "").trim()
  );
}

/**
 * Détermine si au moins une compétence d’arme est personnalisée.
 *
 * @param {object} [currentSystem={}] - Données système actuelles.
 * @returns {boolean} `true` si les compétences doivent être préservées.
 */
function shouldPreserveCustomWeaponSkills(currentSystem = {}) {
  const baseName = String(currentSystem?.base ?? getDefaultBaseForItemType("weapon"));

  const localizedSkills = buildLocalizedWeaponSkills(
    baseName,
    null,
    getResolvedItemPreset("weapon", baseName)?.preset?.skills ?? []
  );

  const currentSkills = Array.isArray(currentSystem?.skills)
    ? currentSystem.skills
    : [];

  return currentSkills.some((skill, index) => {
    const localized = localizedSkills[index] ?? {};

    return (
      String(skill?.name ?? "").trim() !== String(localized.name ?? "").trim()
      || String(skill?.description ?? "").trim() !== String(localized.description ?? "").trim()
    );
  });
}

/**
 * Clone un tableau ou renvoie un fallback cloné.
 *
 * @param {unknown} value - Valeur à cloner.
 * @param {unknown} fallback - Fallback utilisé si `value` n’est pas un tableau.
 * @returns {Array} Tableau cloné.
 */
function cloneArrayOrDefault(value, fallback) {
  return Array.isArray(value)
    ? foundry.utils.deepClone(value)
    : foundry.utils.deepClone(fallback ?? []);
}

/**
 * Préserve une chaîne courante si elle n’est pas vide.
 *
 * @param {unknown} currentValue - Valeur actuelle.
 * @param {unknown} fallbackValue - Valeur de fallback.
 * @returns {string} Chaîne préservée ou fallback.
 */
function preserveString(currentValue, fallbackValue) {
  const current = String(currentValue ?? "");

  return current.trim()
    ? current
    : String(fallbackValue ?? "");
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