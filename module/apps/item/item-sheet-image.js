/**
 * Extension de fiche item : Item sheet image.
 *
 * Responsabilités :
 * - préparer ou synchroniser la section correspondante de l’ItemSheetV2 ;
 * - gérer les actions utilisateur liées à l’item affiché ;
 * - éviter de mélanger rendu, règles et persistance dans un même bloc.
 *
 * Ce fichier doit rester spécialisé par section de fiche item.
 */

export function bindImageEditor(sheet, root) {
  const image = root.querySelector('[data-edit="img"]');
  if (!(image instanceof HTMLElement) || image.dataset.boundImage === '1') return;

  image.dataset.boundImage = '1';
  image.addEventListener('click', (event) => {
    event.preventDefault();
    if (!sheet.document.isOwner) return;

    const current = sheet.document.img || 'icons/svg/item-bag.svg';
    const FilePickerApp = foundry.applications.apps.FilePicker.implementation;
    const picker = new FilePickerApp({
      type: 'image',
      current,
      callback: (path) => sheet.document.update({ img: path })
    });

    picker.render(true);
  });
}
