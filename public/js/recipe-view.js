
// Walkthrough objects
const navigateWalkthroughContainer = document.getElementById("navigate-walkthrough");
const stepFractionPresentation = document.getElementById("completion-fraction");
const progressBar = document.getElementById("completion-progress");
const stepCounter = document.getElementById("step-counter");
const currentUrl = window.location.href;
const estimatedTimeElement = document.getElementById("estimated-time");
const estimatedTimeDescriptor = document.getElementById("description");
const timerSection = document.getElementById("timer-section")
const estimatedTimeBoldedText = document.getElementById("time-in-bold");

// Publisher and Date objects
const usernameElement = document.getElementById("username");
const usernameAndDateElement = document.getElementById("username-and-date");
const dateElement = document.getElementById("publishing-date");
const separatorElement = document.getElementById("separator");

// Link objects
const usernameLink = document.getElementById("username-link");
const websiteLink = document.getElementById("origin-site-link");
const websiteAvailableImg = document.getElementById("origin-site-available");
const websiteNotAvailableImg = document.getElementById("origin-site-not-available")

// Recipe detail objects
const recipeName = document.getElementById("recipe-name");
const username = document.getElementById("username-str");
const thumbnail = document.getElementById("recipe-thumbnail");
const videoElement = document.getElementById("recipe-tutorial");
const instructionsTextElement = document.getElementById("instructions");
const ingredientListElement = document.getElementById("ingredient-list");

// Obtains recipe ID from URL
const [ _, recipeApiId ] = currentUrl.split("?id=");

// Returns the current step and the last step of instructions
function getSteps() {
    let [ currentStep, _ ] = stepFractionPresentation.textContent.split(" / ");
    currentStep = parseInt(currentStep);
    lastStep = instructions.length;
    return { currentStep, lastStep};
}


// Searches for the recipe based on ID provided in URL
async function searchForRecipe() {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipeApiId}`);
    if (!response.ok) {
        throw "Error occurred fetching data!";
    }
    const data = await response.json();
    return data["meals"][0];
}

// Lists publisher of recipe
function listPublisher(url, publishingDate) {
    urlCopy = url;
    if (!url) {
        domainName = "AnonymousPublisher";
        websiteAvailableImg.style.display = "none";
    }
    else {
        const urlComponentsToRemove = ["https://", "http://", "www."];
        for (let i = 0; i < urlComponentsToRemove.length; i++){
            urlCopy = urlCopy.replace(urlComponentsToRemove[i], "");
        }

        startIndex = 0;
        endIndex = urlCopy.indexOf(".");
        domainName = urlCopy.substring(startIndex, endIndex);

        usernameLink.href = "public-account.html";
        websiteNotAvailableImg.style.display = "none";
        websiteLink.href = url;
    }
    usernameElement.textContent = domainName;

    if (publishingDate){
        dateElement.textContent = `Uploaded on ${publishingDate}`;  
    }
    else {
        separatorElement.remove();
        dateElement.remove();
    }
}

// Returns object containing lists of ingredients and their associated measurements
function getIngredients(recipe) {
    let ingredients = [];
    let measurements = [];

    for (let i = 1; i <= 20; i++) {
        ingredient = recipe[`strIngredient${i}`]
        measurement = recipe[`strMeasure${i}`]

        if (ingredient) {
            ingredients.push(ingredient);
            measurements.push(measurement)
        }
        // Early return when no more ingredients/measurements are left
        else {
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
    // Fetches recipe (ID provided in link)
    const recipe = await searchForRecipe();
    // Title
    recipeName.textContent = recipe["strMeal"]
    // Publisher
    listPublisher(recipe["strSource"], recipe["dateModified"]);
    // Thumbnail
    thumbnail.src = recipe["strMealThumb"];
    // Instructions
    instructions = recipe["strInstructions"].replace(/\r/g, "").split("\n").filter(str => str !== "").filter(str => str.length > 7)
    instructionsTextElement.textContent = instructions[0];
    // Video Tutorial
    let [ _, tutorialVideoId ] = recipe["strYoutube"].split("?v=");
    videoElement.setAttribute("src", `https://www.youtube.com/embed/${tutorialVideoId}`)

    let {ingredients, measurements} = getIngredients(recipe);
    renderIngredients(ingredients, measurements);

    return { instructions }
}


