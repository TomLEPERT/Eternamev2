/**
 * Service de calcul XP des techniques du système Etername.
 *
 * Responsabilités :
 * - additionner le coût XP des composants d’une technique ;
 * - calculer le coût XP des statistiques ajoutées à une technique ;
 * - calculer le coût XP cumulé de la puissance ;
 * - produire un résumé complet du coût de création et du coût total.
 *
 * Ce fichier doit rester dédié au calcul XP.
 * Il ne doit pas contenir de logique UI, de validation de formulaire ou de rendu de fiche.
 */

import {
  getTechniquePowerCumulativeCost,
  getTechniqueStatDefinition
} from "./stat-definitions.js";

/**
 * Construit le résumé XP complet d’une technique.
 *
 * Le coût total est séparé en deux grandes parties :
 * - `creationXp` : coût des clés, conditions, mécaniques, états et statistiques ;
 * - `powerXp` : coût cumulé lié au niveau de puissance de la technique.
 *
 * Les composants peuvent avoir un coût négatif.
 * C’est nécessaire pour des conditions comme Recharge, qui réduisent le coût XP.
 *
 * @param {object} [system={}] - Données système de la technique.
 * @returns {{
 *   breakdown: {
 *     keys: number,
 *     conditions: number,
 *     mechanics: number,
 *     states: number,
 *     statistics: number
 *   },
 *   creationXp: number,
 *   powerXp: number,
 *   totalXp: number
 * }} Résumé XP de la technique.
 */
export function buildTechniqueXpSummary(system = {}) {
  const keysXp = sumComponentXp(system.keys);
  const conditionsXp = sumComponentXp(system.conditions);
  const mechanicsXp = sumComponentXp(system.mechanics);
  const statesXp = sumComponentXp(system.states);
  const statisticsXp = sumStatisticXp(system.statistics);

  const creationXp = keysXp + conditionsXp + mechanicsXp + statesXp + statisticsXp;
  const powerXp = getTechniquePowerCumulativeCost(system.power ?? 0);

  return {
    breakdown: {
      keys: keysXp,
      conditions: conditionsXp,
      mechanics: mechanicsXp,
      states: statesXp,
      statistics: statisticsXp
    },
    creationXp,
    powerXp,
    totalXp: creationXp + powerXp
  };
}

/**
 * Additionne le coût XP d’une liste de composants.
 *
 * Cette fonction est utilisée pour les clés, conditions, mécaniques et états.
 * Elle accepte volontairement les coûts négatifs, car certaines conditions
 * peuvent réduire le coût final d’une technique.
 *
 * @param {Array<{xpCost?: number|string}>} entries - Liste des composants à additionner.
 * @returns {number} Somme des coûts XP des composants.
 */
function sumComponentXp(entries) {
  return (Array.isArray(entries) ? entries : []).reduce((total, entry) => {
    const xpCost = Math.floor(Number(entry?.xpCost ?? 0) || 0);

    return total + xpCost;
  }, 0);
}

/**
 * Additionne le coût XP des statistiques d’une technique.
 *
 * Contrairement aux composants classiques, le coût d’une statistique ne doit pas être négatif.
 * Si une statistique est inconnue ou invalide, la statistique `damage` sert de fallback.
 *
 * @param {Array<{statId?: string}>} statistics - Liste des statistiques de la technique.
 * @returns {number} Somme des coûts XP des statistiques.
 */
function sumStatisticXp(statistics) {
  return (Array.isArray(statistics) ? statistics : []).reduce((total, entry) => {
    const statId = entry?.statId ?? "damage";
    const definition = getTechniqueStatDefinition(statId);
    const xpCost = Math.max(0, Math.floor(Number(definition?.xpCost ?? 0) || 0));

    return total + xpCost;
  }, 0);
}