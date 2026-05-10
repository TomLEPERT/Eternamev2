/**
 * Référentiel et helpers liés aux statistiques des techniques du système Etername.
 *
 * Responsabilités :
 * - déclarer les statistiques disponibles pour les techniques ;
 * - définir leur coût XP, leur valeur de base, leur catégorie et leur scaling ;
 * - gérer les seuils de puissance débloqués ;
 * - calculer le coût XP de puissance ;
 * - formater la valeur finale d’une statistique selon son nombre de rangs.
 *
 * Ce fichier doit rester centré sur les définitions mécaniques des statistiques.
 * Il ne doit pas contenir de logique UI, de validation de fiche ou de rendu Handlebars.
 *
 * Note :
 * si le fichier s’appelle actuellement `stat-difinitions.js`, il vaut mieux le renommer
 * en `stat-definitions.js`, puis mettre à jour les imports.
 */

const DEFAULT_TECHNIQUE_STAT_ID = "damage";
const DEFAULT_TECHNIQUE_STAT_CATEGORY = "effect";
const MIN_TECHNIQUE_POWER = 0;
const MAX_TECHNIQUE_POWER = 10;
const TECHNIQUE_POWER_COST_MULTIPLIER = 3;

export const TECHNIQUE_STAT_DEFINITIONS = {
  damage: {
    labelKey: "ETERN.TECHNIQUE.STAT.DAMAGE",
    baseValue: "1d6",
    xpCost: 1,
    category: "effect",
    scalesWithPower: true
  },

  healing: {
    labelKey: "ETERN.TECHNIQUE.STAT.HEALING",
    baseValue: "1",
    xpCost: 1,
    category: "effect",
    scalesWithPower: true
  },

  prc: {
    labelKey: "ETERN.TECHNIQUE.STAT.PRC",
    baseValue: "1",
    xpCost: 2,
    category: "effect",
    scalesWithPower: true
  },

  prd: {
    labelKey: "ETERN.TECHNIQUE.STAT.PRD",
    baseValue: "1",
    xpCost: 2,
    category: "effect",
    scalesWithPower: true
  },

  prm: {
    labelKey: "ETERN.TECHNIQUE.STAT.PRM",
    baseValue: "1",
    xpCost: 2,
    category: "effect",
    scalesWithPower: true
  },

  defense: {
    labelKey: "ETERN.TECHNIQUE.STAT.DEFENSE",
    baseValue: "1",
    xpCost: 2,
    category: "effect",
    scalesWithPower: true
  },

  initiative: {
    labelKey: "ETERN.TECHNIQUE.STAT.INITIATIVE",
    baseValue: "1",
    xpCost: 1,
    category: "effect",
    scalesWithPower: true
  },

  range: {
    labelKey: "ETERN.TECHNIQUE.STAT.RANGE",
    baseValue: "6m",
    xpCost: 1,
    category: "range",
    scalesWithPower: true
  },

  speed: {
    labelKey: "ETERN.TECHNIQUE.STAT.SPEED",
    baseValue: "1m",
    xpCost: 4,
    category: "effect",
    scalesWithPower: true
  },

  duration: {
    labelKey: "ETERN.TECHNIQUE.STAT.DURATION",
    baseValue: "1 turn",
    xpCost: 2,
    category: "duration",
    scalesWithPower: true
  },

  dice_bonus: {
    labelKey: "ETERN.TECHNIQUE.STAT.DICE_BONUS",
    baseValue: "1 die",
    xpCost: 4,
    category: "effect",
    scalesWithPower: true
  },

  improve_index: {
    labelKey: "ETERN.TECHNIQUE.STAT.IMPROVE_INDEX",
    baseValue: "1",
    xpCost: 5,
    category: "effect",
    scalesWithPower: true
  },

  apply_state: {
    labelKey: "ETERN.TECHNIQUE.STAT.APPLY_STATE",
    baseValue: "—",
    xpCost: 3,
    category: "effect",
    scalesWithPower: false
  },

  add_weight: {
    labelKey: "ETERN.TECHNIQUE.STAT.ADD_WEIGHT",
    baseValue: "24 kg",
    xpCost: 1,
    category: "effect",
    scalesWithPower: true
  },

  add_unit: {
    labelKey: "ETERN.TECHNIQUE.STAT.ADD_UNIT",
    baseValue: "3",
    xpCost: 2,
    category: "effect",
    scalesWithPower: true
  },

  add_target: {
    labelKey: "ETERN.TECHNIQUE.STAT.ADD_TARGET",
    baseValue: "1",
    xpCost: 3,
    category: "effect",
    scalesWithPower: true
  },

  add_volume: {
    labelKey: "ETERN.TECHNIQUE.STAT.ADD_VOLUME",
    baseValue: "9 m3",
    xpCost: 1,
    category: "effect",
    scalesWithPower: true
  },

  grant_save: {
    labelKey: "ETERN.TECHNIQUE.STAT.GRANT_SAVE",
    baseValue: "1",
    xpCost: 6,
    category: "effect",
    scalesWithPower: true
  },

  improve_save_index: {
    labelKey: "ETERN.TECHNIQUE.STAT.IMPROVE_SAVE_INDEX",
    baseValue: "1",
    xpCost: 9,
    category: "effect",
    scalesWithPower: true
  },

  zone_control: {
    labelKey: "ETERN.TECHNIQUE.STAT.ZONE_CONTROL",
    baseValue: "—",
    xpCost: 3,
    category: "effect",
    scalesWithPower: false
  },

  zone_radius: {
    labelKey: "ETERN.TECHNIQUE.STAT.ZONE_RADIUS",
    baseValue: "3m",
    xpCost: 4,
    category: "effect",
    scalesWithPower: true
  },

  zone_line: {
    labelKey: "ETERN.TECHNIQUE.STAT.ZONE_LINE",
    baseValue: "6m × 1.5m",
    xpCost: 5,
    category: "effect",
    scalesWithPower: true
  },

  zone_cone: {
    labelKey: "ETERN.TECHNIQUE.STAT.ZONE_CONE",
    baseValue: "Small",
    xpCost: 7,
    category: "effect",
    scalesWithPower: true
  }
};

