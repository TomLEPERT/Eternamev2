/**
 * Helpers liés à la richesse et aux monnaies du système Etername.
 *
 * Responsabilités :
 * - définir la valeur de chaque monnaie dans une unité de base ;
 * - normaliser les objets de richesse ;
 * - convertir une richesse en valeur totale ;
 * - reconvertir une valeur totale en monnaies détaillées ;
 * - additionner, soustraire, augmenter ou réduire une richesse ;
 * - formater une richesse pour l’affichage utilisateur.
 *
 * Ce fichier doit rester indépendant de l’interface.
 * Les dialogues de paiement, marchands ou inventaire doivent utiliser ces helpers
 * sans y ajouter leur logique directement.
 */

import { toPositiveInteger } from '../../utils/numbers.js';
/**
 * Valeur de chaque monnaie exprimée en unité de base.
 *
 * Ici, `pc` est l’unité minimale.
 * Toutes les conversions passent par cette table.
 *
 * @type {Readonly<Record<string, number>>}
 */
export const CURRENCY_VALUES = Object.freeze({
  pc: 1,
  pa: 10,
  po: 1000,
  rc: 100000,
  pp: 1000000
});

/**
 * Ordre d’affichage et de conversion des monnaies.
 *
 * L’ordre va de la monnaie la plus forte à la monnaie la plus faible,
 * ce qui permet à `baseValueToWealth` de convertir proprement une valeur totale.
 *
 * @type {Readonly<string[]>}
 */
export const CURRENCY_ORDER = Object.freeze(["pp", "rc", "po", "pa", "pc"]);


/**
 * Normalise un objet de richesse.
 *
 * La fonction garantit que :
 * - toutes les monnaies attendues existent ;
 * - chaque valeur est un entier positif ;
 * - les clés suivent l’ordre défini par `CURRENCY_ORDER`.
 *
 * @param {object} [wealth={}] - Richesse brute à normaliser.
 * @returns {Record<string, number>} Richesse normalisée.
 */
export function normalizeWealth(wealth = {}) {
  return Object.fromEntries(
    CURRENCY_ORDER.map((key) => [
      key,
      toPositiveInteger(wealth?.[key])
    ])
  );
}

/**
 * Convertit une richesse détaillée en valeur totale de base.
 *
 * Exemple :
 * - 1 pa vaut 10 pc ;
 * - 1 po vaut 1000 pc.
 *
 * Le résultat est toujours exprimé dans l’unité minimale `pc`.
 *
 * @param {object} [wealth={}] - Richesse à convertir.
 * @returns {number} Valeur totale en unité de base.
 */
export function wealthToBaseValue(wealth = {}) {
  const normalized = normalizeWealth(wealth);

  return CURRENCY_ORDER.reduce((total, key) => {
    return total + (normalized[key] * (CURRENCY_VALUES[key] ?? 0));
  }, 0);
}

/**
 * Convertit une valeur de base en richesse détaillée.
 *
 * La fonction répartit la valeur totale en utilisant d’abord
 * les monnaies les plus fortes, puis les plus faibles.
 *
 * @param {number} [baseValue=0] - Valeur totale exprimée en unité de base.
 * @returns {Record<string, number>} Richesse détaillée normalisée.
 */
export function baseValueToWealth(baseValue = 0) {
  let remaining = toPositiveInteger(baseValue);
  const wealth = {};

  for (const key of CURRENCY_ORDER) {
    const unit = CURRENCY_VALUES[key] ?? 1;

    wealth[key] = Math.floor(remaining / unit);
    remaining %= unit;
  }

  return normalizeWealth(wealth);
}

/**
 * Vérifie si une richesse permet de payer un coût donné.
 *
 * Les deux valeurs sont converties en unité de base avant comparaison.
 *
 * @param {object} [wealth={}] - Richesse disponible.
 * @param {object} [cost={}] - Coût à payer.
 * @returns {boolean} `true` si la richesse est suffisante.
 */
