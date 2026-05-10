/**
 * Constantes et presets liés aux armes du système Etername.
 *
 * Responsabilités :
 * - déclarer les catégories d’armes disponibles ;
 * - déclarer les tags applicables aux armes ;
 * - associer les tags à leurs clés i18n ;
 * - lister les bases d’armes disponibles par catégorie ;
 * - définir les presets d’armes créables rapidement depuis l’interface ;
 * - normaliser la structure des presets pour éviter la répétition.
 *
 * Ce fichier doit rester un fichier de données système stables.
 * Les calculs d’attaque, de précision, de dégâts ou de portée doivent rester dans les règles dédiées.
 */

export const WEAPON_CATEGORIES = {
  natural: "ETERN.WEAPON.CATEGORY.NATURAL",
  sidearm: "ETERN.WEAPON.CATEGORY.SIDEARM",
  wooden: "ETERN.WEAPON.CATEGORY.WOODEN",
  mechanical: "ETERN.WEAPON.CATEGORY.MECHANICAL"
};

export const WEAPON_TAG_KEYS = [
  "oneHand",
  "twoHands",
  "versatile",
  "finesse",
  "light",
  "heavy",
  "short",
  "reach",
  "throw",
  "powerful",
  "range",
  "ammo",
  "powder",
  "temporary",
  "mount",
  "boomerang",
  "reload",
  "concealed"
];

export const WEAPON_TAG_LABELS = {
  oneHand: "ETERN.WEAPON.TAGS.ONE_HAND",
  twoHands: "ETERN.WEAPON.TAGS.TWO_HANDS",
  versatile: "ETERN.WEAPON.TAGS.VERSATILE",
  finesse: "ETERN.WEAPON.TAGS.FINESSE",
  light: "ETERN.WEAPON.TAGS.LIGHT",
  heavy: "ETERN.WEAPON.TAGS.HEAVY",
  short: "ETERN.WEAPON.TAGS.SHORT",
  reach: "ETERN.WEAPON.TAGS.REACH",
  throw: "ETERN.WEAPON.TAGS.THROW",
  powerful: "ETERN.WEAPON.TAGS.POWERFUL",
  range: "ETERN.WEAPON.TAGS.RANGE",
  ammo: "ETERN.WEAPON.TAGS.AMMO",
  powder: "ETERN.WEAPON.TAGS.POWDER",
  temporary: "ETERN.WEAPON.TAGS.TEMPORARY",
  mount: "ETERN.WEAPON.TAGS.MOUNT",
  boomerang: "ETERN.WEAPON.TAGS.BOOMERANG",
  reload: "ETERN.WEAPON.TAGS.RELOAD",
  concealed: "ETERN.WEAPON.TAGS.CONCEALED"
};

export const WEAPON_BASES = {
  natural: [
    "unarmed",
    "fang",
    "claw_or_talon",
    "horn",
    "tail",
    "stinger",
    "tentacle"
  ],

  sidearm: [
    "dagger",
    "short_sword",
    "longsword",
    "bastard_sword",
    "claymore",
    "mace",
    "battle_axe",
    "warhammer",
    "rapier",
    "great_axe",
    "spear",
    "whip",
    "katana",
    "chakram",
    "halberd",
    "scythe",
    "throwing_knife",
    "needles",
    "chain_sickle",
    "scepter"
  ],

  wooden: [
    "staff",
    "mage_staff",
    "javelin",
    "shortbow",
    "longbow",
    "war_bow",
    "wand",
    "blowgun",
    "sling",
    "boomerang"
  ],

  mechanical: [
    "hand_crossbow",
    "light_crossbow",
    "heavy_crossbow",
    "pistol",
    "arquebus",
    "culverin_c"
  ]
};

/**
 * Crée les emplacements de compétences d’arme par défaut.
 *
 * Chaque arme possède actuellement trois emplacements de compétences.
 * Les compétences sont créées vides, puis pourront être complétées depuis la fiche.
 *
 * @param {number} [count=3] - Nombre d’emplacements de compétences à créer.
 * @returns {{name: string, description: string, learned: boolean}[]} Liste de compétences vides.
 */
function createEmptyWeaponSkills(count = 3) {
  return Array.from({ length: count }, () => ({
    name: "",
    description: "",
    learned: false
  }));
}

/**
 * Normalise la liste des tags d’un preset d’arme.
 *
 * La fonction :
 * - ignore les tags vides ;
 * - convertit chaque tag en chaîne ;
 * - supprime les doublons ;
 * - conserve seulement les tags déclarés dans `WEAPON_TAG_KEYS`.
 *
 * @param {unknown[]} [tags=[]] - Tags bruts du preset.
 * @returns {string[]} Tags valides et uniques.
 */