export const TECHNIQUE_POWER_THRESHOLDS = Object.freeze([3, 6, 9, 10]);

/**
 * Retourne la liste des ids de statistiques disponibles pour les techniques.
 *
 * @returns {string[]} Liste des ids de statistiques.
 */
export function getTechniqueStatIds() {
  return Object.keys(TECHNIQUE_STAT_DEFINITIONS);
}

/**
 * Normalise la puissance d’une technique.
 *
 * La puissance est toujours bornée entre 0 et 10.
 * Les valeurs invalides, vides ou non numériques reviennent à 0.
 *
 * @param {unknown} power - Puissance brute à normaliser.
 * @returns {number} Puissance normalisée.
 */
export function clampTechniquePower(power) {
  const numericPower = Number(power ?? 0);
  const safePower = Number.isFinite(numericPower) ? numericPower : 0;

  return Math.max(
    MIN_TECHNIQUE_POWER,
    Math.min(MAX_TECHNIQUE_POWER, Math.floor(safePower))
  );
}

/**
 * Normalise l’id d’une statistique de technique.
 *
 * Si l’id est absent ou inconnu, la fonction renvoie un fallback valide.
 * Si le fallback est lui-même invalide, elle revient à `damage`.
 *
 * @param {unknown} statId - Id brut de statistique.
 * @param {string} [fallback=DEFAULT_TECHNIQUE_STAT_ID] - Id utilisé si l’entrée est invalide.
 * @returns {string} Id de statistique valide.
 */
export function normalizeTechniqueStatId(statId, fallback = DEFAULT_TECHNIQUE_STAT_ID) {
  const normalized = String(statId ?? "").trim();
  const safeFallback = fallback in TECHNIQUE_STAT_DEFINITIONS
    ? fallback
    : DEFAULT_TECHNIQUE_STAT_ID;

  return normalized in TECHNIQUE_STAT_DEFINITIONS
    ? normalized
    : safeFallback;
}

/**
 * Récupère la définition complète d’une statistique de technique.
 *
 * La fonction passe toujours par `normalizeTechniqueStatId`,
 * donc elle renvoie toujours une définition valide.
 *
 * @param {unknown} statId - Id brut ou normalisé de statistique.
 * @returns {{labelKey: string, baseValue: string, xpCost: number, category: string, scalesWithPower: boolean}} Définition de statistique.
 */
export function getTechniqueStatDefinition(statId) {
  const normalizedStatId = normalizeTechniqueStatId(statId);

  return TECHNIQUE_STAT_DEFINITIONS[normalizedStatId]
    ?? TECHNIQUE_STAT_DEFINITIONS[DEFAULT_TECHNIQUE_STAT_ID];
}

/**
 * Récupère la catégorie mécanique d’une statistique de technique.
 *
 * Les catégories servent notamment à distinguer les effets, portées ou durées.
 *
 * @param {unknown} statId - Id brut ou normalisé de statistique.
 * @returns {string} Catégorie de la statistique.
 */
