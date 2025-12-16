import { getCurrentUserDetails, getUserDetails } from "./users.js";
import { getRecipeIdFromURL, searchForRecipe } from "./recipes.js";
import {
    getCollectionByName,
    createCollection,
    deleteCollectionById,
    addRecipeToBookmarks,
} from "./collections.js";

// Walkthrough objects
const navigateWalkthroughContainer = document.getElementById("navigate-walkthrough");
const stepFractionPresentation = document.getElementById("completion-fraction");
const progressBar = document.getElementById("completion-progress");
const stepCounter = document.getElementById("step-counter");
const currentUrl = window.location.href;
const estimatedTimeElement = document.getElementById("estimated-time");
const timerSection = document.getElementById("timer-section")
const estimatedTimeBoldedText = document.getElementById("time-in-bold");

// Publisher and Date objects
const usernameElement = document.getElementById("username");
const dateElement = document.getElementById("publishing-date");

// Link objects
const usernameLink = document.getElementById("username-link");

// Recipe detail objects
const recipeName = document.getElementById("recipe-name");
const tags = document.getElementById("recipe-tag");
const thumbnail = document.getElementById("recipe-thumbnail");
const videoElement = document.getElementById("recipe-tutorial");
const instructionsTextElement = document.getElementById("instructions");
const ingredientListElement = document.getElementById("ingredient-list");
const totalTimeEl = document.getElementById("recipe-details");
const prepTimeEl = document.getElementById("prep-time-total");
const cookTimeEl = document.getElementById("cook-time-total");

// Obtains recipe ID from URL
const [ _, recipeId ] = currentUrl.split("?id=");

