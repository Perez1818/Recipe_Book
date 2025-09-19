/* Logic for the wizard steps - Stef 09/14/2025*/
document.addEventListener('DOMContentLoaded', () => {
    const DEFAULT_PEEK = false;
    const DEV_BLOCK_SUBMIT = true; //for block form submission for development/testing

    const form = document.getElementById('recipe-form');
    const steps = Array.from(document.querySelectorAll('[data-step]'));
    const pills = Array.from(document.querySelectorAll('[data-pill]'));
    let current = 0;
    let peek = new URLSearchParams(location.search).get('peek') === '1' ? true : DEFAULT_PEEK;
    const $ = (id) => document.getElementById(id);

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
     // During Step 1, block real submit so you can keep iterating HTML safely
    form?.addEventListener('submit', (e) => {
        if (!DEV_BLOCK_SUBMIT) return;
        e.preventDefault();
        devToast('Submit blocked (dev). We’ll wire this in Step 2.');
    });

    // tiny toast helper
    function devToast(msg) {
        let t = document.getElementById('dev-toast');
        if (!t) {
        t = document.createElement('div');
        t.id = 'dev-toast';
        t.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);padding:8px 12px;border-radius:8px;background:#333;color:#fff;font:12px/1.2 system-ui;z-index:9999;opacity:.95';
        document.body.appendChild(t);
        }
        t.textContent = msg;
        t.style.display = 'block';
        clearTimeout(t._hide);
        t._hide = setTimeout(() => { t.style.display = 'none'; }, 1500);
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

    addBtn?.addEventListener('click', () => {
    const name = nameEl.value.trim();
    const qty  = qtyEl.value.trim();
    const unit = unitEl.value;

    if (!name) { alert('Please enter an ingredient name.'); return; }

    // update existing pill
    if (editingPill) {
        editingPill.dataset.name = name;
        editingPill.dataset.qty  = qty;
        editingPill.dataset.unit = unit;
        editingPill.querySelector('span').textContent = labelFor(name, qty, unit);
        exitEdit();
        return;
    }

    // create new pill 
    const pill = document.createElement('div');
    pill.className = 'pill';
    pill.dataset.name = name;
    pill.dataset.qty  = qty;
    pill.dataset.unit = unit;
    pill.innerHTML = `
        <span>${labelFor(name, qty, unit)}</span>
        <button type="button" class="remove" aria-label="Remove ingredient">✕</button>
    `;

    // click pill
    pill.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove')) return;
        enterEdit(pill);
    });

    // remove pill 
    pill.querySelector('.remove')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (editingPill === pill) exitEdit();
        pill.remove();
    });

    // alternate rails (left/right), stacking top→bottom
    (nextGoesLeft ? leftRail : rightRail)?.appendChild(pill);
    nextGoesLeft = !nextGoesLeft;

    // clear inputs for next add
    nameEl.value = '';
    qtyEl.value  = '';
    unitEl.value = '';
    });

    cancelEdit?.addEventListener('click', exitEdit);

    // +++ Instructions Logic (ADD + EDIT + IMAGE) +++ //
    let instructionGoesLeft = true;
    let editingInstruction = null;
    let removeImageRequested = false;

    const instrLeft   = document.getElementById('instruction-rail-left');
    const instrRight  = document.getElementById('instruction-rail-right');
    const addInstrBtn = document.getElementById('add-instruction');
    const cancelInstr = document.getElementById('cancel-instruction-edit');

    const textEl    = document.getElementById('instruction-text');
    const hoursEl   = document.getElementById('instruction-hours');
    const minutesEl = document.getElementById('instruction-minutes');
    const imageEl   = document.getElementById('instruction-image');
    const imgPreview = document.getElementById('instruction-image-preview'); // ✅ preview element

    const instructionImages = new Map();  // id -> File
    const instructionURLs   = new Map();  // id -> objectURL
    let instructionIdSeq = 1;

    function labelForInstruction(desc, h, m) {
        const parts = [];
        if (desc) parts.push(desc);
        if (h || m) parts.push(`${h || 0}h ${m || 0}m`);
        return parts.join(' — ');
    }

    function showEditorPreviewFromFile(file) {
        if (!file) {
            imgPreview.src = '';
            imgPreviewWrapper.classList.add('hidden');
            return;
        }
        const url = URL.createObjectURL(file);
        imgPreview.src = url;
        imgPreviewWrapper.classList.remove('hidden');
        imgPreview.onload = () => URL.revokeObjectURL(url);
    }

    function enterInstructionEdit(pill) {
        editingInstruction = pill;
        removeImageRequested = false;
        textEl.value    = pill.dataset.text || '';
        hoursEl.value   = pill.dataset.hours || '';
        minutesEl.value = pill.dataset.minutes || '';
        const id = pill.dataset.id;
        showEditorPreviewFromFile(instructionImages.get(id));
        addInstrBtn.textContent = 'Save Changes';
        cancelInstr.classList.remove('hidden');
        pill.classList.add('editing');
    }

    function exitInstructionEdit(clearPreview = true) { // ✅ param with default
        editingInstruction?.classList.remove('editing');
        editingInstruction = null;
        textEl.value = '';
        hoursEl.value = '';
        minutesEl.value = '';
        imageEl.value = ''; // clear file input
        addInstrBtn.textContent = '+ Add New Step';
        cancelInstr.classList.add('hidden');
        if (clearPreview) showEditorPreviewFromFile(null);
        removeImageRequested = false;  
    }

    // live preview when choosing a new file
    imageEl?.addEventListener('change', () => {
        const f = imageEl.files && imageEl.files[0];
        showEditorPreviewFromFile(f || null);
    });
    const imgPreviewWrapper = document.getElementById('instruction-preview');
    const removeImgBtn = document.getElementById('remove-instruction-image');

    removeImgBtn?.addEventListener('click', () => {
        imageEl.value = '';                       // clear file input
        showEditorPreviewFromFile(null);          // hide preview
        if (editingInstruction) {                 // ### NEW
            removeImageRequested = true;            // mark removal for Save Changes
        }
    });

    addInstrBtn?.addEventListener('click', () => {
        const desc = textEl.value.trim();
        const h    = (hoursEl.value || '').trim();
        const m    = (minutesEl.value || '').trim();
        const newFile = imageEl.files && imageEl.files[0];

        if (!desc) { alert('Please enter a step description.'); return; }

        // === EDIT MODE ===
        if (editingInstruction) {
            const pill = editingInstruction;
            const id = pill.dataset.id;

            pill.dataset.text    = desc;
            pill.dataset.hours   = h;
            pill.dataset.minutes = m;
            pill.querySelector('span').textContent = labelForInstruction(desc, h, m);

            if (removeImageRequested && instructionImages.has(id)) {
                const oldURL = instructionURLs.get(id);
                if (oldURL) URL.revokeObjectURL(oldURL);
                instructionImages.delete(id);
                instructionURLs.delete(id);
                const thumb = pill.querySelector('img.instr-thumb');
                if (thumb) thumb.remove();
            }
            // otherwise, if a new file was chosen, replace the image
            else if (newFile) {
                const oldURL = instructionURLs.get(id);
                if (oldURL) URL.revokeObjectURL(oldURL);

                instructionImages.set(id, newFile);
                const url = URL.createObjectURL(newFile);
                instructionURLs.set(id, url);

                let thumb = pill.querySelector('img.instr-thumb');
                if (!thumb) {
                    thumb = document.createElement('img');
                    thumb.className = 'instr-thumb';
                    pill.insertBefore(thumb, pill.querySelector('.remove'));
                }
                thumb.src = url;
            }

            exitInstructionEdit(); // clears inputs & preview
            return;
        }

        // === ADD MODE ===
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

        if (newFile) {
            instructionImages.set(id, newFile);
            const url = URL.createObjectURL(newFile);
            instructionURLs.set(id, url);

            const img = document.createElement('img');
            img.className = 'instr-thumb';
            img.src = url;
            pill.appendChild(img);
        }

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
            const oldURL = instructionURLs.get(id);
            if (oldURL) URL.revokeObjectURL(oldURL);
            instructionImages.delete(id);
            instructionURLs.delete(id);
            pill.remove();
        });

        (instructionGoesLeft ? instrLeft : instrRight)?.appendChild(pill);
        instructionGoesLeft = !instructionGoesLeft;

        exitInstructionEdit(); // clear inputs & preview
    });

    cancelInstr?.addEventListener('click', () => exitInstructionEdit());
    applyVisibility();
});