export function getTechniqueStatisticCategory(statId) {
  return String(
    getTechniqueStatDefinition(statId)?.category ?? DEFAULT_TECHNIQUE_STAT_CATEGORY
  );
}

/**
 * Indique si une statistique augmente avec la puissance de la technique.
 *
 * @param {unknown} statId - Id brut ou normalisé de statistique.
 * @returns {boolean} `true` si la statistique scale avec la puissance.
 */
export function isTechniqueStatScalable(statId) {
  return Boolean(getTechniqueStatDefinition(statId)?.scalesWithPower);
}

/**
 * Calcule le coût XP d’un niveau précis de puissance.
 *
 * Exemple :
 * - puissance 1 = 3 XP ;
 * - puissance 2 = 6 XP ;
 * - puissance 3 = 9 XP.
 *
 * @param {unknown} power - Niveau de puissance.
 * @returns {number} Coût XP du niveau donné.
 */
export function getTechniquePowerStepCost(power) {
  return clampTechniquePower(power) * TECHNIQUE_POWER_COST_MULTIPLIER;
}

/**
 * Calcule le coût XP cumulé de la puissance d’une technique.
 *
 * Exemple avec le multiplicateur actuel :
 * - puissance 1 = 3 XP ;
 * - puissance 2 = 3 + 6 = 9 XP ;
 * - puissance 3 = 3 + 6 + 9 = 18 XP.
 *
 * @param {unknown} power - Puissance brute ou normalisée.
 * @returns {number} Coût XP cumulé de la puissance.
 */
export function getTechniquePowerCumulativeCost(power) {
  const value = clampTechniquePower(power);
  let total = 0;

  for (let step = 1; step <= value; step += 1) {
    total += getTechniquePowerStepCost(step);
  }

  return total;
}

/**
 * Retourne les seuils de puissance débloqués par une puissance donnée.
 *
 * @param {unknown} power - Puissance brute ou normalisée.
 * @returns {number[]} Seuils débloqués.
 */
export function getUnlockedTechniquePowerThresholds(power) {
  const value = clampTechniquePower(power);

  return TECHNIQUE_POWER_THRESHOLDS.filter((threshold) => threshold <= value);
}

/**
 * Formate la valeur finale d’une statistique selon son nombre de rangs.
 *
 * La fonction gère plusieurs formats :
 * - dés : `1d6`, `2d8` ;
 * - ligne de zone : `6m × 1.5m` ;
 * - nombre + unité : `3m`, `24 kg`, `1 turn`, `1 die` ;
 * - nombre simple : `1`, `3`, `5`.
 *
 * Si le format n’est pas reconnu, elle affiche une multiplication simple :
 * `valeur × rangs`.
 *
 * @param {unknown} statId - Id de statistique.
 * @param {number} [rankCount=1] - Nombre de rangs à appliquer.
 * @returns {string} Valeur formatée.
 */
export function formatTechniqueStatisticValue(statId, rankCount = 1) {
  const definition = getTechniqueStatDefinition(statId);
  const ranks = normalizeRankCount(rankCount);
  const baseValue = String(definition.baseValue ?? "");

  if (!definition.scalesWithPower || ranks <= 1) {
    return baseValue;
  }

  const diceValue = formatDiceValue(baseValue, ranks);
  if (diceValue) return diceValue;

  const lineValue = formatLineAreaValue(baseValue, ranks);
  if (lineValue) return lineValue;

  const numericUnitValue = formatNumericUnitValue(baseValue, ranks);
  if (numericUnitValue) return numericUnitValue;

  const numericValue = formatPlainNumericValue(baseValue, ranks);
  if (numericValue) return numericValue;

  return `${baseValue} × ${ranks}`;
}

/**
 * Normalise le nombre de rangs d’une statistique.
 *
 * Le nombre minimum de rangs est 1.
 *
 * @param {unknown} rankCount - Nombre de rangs brut.
 * @returns {number} Nombre de rangs normalisé.
 */
function normalizeRankCount(rankCount) {
  const numericRankCount = Number(rankCount ?? 1);
  const safeRankCount = Number.isFinite(numericRankCount) ? numericRankCount : 1;

  return Math.max(1, Math.floor(safeRankCount));
}

/**
 * Formate une valeur de dés.
 *
 * Exemple :
 * - `1d6` avec 3 rangs devient `3d6`.
 *
 * @param {string} baseValue - Valeur de base.
 * @param {number} ranks - Nombre de rangs.
 * @returns {string|null} Valeur formatée ou `null` si le format ne correspond pas.
 */
