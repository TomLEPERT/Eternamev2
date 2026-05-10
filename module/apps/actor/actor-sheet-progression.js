/**
 * Extension de fiche acteur : Actor sheet progression.
 *
 * Responsabilités :
 * - ajouter à l’ActorSheetV2 les comportements propres à cette section ;
 * - lire ou mettre à jour uniquement les champs nécessaires à l’interface ;
 * - conserver les calculs de règles dans les modules `rules` ou `system`.
 *
 * Ce fichier doit rester un module UI spécialisé et ne pas devenir un service métier.
 */

import { deriveProgressTracks, normalizeTrackBoxes, parseObjectivesText } from "../../rules/derived/progression.js";

function getTracks(document) {
  return foundry.utils.deepClone(document.system?.progressTracks ?? []);
}

function normalizeTrack(track = {}) {
  const objectives = parseObjectivesText(track.objectivesText ?? track.objectives);
  return {
    id: String(track.id ?? foundry.utils.randomID()),
    name: String(track.name ?? ""),
    objectivesText: objectives.join(', '),
    objectives,
    boxes: normalizeTrackBoxes(track.boxes)
  };
}

export function registerActorSheetProgression(ActorSheetClass) {
  ActorSheetClass.prototype._refreshProgressTracks = function(root) {
    if (!root) return;

    const tracks = deriveProgressTracks(this.document.system?.progressTracks ?? []);
    for (const track of tracks) {
      const row = root.querySelector(`.progress-track-v2[data-track-index="${track.index}"]`);
      if (!row) continue;

      const objectivesInput = row.querySelector('[data-track-field="objectivesText"]');
      if (objectivesInput && document.activeElement !== objectivesInput) {
        objectivesInput.value = track.objectivesText;
      }

      const boxes = row.querySelectorAll('.progress-track-box');
      boxes.forEach((box) => {
        const index = Number(box.dataset.boxIndex);
        const slot = track.slots[index];
        if (!slot) return;
        box.classList.toggle('active', slot.checked);
        box.classList.toggle('objective', slot.isObjective);
        box.setAttribute('aria-pressed', slot.checked ? 'true' : 'false');
      });
    }
  };

  ActorSheetClass.prototype._saveProgressTracks = async function(tracks, activeElement = null, rerender = false) {
    const normalized = tracks.map(normalizeTrack);
    if (rerender) this._captureViewState(activeElement);
    await this.document.update({ 'system.progressTracks': normalized }, { render: false });
    if (rerender) this.render(false);
    else this._refreshProgressTracks(this._getRootElement());
  };

  ActorSheetClass.prototype._onCreateProgressTrack = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) return;
    const tracks = getTracks(this.document);
    tracks.push(normalizeTrack({ name: '', objectivesText: '', boxes: Array(12).fill(false) }));
    await this._saveProgressTracks(tracks, target, true);
  };

  ActorSheetClass.prototype._onDeleteProgressTrack = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) return;
    const index = Number(target.dataset.trackIndex);
    if (!Number.isInteger(index) || index < 0) return;
    const tracks = getTracks(this.document);
    if (index >= tracks.length) return;
    tracks.splice(index, 1);
    await this._saveProgressTracks(tracks, target, true);
  };

  ActorSheetClass.prototype._onProgressTrackFieldInput = async function(event) {
    const field = event.target;
    if (!(field instanceof HTMLInputElement)) return;
    if (!this.document.isOwner) return;
    const index = Number(field.dataset.trackIndex);
    const trackField = String(field.dataset.trackField ?? '');
    if (!Number.isInteger(index) || index < 0 || !trackField) return;
    const tracks = getTracks(this.document);
    const track = tracks[index];
    if (!track) return;
    track[trackField] = field.value ?? '';
    await this._saveProgressTracks(tracks, field, false);
  };

  ActorSheetClass.prototype._onProgressTrackBoxClick = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;
    const button = event.currentTarget;
    if (!(button instanceof HTMLButtonElement)) return;
    const trackIndex = Number(button.dataset.trackIndex);
    const boxIndex = Number(button.dataset.boxIndex);
    if (!Number.isInteger(trackIndex) || !Number.isInteger(boxIndex) || trackIndex < 0 || boxIndex < 0 || boxIndex > 11) return;
    const tracks = getTracks(this.document);
    const track = tracks[trackIndex];
    if (!track) return;
    track.boxes = normalizeTrackBoxes(track.boxes);
    track.boxes[boxIndex] = !track.boxes[boxIndex];
    await this._saveProgressTracks(tracks, button, false);
  };
}
