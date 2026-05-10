/**
 * Extension de fiche acteur : Actor sheet movement.
 *
 * Responsabilités :
 * - ajouter à l’ActorSheetV2 les comportements propres à cette section ;
 * - lire ou mettre à jour uniquement les champs nécessaires à l’interface ;
 * - conserver les calculs de règles dans les modules `rules` ou `system`.
 *
 * Ce fichier doit rester un module UI spécialisé et ne pas devenir un service métier.
 */

function normalizeMovementValue(value) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.floor(number));
}

function normalizeMovementMode(mode) {
  return {
    id: String(mode?.id ?? foundry.utils.randomID()),
    name: String(mode?.name ?? ""),
    value: normalizeMovementValue(mode?.value),
    auto: false
  };
}

export function registerActorSheetMovement(ActorSheetClass) {
  ActorSheetClass.prototype._getMovementModes = function() {
    const modes = Array.isArray(this.document.system?.movement?.modes)
      ? this.document.system.movement.modes
      : [];

    return modes
      .filter((mode) => !mode?.auto && String(mode?.id ?? "") !== "walk")
      .map(normalizeMovementMode);
  };

  ActorSheetClass.prototype._saveMovementModes = async function(modes, activeElement = null, rerender = true) {
    this._captureViewState(activeElement);

    const normalized = modes.map(normalizeMovementMode);

    await this.document.update(
      { "system.movement.modes": normalized },
      { render: false }
    );

    if (rerender) this.render(false);
    else this._refreshMovement(this._getRootElement(), this.document.system?.derived?.movement ?? {});
  };

  ActorSheetClass.prototype._onCreateMovementMode = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;

    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) return;

    const modes = this._getMovementModes();
    modes.push(
      normalizeMovementMode({
        id: foundry.utils.randomID(),
        name: game.i18n.localize("ETERN.MOVEMENT.DEFAULT_NAME"),
        value: 0
      })
    );

    await this._saveMovementModes(modes, target, true);
  };

  ActorSheetClass.prototype._onDeleteMovementMode = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;

    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) return;

    const modeId = target.dataset.modeId;
    if (!modeId) return;

    const modes = this._getMovementModes().filter((mode) => mode.id !== modeId);
    await this._saveMovementModes(modes, target, true);
  };

  ActorSheetClass.prototype._onMovementModeFieldChange = async function(event) {
    const field = event.target;
    if (!(field instanceof HTMLInputElement)) return;

    const modeId = field.dataset.modeId;
    const modeField = field.dataset.modeField;
    if (!modeId || !modeField) return;

    const modes = this._getMovementModes();
    const mode = modes.find((entry) => entry.id === modeId);
    if (!mode) return;

    if (modeField === "name") {
      mode.name = field.value ?? "";
    } else if (modeField === "value") {
      mode.value = normalizeMovementValue(field.value);
    } else {
      return;
    }

    await this._saveMovementModes(modes, field, false);
  };
}