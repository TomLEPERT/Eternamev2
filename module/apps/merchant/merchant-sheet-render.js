/**
 * Extension de fiche marchand : Merchant sheet render.
 *
 * Responsabilités :
 * - gérer une section ou un comportement de la fiche marchand ;
 * - préparer les données d’affichage liées au commerce ;
 * - déléguer les calculs de richesse et de transaction aux services dédiés.
 *
 * Ce fichier doit rester un module UI de marchand.
 */

import { activateInitialMerchantTab, bindMerchantTabs } from "./merchant-sheet-tabs.js";

export function bindMerchantSheetRender(root) {
  bindMerchantTabs(this, root);
  activateInitialMerchantTab(this, root);

  this._bindMerchantElements(root, { selector: 'input[name], select[name], textarea[name]', datasetKey: 'boundMerchantFieldInput', eventName: 'input', handlerName: '_onMerchantFieldInput' });
  this._bindMerchantElements(root, { selector: 'input[name], select[name], textarea[name]', datasetKey: 'boundMerchantFieldChange', eventName: 'change', handlerName: '_onMerchantFieldChange' });
  this._bindMerchantElements(root, { selector: 'textarea[name]', datasetKey: 'boundMerchantFieldBlur', eventName: 'blur', handlerName: '_onMerchantFieldBlur' });
  this._bindMerchantElements(root, { selector: '[data-action="merchant-buy"]', datasetKey: 'boundMerchantBuy', eventName: 'click', handlerName: '_onMerchantBuy' });
  this._bindMerchantElements(root, { selector: '[data-merchant-trade-actor]', datasetKey: 'boundMerchantTradeActor', eventName: 'change', handlerName: '_onMerchantTradeActorChange' });
  this._bindMerchantElements(root, { selector: '[data-action="merchant-set-discount"]', datasetKey: 'boundMerchantDiscount', eventName: 'click', handlerName: '_onMerchantSetDiscount' });
  this._bindMerchantElements(root, { selector: '[data-action="merchant-reset-discount"]', datasetKey: 'boundMerchantDiscountReset', eventName: 'click', handlerName: '_onMerchantResetDiscount' });
  this._bindMerchantElements(root, { selector: '[data-action="merchant-edit-price"]', datasetKey: 'boundMerchantEditPrice', eventName: 'click', handlerName: '_onMerchantStockEditPrice' });
  this._bindMerchantElements(root, { selector: '[data-action="merchant-delete-stock"]', datasetKey: 'boundMerchantDeleteStock', eventName: 'click', handlerName: '_onMerchantStockDelete' });
  this._bindMerchantElements(root, { selector: '[data-action="merchant-adjust-qty"]', datasetKey: 'boundMerchantAdjustQty', eventName: 'click', handlerName: '_onMerchantStockAdjustQty' });
  this._bindMerchantElements(root, { selector: '[data-merchant-dropzone="stock"]', datasetKey: 'boundMerchantStockDrag', eventName: 'dragover', handlerName: '_onMerchantStockDropDragover' });
  this._bindMerchantElements(root, { selector: '[data-merchant-dropzone="stock"]', datasetKey: 'boundMerchantStockDrop', eventName: 'drop', handlerName: '_onMerchantStockDrop' });
  this._bindMerchantElements(root, { selector: '[data-merchant-dropzone="sell"]', datasetKey: 'boundMerchantSellDrag', eventName: 'dragover', handlerName: '_onMerchantStockDropDragover' });
  this._bindMerchantElements(root, { selector: '[data-merchant-dropzone="sell"]', datasetKey: 'boundMerchantSellDrop', eventName: 'drop', handlerName: '_onMerchantSellDrop' });
}

export function registerMerchantSheetRender(MerchantSheetClass) {
  MerchantSheetClass.prototype._bindMerchantElements = function(root, { selector, datasetKey, eventName, handlerName }) {
    if (!root || typeof this[handlerName] !== 'function') return;
    for (const element of root.querySelectorAll(selector)) {
      if (element.dataset[datasetKey]) continue;
      element.dataset[datasetKey] = '1';
      element.addEventListener(eventName, this[handlerName].bind(this));
    }
  };
}
