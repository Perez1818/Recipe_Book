
// const recipeContainers = document.getElementsByClassName("recipe-container");
// const recipeContainersArray = Array.from(recipeContainers);
// const bookmarks = Array.from(document.getElementsByClassName("bookmark-recipe-icon"));
// const carousels = Array.from(document.getElementsByClassName("carousel-container"));
const initialCarousel = document.getElementById("trending-container");
const mainElement = document.getElementsByTagName("main")[0];

const viewedRecipeTags = JSON.parse(localStorage.getItem("recipeTags"));

async function createNewCarousel(lookupMethod, filter) {
    clonedContainer = initialCarousel.cloneNode(true);
    clonedContainer.setAttribute("id", `${filter.toLowerCase()}-recipe-container`)
    clonedContainer.dataset.lookupMethod = lookupMethod;
    clonedContainer.dataset.filter = filter;

    let heading1 = clonedContainer.getElementsByTagName("h2")[0];
    heading1.textContent = `Because You Recently Viewed a ${filter} Recipe`;
    mainElement.append(clonedContainer)
    await renderCarousel(clonedContainer, lookupMethod=lookupMethod, filter=filter);
}

let bookmarkedRecipes = JSON.parse(localStorage.getItem("bookmarkedRecipes")) || {};

async function listPublisher(url, recipeContainer) {
    if (!url) {
        domainName = "AnonymousPublisher";
    }
    else {
        const urlComponentsToRemove = ["https://", "http://", "www."];
        for (let i = 0; i < urlComponentsToRemove.length; i++){
            url = url.replace(urlComponentsToRemove[i], "");
        }
        startIndex = 0;
        endIndex = url.indexOf(".");
        domainName = url.substring(startIndex, endIndex);
    }
    username = recipeContainer.getElementsByClassName("username")[0];
    username.textContent = `@${domainName}`;
    username.href = `public-account.html?user=${domainName}`;
}

function addVisibleRecipesFromCarousel(carousel) {
    const recipeContainerChildren = getCarouselRecipeContainerObjs(carousel);

    // Initialize empty array if not already set
    let seenRecipes = [];
    try {
        seenRecipes = JSON.parse(carousel.dataset.seenRecipes) || [];
    } catch {
        seenRecipes = [];
    }

    recipeContainerChildren.forEach((recipeContainer) => {
        const id = JSON.parse(recipeContainer.dataset.recipeId);
        if (!seenRecipes.includes(id)) {
            seenRecipes.push(id);
        }
    });

    carousel.dataset.seenRecipes = JSON.stringify(seenRecipes);
}


function addVisibleRecipesFromRecipeContainer(recipeContainer){
    parentCarousel = recipeContainer.closest(".carousel-container");
    id = JSON.parse(recipeContainer.dataset.recipeId);
    seenRecipes = JSON.parse(parentCarousel.dataset.seenRecipes);
    seenRecipes.push(id);
    parentCarousel.dataset.seenRecipes = JSON.stringify(seenRecipes);
}

async function fetchRecipe(){
    const response = await fetch("https://www.themealdb.com/api/json/v1/1/random.php");
    if (!response.ok){
        throw "Error occurred fetching data";
    }
    const data = await response.json();
    return data['meals'][0];
}

async function fetchRecipesByCategory(category){
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`);
    if (!response.ok){
        throw "Error occurred fetching data";
    }
    const data = await response.json();
    return data['meals'];
}

async function fetchRecipesByCuisine(cuisine) {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${cuisine}`);
    if (!response.ok) {
        throw "Error occurred fetching data";
    }
    const data = await response.json();
    return data["meals"];
}

