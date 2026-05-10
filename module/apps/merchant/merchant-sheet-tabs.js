/**
 * Extension de fiche marchand : Merchant sheet tabs.
 *
 * Responsabilités :
 * - gérer une section ou un comportement de la fiche marchand ;
 * - préparer les données d’affichage liées au commerce ;
 * - déléguer les calculs de richesse et de transaction aux services dédiés.
 *
 * Ce fichier doit rester un module UI de marchand.
 */

export function bindMerchantTabs(sheet, root) {
  for (const tab of root.querySelectorAll('.merchant-sheet-tabs .item[data-tab]')) {
    if (tab.dataset.boundMerchantTab === '1') continue;

    tab.dataset.boundMerchantTab = '1';
    tab.addEventListener('click', (event) => {
      event.preventDefault();
      setMerchantTab(sheet, root, tab.dataset.tab);
    });
  }
}

export function activateInitialMerchantTab(sheet, root) {
  const initialTab = sheet._activeTab || root.querySelector('.merchant-sheet-tabs .item[data-tab]')?.dataset?.tab || 'stock';
  setMerchantTab(sheet, root, initialTab);
}

function setMerchantTab(sheet, root, tabId) {
  const nextTab = String(tabId || 'stock');
  sheet._activeTab = nextTab;

  for (const item of root.querySelectorAll('.merchant-sheet-tabs .item')) {
    item.classList.toggle('active', item.dataset.tab === nextTab);
  }

  for (const panel of root.querySelectorAll('.merchant-tab')) {
    const active = panel.dataset.tab === nextTab;
    panel.classList.toggle('active', active);
    panel.hidden = !active;
  }
}