// Lists publisher of recipe
function listPublisher(url, publishingDate) {
    let urlCopy = url;
    let domainName;
    if (!url) {
        domainName = "AnonymousPublisher";
    }
    else {
        const urlComponentsToRemove = ["https://", "http://", "www."];
        for (let i = 0; i < urlComponentsToRemove.length; i++){
            urlCopy = urlCopy.replace(urlComponentsToRemove[i], "");
        }

        const startIndex = 0;
        const endIndex = urlCopy.indexOf(".");
        domainName = urlCopy.substring(startIndex, endIndex);
        
        usernameLink.href = url;
    }
    usernameElement.textContent = domainName;

    if (publishingDate && domainName != "AnonymousPublisher"){
        const date = new Date(publishingDate.replace(" ", "T"));
        const formattedDate = date.toLocaleDateString("en-US", {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        dateElement.textContent = `${formattedDate}`;  
    }
    else {
        dateElement.remove();
    }
}

// Returns object containing lists of ingredients and their associated measurements
function getIngredients(recipe) {
    let ingredients = [];
    let measurements = [];

    for (let i = 1; i <= 20; i++) {
        try {
            const ingredient = recipe[`strIngredient${i}`] || recipe.ingredients[i - 1].name;
            const measurement = recipe[`strMeasure${i}`] || `${recipe.ingredients[i - 1].qty} ${recipe.ingredients[i - 1].unit}`
            if (ingredient) {
                ingredients.push(ingredient);
                measurements.push(measurement)
            }
        } catch {
            // Early return when no more ingredients/measurements are left
            return {ingredients, measurements}
        }
    }

    return {ingredients, measurements}
}

function renderIngredients(ingredients, measurements) {
    ingredientListElement.innerHTML = ""; //clear any existing items
    for (let i = 0; i < ingredients.length; i++) { //for every ingredient the recipe has, put it into a checklist
        const ingredient = ingredients[i];
        const measurement = measurements[i];
        const li = document.createElement("li");
        li.innerHTML = `
            <label>
                <input type="checkbox" class="ingredient-checkbox" data-original="${measurement} ${ingredient}">
                <span>${measurement} ${ingredient}</span>
            </label>
        `;
        ingredientListElement.appendChild(li);
    }
}

// Fills in title, publisher, thumbnail, video, ingredients, and measurements associated with recipe
async function fillRecipeViewPage() {
    const recipeId = new URLSearchParams(window.location.search).get("id");
    // Fetches recipe (ID provided in link)
    const recipe = await searchForRecipe(recipeId);
    // Title
    const recipeTitle = recipe.strMeal || recipe.name;
    recipeName.textContent = recipeTitle;
    document.title = recipeTitle;
    // Publisher
    let recipeOwner = null;
    if (recipe.user_id) {
        recipeOwner = await getUserDetails(recipe.user_id);

        // Loads user's avatar
        const avatar = recipeOwner.avatar;
        let posterAvatar = document.getElementById("poster-profile-pic");
        posterAvatar.src = `/avatar/${avatar}`;
        
        // Adds profile link to username and avatar
        const username = recipeOwner.username;
        let url = new URL(window.location.href);
        url.pathname = `user/${username}`
        url.search = "";
        usernameLink.href = url;
    }

    const publisher = recipe.strSource
                      ? recipe.strSource
                      : recipeOwner
                      ? recipeOwner.username
                      : "AnonymousPublisher";
    const publishDate = recipe.dateModified || recipe.created_at
    if (recipe.strSource) {
        listPublisher(publisher, publishDate);
    }
    else {
        usernameElement.textContent = publisher;
        dateElement.textContent = `${new Date(publishDate).toLocaleDateString("en-US", {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })}`;
    }
    
    // Category
    tags.textContent = recipe.strArea || recipe.tags;
    // Thumbnail
    thumbnail.src = recipe.strMealThumb || `../uploads/multimedia/${recipe.thumbnail}`;
    // Instructions
    let instructions = recipe.strInstructions || recipe.instructions
    try {
        instructions = instructions.replace(/\r/g, "").split("\n").filter(str => str !== "").filter(str => str.length > 7)
    } catch {
        let instructionsBucket = [];
        for (const instr of instructions) {
            instructionsBucket.push(instr);
        }
        instructions = instructionsBucket;
    }
    instructionsTextElement.textContent = instructions[0].text || instructions[0];
    // Video Tutorial
    try {
        let [ _, tutorialVideoId ] = recipe["strYoutube"].split("?v=");
        videoElement.setAttribute("src", `https://www.youtube.com/embed/${tutorialVideoId}`);
    } catch {
        const videoEl = document.createElement("video");
        videoEl.id = videoElement.id;
        videoElement.replaceWith(videoEl);
        videoEl.type = "video/mp4";
        videoEl.controls = true;
        videoEl.src = `../uploads/multimedia/${recipe.video}`;
    }

    let {ingredients, measurements} = getIngredients(recipe);
    renderIngredients(ingredients, measurements);

    return { instructions }
}


// Replaces text with unicode fractions with corresponding non-unicode fractions
function normalizeUnicodeFractions(str) {
    const fractions = {
        "½": '1/2',
        "⅓": '1/3',
        "⅔": '2/3',
        "¼": '1/4',
        "¾": '3/4',
        "⅕": '1/5',
        "⅖": '2/5',
        "⅗": '3/5',
        "⅘": '4/5'
    }
    return str.replace(/[½⅓⅔¼¾⅕⅖⅗⅘]/g, i => ` ${fractions[i]}`);
}


function findTimeMatches(text) {
  const regex =
    /\b(\d+(?:\s+\d+\/\d+)?)(?:\s*(?:-|to)\s*(\d+(?:\s+\d+\/\d+)?))?\s*(?:more\s+)?(mins?|minutes?|hrs?|hours?|hour?|hr?)\b/gi;
  return [...text.matchAll(regex)];
}


function parseTimeSegment(match) {
    const [full, lower, upper, unitRaw] = match;
    const unit = normalizeTimeUnit(unitRaw);
    const singular = unit.replace(/s$/, "");

    if (upper) {
        const lowNum = parseFractional(lower);
        const highNum = parseFractional(upper);
        return {
            lower: lowNum,
            upper: highNum,
            unit: singular,
            hasRange: true,
        };
    } else {
        const value = parseFractional(lower);
        return {
            lower: value,
            upper: null,
            unit: singular,
            hasRange: false,
        };
    }
}


function normalizeTimeUnit(unit) {
    if (!unit){
        return "minutes";
    }
    if (unit.startsWith("h")){
        return "hours"
    };
    return "minutes";
}


function toMinutesMultiplier(unit) {
    return unit.startsWith("h") ? 60 : 1;
}


function parseFractional(str) {
    if (!str) {
        return 0;
    }
    const parts = str.trim().split(" ");
    if (parts.length === 2 && parts[1].includes("/")) {
        const [n, d] = parts[1].split("/").map(Number);
        return parseInt(parts[0], 10) + n / d;
    }
    if (str.includes("/")) {
        const [n, d] = str.split("/").map(Number);
        return n / d;
    }
    return parseFloat(str);
}


function convertMinutesToDisplay(mins) {
    if (mins >= 60) {
        const hours = Math.floor(mins / 60);
        const rem = mins % 60;
        if (rem === 0) {
            return `${hours} hour${hours > 1 ? "s" : ""}`;
        }
        return `${hours} hour${hours > 1 ? "s" : ""}, ${rem} minute${rem !== 1 ? "s" : ""}`;
    }
    return `${mins} minute${mins !== 1 ? "s" : ""}`;
}


function formatTimeSegments(segments) {
  return segments
    .map(s => {
        const unit = s.unit; // "hour" or "minute"
        const formatValue = val => (val % 1 === 0 ? val : val.toFixed(1));

        if (s.hasRange) {
            // wrap ranges in parentheses
            return `(${formatValue(s.lower)} - ${formatValue(s.upper)} ${unit}${s.upper !== 1 ? "s" : ""})`;
        } else {
            return `${formatValue(s.lower)} ${unit}${s.lower !== 1 ? "s" : ""}`;
        }
    })
    .join(" + ");
}


// Reads all durations specified in current recipe instruction and writes them to notecard
function getTimeForInstruction(instruction) {
    // Case 1: When recipe is created with Recipe Maker and is fetched from local SQL database
    if (instruction.hours || instruction.minutes) {
        const hrs = instruction.hours;
        const mins = instruction.minutes;
        const totalMinutes = (hrs * 60) + mins;

        // build a segment identical to regex branch
        const segments = [
            {
                lower: totalMinutes,
                upper: null,
                unit: "minute",
                hasRange: false
            }
        ];

        const estimatedText = convertMinutesToDisplay(totalMinutes);
        estimatedTimeBoldedText.textContent = estimatedText;
        estimatedTimeElement.style.visibility = "";

        return { segments, estimatedText }
    }
    // Case 2: Recipe fetched from TheMealDB API
    else {
        const text = instruction.text || normalizeUnicodeFractions(
            instruction.toLowerCase().replace(/\s*( to |–|—|−| or )\s*/gi, "-")
        );
        
        const matches = findTimeMatches(text);
        if (!matches || matches.length === 0) {
            estimatedTimeElement.style.visibility = "hidden";
            estimatedTimeBoldedText.textContent = "";
            return null;
        }
        const segments = matches.map(parseTimeSegment);
        const estimatedText = formatTimeSegments(segments);

        estimatedTimeBoldedText.textContent = estimatedText;
        estimatedTimeElement.style.visibility = "";

        return { segments, estimatedText };
    }
}

// Convert segments to minutes, picking which bound to use for ranges
function computeMinutesFromSegments(segments, bound = "lower") {
    const mult = u => (u.startsWith("hour") ? 60 : 1);
    return segments.reduce((sum, s) => {
        const val = s.hasRange
        ? (bound === "upper" ? s.upper : s.lower)
        : s.lower;
        return sum + (val * mult(s.unit));
    }, 0);
}


function classifyTimeType(instructionText) {
    // Normalize text to lowercase
    const text = instructionText.toLowerCase();

    // Regex patterns for prep and cook keywords
    const prepPattern = /\b(prep|prepare|mix|chop|slice|whisk|stir|combine|marinate|rest|let stand|knead)\b/;
    const cookPattern = /\b(cook|bake|boil|simmer|roast|grill|fry|saute|steam|broil|toast|heat|reheat)\b/;

    if (cookPattern.test(text)) return "cook";
    if (prepPattern.test(text)) return "prep";

    // fallback if uncertain
    return "prep";
}


function getClassifiedTime(instruction, bound = "upper") {
    const parsed = getTimeForInstruction(instruction);
    instruction = instruction.text || instruction;
    const type = classifyTimeType(instruction);
    if (!parsed) {
        return{ type, totalMinutes: 0 };
    }
    const totalMinutes = computeMinutesFromSegments(parsed.segments, bound);
    return { type, totalMinutes };
}



async function main() {
    // Returns the current step and the last step of instructions
    function getSteps() {
        let [ currentStep, _ ] = stepFractionPresentation.textContent.split(" / ");
        currentStep = parseInt(currentStep);
        let lastStep = instructions.length;
        return { currentStep, lastStep};
    }
    const { instructions } = await fillRecipeViewPage();
    let [ getPreviousStep, getNextStep ] = navigateWalkthroughContainer.getElementsByTagName("button");
    let { currentStep, lastStep } = getSteps();

    progressBar.value = currentStep / lastStep;
    getPreviousStep.style.cursor = "not-allowed";
    getPreviousStep.disabled = true;
    getNextStep.style.cursor = "pointer";

    stepFractionPresentation.textContent = `1 / ${instructions.length}`

    let currentInstruction = instructions[currentStep - 1];

    let prepTotal = 0;
    let cookTotal = 0;  

    for (const instruction of instructions) {
        const { type, totalMinutes } = getClassifiedTime(instruction);
        if (type === "prep"){
            prepTotal += totalMinutes;
        }
        else if (type === "cook"){
            cookTotal += totalMinutes;
        }
    }

    console.log(prepTotal, cookTotal)

    // Deletes parent element representing total time if there's no time to list
    if (prepTotal + cookTotal === 0 || (prepTotal === undefined && cookTotal === undefined)) {
        totalTimeEl.remove();
    }
    else if (prepTotal === 0 || prepTotal === undefined) {
        const prepTimeSection = document.getElementById("prep-time");
        prepTimeSection.remove();
        totalTimeEl.style.width = "200px";
        totalTimeEl.style.gridTemplateColumns = "repeat(1, 1fr)";
    }
    else if (cookTotal === 0 || cookTotal === undefined) {
        const cookTimeSection = document.getElementById("cook-time");
        cookTimeSection.remove();
        totalTimeEl.style.width = "200px";
        totalTimeEl.style.gridTemplateColumns = "repeat(1, 1fr)";
    }
    
    prepTimeEl.textContent = convertMinutesToDisplay(prepTotal);
    cookTimeEl.textContent = convertMinutesToDisplay(cookTotal);

    // Checks if timer should be displayed
    function displayTimer(currentInstruction) {
        const timer = getTimeForInstruction(currentInstruction);
        visibleCountdown.textContent = calculate_padded_time(getEstimatedTimeInMinutes(0) * 60);
        timerBar.value = 1;

        // Makes timer section fully visible and interactible
        if (timer) {
            timerSection.style.opacity = 1;
            timerSection.removeAttribute("inert");
        }
        // Makes timer partially transparent and not interactible
        else {
            visibleCountdown.textContent = "00:00";
            timerSection.setAttribute("inert", "")
            timerSection.style.opacity = 0.5;
        }
    }

    function initializeTimerButtons() {
        timerIndex = 0;
        prevTimerBtn.style.cursor = "not-allowed";
        prevTimerBtn.style.color = "gray";
        
        if (!getCurrentTimeBlock(timerIndex).includes("-")) {
            switchTimerBtn.style.cursor = "not-allowed";
            switchTimerBtn.style.color = "gray";
        }
        else {
            switchTimerBtn.style.cursor = "pointer";
            switchTimerBtn.style.color = "black";
        }

        if (!getCurrentTimeBlock(timerIndex + 1)) {
            nextTimerBtn.style.cursor = "not-allowed"
            nextTimerBtn.style.color = "gray";
        }
        else {
            nextTimerBtn.style.cursor = "pointer";
            nextTimerBtn.style.color = "black";
        }
    }
    
    displayTimer(currentInstruction);
    initializeTimerButtons();

    // Allows user to move to the previous step in instructions when left button is clicked
    getPreviousStep.addEventListener("click", () => {
        // Obtains current step and last step
        let { currentStep, lastStep } = getSteps();

        currentInstruction = instructions[currentStep - 1];

        initializeTimerButtons();

        if (currentStep != 1) {
            currentStep -= 1;

            currentInstruction = instructions[currentStep - 1];
            displayTimer(currentInstruction)

            // Updates text displayed for instructions, steps done, and step counter
            instructionsTextElement.textContent = instructions[currentStep - 1].text || instructions[currentStep - 1];
            stepFractionPresentation.textContent = `${currentStep} / ${lastStep}`;
            stepCounter.textContent = currentStep;
            progressBar.value = currentStep / lastStep;

            // Prevents user from moving below step 1
            if (currentStep == 1) {
                getPreviousStep.style.cursor = "not-allowed";
                getPreviousStep.disabled = true;
            }

            getNextStep.disabled = false;
            getNextStep.style.cursor = "pointer";
        }
    })

    // Allows user to move to the next step in instructions when right button is clicked
    getNextStep.addEventListener("click", () => {
        // Obtains current step and last step
        let { currentStep, lastStep } = getSteps();

        if (currentStep != lastStep) {
            currentStep += 1;

            currentInstruction = instructions[currentStep - 1];
            displayTimer(currentInstruction)

            // Updates text displayed for instructions, steps done, and step counter
            instructionsTextElement.textContent = instructions[currentStep - 1].text || instructions[currentStep - 1];
            stepFractionPresentation.textContent = `${currentStep} / ${lastStep}`;
            stepCounter.textContent = currentStep;
            // Updates progress bar to reflect current step
            progressBar.value = currentStep / lastStep;

            // Prevents user from moving past last step
            if (currentStep == lastStep) {
                getNextStep.style.cursor = "not-allowed";
                getNextStep.disabled = true;
            }

            getPreviousStep.disabled = false;
            getPreviousStep.style.cursor = "pointer";
        }

        initializeTimerButtons();
    })

    const timerOptionsDropdown = timerSection.getElementsByClassName("dropdown-content")[0];
    timerSection.addEventListener(
        "mouseleave", () => {
            timerOptionsDropdown.style.display = "none";
        }
    )

    //dropdown for unit conversion
    const ingredientCard = document.querySelector('.ingredient-card');
    //source that helped: https://stackoverflow.com/a/23718863 (Credit to user named "nicael")
    const dropdown = document.createElement('select');
    dropdown.id = 'unit-conversion-dropdown';
    dropdown.innerHTML = `
        <option value="none">Select conversion</option>
        <option value="oz-to-ml">Ounces to Milliliters</option>
        <option value="ml-to-oz">Milliliters to Ounces</option>
        <option value="cups-to-ml">Cups to Milliliters</option>
        <option value="ml-to-cups">Milliliters to Cups</option>
        <option value="tbsp-to-tsp">Tablespoons to Teaspoons</option>
        <option value="tsp-to-tbsp">Teaspoons to Tablespoons</option>
    `;
    ingredientCard.insertBefore(dropdown, ingredientCard.firstChild.nextSibling); // after h3, before ol

    // Conversion factors
    const conversionFactors = {
        'oz-to-ml': 29.5735, //https://www.inchcalculator.com/convert/fluid-ounce-to-milliliter/
        'ml-to-oz': 1/29.5735,
        'cups-to-ml': 236.588, //https://www.unitconverters.net/volume/cups-to-ml.htm
        'ml-to-cups': 1/236.588,
        'tbsp-to-tsp': 3, //https://www.inchcalculator.com/convert/tablespoon-to-teaspoon/
        'tsp-to-tbsp': 1/3
    };

    // Parse quantity like "3 1/3 cup", "1/2cup", "2.5 tbsp", "4 ", "½ tbsp"
    //had to get help from copilot for this function
    function parseQuantity(input) {
        if (!input || typeof input !== 'string') return null;
        let s = input.trim();
        // normalize unicode fractions (uses existing function in file)
        s = normalizeUnicodeFractions(s).trim();

        // Pattern: numeric part (mixed | fraction | decimal | int), optional unit (letters + dots), then rest
        const m = s.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.\d+|\d+)\s*([a-zA-Z\.]+)?\.?\s*(.*)$/);
        if (!m) return null;

        const rawNumber = m[1];
        const rawUnit = m[2] || '';
        const rest = (m[3] || '').trim();

        let value;
        if (rawNumber.includes(' ')) { // mixed number
            const [whole, frac] = rawNumber.split(/\s+/);
            const [num, den] = frac.split('/').map(Number);
            value = parseInt(whole, 10) + (num / den);
        } else if (rawNumber.includes('/')) { // simple fraction
            const [num, den] = rawNumber.split('/').map(Number);
            value = num / den;
        } else {
            value = parseFloat(rawNumber);
        }

        const unit = rawUnit.toLowerCase().replace(/\.$/, '');

        return { value, unit, rest, rawNumber };
    }

    function convertMeasurement(original, conversionType) {
        // original may contain quantity + unit + ingredient; parse it
        //had to get help from copilot for this function
        const parsed = parseQuantity(original);
        if (!parsed) return original; // nothing to convert

        const { value, unit, rest } = parsed;
        let convertedValue, convertedUnit;

        switch (conversionType) {
            case 'oz-to-ml':
                if (["oz", "ounce", "ounces"].includes(unit)) {
                    convertedValue = value * conversionFactors[conversionType];
                    convertedUnit = "ml";
                }
                break;
            case 'ml-to-oz':
                if (["ml", "milliliter", "milliliters"].includes(unit)) {
                    convertedValue = value * conversionFactors[conversionType];
                    convertedUnit = "oz";
                }
                break;
            case 'cups-to-ml':
                if (["cup", "cups"].includes(unit)) {
                    convertedValue = value * conversionFactors[conversionType];
                    convertedUnit = "ml";
                }
                break;
            case 'ml-to-cups':
                if (["ml", "milliliter", "milliliters"].includes(unit)) {
                    convertedValue = value * conversionFactors[conversionType];
                    convertedUnit = "cups";
                }
                break;
            case 'tbsp-to-tsp':
                if (["tbsp", "tbs", "tablespoon", "tablespoons", "tbs."].includes(unit)) {
                    convertedValue = value * conversionFactors[conversionType];
                    convertedUnit = "tsp";
                }
                break;
            case 'tsp-to-tbsp':
                if (["tsp", "teaspoon", "teaspoons", "t", "tsp."].includes(unit)) {
                    convertedValue = value * conversionFactors[conversionType];
                    convertedUnit = "tbsp";
                }
                break;
            default:
                return original;
        }

        if (convertedValue === undefined) return original; // unit didn't match expected for this conversion

        // Format: two decimals, but remove trailing .00 for whole numbers if desired
        const formatted = Number.isInteger(convertedValue) ? `${convertedValue}` : convertedValue.toFixed(2);
        return `${formatted} ${convertedUnit}${rest ? ' ' + rest : ''}`;
    }

    dropdown.addEventListener('change', function() {
        const conversionType = this.value;
        const ingredients = document.querySelectorAll('.ingredient-card ol li');
        ingredients.forEach(li => {
            const checkbox = li.querySelector('input.ingredient-checkbox');
            const span = li.querySelector('span');
            if (checkbox && span) {
                const original = checkbox.getAttribute('data-original') || span.textContent;
                if (conversionType === 'none') {
                    span.textContent = original.trim();
                } else {
                    span.textContent = convertMeasurement(original, conversionType);
                }
            }
        });
    });
}

