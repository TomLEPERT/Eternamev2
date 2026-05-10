/**
 * Extension de fiche marchand : Merchant sheet.
 *
 * Responsabilités :
 * - gérer une section ou un comportement de la fiche marchand ;
 * - préparer les données d’affichage liées au commerce ;
 * - déléguer les calculs de richesse et de transaction aux services dédiés.
 *
 * Ce fichier doit rester un module UI de marchand.
 */

import { prepareMerchantSheetContext } from "./merchant-sheet-context.js";
import { bindMerchantSheetRender, registerMerchantSheetRender } from "./merchant-sheet-render.js";
import { registerMerchantSheetTrade } from "./merchant-sheet-trade.js";
import { registerMerchantSheetAutosave } from "./merchant-sheet-autosave.js";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const Base = HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2);

export class MerchantSheet extends Base {
  static DEFAULT_OPTIONS = {
    ...super.DEFAULT_OPTIONS,
    classes: ["eternamev2", "sheet", "actor", "merchant"],
    position: { width: 1180, height: 900 },
    form: {
      handler: MerchantSheet.#onSubmit,
      submitOnChange: true,
      closeOnSubmit: false
    }
  };

  static PARTS = {
    ...super.PARTS,
    body: {
      template: "systems/eternamev2/templates/actor/merchant-sheet.hbs"
    }
  };

  constructor(options = {}) {
    super(options);
    this._sessionDiscountPercent = 0;
    this._activeTab = "stock";
    this._pendingFieldSaves = new Map();
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    return prepareMerchantSheetContext.call(this, context, options);
  }

  static async #onSubmit(_event, _form, formData) {
    await this.document.update(formData.object);
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const root = this._getRootElement?.() ?? this.element;
    if (root) bindMerchantSheetRender.call(this, root, context, options);
  }

  async close(options = {}) {
    this._sessionDiscountPercent = 0;
    this._activeTab = "stock";
    return super.close(options);
  }
}

registerMerchantSheetRender(MerchantSheet);
registerMerchantSheetTrade(MerchantSheet);
registerMerchantSheetAutosave(MerchantSheet);
