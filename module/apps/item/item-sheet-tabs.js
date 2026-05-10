/**
 * Extension de fiche item : Item sheet tabs.
 *
 * Responsabilités :
 * - préparer ou synchroniser la section correspondante de l’ItemSheetV2 ;
 * - gérer les actions utilisateur liées à l’item affiché ;
 * - éviter de mélanger rendu, règles et persistance dans un même bloc.
 *
 * Ce fichier doit rester spécialisé par section de fiche item.
 */

export function activateInitialItemTab(sheet, root) {
  const initialTab = sheet._activeTab || root.querySelector('.sheet-tabs .item[data-tab]')?.dataset?.tab || null;
  setActiveTab(sheet, root, initialTab);
}

export function bindTabs(sheet, root) {
  for (const tab of root.querySelectorAll('.sheet-tabs .item[data-tab]')) {
    if (tab.dataset.boundTab === '1') continue;

    tab.dataset.boundTab = '1';
    tab.addEventListener('click', (event) => {
      event.preventDefault();
      setActiveTab(sheet, root, tab.dataset.tab);
    });
  }
}

function setActiveTab(sheet, root, tabId) {
  const nextTab = String(tabId || 'general');
  sheet._activeTab = nextTab;

  for (const item of root.querySelectorAll('.sheet-tabs .item')) {
    item.classList.toggle('active', item.dataset.tab === nextTab);
  }

  for (const panel of root.querySelectorAll('.tab')) {
    panel.classList.toggle('active', panel.dataset.tab === nextTab);
    panel.hidden = panel.dataset.tab !== nextTab;
  }
}
