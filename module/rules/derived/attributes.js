/**
 * Règle pure de donnée dérivée : Attributes.
 *
 * Responsabilités :
 * - calculer une valeur de jeu à partir des données source ;
 * - éviter toute écriture directe dans les documents Foundry ;
 * - rester réutilisable par les fiches, jets et préparateurs de données.
 *
 * Ce fichier ne doit pas contenir de rendu ni de persistance.
 */

export function valueToIndex(value) {
  const n = Number(value ?? 0);

  if (n <= 0) return "_";
  if (n <= 2) return "6+";
  if (n <= 5) return "5+";
  if (n <= 10) return "4+";
  if (n <= 15) return "3+";
  return "2+";
}

export function indexStringToTarget(indexStr) {
  if (!indexStr || indexStr === "_" || indexStr === "—") return 7;
  const match = String(indexStr).match(/^(\d)\+$/);
  return match ? Number(match[1]) : 7;
}

export function targetToIndexString(target) {
  const t = Number(target);
  if (!Number.isFinite(t) || t >= 7) return "_";
  return `${t}+`;
}

export function buildAttributeTicks(ticks) {
  const total = Math.max(0, Math.min(4, Number(ticks ?? 0)));

  return Array.from({ length: 4 }, (_, i) => ({
    index: i,
    active: i < total
  }));
}

export function nextTickValue(current, clickedIndex) {
  const now = Number(current ?? 0);
  const idx = Number(clickedIndex ?? 0);

  return now === idx + 1 ? idx : idx + 1;
}