function formatDiceValue(baseValue, ranks) {
  const diceMatch = baseValue.match(/^(\d+)d(\d+)$/i);

  if (!diceMatch) return null;

  const diceCount = Number(diceMatch[1] ?? 1) * ranks;

  return `${diceCount}d${diceMatch[2]}`;
}

/**
 * Formate une zone linéaire.
 *
 * Exemple :
 * - `6m × 1.5m` avec 2 rangs devient `12m × 3m`.
 *
 * @param {string} baseValue - Valeur de base.
 * @param {number} ranks - Nombre de rangs.
 * @returns {string|null} Valeur formatée ou `null` si le format ne correspond pas.
 */
function formatLineAreaValue(baseValue, ranks) {
  const lineMatch = baseValue.match(
    /^(\d+(?:\.\d+)?)m\s*[×x]\s*(\d+(?:\.\d+)?)m$/i
  );

  if (!lineMatch) return null;

  const length = formatScaledNumber(Number(lineMatch[1]), ranks);
  const width = formatScaledNumber(Number(lineMatch[2]), ranks);

  return `${length}m × ${width}m`;
}

/**
 * Formate une valeur numérique suivie d’une unité.
 *
 * Exemples :
 * - `6m` avec 2 rangs devient `12m` ;
 * - `24 kg` avec 2 rangs devient `48 kg` ;
 * - `1 die` avec 2 rangs devient `2 dice`.
 *
 * @param {string} baseValue - Valeur de base.
 * @param {number} ranks - Nombre de rangs.
 * @returns {string|null} Valeur formatée ou `null` si le format ne correspond pas.
 */
function formatNumericUnitValue(baseValue, ranks) {
  const numericUnitMatch = baseValue.match(
    /^(\d+(?:\.\d+)?)(?:\s*)(kg|m3|m|turn|die|dice)$/i
  );

  if (!numericUnitMatch) return null;

  const value = formatScaledNumber(Number(numericUnitMatch[1]), ranks);
  const unit = formatUnitLabel(numericUnitMatch[2], value);

  return requiresSpaceBeforeUnit(unit)
    ? `${value} ${unit}`
    : `${value}${unit}`;
}

/**
 * Formate une valeur numérique sans unité.
 *
 * Exemple :
 * - `3` avec 2 rangs devient `6`.
 *
 * @param {string} baseValue - Valeur de base.
 * @param {number} ranks - Nombre de rangs.
 * @returns {string|null} Valeur formatée ou `null` si le format ne correspond pas.
 */
function formatPlainNumericValue(baseValue, ranks) {
  const numericMatch = baseValue.match(/^(\d+(?:\.\d+)?)$/);

  if (!numericMatch) return null;

  return String(formatScaledNumber(Number(numericMatch[1]), ranks));
}

/**
 * Applique un multiplicateur à une valeur numérique et formate le résultat.
 *
 * Les entiers restent des entiers.
 * Les nombres décimaux sont arrondis à deux décimales.
 *
 * @param {number} base - Valeur de base.
 * @param {number} multiplier - Multiplicateur.
 * @returns {number} Valeur multipliée et formatée.
 */
function formatScaledNumber(base, multiplier) {
  const safeBase = Number.isFinite(base) ? base : 0;
  const safeMultiplier = normalizeRankCount(multiplier);
  const value = safeBase * safeMultiplier;

  return Number.isInteger(value) ? value : Number(value.toFixed(2));
}

/**
 * Formate l’unité d’une valeur numérique.
 *
 * Pour le moment, seule l’unité anglaise `die/dice` est pluralisée.
 *
 * @param {string} unit - Unité brute.
 * @param {number} value - Valeur finale.
 * @returns {string} Unité formatée.
 */
function formatUnitLabel(unit, value) {
  const normalizedUnit = String(unit ?? "").trim();

  if (/^die$/i.test(normalizedUnit) || /^dice$/i.test(normalizedUnit)) {
    return Number(value) === 1 ? "die" : "dice";
  }

  return normalizedUnit;
}

/**
 * Indique si une unité doit être séparée de la valeur par une espace.
 *
 * Les unités courtes de distance ou volume restent collées :
 * - `m`
 * - `m3`
 *
 * Les autres unités restent séparées :
 * - `kg`
 * - `turn`
 * - `die`
 * - `dice`
 *
 * @param {string} unit - Unité formatée.
 * @returns {boolean} `true` si une espace doit être insérée.
 */
function requiresSpaceBeforeUnit(unit) {
  return !["m", "m3"].includes(String(unit ?? "").toLowerCase());
}