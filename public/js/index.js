
// Obtains reference to HTML objects for reference
const initialCarousel = document.getElementById("trending-container");
const mainElement = document.getElementsByTagName("main")[0];
const viewedRecipeTags = JSON.parse(localStorage.getItem("recipeTags"));

// Parses local storage for recipes user has bookmarked
let bookmarkedRecipes = JSON.parse(localStorage.getItem("bookmarkedRecipes")) || {};

// Adds a new recipe carousel to the page
async function createNewCarousel(lookupMethod, filter) {
    // Creates clone of pre-existing carousel
    clonedContainer = initialCarousel.cloneNode(true);
    // Assigns unique ID
    clonedContainer.setAttribute("id", `${filter.toLowerCase()}-recipe-container`);
    // Assigns a lookup method and filter to search for specific recipes
    clonedContainer.dataset.lookupMethod = lookupMethod;
    clonedContainer.dataset.filter = filter;

    // Creates unique heading based on filter
    let heading1 = clonedContainer.getElementsByTagName("h2")[0];
    heading1.textContent = `Because You Recently Viewed a ${filter} Recipe`;

    // Adds element to HTML page and renders it
    mainElement.append(clonedContainer)
    await renderCarousel(clonedContainer, lookupMethod=lookupMethod, filter=filter);
}

// Displays "username" of recipe and attaches link to recipe page
async function listPublisher(url, recipeContainer) {
    // If no site is associated with the recipe, list as "AnonymousPublisher"
    if (!url) {
        domainName = "AnonymousPublisher";
    }
    // Otherwise, obtain the domain name of the site
    else {
        const urlComponentsToRemove = ["https://", "http://", "www."];
        for (let i = 0; i < urlComponentsToRemove.length; i++){
            url = url.replace(urlComponentsToRemove[i], "");
        }
        startIndex = 0;
        endIndex = url.indexOf(".");
        domainName = url.substring(startIndex, endIndex);
    }

    // Sets username displayed 
    username = recipeContainer.getElementsByClassName("username")[0];
    username.textContent = `@${domainName}`;
    // Creates a reference that takes user to associated recipe page when recipe container clicked
    username.href = `public-account.html?user=${domainName}`;
}

// 
function addVisibleRecipesFromCarousel(carousel) {
    const recipeContainerChildren = getCarouselRecipeContainerObjs(carousel);

    // Initialize empty array if not already set
    let seenRecipes = [];
    try {
        seenRecipes = JSON.parse(carousel.dataset.seenRecipes) || [];
    } catch {
        seenRecipes = [];
    }

    // For each recipe container in a carousel, checks if recipe was seen prior
    // New recipes are added to "seenRecipes"
    recipeContainerChildren.forEach((recipeContainer) => {
        const id = JSON.parse(recipeContainer.dataset.recipeId);
        if (!seenRecipes.includes(id)) {
            seenRecipes.push(id);
        }
    });

    // Attaches "seenRecipes" data to the carousel
    carousel.dataset.seenRecipes = JSON.stringify(seenRecipes);
}

// Given a recipe container, adds the recipe ID to the "seenRecipes" data of parent carousel
function addVisibleRecipesFromRecipeContainer(recipeContainer){
    // Obtains reference to the carousel holding the recipe container
    parentCarousel = recipeContainer.closest(".carousel-container");
    // Obtains recipe ID
    id = JSON.parse(recipeContainer.dataset.recipeId);
    // Adds ID to "seenRecipes" property of parent carousel
    seenRecipes = JSON.parse(parentCarousel.dataset.seenRecipes);
    seenRecipes.push(id);
    parentCarousel.dataset.seenRecipes = JSON.stringify(seenRecipes);
}

// Returns a random recipe
async function fetchRecipe(){
    const response = await fetch("https://www.themealdb.com/api/json/v1/1/random.php");
    if (!response.ok){
        throw "Error occurred fetching data";
    }
    const data = await response.json();
    return data['meals'][0];
}

// Returns recipe based on category (e.g., breakfast)
async function fetchRecipesByCategory(category){
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`);
    if (!response.ok){
        throw "Error occurred fetching data";
    }
    const data = await response.json();
    return data['meals'];
}

// Returns recipe based on cuisine (e.g., British)
async function fetchRecipesByCuisine(cuisine) {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${cuisine}`);
    if (!response.ok) {
        throw "Error occurred fetching data";
    }
    const data = await response.json();
    return data["meals"];
}