async function setRecipeContainer(recipe, recipeContainer) {
    const { recipeName,
        recipeThumbnail,
        recipeId,
        recipeIngredients,
        recipeOrigin,
        recipeCategory,
        recipeCusine } = initializeRecipeVariables(recipe);
            
    recipeContainer.dataset.recipeId = JSON.stringify(recipeId);

    recipeContainer.onclick = () => {
        const recipeTags = {
            category: recipeCategory,
            cuisine: recipeCusine
        }

        // Prevents "undefined recipes" from being displayed
        if (recipeCategory && recipeCusine) {
            localStorage.setItem("recipeTags", JSON.stringify(recipeTags));
        }

        window.location.href = `recipe-view.html?id=${recipeId}`;
    }

    recipeHeading = recipeContainer.getElementsByClassName("recipe-name")[0];
    recipeHeading.textContent = recipeName;
    thumbnail = recipeContainer.getElementsByTagName("img")[0];
    thumbnail.src = recipeThumbnail;
    recipeDescription = recipeContainer.getElementsByClassName("description")[0];
    recipeDescription.textContent = recipeIngredients.join(", ");
    await listPublisher(recipeOrigin, recipeContainer);
}

function getIngredientsList(recipe){
    recipeIngredients = [];

    for (let i = 1; i <= 20; i++){
        ingredient = recipe[`strIngredient${i}`];
        if (ingredient){
            recipeIngredients.push(ingredient);
        }
        // Prevents unnecessary commas from being appended when there are less than 20 ingredients
        else {
            break;
        }
    }

    return recipeIngredients;
}

function initializeRecipeVariables(recipe){
    recipeName = recipe["strMeal"];
    recipeThumbnail = recipe["strMealThumb"];
    recipeId = recipe["idMeal"];
    recipeIngredients = getIngredientsList(recipe);
    recipeOrigin = recipe["strSource"];
    recipeCategory = recipe["strCategory"];
    recipeCusine = recipe["strArea"];
    return {
        recipeName,
        recipeThumbnail,
        recipeId,
        recipeIngredients,
        recipeOrigin,
        recipeCategory,
        recipeCusine
    }
}

async function renderAllCarousels(){
    const carousels = Array.from(document.getElementsByClassName("carousel-container"));
    for (let carousel of carousels) {
        carousel.dataset.seenRecipes = JSON.stringify([]);
        await renderCarousel(carousel);
    }
}

function checkBookmarked(recipe, recipeContainer) {
    const recipeId = recipe["idMeal"];
    const bookmark = recipeContainer.getElementsByClassName("bookmark-recipe-icon")[0];
    const isBookmarked = bookmarkedRecipes[recipeId] || false;

    if (isBookmarked){
        bookmark.setAttribute("fill", "#E34234");
    }
    else {
        bookmark.setAttribute("fill", "whitesmoke");
    }

    // Adds CSS "bookmarked" class to recipes bookmarked by user
    bookmark.classList.toggle(
        "bookmarked",
        Boolean(bookmarkedRecipes[recipeId])
    );
}

async function renderCarousel(carousel, lookupMethod=null, filter=null){
    const carouselRecipeContainers = getCarouselRecipeContainerObjs(carousel);
    const startIndex = carousel.sliderIndex || 0;
    const batchSize = carouselRecipeContainers.length;

    if (!lookupMethod) {
        for (let recipeContainer of carouselRecipeContainers) {
            const recipe = await fetchRecipe();
            await setRecipeContainer(recipe, recipeContainer);
            checkBookmarked(recipe, recipeContainer);
        }
    } else {
        if (!filter) return;

        let recipes;
        if (lookupMethod === "category") {
            recipes = await fetchRecipesByCategory(filter);
        } else if (lookupMethod === "cuisine") {
            recipes = await fetchRecipesByCuisine(filter);
        } else {
            throw "Unknown lookup method";
        }

        const recipeIds = recipes.map(r => r.idMeal);
        carousel.dataset.seenRecipes = JSON.stringify(recipeIds);

        const slice = recipes.slice(startIndex, startIndex + batchSize);

        for (let [index, recipeContainer] of carouselRecipeContainers.entries()) {
            const recipe = slice[index];
            if (!recipe) {
                let [_, rightButton] = carousel.getElementsByClassName("carousel-button");
                rightButton.disabled = true;
                continue;
            }

            const fullRecipe = await searchForRecipe(recipe.idMeal);
            await setRecipeContainer(fullRecipe, recipeContainer);
            checkBookmarked(fullRecipe, recipeContainer);
        }
    }
    addVisibleRecipesFromCarousel(carousel);
}


