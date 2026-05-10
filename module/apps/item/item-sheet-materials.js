/**
 * Extension de fiche item : Item sheet materials.
 *
 * Responsabilités :
 * - préparer ou synchroniser la section correspondante de l’ItemSheetV2 ;
 * - gérer les actions utilisateur liées à l’item affiché ;
 * - éviter de mélanger rendu, règles et persistance dans un même bloc.
 *
 * Ce fichier doit rester spécialisé par section de fiche item.
 */

import {
  getDefaultAlchemicalTag,
  normalizeAlchemicalTag,
  normalizeMaterialCategory
} from "../../system/constants/materials.js";

export function bindMaterialSelectListeners(sheet, root) {
  if (sheet.item?.type !== "material") return;

  const categorySelect = root.querySelector('[name="system.category"]');
  if (categorySelect instanceof HTMLSelectElement) {
    categorySelect.dataset.boundAutosave = "1";
    if (categorySelect.dataset.boundMaterialCategory !== "1") {
      categorySelect.dataset.boundMaterialCategory = "1";
      categorySelect.addEventListener("change", async (event) => {
        const category = normalizeMaterialCategory(event.currentTarget?.value ?? "alchemical");
        const payload = { "system.category": category };

        if (category === "alchemical") {
          payload["system.tag"] = normalizeAlchemicalTag(sheet.item.system?.tag ?? getDefaultAlchemicalTag());
        }

        await sheet.item.update(payload);
        await sheet.render(false);
      });
    }
  }

  const tagSelect = root.querySelector('[name="system.tag"]');
  if (tagSelect instanceof HTMLSelectElement) {
    tagSelect.dataset.boundAutosave = "1";
    if (tagSelect.dataset.boundMaterialTag !== "1") {
      tagSelect.dataset.boundMaterialTag = "1";
      tagSelect.addEventListener("change", async (event) => {
        const nextTag = normalizeAlchemicalTag(event.currentTarget?.value ?? getDefaultAlchemicalTag());
        await sheet.item.update({ "system.tag": nextTag });
        await sheet.render(false);
      });
    }
  }
}
