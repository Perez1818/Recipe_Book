/**
 * Create-Recipe Wizard (frontend)
 *
 * - Manages multi-step form UI (pills/steps); supports “peek” mode (Alt+P) to show all steps.
 * - Navigation: Next/Back buttons + global click handlers; resets to step 0 when nav icon is re-clicked.
 * - Submits recipe via POST /recipes with fields (name, description, cookTimeMinutes, servingSize, tags,
 *   ingredients, instructions). Requires a thumbnail before submit.
 * - On success, replaces <main> with a “Recipe created” confirmation screen and scrolls to top.
 * - Ingredients: add/edit/remove as “pills”, alternating into left/right rails; local validation plus optional
 *   server verification via POST /recipes/verify-ingredients; inline error list.
 * - Instructions: add/edit/remove with optional image preview; tracks object URLs and cleans them up;
 *   maintains visual order and time metadata (hours/minutes).
 * - Utilities: safe devToast fallback, smooth scroll, responsive visibility state; minimal DOM helpers.
 */


/* Logic for the wizard steps - Stef 09/14/2025*/
document.addEventListener('DOMContentLoaded', () => {
    const DEFAULT_PEEK = false;
    const STRICT_ING_VERIFY = true; 

    const form = document.getElementById('recipe-form');
    const steps = Array.from(document.querySelectorAll('[data-step]'));
    const pills = Array.from(document.querySelectorAll('[data-pill]'));
    let current = 0;
    let peek = new URLSearchParams(location.search).get('peek') === '1' ? true : DEFAULT_PEEK;
    const $ = (id) => document.getElementById(id);

    console.log('[BOOT] create-recipe.js loaded');
    if (!form) console.error('[BOOT] #recipe-form NOT FOUND');

    // Fallback toast so code never crashes if devToast doesn't exist
    if (!window.devToast) {
        window.devToast = (msg) => {
            const t = document.getElementById('dev-toast') || (() => {
                const el = document.createElement('div');
                el.id = 'dev-toast';
                el.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);padding:8px 12px;border-radius:8px;background:#333;color:#fff;font:12px/1.2 system-ui;z-index:9999;opacity:.95';
                document.body.appendChild(el);
                return el;
            })();
            t.textContent = msg;
            t.style.display = 'block';
            clearTimeout(t._hide);
            t._hide = setTimeout(() => { t.style.display = 'none'; }, 7500);
        };
    }



    const applyVisibility = () => {
        if (peek)
        {
            steps.forEach(s => s.classList.remove('hidden'));
        }else{
            steps.forEach((s, i) => s.classList.toggle('hidden', i !== current));
        }
        pills.forEach((p, i) => {
            p.classList.toggle('active', !peek && i === current);
            p.classList.toggle('done', !peek && i < current);
        });
        window.scrollTo({top: 0, behavior: 'smooth'});
    };

    function goNext() {
        if (peek) {
            current = Math.min(current + 1, steps.length - 1); applyVisibility(); return; }
            current = Math.min(current + 1, steps.length - 1);
            applyVisibility();
    };

    function goBack() {
        if (peek) {
            current = Math.max(current -  1, 0); applyVisibility(); return; }
            current = Math.max(current - 1, 0);
            applyVisibility();
     };

     //wire buttons
    $('#btn-next-0')?.addEventListener('click', goNext);
    $('#to-step-0')?.addEventListener('click', goNext);   
    $('#btn-next-1')?.addEventListener('click', goNext);
    $('#btn-back-1')?.addEventListener('click', goBack);
    $('#btn-back-2')?.addEventListener('click', goBack);

    document.addEventListener('click', (e) => {
    const t = e.target;
    if (!t) return;

    // Step 0 "Next" — support both ids
    if (t.id === 'to-step-0' || t.id === 'btn-next-0') {
        goNext();
    }

    if (t.id === 'btn-next-1') {
        goNext();
    }

    if (t.id === 'btn-back-1' || t.id === 'btn-back-2') {
        goBack();
    }
    });

     //toggle peek with Alt+P
     document.addEventListener('keydown', (e) => {
        if (e.altKey && e.key.toLowerCase() === 'p') {
            peek = !peek;
            applyVisibility();
        }
     });

     //reset to step 0 when clicking on the nav icon that links to the same page
     document.getElementById('nav-recipe-maker')?.addEventListener('click', (e) => {
        if (location.pathname.endsWith('create-recipe.html')) {
            e.preventDefault();
            current = 0;
            applyVisibility();
        }
     });
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('[SUBMIT] handler fired');

        const nameEl = document.getElementById('recipe-name');
        const descEl = document.getElementById('recipe-description');
        const cookTimeEl    = document.getElementById('cook-time');
        const servingSizeEl = document.getElementById('serving-size');
        const tagsEl        = document.getElementById('tags');

        const name = (nameEl?.value || '').trim();
        const description = (descEl?.value || '').trim();
        if (!name || !description) { devToast('Please fill in name and description.'); return; }

        // Require a thumbnail
        if (typeof hasThumbSelected === 'function' && !hasThumbSelected()) {
            devToast('Please add a thumbnail before submitting.');
            if (typeof current !== 'undefined') { current = 0; applyVisibility?.(); }
            return;
        }

        // Gather child rows from UI
        const ingredients  = collectIngredientsFromDOM();
        const instructions = collectInstructionsFromDOM();

        // Build payload that your backend accepts
        const payload = {
            name,
            description,
            cookTimeMinutes: Math.max(0, Number(cookTimeEl?.value || 0)),
            servingSize:     Math.max(1, Number(servingSizeEl?.value || 1)),
            tags: (tagsEl?.value || '').split(',').map(t => t.trim()).filter(Boolean),
            ingredients,
            instructions,
        };
        console.log('[SUBMIT] payload', payload);

        // Use RELATIVE URL so it works from http://localhost:4000
        const res = await fetch('/recipes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const ct = res.headers.get('content-type') || '';
        let data = null;
        try { data = ct.includes('application/json') ? await res.json() : null; } catch {}

        console.log('[SUBMIT] response status', res.status, data);

        if (!res.ok) {
            devToast(`Save failed: ${data?.error || res.status}`);
            return;
        }
        // Replace the whole UI with a success screen
        const main = document.querySelector('main');
        main.innerHTML = `
        <section class="grid-container" style="text-align:center;">
            <h1 style="margin-bottom:12px;">Recipe created 🎉</h1>
            <p style="font-size:1rem; margin-bottom:24px;">
            Your recipe has been saved${data?.id ? ` (ID: <b>${data.id}</b>)` : ''}.
            </p>
            <div style="display:flex; gap:12px; justify-content:center;">
            <button id="create-another" class="start-btn">Create another</button>
            <a href="/create-recipe.html" id="new-recipe-link" class="start-btn" style="text-decoration:none; display:inline-block;">Start over</a>
            <a href="/index.html" class="start-btn" style="text-decoration:none; display:inline-block;">Go home</a>
            </div>
        </section>
        `;

        // optional: “Create another” just reloads the page clean
        document.getElementById('create-another')?.addEventListener('click', () => {
        location.href = '/create-recipe.html';
        });

        // Scroll to top so the message is in view
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // +++ Thumbnail + Video Logic +++ //
    const thumbInput   = document.getElementById('thumbnail-input');
    const thumbWrap    = document.getElementById('thumb-preview-wrap');
    const thumbPreview = document.getElementById('thumbnail-preview');
    const thumbRemove  = document.getElementById('remove-thumbnail');


    let _thumbURL = null;

    function showThumbPreview(file) {
        if (_thumbURL) { URL.revokeObjectURL(_thumbURL); _thumbURL = null; }
        if (!file) {
            thumbPreview.removeAttribute('src');
            thumbWrap?.classList.add('hidden');
            return;
        }
        _thumbURL = URL.createObjectURL(file);
        thumbPreview.src = _thumbURL;
        thumbWrap?.classList.remove('hidden');
    }

    // require-thumbnail helper used at submit
    function hasThumbSelected() {
        const hasFile = !!(thumbInput?.files && thumbInput.files[0]);
        const visible = !!(thumbWrap && !thumbWrap.classList.contains('hidden'));
        return hasFile || visible;
    }
    // Thumbnail picker → preview tile
    thumbInput?.addEventListener('change', () => {
        const f = thumbInput.files && thumbInput.files[0];
        showThumbPreview(f || null);
    });

    // Thumbnail ✕ overlay → clear
    thumbRemove?.addEventListener('click', () => {
        thumbInput.value = '';
        showThumbPreview(null);
        devToast('Thumbnail removed. A thumbnail is required before submitting.');
    });
    // Video + preview logic
   const videoInput   = document.getElementById('video-input');
    const videoWrap    = document.getElementById('video-preview-wrap');
    const videoEl      = document.getElementById('recipe-video');
    const removeVideo  = document.getElementById('remove-video');

    let _videoURL = null;

    function showVideoPreview(file) {
    if (_videoURL) { URL.revokeObjectURL(_videoURL); _videoURL = null; }
    if (!file) {
        videoEl.removeAttribute('src');
        videoEl.load(); // clear stale frame
        videoWrap?.classList.add('hidden');
        return;
    }
    _videoURL = URL.createObjectURL(file);
    videoEl.src = _videoURL;
    videoWrap?.classList.remove('hidden');
    }

    // on file select
    videoInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0] || null;
    showVideoPreview(file);
    });

    // ✕ button behavior
    removeVideo?.addEventListener('click', () => {
    videoInput.value = '';
    showVideoPreview(null);
    });


    // Collect ingredients from both rails (left/right)
    function collectIngredientsFromDOM() {
        const pills = [
            ...document.querySelectorAll('#ingredient-rail-left .pill'),
            ...document.querySelectorAll('#ingredient-rail-right .pill'),
        ];
        return pills.map(p => ({
            name: p.dataset.name || '',
            qty:  p.dataset.qty  || '',
            unit: p.dataset.unit || '',
        }));
    }

    // Collect instructions from both rails in visual order
    function collectInstructionsFromDOM() {
        const pills = [
            ...document.querySelectorAll('#instruction-rail-left .pill'),
            ...document.querySelectorAll('#instruction-rail-right .pill'),
        ];
        return pills.map((p, i) => ({
            step_num: i + 1,
            text:     p.dataset.text    || '',
            hours:    Number(p.dataset.hours   || 0),
            minutes:  Number(p.dataset.minutes || 0),
            hasImage: false, // you’re not uploading files yet
        }));
    }
    // +++ Ingredient Logic +++ //
    let nextGoesLeft = true; 
    let editingPill = null; 

    const leftRail    = document.getElementById('ingredient-rail-left');
    const rightRail   = document.getElementById('ingredient-rail-right');
    const addBtn     = document.getElementById('add-ingredient');
    const cancelEdit = document.getElementById('cancel-edit');   

    const nameEl = document.getElementById('ingredient-name');
    const qtyEl  = document.getElementById('quantity-input');
    const unitEl = document.getElementById('ingredient-unit');

    // [ADD] error box that lives in the Ingredients step (you added this earlier)
    const verifyErrorsEl = document.getElementById('verify-errors');

    // [ADD] show/hide reasons under the editor
    function showVerifyErrors(reasons) {
        if (!verifyErrorsEl) return;
        if (!reasons || !reasons.length) {
            verifyErrorsEl.classList.add('hidden');
            verifyErrorsEl.textContent = '';
            return;
        }
        verifyErrorsEl.innerHTML =
            '<ul style="margin:0;padding-left:18px;">' +
            reasons.map(r => `<li>${r}</li>`).join('') +
            '</ul>';
        verifyErrorsEl.classList.remove('hidden');
    }

    // [ADD] quick local gate: blocks empty, too short, weird chars
    function quickLocalIngredientCheck(name) {
        const n = String(name || '').trim();
        if (n.length < 2) return 'Ingredient name is too short.';
        // letters, numbers, spaces, dash, apostrophe, commas, periods, parentheses
        if (!/^[a-z0-9\s\-’',.()]+$/i.test(n)) return 'Ingredient name has invalid characters.';
        return null;
    }

    // [ADD] server gate: asks your API for final say
    // server gate: final say (relative URL + timeout + robust errors)
    async function verifyOneIngredient(name) {
        if (!STRICT_ING_VERIFY) return { ok: true, reasons: [] }; // bypass during dev

        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 5000); // 5s timeout so UI never hangs

        try {
            const resp = await fetch('/recipes/verify-ingredients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ingredients: [{ name }] }),
            signal: ctrl.signal,
            });
        clearTimeout(t);

        if (!resp.ok) {
            return { ok: false, reasons: [`Verify endpoint returned ${resp.status}`] };
        }
        let data;
        try { data = await resp.json(); }
        catch { return { ok: false, reasons: ['Bad JSON from verify endpoint.'] }; }

        // Expect { ok:boolean, reasons?:string[] }
        if (typeof data.ok !== 'boolean') {
            return { ok: false, reasons: ['Malformed verify response.'] };
        }
        return data;
        } catch (e) {
            clearTimeout(t);
            const reason = e?.name === 'AbortError'
            ? 'Verify timed out (5s).'
            : 'Network error while verifying ingredient.';
            return { ok: false, reasons: [reason] };
        }
    }
    function labelFor(name, qty, unit) {
        const n = (name || '').trim();
        const q = (qty  || '').trim();
        return `${n}${q ? ` (${q} ${unit || ""})` : ""}`;
    }

    function enterEdit(pill) {
        editingPill = pill;
        nameEl.value = pill.dataset.name || '';
        qtyEl.value  = pill.dataset.qty  || '';
        unitEl.value = pill.dataset.unit || '';
        addBtn.textContent = 'Save Changes';
        cancelEdit.classList.remove('hidden');
        pill.classList.add('editing');
    }

    function exitEdit() {
        editingPill?.classList.remove('editing');
        editingPill = null;
        nameEl.value = '';
        qtyEl.value  = '';
        unitEl.value = '';
        addBtn.textContent = '+ Add New Ingredient';
        cancelEdit.classList.add('hidden');
    }

    addBtn?.addEventListener('click', async () => {
        const name = nameEl.value.trim();
        const qty  = qtyEl.value.trim();
        const unit = unitEl.value;

        if (!name) { showVerifyErrors(['Please enter an ingredient name.']); nameEl.focus(); return; }

        // 1) Local check first (fast, no network)
        const localErr = quickLocalIngredientCheck(name);
        if (localErr) { showVerifyErrors([localErr]); nameEl.focus(); return; }

        // 2) EDIT MODE: update existing pill immediately
        if (editingPill) {
            editingPill.dataset.name = name;
            editingPill.dataset.qty  = qty;
            editingPill.dataset.unit = unit;
            editingPill.querySelector('span').textContent = labelFor(name, qty, unit);
            editingPill.classList.remove('invalid');
            exitEdit();
            return;
        }

        // 3) ADD MODE: create pill immediately
        const pill = document.createElement('div');
        pill.className = 'pill';
        pill.dataset.name = name;
        pill.dataset.qty  = qty;
        pill.dataset.unit = unit;
        pill.innerHTML = `
            <span>${labelFor(name, qty, unit)}</span>
            <button type="button" class="remove" aria-label="Remove ingredient">✕</button>
        `;

        pill.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove')) return;
            enterEdit(pill);
        });
        pill.querySelector('.remove')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (editingPill === pill) exitEdit();
            pill.remove();
        });

        const rail = nextGoesLeft ? leftRail : rightRail;
        if (!rail) { console.error('[ING] rails not found'); return; }
        rail.appendChild(pill);
        nextGoesLeft = !nextGoesLeft;

        // reset editor fields
        nameEl.value = '';
        qtyEl.value  = '';
        unitEl.value = '';
        nameEl.focus();
    });
    // +++ Instructions Logic (ADD + EDIT + IMAGE) +++ //
    let instructionGoesLeft = true;
    let editingInstruction = null;

    const instrLeft   = document.getElementById('instruction-rail-left');
    const instrRight  = document.getElementById('instruction-rail-right');
    const addInstrBtn = document.getElementById('add-instruction');
    const cancelInstr = document.getElementById('cancel-instruction-edit');

    const textEl    = document.getElementById('instruction-text');
    const hoursEl   = document.getElementById('instruction-hours');
    const minutesEl = document.getElementById('instruction-minutes');

    let instructionIdSeq = 1;

    function labelForInstruction(desc, h, m) {
        const parts = [];
        if (desc) parts.push(desc);
        if (h || m) parts.push(`${h || 0}h ${m || 0}m`);
        return parts.join(' — ');
    }

    function enterInstructionEdit(pill) {
        editingInstruction = pill;
        textEl.value    = pill.dataset.text || '';
        hoursEl.value   = pill.dataset.hours || '';
        minutesEl.value = pill.dataset.minutes || '';
        addInstrBtn.textContent = 'Save Changes';
        cancelInstr.classList.remove('hidden');
        pill.classList.add('editing');
    }

    function exitInstructionEdit(clearPreview = true) { 
        editingInstruction?.classList.remove('editing');
        editingInstruction = null;
        textEl.value = '';
        hoursEl.value = '';
        minutesEl.value = '';
        addInstrBtn.textContent = '+ Add New Step';
        cancelInstr.classList.add('hidden');
    }

    addInstrBtn?.addEventListener('click', () => {
        const desc = textEl.value.trim();
        const h    = (hoursEl.value || '').trim();
        const m    = (minutesEl.value || '').trim();

        if (!desc) { alert('Please enter a step description.'); return; }

        // EDIT MODE
        if (editingInstruction) {
            const pill = editingInstruction;

            pill.dataset.text    = desc;
            pill.dataset.hours   = h;
            pill.dataset.minutes = m;
            pill.querySelector('span').textContent = labelForInstruction(desc, h, m);
            exitInstructionEdit();
            return;
        }

        // ADD MODE
        const pill = document.createElement('div');
        pill.className = 'pill';
        const id = String(instructionIdSeq++);
        pill.dataset.id      = id;
        pill.dataset.text    = desc;
        pill.dataset.hours   = h;
        pill.dataset.minutes = m;

        const span = document.createElement('span');
        span.textContent = labelForInstruction(desc, h, m);
        pill.appendChild(span);

        const rm = document.createElement('button');
        rm.type = 'button';
        rm.className = 'remove';
        rm.setAttribute('aria-label', 'Remove instruction');
        rm.textContent = '✕';
        pill.appendChild(rm);

        pill.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove')) return;
            enterInstructionEdit(pill);
        });

        rm.addEventListener('click', (e) => {
            e.stopPropagation();
            if (editingInstruction === pill) exitInstructionEdit();
            pill.remove();
        });

        (instructionGoesLeft ? instrLeft : instrRight)?.appendChild(pill);
        instructionGoesLeft = !instructionGoesLeft;

        exitInstructionEdit(); // clears inputs & preview
    });
    cancelInstr?.addEventListener('click', () => exitInstructionEdit());
    applyVisibility();
});
