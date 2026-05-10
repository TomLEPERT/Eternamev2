/**
 * Constantes et helpers liés à la légalité des items.
 *
 * Responsabilités :
 * - déclarer les statuts de légalité disponibles pour les objets ;
 * - associer chaque statut à sa clé i18n ;
 * - normaliser les valeurs stockées dans les items.
 *
 * Ce fichier doit rester un petit référentiel système.
 * Il ne doit pas contenir de logique de marchand, de prix, de disponibilité
 * ou de règles liées aux autorités.
 */

const DEFAULT_ITEM_LEGALITY = "legal";

export const ITEM_LEGALITY = {
  legal: "ETERN.ITEM.LEGALITY.LEGAL",
  illegal: "ETERN.ITEM.LEGALITY.ILLEGAL"
};

/**
 * Normalise la légalité d’un item.
 *
 * Valeurs autorisées :
 * - `legal`
 * - `illegal`
 *
 * Toute valeur absente ou inconnue revient au fallback.
 * Si le fallback fourni est lui-même invalide, la fonction revient à `legal`.
 *
 * @param {unknown} value - Valeur brute à normaliser.
 * @param {string} [fallback=DEFAULT_ITEM_LEGALITY] - Valeur utilisée si l’entrée est invalide.
 * @returns {"legal"|"illegal"} Légalité normalisée.
 */
export function normalizeItemLegality(value, fallback = DEFAULT_ITEM_LEGALITY) {
  const normalized = String(value ?? "").trim().toLowerCase();
  const safeFallback = fallback in ITEM_LEGALITY ? fallback : DEFAULT_ITEM_LEGALITY;

  return normalized in ITEM_LEGALITY ? normalized : safeFallback;
}