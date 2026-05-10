/**
 * Extension de fiche item : Item sheet bags.
 *
 * Responsabilités :
 * - préparer ou synchroniser la section correspondante de l’ItemSheetV2 ;
 * - gérer les actions utilisateur liées à l’item affiché ;
 * - éviter de mélanger rendu, règles et persistance dans un même bloc.
 *
 * Ce fichier doit rester spécialisé par section de fiche item.
 */

export function bindBagListeners(sheet, root) {
  if (sheet.item?.type !== 'bag') return;

  root.querySelectorAll('[data-action="bag-store-item"]').forEach((button) => {
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      if (!sheet.item?.isOwner) return;
      const actor = sheet.item.parent;
      const itemId = String(button.dataset.itemId ?? '');
      const target = actor?.items.get(itemId);
      if (!actor || !target || target.id === sheet.item.id) return;
      const qty = Math.max(1, Math.floor(Number(target.system?.quantity ?? 1) || 1));
      const weight = Number(target.system?.weight ?? 0) || 0;
      const currentLoad = Number(sheet.item.system?.derived?.loadWeight ?? 0) || 0;
      const capacity = Number(sheet.item.system?.capacityWeight ?? 0) || 0;
      if ((currentLoad + (qty * weight)) > capacity) {
        ui.notifications.warn(game.i18n.localize('ETERN.BAG.ERROR_OVER_CAPACITY'));
        return;
      }
      await target.update({
        'system.location': 'bag',
        'system.containerId': String(sheet.item.id)
      });
      sheet.render(false);
      actor.sheet?.render(false);
    });
  });

  root.querySelectorAll('[data-action="bag-remove-item"]').forEach((button) => {
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      if (!sheet.item?.isOwner) return;
      const actor = sheet.item.parent;
      const itemId = String(button.dataset.itemId ?? '');
      const target = actor?.items.get(itemId);
      if (!actor || !target) return;
      await target.update({
        'system.location': String(sheet.item.system?.location ?? 'backpack'),
        'system.containerId': ''
      });
      sheet.render(false);
      actor.sheet?.render(false);
    });
  });
}
