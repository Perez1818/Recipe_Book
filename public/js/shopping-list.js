/* =============================================================================
   SHOPPING LIST — APP SCRIPT OVERVIEW
   -----------------------------------------------------------------------------
   What this file does (big picture)
   - Builds ingredient tiles from search results and “saved recipes”
   - Maps each ingredient into a grocery aisle section
   - Lets users “Buy” an item (opens retailer search), then confirm deletion
   - Persists the whole list (name, qty, image, aisle/section) in localStorage
   - Restores the list on page load and saves changes automatically

   ---------------------------------------------------------------------------
   Data model (localStorage)
   - Key: LIST_STORAGE_KEY = 'shoppingListV1'
   - Value: JSON array of tiles:
       [
         {
           name: String,            // e.g., "olive oil"
           qty: Number,             // e.g., 1
           image: String,           // image URL if we have one
           aisle: String            // section title, e.g., "Condiments & Spices"
         },
         ...
       ]
   - Persisted whenever tiles are added/removed or quantity changes (debounced).

   ---------------------------------------------------------------------------
   Major parts & key functions
   1) Persistence
      - serializeTile(container):  reads one tile from the DOM → {name, qty, image, aisle}
      - saveListFromDOM():         writes all tiles to localStorage (debounced via saveDebounced)
      - loadSavedList():           rebuilds tiles on page load, restoring quantities

   2) Search workflow
      - searchIngredients(q):      calls your Express proxy (/api/ingredients?q=...)
                                   and returns [{name, image, aisle}, ...]
      - addIngredientTile(item):   builds DOM for a tile (image, name+qty, description),
                                   adds a compact “Buy” button rail, and appends to the right section.
                                   Triggers saveDebounced() so the new item is persisted.

   3) Sections / aisle mapping
      - mapAisleToSection(aisle):  converts arbitrary aisle strings into your fixed sections:
                                   "Fresh Produce", "Meat & Seafood", "Dairy", "Bread",
                                   "Frozen Goods", "Canned & Dry Goods", "Snacks & Beverages",
                                   "Condiments & Spices"
      - findSectionByTitle(t):     finds the <section> element with the matching <h2> text

   4) Autocomplete dropdown
      - ensureSuggestionHost / renderSuggestions / clearSuggestions:
                                   lightweight suggestion list below the search bar
      - Keyboard + click handlers for quick selection

   5) Saved recipes → import ingredients
      - getBookmarkedRecipeIds():  reads recipe IDs from localStorage.bookmarkedRecipes (set by Home feed)
      - fetchRecipeById(id):       fetches full MealDB recipe; used to derive ingredients list
      - populateSavedRecipesSelect(): populates <select> with saved recipe names
      - addIngredientsFromSavedRecipe():
            • extracts up to 20 strIngredientN fields from the recipe
            • enriches each ingredient via enrichIngredientFromAPI() (below)
            • creates tiles with addIngredientTile()

      Enrichment helpers
      - normalizeIngredientName(): trims generic words that hurt search (e.g., “fresh”, “chopped”)
      - singularize():             simple plural → singular
      - guessAisleFromName():      fallback aisle guess if the API result has no aisle
      - enrichIngredientFromAPI(): tries multiple queries for a better match/image/aisle.
                                   Returns {name, image?, aisle} suitable for addIngredientTile.

   6) “Buy” flow + confirm removal
      - addBuyControls(container, name): adds a small blue Buy button to the card
      - Global click handler on .buy-btn:
            • opens the chosen retailer (Kroger/Walmart/Target/Google) in a new tab
            • shows a custom modal confirmRemove(name)
            • if user confirms: removes the tile and saves the list

      - confirmRemove(name): custom modal (not window.confirm) that resolves true/false

   7) Deleting a tile (minus icon)
      - Global click handler looks for the first SVG child of the tile container
        and removes the tile if that icon was clicked, then saves.

   8) Quantity changes
      - Global input handler for input.quantity triggers saveDebounced()

   9) Boot sequence (boot())
      - loadSavedList()                // restore from localStorage
      - initIngredientSearch()         // wire up search + suggestions
      - addBuyButtonsToExisting()      // ensure any pre-rendered tiles get a Buy button
      - populateSavedRecipesSelect()   // fill the saved-recipe dropdown
      - Hook “Add ingredients” button  // import from chosen saved recipe

   ---------------------------------------------------------------------------
   Extensibility notes
   - To change the persisted schema, bump LIST_STORAGE_KEY (e.g., 'shoppingListV2')
     and add a migration in loadSavedList().
   - To support more retailers: update retailerSearchUrl() in the price-check section.
   - To improve aisle mapping, expand mapAisleToSection() and guessAisleFromName().

   ---------------------------------------------------------------------------
   Guardrails & UX details
   - All localStorage writes are debounced (200ms) to avoid excessive I/O.
   - Modal is accessible and won’t block opening the retailer tab.
   - Class/ID names are coordinated with CSS and HTML; keep IDs like
     #name-quanitity, .quantity, .ingredient-tile-container, .buy-btn in sync.

============================================================================= */