async function renderCarouselWithOldElements(carousel, recipeIds){
    carouselRecipeContainers = getCarouselRecipeContainerObjs(carousel);
    for (let [ index, recipeContainer] of carouselRecipeContainers.entries() ) {
        let recipeId = recipeIds[index];
        recipeContainer.onclick = () => {
            window.location.href = `recipe-view.html?id=${recipeId}`;
        }
        recipe = await searchForRecipe(recipeId);
        setRecipeContainer(recipe, recipeContainer);
        checkBookmarked(recipe, recipeContainer);
    }
}

function getMaxSliderIndex(carousel) {
    return Math.max(carousel.sliderIndex, carousel.maxSliderIndex);
}

function getNumColumns(){
    const grid = document.getElementsByClassName("column-container")[0];
    const numOfCols = grid.children.length;
    return numOfCols;
}

function findCarouselByCarouselIndex(carouselIndex){
    const carousels = Array.from(document.getElementsByClassName("carousel-container"));
    const carouselReference = carousels[carouselIndex];
    return carouselReference;
}

function findCarouselByRecipeContainerIndex(RecipeContainerIndex) {
    const numCols = getNumColumns();
    const carouselIndex = Math.floor(RecipeContainerIndex / numCols);
    const carouselReference = findCarouselByCarouselIndex(carouselIndex);
    return carouselReference;
}

function getCarouselRecipeContainerObjs(carousel){
    const recipeContainerChildren = carousel.getElementsByClassName("recipe-container");
    return Array.from(recipeContainerChildren);
}

function getRecipeContainerObj(recipeContainerIndex){
    const recipeContainerReference = recipeContainers[recipeContainerIndex];
    return recipeContainerReference;
}