main()

// Store comments in-memory per step (for demo; lacks persistence)

document.addEventListener('DOMContentLoaded', async () => {    

    // Text-to-speech for step instructions
    // https://forum.freecodecamp.org/t/text-to-speech-with-javascript-and-html/724321
    const speakBtn = document.getElementById('speak-step-btn');
    const instructionsEl = document.getElementById('instructions');
    if (speakBtn && instructionsEl) {
        speakBtn.addEventListener('click', () => {
            const text = instructionsEl.innerText || instructionsEl.textContent;
            const speech = new SpeechSynthesisUtterance(text);
            speech.volume = 1;
            speech.rate = 1;
            speech.pitch = 1;
            window.speechSynthesis.speak(speech);
        });
    }

    //bookmark popup logic
    const bookmarkBtn = document.querySelector("#bookmark");
    const popup = document.getElementById("bookmark-popup");
    const overlay = document.getElementById("bookmark-popup-overlay");
    const form = document.getElementById("bookmark-form");
    const select = document.getElementById("collection-select");
    const newCollectionInput = document.getElementById("new-collection-name");
    const addCollectionBtn = document.getElementById("add-collection-btn");
    const deleteCollectionBtn = document.getElementById("delete-collection-btn");
    const cancelBtn = document.getElementById("cancel-bookmark-popup");

    // Early return to prevent unregistered users from making collections/bookmarking recipes
    const current_user = await getCurrentUserDetails();

    if (!current_user) {
        bookmarkBtn.disabled = true;
        bookmarkBtn.style.cursor = "not-allowed";
        return; // stop executing the rest
    }

    //load collections from localStorage or default + help from copilot to change collections to arrays
    async function loadCollections() {
        select.innerHTML = "";
        try {
        const res = await fetch("/collections");
        const data = await res.json();
        const items = data.items || [];

        // Auto-create "My Bookmarks" if missing
        if (!items.some((c) => c.collection_name === "My Bookmarks")) {
            await createCollection("My Bookmarks");
            return loadCollections();
        }

        for (const col of items) {
            const opt = document.createElement("option");
            opt.value = col.collection_name;
            opt.textContent = col.collection_name;
            select.appendChild(opt);
        }

        updateDeleteButtonState();
        } catch (err) {
        console.error("Failed to load collections:", err);
        }
    }

    //show popup
    //https://www.w3schools.com/howto/howto_js_popup_form.asp
    function showPopup() {
        loadCollections();
        popup.style.display = "block";
        overlay.style.display = "block";
        newCollectionInput.value = "";
        select.focus();
        updateDeleteButtonState();
    }

    //hide popup
    //https://www.w3schools.com/howto/howto_js_popup_form.asp
    function hidePopup() {
        popup.style.display = "none";
        overlay.style.display = "none";
    }

    overlay.addEventListener("click", hidePopup);
    cancelBtn.addEventListener("click", hidePopup);

    //helper to enable/disable delete button (cannot delete "bookmarks")
    function updateDeleteButtonState() {
        const selected = select.value;
        if (!selected || selected === "My Bookmarks") {
        deleteCollectionBtn.disabled = true;
        deleteCollectionBtn.style.opacity = "0.5";
        } else {
        deleteCollectionBtn.disabled = false;
        deleteCollectionBtn.style.opacity = "1";
        }
    }

    select.addEventListener("change", updateDeleteButtonState);

    //add new collection
    addCollectionBtn.addEventListener("click", async () => {
        const name = newCollectionInput.value.trim();
        if (!name) return;
        const existing = Array.from(select.options).map((o) => o.value.toLowerCase());
        if (existing.includes(name.toLowerCase())) {
            alert(`Collection "${name}" already exists.`);
            return;
        }
        await createCollection(name);
        await loadCollections();
        select.value = name;
        newCollectionInput.value = "";
    });

    //delete selected collection (except 'bookmarks')
    deleteCollectionBtn.addEventListener("click", async () => {
        const name = select.value;
        if (!name || name === "My Bookmarks") {
            alert('Default "My Bookmarks" cannot be deleted.');
            return;
        }
        if (!confirm(`Delete collection "${name}"?`)) return;
        const col = await getCollectionByName(name);
        console.log(col.id);
        if (col?.id) await deleteCollectionById(col.id);
        await loadCollections();
        select.value = "My Bookmarks";

    });

    //update delete button state when user chooses another collection
    select.addEventListener('change', updateDeleteButtonState);

    //cancel button
    cancelBtn.addEventListener('click', hidePopup);
    overlay.addEventListener('click', hidePopup);

    //save bookmark
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const recipeId = getRecipeIdFromURL();
        console.log(recipeId)
        const collectionName = select.value || "My Bookmarks";

        let collection = await getCollectionByName(collectionName);
        let collectionId = collection?.id;

        if (!collectionId) {
            const created = await createCollection(collectionName);
            collectionId = created.collection?.id;
        }

        await addRecipeToBookmarks(collectionId, recipeId);
        alert(`Recipe saved to "${collectionName}"!`);
        hidePopup();
    });

    //show popup on bookmark button click
    if (bookmarkBtn) {
        bookmarkBtn.addEventListener("click", (e) => {
            e.preventDefault();
            showPopup();
        });
    }

    // Step comment logic
    const commentBtn = document.getElementById('add-step-comment');
    const section = document.getElementById('step-comment-section');
    const input = document.getElementById('step-comment-input');
    const submitBtn = document.getElementById('submit-step-comment');
    const list = document.getElementById('step-comments-list');
    const stepCounter = document.getElementById('step-counter');
    const recipeId = getRecipeIdFromURL();

    let currentUser = null;
    try {
        currentUser = await getCurrentUserDetails();
    } catch {
        currentUser = null;
    }

    // Fetch and render comments for a step
    async function renderStepComments() {
        const stepNum = Number(stepCounter.textContent) || 1;
        list.innerHTML = '';
        let currentUserId = currentUser?.id;
        try {
            const res = await fetch(`/step-comments/${recipeId}/${stepNum}`); //fetch comments for this recipe and step
            const comments = await res.json();
            comments.forEach(comment => {
                const div = document.createElement('div');
                div.className = "step-comment";
                div.innerHTML = `<b>@${comment.username}:</b> <span class="comment-content">${comment.content}</span>`;

                // Only show edit/delete for user's own comment
                if (comment.user_id === currentUserId) {
                    const editBtn = document.createElement('button');
                    editBtn.textContent = "Edit";
                    editBtn.style.marginLeft = "10px";
                    editBtn.onclick = () => {
                        const contentSpan = div.querySelector('.comment-content');
                        const oldContent = contentSpan.textContent;
                        const input = document.createElement('input');
                        input.type = "text";
                        input.value = oldContent;
                        const saveBtn = document.createElement('button');
                        saveBtn.textContent = "Save";
                        const cancelBtn = document.createElement('button');
                        cancelBtn.textContent = "Cancel";
                        contentSpan.replaceWith(input); //replace with input field
                        editBtn.replaceWith(saveBtn); //replace edit with save
                        deleteBtn.replaceWith(cancelBtn); //replace delete with cancel

                        saveBtn.onclick = async () => { //save updated comment
                            const newContent = input.value.trim();
                            if (!newContent) return;
                            const resp = await fetch(`/step-comments/${comment.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ content: newContent })
                            });
                            if (resp.ok) {
                                await renderStepComments();
                            } else {
                                alert("Failed to update comment.");
                            }
                        };
                        cancelBtn.onclick = () => renderStepComments();
                    };

                    const deleteBtn = document.createElement('button');
                    deleteBtn.textContent = "Delete";
                    deleteBtn.style.marginLeft = "5px";
                    deleteBtn.onclick = async () => {
                        if (!confirm("Delete this comment?")) return;
                        const resp = await fetch(`/step-comments/${comment.id}`, { method: "DELETE" });
                        if (resp.ok) {
                            await renderStepComments();
                        } else {
                            alert("Failed to delete comment.");
                        }
                    };

                    div.appendChild(editBtn);
                    div.appendChild(deleteBtn);
                }
                list.appendChild(div);
                if (comment.user_id !== currentUserId) { //only show report button for other users' comments
                    const reportBtn = document.createElement('button');
                    reportBtn.textContent = "Report";
                    reportBtn.style.marginLeft = "10px";
                    reportBtn.onclick = async () => {  //reports a comment by getting info and sending to a report to email
                        await fetch("/report/step-comment", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                username: comment.username,
                                recipeId: recipeId,
                                stepNum: stepNum,
                                content: comment.content,
                            }),
                        });
                        alert("Reported. Thank you!");
                    };
                    div.appendChild(reportBtn);
                }
            });
        } catch (err) {
            list.innerHTML = "<div class='step-comment'>Failed to load comments.</div>";
        }
    }

    commentBtn.addEventListener('click', () => { //toggle comment section
        if (!currentUser) {
            alert("You must be logged in to comment.");
            return;
        }
        section.style.display = section.style.display === "none" ? "block" : "none";
        input.focus();
        renderStepComments();
    });

    submitBtn.addEventListener('click', async () => { //submit new comment
        if (!currentUser) {
            alert("You must be logged in to comment.");
            return;
        }
        const text = input.value.trim();
        if (!text) return;
        const stepNum = Number(stepCounter.textContent) || 1;
        try {
            const res = await fetch("/step-comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    recipe_id: recipeId,
                    step_num: stepNum,
                    content: text
                })
            });
            if (res.ok) {
                input.value = "";
                await renderStepComments();
            } else {
                alert("Failed to post comment.");
            }
        } catch {
            alert("Failed to post comment.");
        }
    });

    // Update comments when step changes
    const observer = new MutationObserver(renderStepComments);
    observer.observe(stepCounter, { childList: true });

    renderStepComments();

});