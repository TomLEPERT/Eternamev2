/**
 * Règle pure de donnée dérivée : Progression.
 *
 * Responsabilités :
 * - calculer une valeur de jeu à partir des données source ;
 * - éviter toute écriture directe dans les documents Foundry ;
 * - rester réutilisable par les fiches, jets et préparateurs de données.
 *
 * Ce fichier ne doit pas contenir de rendu ni de persistance.
 */

export function parseObjectivesText(value) {
  const text = String(value ?? "");
  if (!text.trim()) return [];

  const values = text
    .split(/[^0-9]+/g)
    .map((entry) => Number(entry))
    .filter((entry) => Number.isInteger(entry) && entry >= 1 && entry <= 12);

  return Array.from(new Set(values)).sort((a, b) => a - b);
}

export function normalizeTrackBoxes(value) {
  const list = Array.isArray(value) ? value.slice(0, 12) : [];
  while (list.length < 12) list.push(false);
  return list.map((entry) => Boolean(entry));
}

export function deriveProgressTracks(tracks = []) {
  return (Array.isArray(tracks) ? tracks : []).map((track, index) => {
    const objectives = Array.isArray(track?.objectives) && track.objectives.length
      ? track.objectives.map((entry) => Number(entry)).filter((entry) => Number.isInteger(entry) && entry >= 1 && entry <= 12)
      : parseObjectivesText(track?.objectivesText);

    const objectiveSet = new Set(objectives);
    const boxes = normalizeTrackBoxes(track?.boxes);

    return {
      id: String(track?.id ?? ''),
      index,
      name: String(track?.name ?? ''),
      objectivesText: objectives.join(', '),
      objectives,
      slots: Array.from({ length: 12 }, (_, boxIndex) => ({
        index: boxIndex,
        trackIndex: index,
        checked: Boolean(boxes[boxIndex]),
        isObjective: objectiveSet.has(boxIndex + 1)
      }))
    };
  });
}