/* ===== PERSISTENCE ===== */
const LIST_STORAGE_KEY = 'shoppingListV1';

function sectionTitleForContainer(container) {
  const sec = container.closest('section');
  return sec?.querySelector('h2')?.textContent?.trim() || '';
}

function serializeTile(container) {
  return {
    name: container.querySelector('#name-quanitity b p')?.textContent?.trim() || '',
    qty: Number(container.querySelector('input.quantity')?.value || 1),
    image: container.querySelector('img')?.src || '',
    aisle: sectionTitleForContainer(container),    // we’ll put it back into same section
  };
}

function saveListFromDOM() {
  const data = [...document.querySelectorAll('.ingredient-tile-container')]
    .map(serializeTile)
    .filter(it => it.name);
  localStorage.setItem(LIST_STORAGE_KEY, JSON.stringify(data));
}

function loadSavedList() {
  try {
    const raw = JSON.parse(localStorage.getItem(LIST_STORAGE_KEY) || '[]');
    if (!Array.isArray(raw)) return;
    raw.forEach(item => {
      // item has {name, qty, image, aisle}
      addIngredientTile(item);
      // set quantity after tile is created
      const last = [...document.querySelectorAll('.ingredient-tile-container')].pop();
      const qtyInput = last?.querySelector('input.quantity');
      if (qtyInput && item.qty) qtyInput.value = item.qty;
    });
  } catch {}
}

// light debounce to avoid spamming localStorage
const saveDebounced = (() => {
  let t;
  return () => { clearTimeout(t); t = setTimeout(saveListFromDOM, 200); };
})();

document.addEventListener('input', (e) => {
  if (e.target.matches('input.quantity')) saveDebounced();
});

