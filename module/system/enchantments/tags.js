/**
 * Gestion des tags d’enchantement.
 *
 * Responsabilités :
 * - déclarer les clés i18n des tags d’enchantement ;
 * - fournir des alias français et anglais pour les tags ;
 * - normaliser une valeur libre en tag canonique ;
 * - localiser le libellé affiché d’un tag ;
 * - construire des pills de tags uniques pour l’interface.
 *
 * Ce fichier doit rester dédié aux tags d’enchantement.
 * Il ne doit pas contenir la logique de création d’enchantement,
 * d’application des bonus ou de rendu DOM.
 */

export const ENCHANTMENT_TAG_LABEL_KEYS = Object.freeze({
  acid: "ETERN.ENCHANTING.TAGS.ACID",
  attack: "ETERN.ENCHANTING.TAGS.ATTACK",
  attribute: "ETERN.ENCHANTING.TAGS.ATTRIBUTE",
  combat: "ETERN.ENCHANTING.TAGS.COMBAT",
  consumable: "ETERN.ENCHANTING.TAGS.CONSUMABLE",
  damage: "ETERN.ENCHANTING.TAGS.DAMAGE",
  defense: "ETERN.ENCHANTING.TAGS.DEFENSE",
  earth: "ETERN.ENCHANTING.TAGS.EARTH",
  enemy: "ETERN.ENCHANTING.TAGS.ENEMY",
  environment: "ETERN.ENCHANTING.TAGS.ENVIRONMENT",
  fire: "ETERN.ENCHANTING.TAGS.FIRE",
  ice: "ETERN.ENCHANTING.TAGS.ICE",
  life: "ETERN.ENCHANTING.TAGS.LIFE",
  lightning: "ETERN.ENCHANTING.TAGS.LIGHTNING",
  magic: "ETERN.ENCHANTING.TAGS.MAGIC",
  meta: "ETERN.ENCHANTING.TAGS.META",
  mobility: "ETERN.ENCHANTING.TAGS.MOBILITY",
  save: "ETERN.ENCHANTING.TAGS.SAVE",
  season: "ETERN.ENCHANTING.TAGS.SEASON",
  spell: "ETERN.ENCHANTING.TAGS.SPELL",
  state: "ETERN.ENCHANTING.TAGS.STATE",
  stealth: "ETERN.ENCHANTING.TAGS.STEALTH",
  summon: "ETERN.ENCHANTING.TAGS.SUMMON",
  weather: "ETERN.ENCHANTING.TAGS.WEATHER",
  wind: "ETERN.ENCHANTING.TAGS.WIND",
  zone: "ETERN.ENCHANTING.TAGS.ZONE"
});

const ENCHANTMENT_TAG_ALIASES = Object.freeze({
  acide: "acid",
  acid: "acid",

  attaque: "attack",
  attack: "attack",

  attribut: "attribute",
  attributs: "attribute",
  caracteristique: "attribute",
  caracteristiques: "attribute",
  caractéristique: "attribute",
  caractéristiques: "attribute",
  attribute: "attribute",

  combat: "combat",

  consommable: "consumable",
  consommables: "consumable",
  consumable: "consumable",

  degat: "damage",
  degats: "damage",
  dégât: "damage",
  dégâts: "damage",
  damage: "damage",

  defense: "defense",
  défense: "defense",
  def: "defense",

  terre: "earth",
  earth: "earth",

  ennemi: "enemy",
  ennemis: "enemy",
  adversaire: "enemy",
  adversaires: "enemy",
  enemy: "enemy",

  environment: "environment",
  environnement: "environment",

  feu: "fire",
  fire: "fire",

  glace: "ice",
  ice: "ice",

  vie: "life",
  life: "life",

  foudre: "lightning",
  lightning: "lightning",

  magie: "magic",
  magique: "magic",
  magic: "magic",

  meta: "meta",
  méta: "meta",

  mobilité: "mobility",
  mobilite: "mobility",
  mobility: "mobility",

  sauvegarde: "save",
  sauvegardes: "save",
  save: "save",
  saves: "save",

  saison: "season",
  saisons: "season",
  season: "season",

  sort: "spell",
  sorts: "spell",
  spell: "spell",

  etat: "state",
  états: "state",
  état: "state",
  state: "state",

  discretion: "stealth",
  discrétion: "stealth",
  stealth: "stealth",

  invocation: "summon",
  invocations: "summon",
  summon: "summon",

  meteo: "weather",
  météo: "weather",
  meteorologie: "weather",
  météorologie: "weather",
  weather: "weather",

  vent: "wind",
  wind: "wind",

  zone: "zone"
});

/**
 * Normalise une valeur libre en token technique.
 *
 * La fonction :
 * - retire les espaces inutiles ;
 * - passe en minuscules ;
 * - retire les accents ;
 * - remplace les caractères spéciaux par des tirets ;
 * - compacte les tirets multiples ;
 * - retire les tirets en début et fin.
 *
 * @param {unknown} value - Valeur brute à normaliser.
 * @returns {string} Token normalisé.
 */
function normalizeToken(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Normalise un tag d’enchantement.
 *
 * La fonction accepte :
 * - les ids canoniques anglais ;
 * - les alias français ;
 * - les variantes accentuées ;
 * - les valeurs libres, qui sont converties en token.
 *
 * Si le tag correspond à un alias connu, l’id canonique est renvoyé.
 * Sinon, le token normalisé est renvoyé afin de permettre des tags personnalisés.
 *
 * @param {unknown} value - Tag brut.
 * @returns {string} Tag canonique ou token personnalisé.
 */
export function normalizeEnchantmentTag(value) {
  const raw = String(value ?? "").trim().toLowerCase();

  if (!raw) return "";

  const normalized = normalizeToken(raw);

  return ENCHANTMENT_TAG_ALIASES[raw]
    ?? ENCHANTMENT_TAG_ALIASES[normalized]
    ?? normalized;
}

/**
 * Récupère le libellé localisé d’un tag d’enchantement.
 *
 * Si le tag correspond à une clé connue, le label i18n est utilisé.
 * Sinon, la valeur brute est renvoyée comme fallback.
 *
 * @param {unknown} tag - Tag à afficher.
 * @returns {string} Libellé localisé ou fallback.
 */
export function getEnchantmentTagLabel(tag) {
  const normalized = normalizeEnchantmentTag(tag);
  const labelKey = ENCHANTMENT_TAG_LABEL_KEYS[normalized];

  if (!labelKey) {
    return String(tag ?? "").trim();
  }

  return game.i18n.localize(labelKey);
}

/**
 * Construit les pills de tags affichables.
 *
 * La fonction accepte :
 * - un tableau de tags ;
 * - une chaîne séparée par des virgules.
 *
 * Les tags sont normalisés, les valeurs vides sont ignorées
 * et les doublons sont supprimés en conservant le premier ordre d’apparition.
 *
 * @param {string[]|string} [tags=[]] - Tags bruts.
 * @returns {{key: string, label: string}[]} Pills de tags.
 */
export function buildEnchantmentTagPills(tags = []) {
  const seen = new Set();
  const values = Array.isArray(tags)
    ? tags
    : String(tags ?? "").split(",");

  return values
    .map((tag) => normalizeEnchantmentTag(tag))
    .filter(Boolean)
    .filter((tag) => {
      if (seen.has(tag)) return false;

      seen.add(tag);
      return true;
    })
    .map((tag) => ({
      key: tag,
      label: getEnchantmentTagLabel(tag)
    }));
}