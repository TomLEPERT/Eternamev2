/**
 * Helpers liés aux sacs, conteneurs et calculs de poids stocké.
 *
 * Responsabilités :
 * - normaliser les capacités de poids des sacs ;
 * - formater les poids pour l’affichage ;
 * - retrouver les items stockés dans un sac donné ;
 * - calculer le poids total contenu dans un sac.
 *
 * Ce fichier ne doit contenir que de la logique utilitaire liée aux sacs.
 * Les règles globales d’inventaire ou d’encombrement doivent rester dans des services dédiés.
 */

/**
 * Normalise une capacité de poids de sac.
 *
 * La fonction :
 * - convertit la valeur en nombre ;
 * - utilise le fallback si la valeur est absente ;
 * - empêche les valeurs négatives ;
 * - renvoie toujours un nombre valide.
 *
 * @param {unknown} value - Valeur brute à normaliser.
 * @param {number} [fallback=0] - Valeur utilisée si l’entrée est invalide.
 * @returns {number} Capacité de poids normalisée, toujours supérieure ou égale à 0.
 */
export function normalizeBagCapacityWeight(value, fallback = 0) {
  const num = Number(value ?? fallback);

  if (Number.isFinite(num)) {
    return Math.max(0, num);
  }

  return Math.max(0, Number(fallback) || 0);
}

/**
 * Formate un poids de sac pour l’affichage.
 *
 * La fonction :
 * - renvoie `"0"` si la valeur est invalide ;
 * - conserve les entiers sans décimales ;
 * - arrondit les nombres décimaux à deux chiffres après la virgule.
 *
 * @param {unknown} value - Poids brut à formater.
 * @returns {string} Poids formaté pour l’interface.
 */
export function formatBagWeight(value) {
  const num = Number(value ?? 0);

  if (!Number.isFinite(num)) return "0";

  return Number.isInteger(num)
    ? String(num)
    : String(Math.round(num * 100) / 100);
}

/**
 * Récupère les items stockés dans un sac donné.
 *
 * Un item est considéré comme stocké dans le sac si :
 * - `system.location` vaut `"bag"` ;
 * - `system.containerId` correspond à l’id du sac.
 *
 * @param {Actor} actor - Acteur propriétaire de l’inventaire.
 * @param {string} bagId - Identifiant de l’item sac.
 * @returns {Item[]} Liste des items contenus dans le sac.
 */
export function getBagStoredItems(actor, bagId) {
  if (!actor || !bagId) return [];

  const items = actor.items?.contents ?? [];

  return items.filter((item) => {
    const location = String(item.system?.location ?? "");
    const containerId = String(item.system?.containerId ?? "");

    return location === "bag" && containerId === String(bagId);
  });
}

/**
 * Calcule le poids total des items contenus dans un sac.
 *
 * Pour chaque item stocké, le poids pris en compte est :
 * `quantité × poids unitaire`.
 *
 * La quantité minimale est forcée à 1 afin d’éviter qu’un item existant
 * avec une quantité vide ou invalide ne pèse artificiellement 0.
 *
 * @param {Actor} actor - Acteur propriétaire de l’inventaire.
 * @param {string} bagId - Identifiant de l’item sac.
 * @returns {number} Poids total contenu dans le sac.
 */
export function getBagStoredWeight(actor, bagId) {
  return getBagStoredItems(actor, bagId).reduce((total, item) => {
    const quantity = Math.max(1, Math.floor(Number(item.system?.quantity ?? 1) || 1));
    const weight = Number(item.system?.weight ?? 0) || 0;

    return total + (quantity * weight);
  }, 0);
}