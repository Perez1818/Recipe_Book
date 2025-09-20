const navigateWalkthroughContainer = document.getElementById("navigate-walkthrough");
const stepFractionPresentation = document.getElementById("completion-fraction");
const progressBar = document.getElementById("completion-progress");
const stepCounter = document.getElementById("step-counter");
const currentUrl = window.location.href
const [ _, recipeApiId ] = currentUrl.split("?id=");

const usernameElement = document.getElementById("username");
const usernameAndDateElement = document.getElementById("username-and-date");
const dateElement = document.getElementById("publishing-date");
const separatorElement = document.getElementById("separator");

const usernameLink = document.getElementById("username-link");
const websiteLink = document.getElementById("origin-site-link");
const websiteAvailableImg = document.getElementById("origin-site-available");
const websiteNotAvailableImg = document.getElementById("origin-site-not-available")

const recipeName = document.getElementById("recipe-name");
const username = document.getElementById("username-str");
const thumbnail = document.getElementById("recipe-thumbnail");
const videoElement = document.getElementById("recipe-tutorial");
const instructionsTextElement = document.getElementById("instructions");

const ingredientListElement = document.getElementById("ingredient-list");

function getSteps() {
    let [ currentStep, _ ] = stepFractionPresentation.textContent.split(" / ");
    currentStep = parseInt(currentStep);
    lastStep = instructions.length;
    return { currentStep, lastStep};
}

async function searchForRecipe() {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipeApiId}`);
    if (!response.ok) {
        throw "Error occurred fetching data!";
    }
    const data = await response.json();
    return data["meals"][0];
}

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

function getIngredients(recipe) {
    let ingredients = [];
    let measurements = [];

    for (let i=1; i <= 20; i++) {
        ingredient = recipe[`strIngredient${i}`]
        measurement = recipe[`strMeasure${i}`]
        if (ingredient) {
            ingredients.push(ingredient);
            measurements.push(measurement)
        }
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

async function fillRecipeViewPage() {
    const recipe = await searchForRecipe();
    recipeName.textContent = recipe["strMeal"]
    listPublisher(recipe["strSource"], recipe["dateModified"]);
    thumbnail.src = recipe["strMealThumb"];
    instructions = recipe["strInstructions"].replace(/\r/g, "").split("\n").filter(str => str !== "").filter(str => str.length > 7)
    let [_, tutorialVideoId] = recipe["strYoutube"].split("?v=");
    videoElement.setAttribute("src", `https://www.youtube.com/embed/${tutorialVideoId}`)
    instructionsTextElement.textContent = instructions[0];
    let {ingredients, measurements} = getIngredients(recipe);
    renderIngredients(ingredients, measurements);
    return { instructions }
}

async function main() {
    ({instructions} = await fillRecipeViewPage());
    let [ getPreviousStep, getNextStep ] = navigateWalkthroughContainer.getElementsByTagName("button");
    let { currentStep, lastStep } = getSteps();


    progressBar.value = currentStep / lastStep;
    getPreviousStep.style.cursor = "not-allowed";
    getPreviousStep.disabled = true;
    getNextStep.style.cursor = "pointer"

    stepFractionPresentation.textContent = `1 / ${instructions.length}`

    getPreviousStep.addEventListener("click", () => {
        let { currentStep, lastStep } = getSteps();

        if (currentStep != 1) {
            currentStep -= 1;
            instructionsTextElement.textContent = instructions[currentStep - 1]
            stepFractionPresentation.textContent = `${currentStep} / ${lastStep}`;
            stepCounter.textContent = currentStep;
            progressBar.value = currentStep / lastStep;

            if (currentStep == 1) {
                getPreviousStep.style.cursor = "not-allowed";
                getPreviousStep.disabled = true;
            }
            getNextStep.disabled = false;
            getNextStep.style.cursor = "pointer";
        }
    })

    getNextStep.addEventListener("click", () => {
        let { currentStep, lastStep } = getSteps();

        if (currentStep != lastStep) {
            currentStep += 1;
            instructionsTextElement.textContent = instructions[currentStep - 1]
            stepFractionPresentation.textContent = `${currentStep} / ${lastStep}`;
            stepCounter.textContent = currentStep;
            progressBar.value = currentStep / lastStep;

            if (currentStep == lastStep) {
                getNextStep.style.cursor = "not-allowed";
                getNextStep.disabled = true;
            }
            getPreviousStep.disabled = false;
            getPreviousStep.style.cursor = "pointer";
        }
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
