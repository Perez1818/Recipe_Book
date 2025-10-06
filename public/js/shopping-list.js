/******** DELETE ON MINUS ********/
document.addEventListener('click', (e) => {
  const container = e.target.closest('.ingredient-tile-container');
  if (!container) return;

  const firstSvg = container.querySelector(':scope > svg');
  if (!firstSvg) return;

  if (firstSvg === e.target || firstSvg.contains(e.target)) {
    container.remove();
  }
});

/******** SEARCH → ADD TILE ********/
const SEARCH_INPUT_SELECTOR = '#search';
const SHOPPING_LIST_SELECTOR = '#shopping-list';

/* ---- API call to your Express proxy ---- */
async function searchIngredients(q) {
  const r = await fetch(`/api/ingredients?q=${encodeURIComponent(q)}`, {
    headers: { Accept: 'application/json' },
  });
  if (!r.ok) return [];
  const { items } = await r.json();
  return items || [];
}

/* ---- Section mapping ---- */
function mapAisleToSection(aisle = '') {
  const a = aisle.toLowerCase();
  if (a.includes('produce')) return 'Fresh Produce';
  if (/(meat|seafood|fish|poultry)/.test(a)) return 'Meat & Seafood';
  if (/(dairy|cheese|milk|yogurt|butter|eggs)/.test(a)) return 'Dairy';
  if (/(bakery|bread|tortilla)/.test(a)) return 'Bread';
  if (a.includes('frozen')) return 'Frozen Goods';
  if (/(canned|pasta|rice|beans|grains|dry goods|jarred)/.test(a)) return 'Canned & Dry Goods';
  if (/(snacks|beverages|soda|juice|candy|cookies|chips)/.test(a)) return 'Snacks & Beverages';
  if (/(condiments|sauces|spices|seasonings|nut butter|jam|honey)/.test(a)) return 'Condiments & Spices';
  return 'Fresh Produce';
}

function findSectionByTitle(title) {
  return [...document.querySelectorAll(`${SHOPPING_LIST_SELECTOR} > section`)]
    .find(sec => (sec.querySelector('h2')?.textContent || '').trim() === title);
}

/* ---- Create a tile that matches your markup ---- */
function addIngredientTile(item) {
  const listRoot = document.querySelector(SHOPPING_LIST_SELECTOR);
  const sectionTitle = mapAisleToSection(item.aisle);
  const section = findSectionByTitle(sectionTitle) || listRoot;

  // container
  const container = document.createElement('div');
  container.className = 'ingredient-tile-container';

  // left minus SVG (works with your delete handler)
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', '40px');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke-width', '1.5');
  svg.setAttribute('stroke', 'currentColor');
  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  path.setAttribute('d', 'M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z');
  svg.appendChild(path);
  svg.style.cursor = 'pointer';
  container.appendChild(svg);

  // tile
  const tile = document.createElement('div');
  tile.className = 'ingredient-tile';

  const img = document.createElement('img');
  img.width = 25; img.height = 25;
  img.src = item.image || '';
  img.alt = item.name;

  const nameQty = document.createElement('div');
  nameQty.id = 'name-quanitity'; // keep your existing id
  const b = document.createElement('b');
  const p = document.createElement('p');
  p.textContent = item.name;
  b.appendChild(p);
  const qty = document.createElement('input');
  qty.type = 'number'; qty.className = 'quantity'; qty.name = 'quantity';
  qty.min = '1'; qty.max = '100'; qty.step = '1'; qty.placeholder = '1'; qty.value = '1';
  nameQty.append(b, qty);

  const desc = document.createElement('p');
  desc.className = 'ingredient-text-container';
  desc.textContent = item.aisle || 'Added from search';

  tile.append(img, nameQty, desc);
  container.appendChild(tile);

  if (section?.tagName === 'SECTION') section.appendChild(container);
  else listRoot.appendChild(container);
}

/******** AUTOCOMPLETE DROPDOWN ********/
const DEBOUNCE_MS = 250;
const $ = (s, r = document) => r.querySelector(s);