function normalizeWeaponTags(tags = []) {
  const validTags = new Set(WEAPON_TAG_KEYS);

  return Array.from(new Set(
    tags
      .map((tag) => String(tag ?? "").trim())
      .filter((tag) => tag && validTags.has(tag))
  ));
}

/**
 * Crée un preset d’arme dans un format commun.
 *
 * Cette fonction évite de répéter la même structure pour chaque arme.
 * Elle normalise les valeurs simples et injecte les compétences vides par défaut.
 *
 * @param {object} data - Données du preset.
 * @param {string} data.category - Catégorie canonique de l’arme.
 * @param {string} data.range - Portée de l’arme, par exemple `melee`, `9m`, `24m`.
 * @param {string} data.damage - Formule de dégâts.
 * @param {string} data.damageType - Type de dégâts canonique.
 * @param {string} data.precisionBase - Base de précision utilisée par l’arme.
 * @param {number|string} [data.precisionBonus=0] - Bonus fixe de précision.
 * @param {number|string} [data.weight=0] - Poids ou encombrement de l’arme.
 * @param {string[]} [data.tags=[]] - Tags de l’arme.
 * @returns {{
 *   category: string,
 *   range: string,
 *   damage: string,
 *   damageType: string,
 *   precisionBase: string,
 *   precisionBonus: number,
 *   weight: number,
 *   tags: string[],
 *   skills: {name: string, description: string, learned: boolean}[]
 * }} Preset d’arme normalisé.
 */
function createWeaponPreset({
  category,
  range,
  damage,
  damageType,
  precisionBase,
  precisionBonus = 0,
  weight = 0,
  tags = []
}) {
  return {
    category: String(category ?? ""),
    range: String(range ?? "melee"),
    damage: String(damage ?? ""),
    damageType: String(damageType ?? ""),
    precisionBase: String(precisionBase ?? "PRC"),
    precisionBonus: Number(precisionBonus ?? 0) || 0,
    weight: Number(weight ?? 0) || 0,
    tags: normalizeWeaponTags(tags),
    skills: createEmptyWeaponSkills()
  };
}

/**
 * Presets d’armes disponibles pour la création rapide.
 *
 * Chaque entrée représente une arme prédéfinie avec :
 * - sa catégorie ;
 * - sa portée ;
 * - sa formule de dégâts ;
 * - son type de dégâts ;
 * - sa base de précision ;
 * - son bonus de précision ;
 * - son poids ;
 * - ses tags ;
 * - trois emplacements de compétences vides.
 *
 * Les clés des presets restent en anglais pour conserver une nomenclature interne stable.
 * Les noms affichés doivent passer par l’i18n ailleurs dans l’interface.
 */
