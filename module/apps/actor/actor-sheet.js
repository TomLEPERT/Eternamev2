/**
 * Extension de fiche acteur : Actor sheet.
 *
 * Responsabilités :
 * - ajouter à l’ActorSheetV2 les comportements propres à cette section ;
 * - lire ou mettre à jour uniquement les champs nécessaires à l’interface ;
 * - conserver les calculs de règles dans les modules `rules` ou `system`.
 *
 * Ce fichier doit rester un module UI spécialisé et ne pas devenir un service métier.
 */

import { registerActorSheetView } from "./actor-sheet-view.js";
import { registerActorSheetRolls } from "./actor-sheet-rolls.js";
import { registerActorSheetResources } from "./actor-sheet-resources.js";
import { registerActorSheetMovement } from "./actor-sheet-movement.js";
import { registerActorSheetMagic } from "./actor-sheet-magic.js";
import { registerActorSheetItems } from "./actor-sheet-items.js";
import { registerActorSheetAttacks } from "./actor-sheet-attacks.js";
import { registerActorSheetSaves } from "./actor-sheet-saves.js";
import { registerActorSheetProgression } from "./actor-sheet-progression.js";
import { registerActorSheetInventory } from "./actor-sheet-inventory.js";
import { registerActorSheetTechniques } from "./actor-sheet-techniques.js";
import { registerActorSheetBonusStates } from "./actor-sheet-bonus-states.js";
import { registerActorSheetAutosave } from "./actor-sheet-autosave.js";
import { bindCharacterSheetRender, registerActorSheetRender } from "./actor-sheet-render.js";
import { prepareCharacterSheetContext } from "./actor-sheet-context.js";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const Base = HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2);

export class CharacterSheet extends Base {
  static DEFAULT_OPTIONS = {
    ...super.DEFAULT_OPTIONS,
    classes: ["eternamev2", "sheet", "actor", "character"],
    position: { width: 1440, height: 1440 },
    form: {
      handler: CharacterSheet.#onSubmit,
      submitOnChange: false,
      closeOnSubmit: false
    }
  };

  static PARTS = {
    ...super.PARTS,
    body: {
      template: "systems/eternamev2/templates/actor/character-sheet.hbs"
    }
  };

  constructor(options = {}) {
    super(options);
    this._pendingFieldSaves = new Map();
    this._restoreView = null;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    return prepareCharacterSheetContext.call(this, context, options);
  }

  static async #onSubmit(event, form, formData) {
    await this.document.update(formData.object);
  }

  async _onClickPortrait(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;

    const current = this.document.img || "icons/svg/mystery-man.svg";
    const FilePickerApp = foundry.applications.apps.FilePicker.implementation;
    const fp = new FilePickerApp({
      type: "image",
      current,
      callback: (path) => this.document.update({ img: path })
    });

    fp.render(true);
  }

  _onRender(context, options) {
    super._onRender(context, options);

    const root = this._getRootElement();
    if (!root) return;

    bindCharacterSheetRender.call(this, root, context, options);
  }
}

registerActorSheetView(CharacterSheet);
registerActorSheetRolls(CharacterSheet);
registerActorSheetResources(CharacterSheet);
registerActorSheetMovement(CharacterSheet);
registerActorSheetMagic(CharacterSheet);
registerActorSheetItems(CharacterSheet);
registerActorSheetAttacks(CharacterSheet);
registerActorSheetSaves(CharacterSheet);
registerActorSheetProgression(CharacterSheet);
registerActorSheetInventory(CharacterSheet);
registerActorSheetTechniques(CharacterSheet);
registerActorSheetBonusStates(CharacterSheet);
registerActorSheetAutosave(CharacterSheet);
registerActorSheetRender(CharacterSheet);