export function canAffordWealth(wealth = {}, cost = {}) {
  return wealthToBaseValue(wealth) >= wealthToBaseValue(cost);
}

/**
 * Ajoute un gain à une richesse existante.
 *
 * @param {object} [wealth={}] - Richesse actuelle.
 * @param {object} [gain={}] - Gain à ajouter.
 * @returns {Record<string, number>} Nouvelle richesse après ajout.
 */
export function addWealthValues(wealth = {}, gain = {}) {
  const total = wealthToBaseValue(wealth) + wealthToBaseValue(gain);

  return baseValueToWealth(total);
}

/**
 * Soustrait un coût d’une richesse existante.
 *
 * La fonction renvoie `null` si la richesse est insuffisante.
 * Cela permet à l’appelant de distinguer un paiement impossible
 * d’un paiement réussi qui laisserait simplement zéro monnaie.
 *
 * @param {object} [wealth={}] - Richesse actuelle.
 * @param {object} [cost={}] - Coût à soustraire.
 * @returns {Record<string, number>|null} Nouvelle richesse, ou `null` si paiement impossible.
 */
export function subtractWealthValues(wealth = {}, cost = {}) {
  const total = wealthToBaseValue(wealth);
  const amount = wealthToBaseValue(cost);

  if (amount > total) return null;

  return baseValueToWealth(total - amount);
}

/**
 * Augmente une richesse selon un pourcentage.
 *
 * Le pourcentage est borné à un minimum de 0.
 * Le résultat est arrondi vers le haut afin de ne pas perdre de valeur
 * lors d’une augmentation.
 *
 * @param {object} [wealth={}] - Richesse de départ.
 * @param {number} [percent=0] - Pourcentage d’augmentation.
 * @returns {Record<string, number>} Richesse augmentée.
 */
export function increaseWealthByPercent(wealth = {}, percent = 0) {
  const safePercent = Math.max(0, Number(percent) || 0);
  const multiplier = 1 + (safePercent / 100);
  const increasedValue = Math.ceil(wealthToBaseValue(wealth) * multiplier);

  return baseValueToWealth(increasedValue);
}

/**
 * Applique une remise à une richesse selon un pourcentage.
 *
 * Le pourcentage est borné entre 0 et 100.
 * Le résultat est arrondi vers le bas afin d’obtenir un coût final entier.
 *
 * @param {object} [wealth={}] - Coût ou richesse de départ.
 * @param {number} [percent=0] - Pourcentage de remise.
 * @returns {Record<string, number>} Richesse après remise.
 */
export function discountWealthByPercent(wealth = {}, percent = 0) {
  const boundedPercent = Math.max(0, Math.min(100, Number(percent) || 0));
  const discountedValue = Math.floor(
    wealthToBaseValue(wealth) * (100 - boundedPercent) / 100
  );

  return baseValueToWealth(discountedValue);
}

/**
 * Formate une richesse pour l’affichage utilisateur.
 *
 * La fonction :
 * - ignore les monnaies à zéro ;
 * - localise chaque nom de monnaie ;
 * - affiche `0 pc` si aucune monnaie n’est présente.
 *
 * Cette fonction dépend de `game.i18n`.
 * Elle doit donc être appelée uniquement quand Foundry est initialisé.
 *
 * @param {object} [wealth={}] - Richesse à afficher.
 * @returns {string} Richesse formatée et localisée.
 */
export function formatWealth(wealth = {}) {
  const normalized = normalizeWealth(wealth);

  const parts = CURRENCY_ORDER
    .filter((key) => normalized[key] > 0)
    .map((key) => {
      const label = game.i18n.localize(`ETERN.INVENTORY.CURRENCY.${key.toUpperCase()}`);

      return `${normalized[key]} ${label}`;
    });

  if (parts.length > 0) {
    return parts.join(" · ");
  }

  return `0 ${game.i18n.localize("ETERN.INVENTORY.CURRENCY.PC")}`;
}