/******** DELETE ON MINUS ********/
document.addEventListener('click', (e) => {
  const container = e.target.closest('.ingredient-tile-container');
  if (!container) return;

  const firstSvg = container.querySelector(':scope > svg');
  if (!firstSvg) return;

  if (firstSvg === e.target || firstSvg.contains(e.target)) {
    container.remove();
    saveDebounced();
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
  const known = ['Fresh Produce','Meat & Seafood','Dairy','Bread','Frozen Goods','Canned & Dry Goods','Snacks & Beverages','Condiments & Spices'];
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

  // --- tile (CREATE FIRST, then append)
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

  // Buy controls go AFTER the tile
  addBuyControls(container, item.name);

  if (section?.tagName === 'SECTION') section.appendChild(container);
  else listRoot.appendChild(container);

  saveDebounced();
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
    listStyle: 'none', margin: 0, padding: '6px 12px 6px 24px',
    background: '#fffef0', border: '2px solid #111',
    borderRadius: '10px', boxShadow: '0 2px 0 rgba(0,0,0,.2)',
  });

  items.forEach((it, idx) => {
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    li.dataset.index = String(idx);
    li.tabIndex = -1; // allow ArrowUp/Down to focus
    Object.assign(li.style, {
      display: 'grid', gridTemplateColumns: '112px 1fr',
      gap: '12px', padding: '10px 12px', alignItems: 'center',
      borderRadius: '8px', cursor: 'pointer'
    });

    const img = document.createElement('img');
    img.src = it.image || '';
    img.alt = '';
    img.style.setProperty('width', '96px', 'important');
    img.style.setProperty('height', '96px', 'important');
    img.style.objectFit = 'cover';
    img.style.display = 'block';
    img.style.borderRadius = '12px';

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

function confirmRemove(name){
  const host = document.getElementById('confirm-modal');
  const text = document.getElementById('cm-text');
  const ok   = document.getElementById('cm-ok');
  const cancel = document.getElementById('cm-cancel');

  return new Promise((resolve) => {
    text.textContent = `Did you buy "${name}"? Remove it from your shopping list?`;
    host.hidden = false;

    const cleanup = (val) => {
      host.hidden = true;
      ok.removeEventListener('click', onOk);
      cancel.removeEventListener('click', onCancel);
      host.removeEventListener('click', onBackdrop);
      resolve(val);
    };
    const onOk = () => cleanup(true);
    const onCancel = () => cleanup(false);
    const onBackdrop = (e) => { if (e.target === host) cleanup(false); };

    ok.addEventListener('click', onOk);
    cancel.addEventListener('click', onCancel);
    host.addEventListener('click', onBackdrop);
  });
}


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

function addBuyButtonsToExisting() {
  document.querySelectorAll('.ingredient-tile-container').forEach(c => {
    if (c.querySelector('.buy-btn')) return;
    const name = c.querySelector('#name-quanitity b p')?.textContent?.trim();
    if (name) addBuyControls(c, name);
  });
}

/* ===== Saved recipes → populate select & add ingredients ===== */

function getBookmarkedRecipeIds() {
  const raw = JSON.parse(localStorage.getItem('bookmarkedRecipes') || '{}');
  return Object.keys(raw).filter(id => raw[id]);
}

async function fetchRecipeById(id) {
  const r = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
  const data = await r.json();
  return data?.meals?.[0] || null;
}

async function populateSavedRecipesSelect() {
  const sel = document.getElementById('saved-recipe');
  const btn = document.getElementById('add-saved-ingredients');
  if (!sel || !btn) return;

  sel.innerHTML = `<option value="">Saved recipes…</option>`;
  sel.disabled = true; btn.disabled = true;

  const ids = getBookmarkedRecipeIds();
  if (!ids.length) {
    sel.innerHTML = `<option value="">No saved recipes yet</option>`;
    return;
  }

  // Fetch names; fall back to "Recipe {id}" on failure
  try {
    const recipes = await Promise.all(ids.map(fetchRecipeById));
    recipes.forEach((r, i) => {
      const opt = document.createElement('option');
      opt.value = r?.idMeal || ids[i];
      opt.textContent = r?.strMeal || `Recipe ${ids[i]}`;
      sel.appendChild(opt);
    });
  } catch {
    ids.forEach(id => {
      const opt = document.createElement('option');
      opt.value = id; opt.textContent = `Recipe ${id}`;
      sel.appendChild(opt);
    });
  }

  sel.disabled = false;
  btn.disabled = !sel.value;
  sel.addEventListener('change', () => (btn.disabled = !sel.value));
}

async function addIngredientsFromSavedRecipe() {
  const sel = document.getElementById('saved-recipe');
  if (!sel?.value) return;

  const recipe = await fetchRecipeById(sel.value);
  if (!recipe) return;

  // Pull ingredient names from TheMealDB fields
  const names = [];
  for (let i = 1; i <= 20; i++) {
    const v = (recipe[`strIngredient${i}`] || '').trim();
    if (!v) break;
    names.push(v);
  }

  // Reuse your existing search + add tile
  for (const name of names) {
    const enriched = await enrichIngredientFromAPI(name);
    addIngredientTile(enriched);
  }
}

// --- helpers to make search results richer for saved-recipe imports ----
function normalizeIngredientName(raw='') {
  // remove common descriptors that confuse search
  return raw
    .toLowerCase()
    .replace(/\b(fresh|large|small|chopped|sliced|diced|minced|crushed|grated|to taste)\b/g, '')
    .replace(/\s+/g,' ')
    .trim();
}

function singularize(word='') {
  // very light singularization for simple cases
  if (word.endsWith('ies')) return word.slice(0,-3) + 'y';
  if (word.endsWith('es'))  return word.slice(0,-2);
  if (word.endsWith('s'))   return word.slice(0,-1);
  return word;
}

function guessAisleFromName(name='') {
  const n = name.toLowerCase();
  if (/(beef|pork|chicken|turkey|lamb|steak|loin|thigh|breast|salmon|tuna|shrimp|fish)/.test(n)) return 'Meat & Seafood';
  if (/(milk|yogurt|butter|cream|cheese|egg)/.test(n)) return 'Dairy';
  if (/(bread|bun|roll|tortilla|pita|bagel)/.test(n)) return 'Bread';
  if (/(frozen|ice cream|frozen berries|frozen peas|ice\b)/.test(n)) return 'Frozen Goods';
  if (/(tomato|bean|rice|pasta|noodle|lentil|flour|sugar|salt|baking|oats|cereal|can(ned)?)/.test(n)) return 'Canned & Dry Goods';
  if (/(snack|chips|cookie|candy|soda|juice)/.test(n)) return 'Snacks & Beverages';
  if (/(ketchup|mustard|mayo|sauce|dressing|spice|seasoning|herb|vinegar|oil|honey|jam)/.test(n)) return 'Condiments & Spices';
  return 'Fresh Produce';
}

async function enrichIngredientFromAPI(rawName) {
  const name = normalizeIngredientName(rawName);
  // try: exact, singular, and without spaces joined
  const tries = [
    name,
    singularize(name),
    name.replace(/\s+/g,'-'),
    name.split(/\s+/)[0] // first word as last resort (e.g., "olive oil" -> "olive")
  ];

  let best = null;

  for (const q of tries) {
    if (!q) continue;
    const res = await searchIngredients(q);
    if (res && res.length) {
      // pick best by simple scoring (exact match > includes > first)
      const exact = res.find(it => it.name?.toLowerCase() === rawName.toLowerCase() || it.name?.toLowerCase() === name);
      const partial = res.find(it => it.name?.toLowerCase().includes(name));
      best = exact || partial || res[0];
      break;
    }
  }

  if (best) {
    return {
      name: best.name || rawName,
      image: best.image || '',
      aisle: best.aisle || guessAisleFromName(best.name || rawName),
    };
  }

  // total fallback: at least guess an aisle so it lands in the right section
  return {
    name: rawName,
    image: '', // optional: put a local placeholder URL here
    aisle: guessAisleFromName(rawName),
  };
}



/* ---- Boot it up ---- */
function boot() {
  loadSavedList();
  initIngredientSearch();
  addBuyButtonsToExisting();

  populateSavedRecipesSelect();
  const addBtn = document.getElementById('add-saved-ingredients');
  if (addBtn) addBtn.addEventListener('click', addIngredientsFromSavedRecipe);
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}


/******** CHECK PRICES ********/
function retailerSearchUrl(retailer, query) {
  const q = encodeURIComponent(query);
  switch (retailer) {
    case 'kroger':  return `https://www.kroger.com/search?query=${q}`;
    case 'walmart': return `https://www.walmart.com/search?q=${q}`;
    case 'target':  return `https://www.target.com/s?searchTerm=${q}`;
    case 'google':  return `https://www.google.com/search?tbm=shop&q=${q}`;
    default:        return `https://www.google.com/search?tbm=shop&q=${q}`;
  }
}

function getPreferredRetailer() {
  // Uses the <select id="retailer"> if present; falls back to Google
  return document.getElementById('retailer')?.value || 'google';
}

// Reusable: attach a Buy button to a card
function addBuyControls(container, name) {
  const actions = document.createElement('div');
  actions.className = 'ingredient-actions';

  const buyBtn = document.createElement('button');
  buyBtn.type = 'button';
  buyBtn.className = 'buy-btn';
  buyBtn.textContent = 'Buy';
  buyBtn.dataset.itemName = name; // used by click handler

  actions.appendChild(buyBtn);
  container.appendChild(actions);
}

// BUY → open retailer → confirm removal (single handler)
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.buy-btn');
  if (!btn) return;

  e.preventDefault();
  e.stopPropagation();

  const card = btn.closest('.ingredient-tile-container');
  const name =
    btn.dataset.itemName ||
    card.querySelector('#name-quanitity b p')?.textContent?.trim() ||
    'this item';

  // Open retailer page (allowed since inside user click)
  const retailer = getPreferredRetailer();
  window.open(retailerSearchUrl(retailer, name), '_blank', 'noopener');

  // Show our modal (it will sit there if user is on the other tab)
  // When they come back, they can answer it.
  const shouldRemove = await confirmRemove(name);
  if (shouldRemove) {
    card.remove();
    saveDebounced();
  }
});

function getListItems() {
  return [...document.querySelectorAll('.ingredient-tile-container')].map(c => {
    const name = c.querySelector('#name-quanitity b p')?.textContent?.trim() || '';
    const qty  = Number(c.querySelector('input.quantity')?.value || 1);
    return { name, qty };
  }).filter(x => x.name);
}

function renderCheckoutLinks(retailer, items) {
  const host = document.getElementById('checkout-results');
  host.innerHTML = '';

  if (!items.length) {
    host.textContent = 'Your list is empty.';
    return;
  }

  const ul = document.createElement('ul');
  items.forEach(({name, qty}) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = retailerSearchUrl(retailer, name);
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = `${name} ×${qty}`;
    li.appendChild(a);
    ul.appendChild(li);
  });
  host.appendChild(ul);

  // Optional "Open all" (opens multiple tabs on click)
  const openAll = document.createElement('button');
  openAll.textContent = `Open all in ${retailer}`;
  openAll.addEventListener('click', () => {
    // must happen in this click handler to avoid popup blockers
    items.forEach(({name}) => window.open(retailerSearchUrl(retailer, name), '_blank', 'noopener'));
  });
  host.appendChild(openAll);

  // Optional: copy list
  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Copy list';
  copyBtn.addEventListener('click', async () => {
    const txt = items.map(i => `• ${i.name} x${i.qty}`).join('\n');
    await navigator.clipboard.writeText(txt);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => (copyBtn.textContent = 'Copy list'), 1200);
  });
  host.appendChild(copyBtn);
}

