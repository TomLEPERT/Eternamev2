/**
 * Helpers liés aux modificateurs de jets.
 *
 * Responsabilités :
 * - déclarer les modes de jet disponibles : normal, avantage, désavantage ;
 * - convertir un mode de jet en modification de seuil ;
 * - borner les seuils de réussite ;
 * - appliquer une modification à un seuil de base ;
 * - fournir les choix localisés des modes de jet pour les formulaires.
 *
 * Ce fichier doit rester centré sur la manipulation des modificateurs de jet.
 * Il ne doit pas lancer les jets, construire les formules de dés ou créer les messages de chat.
 */

export const ROLL_MODES = Object.freeze({
  NORMAL: "normal",
  ADVANTAGE: "advantage",
  DISADVANTAGE: "disadvantage"
});

/**
 * Normalise un seuil de réussite.
 *
 * Par défaut, les seuils valides sont compris entre 2 et 6.
 *
 * Une valeur supérieure ou égale à `max + 1` est conservée comme `max + 1`.
 * Avec les valeurs par défaut, cela donne `7`.
 *
 * Ce comportement permet de représenter un seuil impossible ou hors plage,
 * sans le ramener automatiquement à 6.
 *
 * @param {unknown} target - Seuil brut à normaliser.
 * @param {number} [min=2] - Seuil minimum autorisé.
 * @param {number} [max=6] - Seuil maximum autorisé.
 * @returns {number} Seuil normalisé, ou `max + 1` pour un seuil impossible.
 */
export function clampTarget(target, min = 2, max = 6) {
  const safeTarget = Number(target ?? max + 1);

  if (!Number.isFinite(safeTarget)) return max + 1;
  if (safeTarget >= max + 1) return max + 1;

  return Math.max(min, Math.min(max, Math.floor(safeTarget)));
}

/**
 * Convertit un mode de jet en modification de seuil.
 *
 * Dans ce système :
 * - l’avantage diminue le seuil, donc facilite le jet ;
 * - le désavantage augmente le seuil, donc rend le jet plus difficile ;
 * - le mode normal ne modifie pas le seuil.
 *
 * @param {string} [mode=ROLL_MODES.NORMAL] - Mode de jet.
 * @param {number} [step=1] - Intensité de l’avantage ou du désavantage.
 * @returns {number} Modification de seuil à appliquer.
 */
export function modeToDelta(mode = ROLL_MODES.NORMAL, step = 1) {
  const safeStep = Math.max(0, Math.floor(Number(step ?? 0) || 0));

  if (mode === ROLL_MODES.ADVANTAGE) return -safeStep;
  if (mode === ROLL_MODES.DISADVANTAGE) return safeStep;

  return 0;
}

/**
 * Applique une modification à un seuil de base.
 *
 * La fonction :
 * - normalise le seuil de base ;
 * - normalise la modification ;
 * - applique la modification ;
 * - borne le seuil final avec `clampTarget`.
 *
 * @param {unknown} baseTarget - Seuil de base.
 * @param {unknown} [delta=0] - Modification à appliquer.
 * @returns {{baseTarget: number, adjustedTarget: number, delta: number}} Résultat du calcul.
 */
export function applyTargetDelta(baseTarget, delta = 0) {
  const safeBase = clampTarget(baseTarget);
  const safeDelta = Math.trunc(Number(delta ?? 0) || 0);

  return {
    baseTarget: safeBase,
    adjustedTarget: clampTarget(safeBase + safeDelta),
    delta: safeDelta
  };
}

/**
 * Construit les choix localisés des modes de jet.
 *
 * Cette fonction est destinée aux dialogues ou formulaires de jet.
 * Elle dépend de `game.i18n`, donc elle doit être appelée après l’initialisation de Foundry.
 *
 * @returns {{value: string, label: string}[]} Choix localisés des modes de jet.
 */
export function getRollModeChoices() {
  return [
    {
      value: ROLL_MODES.NORMAL,
      label: game.i18n.localize("ETERN.ROLL.MODE.NORMAL")
    },
    {
      value: ROLL_MODES.ADVANTAGE,
      label: game.i18n.localize("ETERN.ROLL.MODE.ADVANTAGE")
    },
    {
      value: ROLL_MODES.DISADVANTAGE,
      label: game.i18n.localize("ETERN.ROLL.MODE.DISADVANTAGE")
    }
  ];
}