export const WEAPON_PRESETS = {
  unarmed: createWeaponPreset({
    category: "natural",
    range: "melee",
    damage: "1d6",
    damageType: "bludgeoning",
    precisionBase: "PRC",
    weight: 0.3,
    tags: ["temporary"]
  }),

  fang: createWeaponPreset({
    category: "natural",
    range: "melee",
    damage: "4d6",
    damageType: "piercing",
    precisionBase: "PRC",
    weight: 0.3
  }),

  claw_or_talon: createWeaponPreset({
    category: "natural",
    range: "melee",
    damage: "HAB/2 d6",
    damageType: "slashing",
    precisionBase: "PRC",
    weight: 0.3,
    tags: ["finesse"]
  }),

  horn: createWeaponPreset({
    category: "natural",
    range: "melee",
    damage: "4d6",
    damageType: "piercing",
    precisionBase: "PRC",
    weight: 0.3
  }),

  tail: createWeaponPreset({
    category: "natural",
    range: "melee",
    damage: "AGI/2 d6",
    damageType: "bludgeoning",
    precisionBase: "PRC",
    weight: 0.3,
    tags: ["temporary"]
  }),

  stinger: createWeaponPreset({
    category: "natural",
    range: "melee",
    damage: "4d6",
    damageType: "piercing",
    precisionBase: "PRC",
    weight: 0.3
  }),

  tentacle: createWeaponPreset({
    category: "natural",
    range: "melee",
    damage: "FOR/2 d6",
    damageType: "bludgeoning",
    precisionBase: "PRC",
    weight: 0.3,
    tags: ["temporary"]
  }),

  dagger: createWeaponPreset({
    category: "sidearm",
    range: "melee",
    damage: "3d6",
    damageType: "slashing",
    precisionBase: "PRC",
    weight: 0.3,
    tags: ["oneHand", "finesse", "short", "light"]
  }),

  short_sword: createWeaponPreset({
    category: "sidearm",
    range: "melee",
    damage: "FOR/2 d6",
    damageType: "slashing",
    precisionBase: "PRC",
    weight: 1,
    tags: ["oneHand", "light"]
  }),

  longsword: createWeaponPreset({
    category: "sidearm",
    range: "melee",
    damage: "FOR/2 d6",
    damageType: "slashing",
    precisionBase: "PRC",
    weight: 2,
    tags: ["versatile", "heavy", "reach"]
  }),

  bastard_sword: createWeaponPreset({
    category: "sidearm",
    range: "melee",
    damage: "FOR/2 d6",
    damageType: "slashing",
    precisionBase: "PRC",
    weight: 2,
    tags: ["versatile", "heavy"]
  }),

  claymore: createWeaponPreset({
    category: "sidearm",
    range: "melee",
    damage: "FOR/2 d6",
    damageType: "slashing",
    precisionBase: "PRC",
    weight: 2,
    tags: ["twoHands", "reach"]
  }),

  mace: createWeaponPreset({
    category: "sidearm",
    range: "melee",
    damage: "FOR/2 d6",
    damageType: "bludgeoning",
    precisionBase: "PRC",
    weight: 1,
    tags: ["oneHand", "heavy", "powerful", "temporary"]
  }),

  battle_axe: createWeaponPreset({
    category: "sidearm",
    range: "melee",
    damage: "FOR d6",
    damageType: "slashing",
    precisionBase: "PRC",
    weight: 2,
    tags: ["oneHand", "heavy"]
  }),

  warhammer: createWeaponPreset({
    category: "sidearm",
    range: "melee",
    damage: "FOR d6",
    damageType: "bludgeoning",
    precisionBase: "PRC",
    weight: 2,
    tags: ["twoHands", "heavy", "powerful"]
  }),

  rapier: createWeaponPreset({
    category: "sidearm",
    range: "melee",
    damage: "HAB/2",
    damageType: "slashing",
    precisionBase: "PRC",
    weight: 1,
    tags: ["oneHand", "finesse", "light"]
  }),

  great_axe: createWeaponPreset({
    category: "sidearm",
    range: "melee",
    damage: "FOR/2 d6",
    damageType: "slashing",
    precisionBase: "PRC",
    weight: 2,
    tags: ["twoHands", "heavy", "reach"]
  }),

  spear: createWeaponPreset({
    category: "sidearm",
    range: "melee",
    damage: "3d6",
    damageType: "piercing",
    precisionBase: "PRC",
    weight: 2,
    tags: ["oneHand", "heavy", "reach"]
  }),

  whip: createWeaponPreset({
    category: "sidearm",
    range: "9m",
    damage: "FOR/2 d6",
    damageType: "bludgeoning",
    precisionBase: "PRD",
    weight: 1,
    tags: ["twoHands", "range"]
  }),

  katana: createWeaponPreset({
    category: "sidearm",
    range: "melee",
    damage: "5d6",
    damageType: "slashing",
    precisionBase: "PRC",
    weight: 2,
    tags: ["twoHands"]
  }),

  chakram: createWeaponPreset({
    category: "sidearm",
    range: "9m",
    damage: "FOR/2 d6",
    damageType: "slashing",
    precisionBase: "PRD",
    weight: 1,
    tags: ["oneHand", "light", "finesse", "throw"]
  }),

  halberd: createWeaponPreset({
    category: "sidearm",
    range: "melee",
    damage: "FOR/2 d6",
    damageType: "slashing",
    precisionBase: "PRC",
    weight: 2,
    tags: ["twoHands", "reach"]
  }),

  scythe: createWeaponPreset({
    category: "sidearm",
    range: "melee",
    damage: "FOR/2 d6",
    damageType: "slashing",
    precisionBase: "PRC",
    weight: 2,
    tags: ["twoHands"]
  }),

  throwing_knife: createWeaponPreset({
    category: "sidearm",
    range: "6m",
    damage: "3d6",
    damageType: "piercing",
    precisionBase: "PRD",
    weight: 0.3,
    tags: ["oneHand", "finesse", "throw"]
  }),

  needles: createWeaponPreset({
    category: "sidearm",
    range: "18m",
    damage: "1d6",
    damageType: "piercing",
    precisionBase: "PRD",
    weight: 0.3,
    tags: ["oneHand", "finesse", "throw", "concealed"]
  }),

  chain_sickle: createWeaponPreset({
    category: "sidearm",
    range: "6m",
    damage: "HAB/2 d6",
    damageType: "slashing",
    precisionBase: "PRD",
    weight: 1,
    tags: ["twoHands", "finesse", "range"]
  }),

  scepter: createWeaponPreset({
    category: "sidearm",
    range: "melee",
    damage: "3d6",
    damageType: "bludgeoning",
    precisionBase: "PRC",
    weight: 1,
    tags: ["oneHand", "heavy", "temporary"]
  }),

  staff: createWeaponPreset({
    category: "wooden",
    range: "melee",
    damage: "FOR/2 d6",
    damageType: "bludgeoning",
    precisionBase: "PRC",
    weight: 1,
    tags: ["oneHand", "temporary"]
  }),

  mage_staff: createWeaponPreset({
    category: "wooden",
    range: "melee",
    damage: "FOR/2 d6",
    damageType: "bludgeoning",
    precisionBase: "PRM",
    weight: 1,
    tags: ["oneHand", "temporary"]
  }),

  javelin: createWeaponPreset({
    category: "wooden",
    range: "18m",
    damage: "FOR/2 d6",
    damageType: "piercing",
    precisionBase: "PRD",
    weight: 1,
    tags: ["oneHand", "throw"]
  }),

  shortbow: createWeaponPreset({
    category: "wooden",
    range: "24m",
    damage: "PER/2 d6",
    damageType: "piercing",
    precisionBase: "PRD",
    weight: 1,
    tags: ["twoHands", "range", "ammo"]
  }),

  longbow: createWeaponPreset({
    category: "wooden",
    range: "36m",
    damage: "PER/2 d6",
    damageType: "piercing",
    precisionBase: "PRD",
    weight: 2,
    tags: ["twoHands", "range", "ammo"]
  }),

  war_bow: createWeaponPreset({
    category: "wooden",
    range: "45m",
    damage: "FOR/2 d6",
    damageType: "piercing",
    precisionBase: "PRD",
    weight: 2,
    tags: ["twoHands", "range", "ammo"]
  }),

  wand: createWeaponPreset({
    category: "wooden",
    range: "melee",
    damage: "MAG/2 d6",
    damageType: "magic",
    precisionBase: "PRM",
    weight: 0.3,
    tags: ["oneHand", "light"]
  }),

  blowgun: createWeaponPreset({
    category: "wooden",
    range: "18m",
    damage: "3d6",
    damageType: "piercing",
    precisionBase: "PRD",
    weight: 0.3,
    tags: ["twoHands", "range", "ammo"]
  }),

  sling: createWeaponPreset({
    category: "wooden",
    range: "24m",
    damage: "FOR/2 d6",
    damageType: "bludgeoning",
    precisionBase: "PRD",
    weight: 0.3,
    tags: ["oneHand", "range", "ammo", "temporary"]
  }),

  boomerang: createWeaponPreset({
    category: "wooden",
    range: "36m",
    damage: "FOR/2 d6",
    damageType: "bludgeoning",
    precisionBase: "PRD",
    weight: 0.3,
    tags: ["oneHand", "throw", "temporary", "boomerang"]
  }),

  hand_crossbow: createWeaponPreset({
    category: "mechanical",
    range: "24m",
    damage: "3d6",
    damageType: "piercing",
    precisionBase: "PRD",
    weight: 1,
    tags: ["oneHand", "range", "light", "ammo", "reload"]
  }),

  light_crossbow: createWeaponPreset({
    category: "mechanical",
    range: "36m",
    damage: "5d6",
    damageType: "piercing",
    precisionBase: "PRD",
    weight: 2,
    tags: ["twoHands", "range", "ammo", "reload"]
  }),

  heavy_crossbow: createWeaponPreset({
    category: "mechanical",
    range: "45m",
    damage: "6d6",
    damageType: "piercing",
    precisionBase: "PRD",
    weight: 2,
    tags: ["twoHands", "range", "ammo", "reload"]
  }),

  pistol: createWeaponPreset({
    category: "mechanical",
    range: "36m",
    damage: "4d6",
    damageType: "piercing",
    precisionBase: "PRD",
    weight: 1,
    tags: ["oneHand", "range", "light", "powder", "ammo", "reload"]
  }),

  arquebus: createWeaponPreset({
    category: "mechanical",
    range: "45m",
    damage: "8d6",
    damageType: "piercing",
    precisionBase: "PRD",
    weight: 2,
    tags: ["twoHands", "range", "ammo", "powder", "reload"]
  }),

  culverin_c: createWeaponPreset({
    category: "mechanical",
    range: "60m",
    damage: "12d6",
    damageType: "fire",
    precisionBase: "PRD",
    weight: 2,
    tags: ["twoHands", "range", "ammo", "powder", "reload"]
  })
};