async function searchForRecipe(recipeId){
    let response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipeId}`);
    if (!response) {
        throw `Error occured searching for recipe ${recipeId}`;
    }
    const data = await response.json();
    return data['meals'][0];
}


async function main() {
    await renderAllCarousels();

    let initialCarousels = Array.from(document.getElementsByClassName("carousel-container"));

    // Initialize sliderIndex and maxSliderIndex for all carousels
    initialCarousels.forEach(carousel => {
        carousel.sliderIndex = 0;
        carousel.maxSliderIndex = getCarouselRecipeContainerObjs(carousel).length; // number of visible recipe containers
    });

    if (viewedRecipeTags) {
        await createNewCarousel("category", viewedRecipeTags.category);
        await createNewCarousel("cuisine", viewedRecipeTags.cuisine);
    }
    
    const carousels = Array.from(document.getElementsByClassName("carousel-container"));
    const recipeContainers = document.getElementsByClassName("recipe-container");
    const recipeContainersArray = Array.from(recipeContainers);

    recipeContainersArray.forEach(
        (recipeContainer) => {
            recipeContainer.addEventListener("mouseover", () => {
                recipeBookmark = recipeContainer.getElementsByClassName("bookmark-recipe-icon")[0];
                recipeBookmark.setAttribute("display", "block");
            });

            recipeContainer.addEventListener("mouseleave", () => {
                recipeBookmark = recipeContainer.getElementsByClassName("bookmark-recipe-icon")[0];
                recipeBookmark.setAttribute("display", "none");
            });
        }
    );

    const bookmarks = Array.from(document.getElementsByClassName("bookmark-recipe-icon"));

    bookmarks.forEach(
        (bookmark) => {
            bookmark.addEventListener("mouseenter", () => {
                bookmark.setAttribute("fill", "#E34234");
            });

            bookmark.addEventListener("mouseleave", () => {
                if(!bookmark.classList.contains("bookmarked")){
                    bookmark.setAttribute("fill", "whitesmoke");
                }
            });
            
            bookmark.addEventListener(
                "click", (event) => {
                    event.stopPropagation(); // Prevents recipeContainer from being clicked
                    bookmark.setAttribute("fill", "#E34234");
                    bookmark.classList.toggle("bookmarked");

                    const parentRecipeContainer = bookmark.closest(".recipe-container");
                    const recipeId = JSON.parse(parentRecipeContainer.dataset.recipeId);

                    if (bookmarkedRecipes[recipeId]) {
                        delete bookmarkedRecipes[recipeId];
                        localStorage.setItem("bookmarkedRecipes", JSON.stringify(bookmarkedRecipes));
                    }
                    else {
                        bookmarkedRecipes[recipeId] = true;
                        localStorage.setItem("bookmarkedRecipes", JSON.stringify(bookmarkedRecipes));
                    }
                }
            );
        }
    );

    for (let i = 0; i < carousels.length; i++) {
        const carousel = carousels[i];
        const [leftButton, rightButton] = carousel.getElementsByClassName("carousel-button");
        leftButton.parentCarousel = carousel;
        rightButton.parentCarousel = carousel;
        rightButton.siblingButton = leftButton;

        const batchSize = getCarouselRecipeContainerObjs(carousel).length;
        carousel.sliderIndex = 0;
        carousel.maxSliderIndex = 0;

        leftButton.addEventListener("click", async () => {
            leftButton.disabled = true;
            currentCarousel = leftButton.parentCarousel;

            // decrement index first
            currentCarousel.sliderIndex -= 3;
            if (currentCarousel.sliderIndex < 0) currentCarousel.sliderIndex = 0;

            const seenRecipeIds = JSON.parse(currentCarousel.dataset.seenRecipes);
            const startingIndex = currentCarousel.sliderIndex;
            const endingIndex = startingIndex + 3;
            const relevantRecipeIds = seenRecipeIds.slice(startingIndex, endingIndex);
            await renderCarouselWithOldElements(currentCarousel, relevantRecipeIds);

            // Enable/disable buttons
            leftButton.disabled = currentCarousel.sliderIndex <= 0;
            rightButton.disabled = currentCarousel.sliderIndex + 3 >= seenRecipeIds.length;
        });

        rightButton.addEventListener("click", async () => {
            rightButton.disabled = true;
            currentCarousel = rightButton.parentCarousel;
            rightButton.siblingButton.disabled = false;

            // increment index first
            currentCarousel.sliderIndex += 3;

            const seenRecipeIds = JSON.parse(currentCarousel.dataset.seenRecipes);
            const totalRecipes = seenRecipeIds.length;

            // If we need to fetch/render new recipes
            if (currentCarousel.sliderIndex >= currentCarousel.maxSliderIndex) {
                await renderCarousel(currentCarousel, currentCarousel.dataset.lookupMethod, currentCarousel.dataset.filter);
            } else {
                const startingIndex = currentCarousel.sliderIndex;
                const endingIndex = startingIndex + 3;
                const relevantRecipeIds = seenRecipeIds.slice(startingIndex, endingIndex);
                await renderCarouselWithOldElements(currentCarousel, relevantRecipeIds);
            }

            // Update maxSliderIndex
            currentCarousel.maxSliderIndex = getMaxSliderIndex(currentCarousel);

            // Disable right button if we've reached the end
            if (currentCarousel.sliderIndex + 3 >= totalRecipes) rightButton.disabled = true;

            // Left button should always be enabled if sliderIndex > 0
            leftButton.disabled = currentCarousel.sliderIndex <= 0;

            rightButton.disabled = false;
        });
    }

}

main();