// Fills in a recipe container with the details of a specific recipe
async function setRecipeContainer(recipe, recipeContainer) {
    // Obtains attributes associated with a particular recipe 
    const { recipeName,
        recipeThumbnail,
        recipeId,
        recipeIngredients,
        recipeOrigin,
        recipeCategory,
        recipeCusine } = initializeRecipeVariables(recipe);
            
    // Associates recipe container with the ID of the recipe it's displaying
    recipeContainer.dataset.recipeId = JSON.stringify(recipeId);

    // Takes user to specified recipe page when user clicks its container
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

    // Shows full name of recipe when user hovers over container
    recipeContainer.title = recipeName 

    // Writes the name and description of the recipe and shows its thumbnail
    recipeHeading = recipeContainer.getElementsByClassName("recipe-name")[0];
    recipeHeading.textContent = recipeName;
    thumbnail = recipeContainer.getElementsByTagName("img")[0];
    thumbnail.src = recipeThumbnail;
    recipeDescription = recipeContainer.getElementsByClassName("description")[0];
    recipeDescription.textContent = recipeIngredients.join(", ");

    // Writes "username" to recipe container
    await listPublisher(recipeOrigin, recipeContainer);
}

// Returns list of ingredients associated with a provided recipe
function getIngredientsList(recipe){
    recipeIngredients = [];

    // Iterates through all ingredients of a recipe and adds them to `recipeIngredients`
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

// Returns an object consisting of all the necessary recipe attributes
function initializeRecipeVariables(recipe){
    // Accesses recipe attributes and assigns them to variables
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

// 
async function renderAllCarousels(){
    // Obtains reference to all carousels on the webpage
    const carousels = Array.from(document.getElementsByClassName("carousel-container"));

    // For each carousel, sets `seenRecipes` to be empty list and renders it
    for (let carousel of carousels) {
        carousel.dataset.seenRecipes = JSON.stringify([]);
        await renderCarousel(carousel);
    }
}

// 
function checkBookmarked(recipe, recipeContainer) {
    const recipeId = recipe["idMeal"];
    const bookmark = recipeContainer.getElementsByClassName("bookmark-recipe-icon")[0];
    const isBookmarked = bookmarkedRecipes[recipeId] || false;

    // Fills in bookmark if recipe exists in "bookmarked" dictionary
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

// 
async function renderCarousel(carousel, lookupMethod=null, filter=null){
    // Obtains reference to all existing recipe container 
    const carouselRecipeContainers = getCarouselRecipeContainerObjs(carousel);
    // Sets up `startIndex` and `batchSize`
    const startIndex = carousel.sliderIndex || 0;
    const batchSize = carouselRecipeContainers.length;

    // Checks if carousel is associated with a "lookup method"
    if (!lookupMethod) {
        // Carousels without a specified "lookup" are filled with random recipes
        for (let recipeContainer of carouselRecipeContainers) {
            const recipe = await fetchRecipe();
            await setRecipeContainer(recipe, recipeContainer);
            checkBookmarked(recipe, recipeContainer);
        }
    // Carousel must be associated with a lookup method
    } else {
        // Prevents any errors when filter is not specified
        if (!filter) return;

        // Fills carousel with recipes based on the provided lookup method and filter
        let recipes;
        if (lookupMethod === "category") {
            recipes = await fetchRecipesByCategory(filter);
        } else if (lookupMethod === "cuisine") {
            recipes = await fetchRecipesByCuisine(filter);
        } else {
            throw "Unknown lookup method";
        }

        // Obtains list of filtered recipes and stores data in carousel
        const recipeIds = recipes.map(r => r.idMeal);
        carousel.dataset.seenRecipes = JSON.stringify(recipeIds);

        // Obtains a reference to the first recipes to be displayed in carousel
        const slice = recipes.slice(startIndex, startIndex + batchSize);

        for (let [index, recipeContainer] of carouselRecipeContainers.entries()) {
            const recipe = slice[index];

            // If no recipe exists at this index, disable right nav button and skip
            if (!recipe) {
                let [_, rightButton] = carousel.getElementsByClassName("carousel-button");
                rightButton.disabled = true;
                continue;
            }

            // Otherwise, fetch full recipe details and render into container
            const fullRecipe = await searchForRecipe(recipe.idMeal);
            await setRecipeContainer(fullRecipe, recipeContainer);
            checkBookmarked(fullRecipe, recipeContainer);
        }
    }
    // Adds recipes in carousel to `seenRecipes` property of carousel
    addVisibleRecipesFromCarousel(carousel);
}


// Renders elements previously seen when clicking left button
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

// Returns highest slider index value seen
function getMaxSliderIndex(carousel) {
    return Math.max(carousel.sliderIndex, carousel.maxSliderIndex);
}

// Retuns the number of grid columns in a carousel
function getNumColumns(){
    const grid = document.getElementsByClassName("column-container")[0];
    const numOfCols = grid.children.length;
    return numOfCols;
}

// Given the index of a carousel, returns the associated carousel
function findCarouselByCarouselIndex(carouselIndex){
    const carousels = Array.from(document.getElementsByClassName("carousel-container"));
    const carouselReference = carousels[carouselIndex];
    return carouselReference;
}

// Given the index of a recipe container, returns the associated carousel
function findCarouselByRecipeContainerIndex(RecipeContainerIndex) {
    const numCols = getNumColumns();
    const carouselIndex = Math.floor(RecipeContainerIndex / numCols);
    const carouselReference = findCarouselByCarouselIndex(carouselIndex);
    return carouselReference;
}

// Returns array of the recipe containers inside a particular carousel
function getCarouselRecipeContainerObjs(carousel){
    const recipeContainerChildren = carousel.getElementsByClassName("recipe-container");
    return Array.from(recipeContainerChildren);
}

// Returns a recipe container based on index
function getRecipeContainerObj(recipeContainerIndex){
    const recipeContainerReference = recipeContainers[recipeContainerIndex];
    return recipeContainerReference;
}

// Returns a recipe from TheMealDB API associated with a particular recipe
async function searchForRecipe(recipeId){
    let response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipeId}`);
    if (!response) {
        throw `Error occured searching for recipe ${recipeId}`;
    }
    const data = await response.json();
    return data['meals'][0];
}

// Organizes all the main flow of logic
async function main() {
    await renderAllCarousels();

    let initialCarousels = Array.from(document.getElementsByClassName("carousel-container"));

    // Initialize sliderIndex and maxSliderIndex for all carousels
    initialCarousels.forEach(carousel => {
        carousel.sliderIndex = 0;
        carousel.maxSliderIndex = getCarouselRecipeContainerObjs(carousel).length;
    });

    // Create new carousels based on previously viewed category and cuisine
    if (viewedRecipeTags) {
        await createNewCarousel("category", viewedRecipeTags.category);
        await createNewCarousel("cuisine", viewedRecipeTags.cuisine);
    }
    
    const carousels = Array.from(document.getElementsByClassName("carousel-container"));
    const recipeContainers = document.getElementsByClassName("recipe-container");
    const recipeContainersArray = Array.from(recipeContainers);

    // Applies event listeners to each recipe container
    recipeContainersArray.forEach(
        (recipeContainer) => {
            const recipeBookmark = recipeContainer.getElementsByClassName("bookmark-recipe-icon")[0];
            const addToCollectionButton = recipeContainer.getElementsByClassName("more-options-icon")[0];
            const dropdownContent = recipeContainer.querySelector(".dropdown-content");
            recipeContainer.addEventListener("mouseover", () => {
                recipeBookmark.setAttribute("display", "block");
                addToCollectionButton.setAttribute("display", "block");
            });
            recipeContainer.addEventListener("mouseleave", () => {
                recipeBookmark.setAttribute("display", "none");
                addToCollectionButton.setAttribute("display", "none");
                dropdownContent.style.display = "none";
            });
            addToCollectionButton.addEventListener(
                "click", (event) => {
                    event.stopPropagation();
                    dropdownContentVisible = dropdownContent.style.display;
                    if (dropdownContentVisible == "block") {
                        dropdownContent.style.display = "none";
                    }
                    else {
                        dropdownContent.style.display = "block";
                    }
                }
            );
        }
    );

    const bookmarks = Array.from(document.getElementsByClassName("bookmark-recipe-icon"));

    // Applies event listeners for each bookmark
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

    // Applies event listeners and properties to each carousel on the webpage
    for (let i = 0; i < carousels.length; i++) {
        const carousel = carousels[i];
        const [leftButton, rightButton] = carousel.getElementsByClassName("carousel-button");
        leftButton.parentCarousel = carousel;
        rightButton.parentCarousel = carousel;
        rightButton.siblingButton = leftButton;

        const batchSize = getCarouselRecipeContainerObjs(carousel).length;
        carousel.sliderIndex = 0;
        carousel.maxSliderIndex = 0;

        // Handles logic for left button
        leftButton.addEventListener("click", async () => {
            leftButton.disabled = true;
            currentCarousel = leftButton.parentCarousel;

            // Decrements index first
            currentCarousel.sliderIndex -= 3;
            if (currentCarousel.sliderIndex < 0) currentCarousel.sliderIndex = 0;

            const seenRecipeIds = JSON.parse(currentCarousel.dataset.seenRecipes);
            const startingIndex = currentCarousel.sliderIndex;
            const endingIndex = startingIndex + 3;
            const relevantRecipeIds = seenRecipeIds.slice(startingIndex, endingIndex);
            await renderCarouselWithOldElements(currentCarousel, relevantRecipeIds);

            // Enable/disables buttons
            leftButton.disabled = currentCarousel.sliderIndex <= 0;
            rightButton.disabled = currentCarousel.sliderIndex + 3 >= seenRecipeIds.length;
        });

        // Handles logic for right button
        rightButton.addEventListener("click", async () => {
            rightButton.disabled = true;
            currentCarousel = rightButton.parentCarousel;
            rightButton.siblingButton.disabled = false;

            // Increments index first
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