// Returns a consistent time unit for the time unit listed in the recipe
function getExpectedTimeUnit(timeUnit, timeValue=-1) {
    switch (timeUnit) {
        // minutes
        case "minutes":
            return "minutes";
        case "mins":
            return "minutes";
        // minutes / minute
        case "minute":
            if (timeValue > 1) {
                return "minutes"
            }
            return "minute";
        case "min":
            if (timeValue > 1) {
                return "minutes"
            }
            return "minute"
        // hours
        case "hours":
            return "hours";
        case "hrs":
            return "hours"
        // hours / hour
        case "hour":
            if (timeValue > 1) {
                return "hours"
            }
            return "hour"
        case "hr":
            if (timeValue > 1) {
                return "hours"
            }
            return "hour"
        // Returns empty string for first time value listed in time span (e.g. 25–30 minutes)
        default:
            return ""
    }
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


// Reads all durations specified in current recipe instruction and writes them to notecard
function getTimeForInstruction() {
    let matches;
    currentInstruction = currentInstruction.toLowerCase().replace(/\s*( to |–|—|−| or )\s*/gi, "-");
    const regex = /\b(\d+(?:\s+\d+\/\d+)?)(?:\s*(?:-|to)\s*(\d+(?:\s+\d+\/\d+)?))?\s*(?:more\s+)?( ?(?:mins?|minutes?|hrs?|hours?|hour?|hr?))\b/gi;

    currentInstruction = normalizeUnicodeFractions(currentInstruction)
    matches = [...currentInstruction.matchAll(regex)];

    if (matches[0]) {
        timeValue = 0;
        estimatedTimeBoldedText.textContent = "";

        matches.forEach(
            (m) => {
                match = m[0];
                parts = match.split(" ");
                let timeValue;
                let timeUnit;

                if (parts.length === 1) {
                    [, timeValue, timeUnit] = match.match(/^(\d+(?:\s+\d+\/\d+)?)([a-zA-Z]+)$/);
                    timeUnit = getExpectedTimeUnit(timeUnit, timeValue)
                }
                else {
                    // Grabs the last word representing the time unit and processes it
                    timeUnit = (match.split(" ")).at(-1)
                    timeUnit = getExpectedTimeUnit(timeUnit)
                }

                if (match.includes("-")) {
                    if ((match.split("-")[0])){
                        let [lowerBound, upperBound] = match.split(/-/).map(s => s.trim());

                        const singular = unit => unit.replace(/s$/, "");

                        function getValuesAndUnits(bound) {
                            let parts = bound.trim().split(/\s+/);

                            let timeUnit;
                            let timeValue;

                            // Case 1: mixed number with fraction (e.g. "2 1/2")
                            if (parts.length >= 2 && parts[1].includes("/")) {
                                let whole = parseInt(parts[0], 10);
                                let [num, denom] = parts[1].split("/").map(Number);
                                timeValue = whole + (num / denom);
                                timeUnit = parts[2] || ""; // optional unit if present
                            }
                            // Case 2: pure fraction (e.g. "1/2")
                            else if (parts[0].includes("/")) {
                                let [num, denom] = parts[0].split("/").map(Number);
                                timeValue = num / denom;
                                timeUnit = parts[1] || "";
                            }
                            // Case 3: normal integer + unit (e.g. "3 hours")
                            else {
                                timeValue = parseInt(parts[0], 10);
                                timeUnit = match.split(" ").at(-1) || "";
                            }

                            timeUnit = getExpectedTimeUnit(timeUnit);

                            if (timeValue == 1) {
                                timeUnit = singular(timeUnit);
                            }

                            return { timeValue, timeUnit };
                        }
                        
                        let { timeValue: timeValueLower, timeUnit: timeUnitLower } = getValuesAndUnits(lowerBound);
                        let { timeValue: timeValueUpper, timeUnit: timeUnitUpper } = getValuesAndUnits(upperBound);
                        if (singular(timeUnitLower) === singular(timeUnitUpper)) {
                            timeUnitLower = "";
                        }
                        
                        if (estimatedTimeBoldedText.textContent) {
                            estimatedTimeBoldedText.textContent += ` + (${timeValueLower} ${timeUnitLower} - ${timeValueUpper} ${timeUnitUpper})`
                        }
                        else {
                            estimatedTimeBoldedText.textContent = `${timeValueLower} ${timeUnitLower} - ${timeValueUpper} ${timeUnitUpper}`;
                        }
                    }
                    else {
                        if (estimatedTimeBoldedText.textContent) {
                            estimatedTimeBoldedText.textContent += ` + ${match.split(" ")[0]} ${timeUnit}`;
                        }
                        else {
                            estimatedTimeBoldedText.textContent = `${match.split(" ")[0]} ${timeUnit}`;
                        }
                    }

                    estimatedTimeElement.style.visibility = "";
                }
                else {
                    if (!timeValue || !timeUnit) {
                        timeValue = parseInt(match.split(" ")[0]);
                        timeUnit = getExpectedTimeUnit(match.split(" ").at(-1));
                    }

                    if (timeUnit === "hours" || timeUnit === "hour") {
                        timeValue *= 60;
                    }
                    
                    estimatedTimeElement.style.visibility = "";

                    let numMinutes;
                    let numHours;
                    if (timeValue > 60) {
                        numHours = Math.floor(timeValue / 60);
                        numMinutes = timeValue - (60 * numHours);
                        if (numHours === 1) {
                            if (estimatedTimeBoldedText.textContent) {
                                if (numMinutes !== 0) {
                                    estimatedTimeBoldedText.textContent += ` + 1 hour, ${numMinutes} minutes`;
                                }
                                else {
                                    estimatedTimeBoldedText.textContent += ` + 1 hour`;
                                }
                            }
                            else {
                                if (numMinutes !== 0) {
                                    estimatedTimeBoldedText.textContent = `1 hour, ${numMinutes} minutes`;
                                }
                                else {
                                    estimatedTimeBoldedText.textContent = `1 hour`;
                                }
                            }
                        }
                        else {
                            if (numMinutes != 0)
                                if (estimatedTimeBoldedText.textContent) {
                                    estimatedTimeBoldedText.textContent += ` + ${numHours} hours, ${numMinutes} minutes`;
                                }
                                else {
                                    estimatedTimeBoldedText.textContent = `${numHours} hours, ${numMinutes} minutes`;
                                }
                            else {
                                if (estimatedTimeBoldedText.textContent) {
                                    estimatedTimeBoldedText.textContent += ` + ${numHours} hours`;
                                }
                                else {
                                    estimatedTimeBoldedText.textContent = `${numHours} hours`;
                                }
                            }
                        }
                    }
                    else {
                        if (estimatedTimeBoldedText.textContent) {
                            estimatedTimeBoldedText.textContent += ` + ${timeValue} ${timeUnit}`;
                        }
                        else {
                            estimatedTimeBoldedText.textContent = `${timeValue} ${timeUnit}`;
                        }
                    }
                }
            }
        );
        return true;
    }
    else {
        estimatedTimeElement.style.visibility = "hidden";
        estimatedTimeBoldedText.textContent = "";
        return false;
    }
}

async function main() {
    ({instructions} = await fillRecipeViewPage());
    let [ getPreviousStep, getNextStep ] = navigateWalkthroughContainer.getElementsByTagName("button");
    let { currentStep, lastStep } = getSteps();


    progressBar.value = currentStep / lastStep;
    getPreviousStep.style.cursor = "not-allowed";
    getPreviousStep.disabled = true;
    getNextStep.style.cursor = "pointer";

    stepFractionPresentation.textContent = `1 / ${instructions.length}`

    currentInstruction = instructions[currentStep - 1];

    // Checks if timer should be displayed
    function displayTimer(currentInstruction) {
        timer = getTimeForInstruction(currentInstruction);
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
        // TODO: Use popups to manage multiple timers when navigating steps
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
            instructionsTextElement.textContent = instructions[currentStep - 1]
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
            instructionsTextElement.textContent = instructions[currentStep - 1]
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

    function convertMeasurement(measurement, conversionType) {
        //extract number and unit + source that helped: https://regexone.com/references/javascript
        const regex = /([\d\.]+)\s*(oz|ounce|ounces|ml|milliliter|milliliters|cup|cups|tbsp|tbs\.?|tablespoon|tablespoons|T|tsp|tsp\.?|teaspoon|teaspoons|t)/i;
        const match = measurement.match(regex);
        if (!match) return measurement; //no conversion if no match
        let value = parseFloat(match[1]); //the number
        let unit = match[2].toLowerCase().replace(/\.$/, ""); //the unit + turning to lowercase and remove period at end if there is one
        let convertedValue, convertedUnit;
        switch(conversionType) { //https://www.w3schools.com/js/js_switch.asp
            case 'oz-to-ml':
                if (["oz","ounce","ounces"].includes(unit)) {
                    convertedValue = value * conversionFactors[conversionType];
                    convertedUnit = "ml";
                }
                break;
            case 'ml-to-oz':
                if (["ml","milliliter","milliliters"].includes(unit)) {
                    convertedValue = value * conversionFactors[conversionType];
                    convertedUnit = "oz";
                }
                break;
            case 'cups-to-ml':
                if (["cup","cups"].includes(unit)) {
                    convertedValue = value * conversionFactors[conversionType];
                    convertedUnit = "ml";
                }
                break;
            case 'ml-to-cups':
                if (["ml","milliliter","milliliters"].includes(unit)) {
                    convertedValue = value * conversionFactors[conversionType];
                    convertedUnit = "cups";
                }
                break;
            case 'tbsp-to-tsp':
                if (["tbsp", "tbs", "tablespoon","tablespoons"].includes(unit)) {
                    convertedValue = value * conversionFactors[conversionType];
                    convertedUnit = "tsp";
                }
                break;
            case 'tsp-to-tbsp':
                if (["tsp","teaspoon","teaspoons","t","tsp."].includes(unit)) {
                    convertedValue = value * conversionFactors[conversionType];
                    convertedUnit = "tbsp";
                }
                break;
            default:
                return measurement;
        }
        if (convertedValue !== undefined) {
            return `${convertedValue.toFixed(2)} ${convertedUnit}`;
        }
        return measurement;
    }

    dropdown.addEventListener('change', function() {
        const conversionType = this.value;
        const ingredients = document.querySelectorAll('.ingredient-card ol li');
        ingredients.forEach(li => {
            const checkbox = li.querySelector('input.ingredient-checkbox');
            const span = li.querySelector('span');
            if (checkbox && span) {
                const original = checkbox.getAttribute('data-original');
                if (conversionType === 'none') {
                    span.textContent = original;
                } else {
                    // Only convert the measurement part, keep ingredient name
                    const parts = original.split(' ');
                    if (parts.length >= 2) {
                        const measurement = parts.slice(0,2).join(' ');
                        const rest = parts.slice(2).join(' ');
                        span.textContent = convertMeasurement(measurement, conversionType) + (rest ? ' ' + rest : '');
                    } else {
                        span.textContent = convertMeasurement(original, conversionType);
                    }
                }
            }
        });
    });
}

main()

// Store comments in-memory per step (for demo; lacks persistence)
const stepComments = {};

// Show/hide comment input for the current step
function showCommentSection(currentStep) {
    const section = document.getElementById('step-comment-section');
    const input = document.getElementById('step-comment-input');
    const list = document.getElementById('step-comments-list');
    section.style.display = 'block';
    input.value = '';
    // Show existing comments for this step
    const comments = stepComments[currentStep] || [];
    comments.forEach(c => {
    const div = document.createElement('div');
        div.style.margin = '4px 0';
        div.textContent = `💡 ${c}`;
        list.appendChild(div);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const commentBtn = document.getElementById('add-step-comment');
    const submitBtn = document.getElementById('submit-step-comment');
    const input = document.getElementById('step-comment-input');
    const section = document.getElementById('step-comment-section');
    const list = document.getElementById('step-comments-list');

    let currentStep = 1;
    const stepComments = {};

    function updateCurrentStep() {
        const [step] = document.getElementById('completion-fraction').textContent.split(' / ');
        currentStep = parseInt(step, 10);
    }

    function showCommentSection(currentStep) {
        section.style.display = 'block';
        input.value = '';
        const comments = stepComments[currentStep] || [];
        list.innerHTML = comments.map(c => `<div style="margin:4px 0;">💡 ${c}</div>`).join('');
    }

    if (commentBtn) {
        commentBtn.addEventListener('click', () => {
            updateCurrentStep();
            showCommentSection(currentStep);
        });
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            const text = input.value.trim();
            if (!text) return;
            if (!stepComments[currentStep]) stepComments[currentStep] = [];
            stepComments[currentStep].push(text);
            showCommentSection(currentStep);
        });
    }

    // Hide comment section when navigating steps
    const nav = document.getElementById('navigate-walkthrough');
    if (nav) {
        nav.addEventListener('click', (e) => {
            // Don't hide if the comment button itself was clicked
            if (e.target === commentBtn) return;
            section.style.display = 'none';
        });
    }

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
});