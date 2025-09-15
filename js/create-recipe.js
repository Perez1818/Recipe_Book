/* So far this just controls the visibility of the different steps in the recipe creation process - Stef 09/14/2025*/
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

    // init
    applyVisibility();
});