function ensureSuggestionHost(input) {
  let host = $('#search-suggestions');
  if (host) return host;

  host = document.createElement('div');
  host.id = 'search-suggestions';
  host.setAttribute('role', 'listbox');
  host.style.position = 'absolute';
  host.style.zIndex = '1000';
  host.style.marginTop = '6px';
  input.insertAdjacentElement('afterend', host);

  const place = () => {
    const rect = input.getBoundingClientRect();
    const sl = window.pageXOffset || document.documentElement.scrollLeft;
    const st = window.pageYOffset || document.documentElement.scrollTop;
    host.style.left  = `${rect.left + sl}px`;
    host.style.top   = `${rect.bottom + st}px`;
    host.style.width = `${rect.width}px`;
  };
  place();
  window.addEventListener('resize', place);
  window.addEventListener('scroll', place, true);

  return host;
}

function clearSuggestions() {
  const host = $('#search-suggestions');
  if (host) host.innerHTML = '';
}

function renderSuggestions(items, onPick) {
  const input = $(SEARCH_INPUT_SELECTOR);
  const host = ensureSuggestionHost(input);
  host.innerHTML = '';
  if (!items.length) return;

  const ul = document.createElement('ul');
  Object.assign(ul.style, {
    listStyle: 'none', margin: 0, padding: '6px',
    background: '#fffef0', border: '2px solid #111',
    borderRadius: '10px', boxShadow: '0 2px 0 rgba(0,0,0,.2)',
  });

  items.forEach((it, idx) => {
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    li.dataset.index = String(idx);
    li.tabIndex = -1; // allow ArrowUp/Down to focus
    Object.assign(li.style, {
      display: 'grid', gridTemplateColumns: '34px 1fr',
      gap: '10px', padding: '8px 10px',
      borderRadius: '8px', cursor: 'pointer'
    });

    const img = document.createElement('img');
    img.src = it.image || ''; img.alt = ''; img.width = 34; img.height = 34;
    img.style.borderRadius = '8px'; img.style.background = '#d6d6d6';

    const wrap = document.createElement('div');
    const title = document.createElement('div'); title.textContent = it.name; title.style.fontWeight = '600';
    const sub   = document.createElement('div'); sub.textContent = it.aisle || ''; sub.style.opacity = '.8'; sub.style.fontSize = '.9rem';
    wrap.append(title, sub);

    li.append(img, wrap);
    li.addEventListener('mouseover', () => li.style.background = '#fff7cc');
    li.addEventListener('mouseout',  () => li.style.background = 'transparent');
    li.addEventListener('click', () => onPick(it));
    ul.appendChild(li);
  });

  host.appendChild(ul);
}

/* ---- Single debounce (keep only this one) ---- */
const debounce = (fn, ms) => {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
};

/* ---- Wire up the search input ---- */
function initIngredientSearch() {
  const input = document.querySelector(SEARCH_INPUT_SELECTOR);
  if (!input) return;

  input.setAttribute('autocomplete', 'off');

  const run = debounce(async () => {
    const q = input.value.trim();
    if (q.length < 2) { clearSuggestions(); return; }
    const results = await searchIngredients(q);
    renderSuggestions(results, (picked) => {
      addIngredientTile(picked);
      input.value = '';
      clearSuggestions();
      input.focus();
    });
  }, DEBOUNCE_MS);

  // Show dropdown while typing
  input.addEventListener('input', run);

  // Keyboard interactions
  input.addEventListener('keydown', (e) => {
    const items = [...document.querySelectorAll('#search-suggestions li')];
    const first = items[0];

    if (e.key === 'Enter' && first) { e.preventDefault(); first.click(); }
    if (e.key === 'Escape') { clearSuggestions(); return; }

    const active = document.activeElement;
    let i = items.indexOf(active);
    if (e.key === 'ArrowDown' && items.length) {
      e.preventDefault();
      items[Math.min(i + 1, items.length - 1) || 0].focus();
    }
    if (e.key === 'ArrowUp' && items.length) {
      e.preventDefault();
      items[Math.max(i - 1, 0)].focus();
    }
  });

  // Click outside to close
  document.addEventListener('click', (e) => {
    const host = document.getElementById('search-suggestions');
    if (!host) return;
    if (e.target === host || host.contains(e.target) || e.target === input) return;
    clearSuggestions();
  });
}

/* ---- Boot it up ---- */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initIngredientSearch);
} else {
  initIngredientSearch();
}
