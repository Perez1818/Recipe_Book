// js/calendar.js
document.addEventListener("DOMContentLoaded", () => {
  // ---------- ELEMENTS ----------
  const monthEl   = document.getElementById("month");
  const prevBtn   = document.getElementById("prev-month");
  const nextBtn   = document.getElementById("next-month");
  const gridRoot  = document.getElementById("calendar-grid");
  const container = document.getElementById("calendar-container");
  const btnToday  = document.getElementById("btn-today");
  const viewSel   = document.getElementById("view-select");
  const monthBar  = document.getElementById("month-display");
  const monthRow  = document.getElementById("month-row");

  // Popup & fields
  const popup     = document.getElementById("inner-container");
  const inpDate   = document.getElementById("ev-date");
  const inpTime   = document.getElementById("ev-time");
  const inpName   = document.getElementById("ev-name");
  const selCat    = document.getElementById("ev-category");
  const btnSave   = document.getElementById("save-button");
  const btnCancel = document.getElementById("cancel-button");

  const selRepeat   = document.getElementById("ev-repeat");
  const panelCustom = document.getElementById("repeat-custom");
  const rcFreq      = document.getElementById("rc-freq");
  const rcWeekdaysC = document.getElementById("rc-weekdays");
  const rcMonthly   = document.getElementById("rc-monthly");
  const rcInterval = document.getElementById("rc-interval");
  const rcCount    = document.getElementById("rc-count");
  const rcUntil    = document.getElementById("rc-until");

  function refreshCustomVisibility(){
    if(!selRepeat || !panelCustom) return;
    panelCustom.style.display = (selRepeat.value === "custom") ? "" : "none";
    // Weekly day pickers only for WEEKLY custom
    if (rcWeekdaysC) rcWeekdaysC.style.display = (rcFreq.value === "WEEKLY") ? "" : "none";
    // Monthly mode toggles only for MONTHLY custom
    if (rcMonthly)   rcMonthly.style.display   = (rcFreq.value === "MONTHLY") ? "" : "none";
  }
    if (selRepeat) selRepeat.addEventListener("change", refreshCustomVisibility);
    if (rcFreq)    rcFreq.addEventListener("change", refreshCustomVisibility);


  if (popup) popup.style.display = "none"; // hidden on load

  // ---------- STATE ----------
  let viewMode = "month";
  let anchor   = new Date();
  anchor.setHours(0,0,0,0);
  let editingDateISO = null;

  // ---------- FORMATTERS ----------
  const fmtMonth = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });
  const fmtDay   = new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric", year: "numeric" });

  // ---------- HELPERS ----------
  const toMondayIndex = (jsDay) => (jsDay + 6) % 7;
  function startOfWeek(d) { const x = new Date(d); const idx = toMondayIndex(x.getDay()); x.setDate(x.getDate()-idx); x.setHours(0,0,0,0); return x; }
  function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }

  function parseHeader(text) {
    const dt = new Date(text);
    if (!isNaN(dt)) { dt.setDate(1); dt.setHours(0,0,0,0); return dt; }
    const m = text.match(/^\s*(\d{1,2})[\/\-\s](\d{4})\s*$/i);
    if (m) return new Date(Number(m[2]), Number(m[1])-1, 1);
    return new Date();
  }
  const WEEKDAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  function iso(d){ return toLocalISO(new Date(d)); }
  function addDaysDate(d, n){ const x = new Date(d); x.setDate(x.getDate()+n); return x; }
  function sameMD(a,b){ return a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
  
  function weekOfMonth(d){
  // 1st..5th (or -1 for last) isn’t needed here; we compute “nth” from start date.
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    return Math.floor((d.getDate() + first.getDay() - 1) / 7) + 1;
  }

  function nthWeekdayOfMonth(year, month, weekday, nth){
    const first = new Date(year, month, 1);
    let offset = (weekday - first.getDay() + 7) % 7;
    let date = 1 + offset + (nth-1)*7;
    const d = new Date(year, month, date);
    if (d.getMonth() !== month) return null;
    return d;
  }

  function labelWeeklyOption(date){
    return `Weekly on ${WEEKDAY_NAMES[date.getDay()]}`;
  }
  function labelMonthlyDay(date){
    return `Monthly on day ${date.getDate()}`;
  }
  function labelMonthlyNth(date){
    const nths = ["","first","second","third","fourth","fifth"];
    return `Monthly on the ${nths[weekOfMonth(date)]} ${WEEKDAY_NAMES[date.getDay()]}`;
  }
  function labelYearly(date){
    return `Annually on ${date.toLocaleString(undefined,{month:"long", day:"numeric"})}`;
  }
  function toLocalISO(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  function parseLocalISO(s) {
    // Convert "YYYY-MM-DD" into a local Date (midnight in your time zone)
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  // top-level helper (place near other helpers)
    function makeSeriesId() {
        return 'series_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    }


  // ---------- GENERATORS ----------
  function* generateOccurrences(startISO, mode, customRule)
  {
    const start = parseLocalISO(startISO);
    start.setHours(0,0,0,0);

    // end controls for custom
    const capCount = customRule?.count ?? null;
    const until    = customRule?.until ? new Date(customRule.until) : null;

    const push = function*(dates){
        for (const d of dates) yield iso(d);
    };

    // PRESETS
    if (mode === "none") { yield startISO; return; }

    if (mode === "daily") {
        // 30-day convenience
        for (let i=0;i<30;i++) yield iso(addDaysDate(start,i));
        return;
    }

    if (mode === "weekday") {
        // Next 90 days Mon–Fri
        for (let i=0, c=0; c<90; i++){
        const d = addDaysDate(start,i);
        const wd = d.getDay();
        if (wd !== 0 && wd !== 6) yield iso(d);
        }
        return;
    }

    if (mode === "weekly") {
        const wd = start.getDay();
        for (let i=0;i<26;i++) yield iso(addDaysDate(start, i*7)); // 26 weeks
        return;
    }

    if (mode === "monthly_day") {
        const day = start.getDate();
        const d = new Date(start);
        for (let i=0;i<12;i++){
        const m = new Date(d.getFullYear(), d.getMonth()+i, day);
        yield iso(m);
        }
        return;
    }

    if (mode === "monthly_nth") {
        const nth = weekOfMonth(start);
        const wk  = start.getDay();
        const d = new Date(start);
        for (let i=0;i<12;i++){
        const m = nthWeekdayOfMonth(d.getFullYear(), d.getMonth()+i, wk, nth) || nthWeekdayOfMonth(d.getFullYear(), d.getMonth()+i, wk, 5);
        if (m) yield iso(m);
        }
        return;
    }

    if (mode === "yearly") {
        const d = new Date(start);
        for (let i=0;i<5;i++){
        const y = new Date(d.getFullYear()+i, d.getMonth(), d.getDate());
        yield iso(y);
        }
        return;
    }

    // CUSTOM (RRULE-lite)
    if (mode === "custom") {
        const F   = customRule.freq;        // DAILY/WEEKLY/MONTHLY/YEARLY
        const INT = Math.max(1, Number(customRule.interval||1));
        const daysSet = new Set(customRule.byweekday || []); // 0..6
        const mMode   = customRule.monthlyMode || "BYMONTHDAY"; // for MONTHLY
        let count = 0;

        const inRange = (d) => (!until || d <= until) && (!capCount || count < capCount);

        if (F === "DAILY") {
            for (let k=0; ; k++){
                const d = addDaysDate(start, k*INT);
                if (!inRange(d)) break;
                yield iso(d); count++;
            }
            return;
        }

        if (F === "WEEKLY") {
            for (let k=0; ; k++){
                const d = addDaysDate(start, k);
                // step only when the week boundary fits the interval from start
                const weeksFromStart = Math.floor((d - start)/(7*24*3600*1000));
                if (weeksFromStart % INT === 0 && (daysSet.size ? daysSet.has(d.getDay()) : d.getDay()===start.getDay())){
                    if (!inRange(d)) break;
                    yield iso(d); count++;
                }
                if (!inRange(d)) break;
            }
            return;
        }

        if (F === "MONTHLY") {
            const nth = weekOfMonth(start);
            const wk  = start.getDay();
            for (let m=0; ; m+=INT){
                const base = new Date(start.getFullYear(), start.getMonth()+m, 1);
                let d;
                if (mMode === "BYDAY"){
                    d = nthWeekdayOfMonth(base.getFullYear(), base.getMonth(), wk, nth) || nthWeekdayOfMonth(base.getFullYear(), base.getMonth(), wk, 5);
                } else {
                    d = new Date(base.getFullYear(), base.getMonth(), start.getDate());
                }
                if (!inRange(d)) break;
                yield iso(d); count++;
            }
            return;
        }

        if (F === "YEARLY") {
            for (let y=0; ; y+=INT){
                const d = new Date(start.getFullYear()+y, start.getMonth(), start.getDate());
                if (!inRange(d)) break;
                yield iso(d); count++;
            }
            return;
        }
    }
  }
 


  // ---------- STORAGE ----------
  const STORAGE_KEY = "rb_calendar_events";
  function getStore(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}"); }catch{ return {}; } }
  function setStore(s){ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
  function addOrReplaceEvent(dateISO, ev){
    const store = getStore();
    const arr = store[dateISO] || [];
    const i = arr.findIndex(x => (x.time||"") === (ev.time||"") && x.name === ev.name);
    if (i >= 0) arr[i] = ev; else arr.push(ev);
    store[dateISO] = arr;
    setStore(store);
  }
  function deleteEvent(dateISO, ev){
    const store = getStore();
    const arr = store[dateISO] || [];
    const idx = arr.findIndex(x => (x.time||"") === (ev.time||"") && x.name === ev.name);
    if (idx >= 0) {
      arr.splice(idx,1);
      if (arr.length) store[dateISO] = arr; else delete store[dateISO];
      setStore(store);
      return true;
    }
    return false;
  }
  function deleteSeriesAll(seriesId)
  {
    const store = getStore();
    let changed = false;
    for (const dateISO of Object.keys(store)) {
        const before = store[dateISO].length;
        store[dateISO] = store[dateISO].filter(ev => ev.seriesId !== seriesId);
        if (store[dateISO].length !== before) changed = true;
        if (store[dateISO].length === 0) delete store[dateISO];
    }
    if (changed) setStore(store);
    return changed;
  }

  function deleteSeriesFrom(seriesId, fromISO){
    const store = getStore();
    let changed = false;
    for (const dateISO of Object.keys(store)) {
        if (dateISO >= fromISO) {
            const before = store[dateISO].length;
            store[dateISO] = store[dateISO].filter(ev => ev.seriesId !== seriesId);
            if (store[dateISO].length !== before) changed = true;
            if (store[dateISO].length === 0) delete store[dateISO];
        }
    }
    if (changed) setStore(store);
    return changed;
  }
  
  // ---------- POPUP ----------
  function openPopup(dateISO, preset = {}) {
    editingDateISO = dateISO;
    if (inpDate) inpDate.value = dateISO;
    if (inpTime) inpTime.value = preset.time || "";
    if (inpName) inpName.value = preset.name || "";
    if (selCat)  selCat.value  = preset.category || "";
    if (popup) {
        popup.style.display = "block";
        popup.classList.add("open");
        popup.setAttribute("aria-hidden", "false");
    }
    document.body.classList.add("modal-open");

    const start = parseLocalISO(dateISO);
    if (typeof labelWeeklyOption === "function") {
        const optWeekly = selRepeat ? [...selRepeat.options].find(o => o.value === "weekly") : null;
        if (optWeekly) optWeekly.textContent = labelWeeklyOption(start);
    }
    if (typeof labelMonthlyDay === "function") {
        const optMonDay = selRepeat ? [...selRepeat.options].find(o => o.value === "monthly_day") : null;
        if (optMonDay) optMonDay.textContent = labelMonthlyDay(start);
    }
    if (typeof labelMonthlyNth === "function") {
        const optMonNth = selRepeat ? [...selRepeat.options].find(o => o.value === "monthly_nth") : null;
        if (optMonNth) optMonNth.textContent = labelMonthlyNth(start);
    }
    if (typeof labelYearly === "function") {
        const optYearly = selRepeat ? [...selRepeat.options].find(o => o.value === "yearly") : null;
        if (optYearly) optYearly.textContent = labelYearly(start);
    }
    if (selRepeat) selRepeat.value = "none";
    if (panelCustom) panelCustom.style.display = "none";

    if (typeof refreshCustomVisibility === "function") refreshCustomVisibility();
    (inpName || inpTime || inpDate || selCat)?.focus();
  }
  function closePopup() {
    if (popup) {
        popup.style.display = "none";
        popup.classList.remove("open");
        popup.setAttribute("aria-hidden", "true");
    }
    document.body.classList.remove("modal-open");
    editingDateISO = null;

    if (typeof selRepeat !== "undefined" && selRepeat) selRepeat.value = "none";
    if (typeof panelCustom !== "undefined" && panelCustom) panelCustom.style.display = "none"; 
  }

  if (btnCancel) btnCancel.addEventListener("click", closePopup);

  if (btnSave) btnSave.addEventListener("click", () => {
    if (!editingDateISO) return;
    const mode = selRepeat ? selRepeat.value : "none";
    const seriesId = (mode !== "none") ? makeSeriesId() : null;
    const base = {
      time:     inpTime?.value || "",
      name:     (inpName?.value || "").trim(),
      category: selCat?.value || "",
      ...(seriesId ? { seriesId } : {})
    };
    if (!base.name) { alert("Please enter a recipe name."); return; }

    if (mode === "none") {
        addOrReplaceEvent(editingDateISO, base);
    } else if (mode === "custom") {
        const endType = document.querySelector('input[name="rc-end"]:checked')?.value || "NEVER";
        const rule = {
            freq: rcFreq.value,                               // DAILY/WEEKLY/MONTHLY/YEARLY
            interval: Number(rcInterval.value || 1),
            byweekday: [...document.querySelectorAll('#rc-weekdays input:checked')].map(x=>Number(x.value)),
            monthlyMode: (document.querySelector('input[name="rc-mmode"]:checked')||{}).value || "BYMONTHDAY",
            count: endType==="COUNT" ? Number(rcCount.value||0) : null,
            until: endType==="UNTIL" ? rcUntil.value : null        
        };
        for (const dISO of generateOccurrences(editingDateISO, "custom", rule)) {
            addOrReplaceEvent(dISO, base);
        }
    } else {
        for (const dISO of generateOccurrences(editingDateISO, mode)) {
            addOrReplaceEvent(dISO, base);
        }
    }
    closePopup();
    render();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && popup && popup.style.display !== "none") closePopup();
  });
  function handleDeleteWithSeries(dateISO, ev){
    const label = ev.time ? `${ev.time} ${ev.name}` : ev.name;

    // no series? behave like before
    if (!ev.seriesId) {
        const ok = confirm(`Delete "${label}" on ${dateISO}?`);
        if (ok) { if (deleteEvent(dateISO, ev)) render(); }
        return;
    }

    // series present → ask how much to delete
    const ans = prompt(
    `Delete "${label}" on ${dateISO}:
    1) This event only
    2) This and following in the series
    3) All events in the series

    Type 1, 2, or 3:`
    );

    if (!ans) return;

    if (ans.trim() === "1") {
        if (deleteEvent(dateISO, ev)) render();
    } else if (ans.trim() === "2") {
        if (deleteSeriesFrom(ev.seriesId, dateISO)) render();
    } else if (ans.trim() === "3") {
        if (deleteSeriesAll(ev.seriesId)) render();
    } else {
        alert("Please enter 1, 2, or 3.");
    }
  }


  // ---------- EVENT RENDER HOOK (with right-click delete) ----------
  function __renderCellEvents(cell) {
    if (!cell || !cell.dataset.date) return;
    const dateISO = cell.dataset.date;
    const wrap = cell.querySelector(".event");
    const store = getStore();
    const events = store[dateISO] || [];

    // Clear & rebuild pills
    wrap.innerHTML = "";

    if (events.length) {
      cell.classList.add("has-events");
      wrap.classList.remove("hide-overflow");

      events.forEach(e => {
        const pill = document.createElement("span");
        pill.className = "event-pill";
        pill.textContent = e.time ? `${e.time} ${e.name}` : e.name;

        // Left-click to edit this specific event
        pill.addEventListener("click", (ev) => {
          ev.stopPropagation();
          openPopup(dateISO, e);
        });

        // RIGHT-CLICK to delete this event
        pill.addEventListener("contextmenu", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          handleDeleteWithSeries(dateISO, e);
        });

        wrap.appendChild(pill);
      });
    } else {
      cell.classList.remove("has-events");
      wrap.classList.add("hide-overflow");
    }

    // Left-click empty cell area → new event
    cell.addEventListener("click", (e) => {
      if (e.target.closest(".event-pill")) return; // pill already handled
      openPopup(dateISO, {});
    });

    // Right-click cell (only if exactly one event) → delete that single event
    cell.addEventListener("contextmenu", (ev) => {
      ev.preventDefault();
      if (events.length !== 1) return;
      handleDeleteWithSeries(dateISO, events[0]);
    });
  }

  // ---------- RENDERERS ----------
  function renderMonth() {
    monthEl.textContent = fmtMonth.format(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
    container.dataset.view = "month";

    const y = anchor.getFullYear();
    const m = anchor.getMonth();
    const firstOfMonth = new Date(y, m, 1);
    const startOffset  = toMondayIndex(firstOfMonth.getDay());
    const daysInThis   = new Date(y, m + 1, 0).getDate();
    const today        = new Date(); today.setHours(0,0,0,0);

    const totalWeeks = Math.ceil((startOffset + daysInThis) / 7);
    const totalCells = totalWeeks * 7;

    gridRoot.innerHTML = "";

    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement("div");
      const dayP = document.createElement("p"); dayP.className = "day";
      const evtP = document.createElement("p"); evtP.className = "event hide-overflow";
      const dayIndex = i - startOffset;

      if (dayIndex < 0 || dayIndex >= daysInThis) {
        cell.className = "grid-item is-outside-empty";
        dayP.textContent = ""; evtP.textContent = "";
        cell.setAttribute("aria-hidden", "true");
        cell.style.pointerEvents = "none";
      } else {
        const d = dayIndex + 1;
        cell.className = "grid-item";
        dayP.textContent = d;
        if (y === today.getFullYear() && m === today.getMonth() && d === today.getDate()) {
          cell.classList.add("is-today");
        }
        cell.dataset.date = toLocalISO(new Date(y, m, d));
      }
      cell.append(dayP, evtP);
      gridRoot.appendChild(cell);
      __renderCellEvents(cell);
    }
  }

  function renderWeek() {
    container.dataset.view = "week";
    const weekStart = startOfWeek(anchor);
    const weekEnd   = addDays(weekStart, 6);

    const fmtRangeStart = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
    const fmtRangeEnd   = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });
    monthEl.textContent = `${fmtRangeStart.format(weekStart)} — ${fmtRangeEnd.format(weekEnd)}`;

    gridRoot.innerHTML = "";

    for (let i = 0; i < 7; i++) {
      const cur  = addDays(weekStart, i);
      const cell = document.createElement("div");
      cell.className = "grid-item";
      cell.dataset.date = toLocalISO(cur);

      const dayP = document.createElement("p");
      dayP.className = "day";
      dayP.textContent = cur.getDate();

      const evtP = document.createElement("p");
      evtP.className = "event hide-overflow";

      const today = new Date(); today.setHours(0,0,0,0);
      if (+cur === +today) cell.classList.add("is-today");

      cell.append(dayP, evtP);
      gridRoot.appendChild(cell);
      __renderCellEvents(cell);
    }
  }

  function renderDay() {
    container.dataset.view = "day";
    monthEl.textContent = fmtDay.format(anchor);

    gridRoot.innerHTML = "";

    const cell = document.createElement("div");
    cell.className = "grid-item";
    const dayP = document.createElement("p");
    dayP.className = "day";
    dayP.textContent = anchor.getDate();
    const evtP = document.createElement("p");
    evtP.className = "event hide-overflow";

    const today = new Date(); today.setHours(0,0,0,0);
    if (+anchor === +today) cell.classList.add("is-today");

    cell.dataset.date = toLocalISO(anchor);
    cell.append(dayP, evtP);
    gridRoot.appendChild(cell);
    __renderCellEvents(cell);
  }

  function render() {
    monthBar.dataset.view = viewMode;
    monthRow.dataset.view = viewMode;
    if (viewMode === "month") renderMonth();
    else if (viewMode === "week") renderWeek();
    else renderDay();
  }

  // ---------- NAV ----------
  function moveBack() {
    if (viewMode === "month") anchor.setMonth(anchor.getMonth() - 1, 1);
    else if (viewMode === "week") anchor.setDate(anchor.getDate() - 7);
    else anchor.setDate(anchor.getDate() - 1);
    render();
  }
  function moveForward() {
    if (viewMode === "month") anchor.setMonth(anchor.getMonth() + 1, 1);
    else if (viewMode === "week") anchor.setDate(anchor.getDate() + 7);
    else anchor.setDate(anchor.getDate() + 1);
    render();
  }

  prevBtn.addEventListener("click", moveBack);
  nextBtn.addEventListener("click", moveForward);

  btnToday.addEventListener("click", () => {
    anchor = new Date(); anchor.setHours(0,0,0,0);
    render();
  });

  viewSel.addEventListener("change", (e) => {
    viewMode = e.target.value;
    if (viewMode === "month") {
      const parsed = parseHeader(monthEl.textContent.trim());
      if (!isNaN(parsed)) anchor = parsed;
    }
    render();
  });

  monthEl.addEventListener("blur", () => {
    if (viewMode !== "month") return;
    const parsed = parseHeader(monthEl.textContent.trim());
    if (!isNaN(parsed)) anchor = parsed;
    render();
  });
  monthEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); monthEl.blur(); }
  });

  // ---------- FIRST PAINT ----------
  render();
});
