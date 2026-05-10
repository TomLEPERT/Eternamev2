/**
 * Module d’action technique acteur : Filters.
 *
 * Responsabilités :
 * - isoler les interactions d’interface liées aux techniques d’acteur ;
 * - préparer les données nécessaires aux handlers ApplicationV2 ;
 * - déléguer la logique métier aux services système plutôt que de la dupliquer dans la fiche.
 *
 * Ce fichier doit rester centré sur le comportement UI d’une zone précise de la fiche acteur.
 */

function getTechniqueFilterState(sheet) {
  sheet._techniqueFilterState ??= { query: '', preparedOnly: false, sort: 'nameAsc' };
  return sheet._techniqueFilterState;
}

function normalizeSearchValue(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function registerTechniqueFilters(ActorSheetClass) {
  ActorSheetClass.prototype._restoreTechniqueFilters = function(root) {
    const state = getTechniqueFilterState(this);
    const search = root.querySelector('[data-technique-search]');
    if (search instanceof HTMLInputElement) search.value = state.query;
    const preparedToggle = root.querySelector('[data-technique-filter="prepared"]');
    if (preparedToggle instanceof HTMLInputElement) preparedToggle.checked = state.preparedOnly;
    const sort = root.querySelector('[data-technique-sort]');
    if (sort instanceof HTMLSelectElement) sort.value = state.sort;
  };

  ActorSheetClass.prototype._applyTechniqueFilters = function(root = null) {
    const host = root ?? this._getRootElement?.();
    if (!(host instanceof HTMLElement)) return;

    const state = getTechniqueFilterState(this);
    const query = normalizeSearchValue(state.query);
    const preparedOnly = Boolean(state.preparedOnly);
    const rows = Array.from(host.querySelectorAll('[data-technique-entry]'));
    for (const row of rows) {
      const searchText = normalizeSearchValue(row.dataset.techniqueSearch ?? '');
      const isPrepared = row.dataset.techniquePrepared === '1';
      const visible = (!preparedOnly || isPrepared) && (!query || searchText.includes(query));
      row.hidden = !visible;
    }

    const list = host.querySelector('[data-technique-list]');
    if (list instanceof HTMLElement) {
      const sorted = rows.sort((left, right) => compareTechniqueRows(left, right, state.sort));
      for (const row of sorted) list.append(row);
    }

    const empty = host.querySelector('[data-technique-empty-filtered]');
    if (empty instanceof HTMLElement) {
      const visibleCount = rows.filter((row) => !row.hidden).length;
      empty.hidden = visibleCount > 0;
    }
  };

  ActorSheetClass.prototype._onTechniqueSearchInput = function(event) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const state = getTechniqueFilterState(this);
    state.query = input.value ?? '';
    this._applyTechniqueFilters();
  };

  ActorSheetClass.prototype._onTechniquePreparedFilterChange = function(event) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const state = getTechniqueFilterState(this);
    state.preparedOnly = input.checked;
    this._applyTechniqueFilters();
  };

  ActorSheetClass.prototype._onTechniqueSortChange = function(event) {
    const select = event.target;
    if (!(select instanceof HTMLSelectElement)) return;
    const state = getTechniqueFilterState(this);
    state.sort = String(select.value ?? 'nameAsc');
    this._applyTechniqueFilters();
  };
}

function compareTechniqueRows(left, right, sortMode = 'nameAsc') {
  switch (String(sortMode ?? 'nameAsc')) {
    case 'nameDesc':
      return compareStrings(right.dataset.techniqueName, left.dataset.techniqueName);
    case 'powerDesc':
      return compareNumbers(right.dataset.techniquePower, left.dataset.techniquePower) || compareStrings(left.dataset.techniqueName, right.dataset.techniqueName);
    case 'xpDesc':
      return compareNumbers(right.dataset.techniqueXp, left.dataset.techniqueXp) || compareStrings(left.dataset.techniqueName, right.dataset.techniqueName);
    case 'status':
      return compareNumbers(getValidationRank(left.dataset.techniqueValidation), getValidationRank(right.dataset.techniqueValidation)) || compareStrings(left.dataset.techniqueName, right.dataset.techniqueName);
    case 'nameAsc':
    default:
      return compareStrings(left.dataset.techniqueName, right.dataset.techniqueName);
  }
}

function compareStrings(left, right) {
  return String(left ?? '').localeCompare(String(right ?? ''), game.i18n.lang, { sensitivity: 'base' });
}

function compareNumbers(left, right) {
  return (Number(left ?? 0) || 0) - (Number(right ?? 0) || 0);
}

function getValidationRank(value) {
  switch (String(value ?? 'warning')) {
    case 'success': return 0;
    case 'warning': return 1;
    case 'error': return 2;
    default: return 1;
  }
}
