
// Obtains reference to HTML objects for reference
const initialCarousel = document.getElementById("trending-container");
const mainElement = document.getElementsByTagName("main")[0];
const viewedRecipeTags = JSON.parse(localStorage.getItem("recipeTags"));

// Parses local storage for recipes user has bookmarked
let bookmarkedRecipes = JSON.parse(localStorage.getItem("bookmarkedRecipes")) || {};
// Keeps track of the number of cuisines loaded in
let currentAreaIndex = 0;

// Adds a new recipe carousel to the page
async function createNewCarousel(lookupMethod, filter, recentlyViewed = false) {
    const clonedCarousel = initialCarousel.cloneNode(true);
    const images = clonedCarousel.querySelectorAll("img");
    const recipeNames = clonedCarousel.getElementsByClassName("recipe-name");
    const authors = clonedCarousel.getElementsByClassName("username");
    const ingredients = clonedCarousel.querySelectorAll("p");

    for (i = 0; i < images.length; i++) {
        images[i].setAttribute("src", "");
        recipeNames[i].textContent = "Recipe Name";
        authors[i].textContent = "@AnonymousPublisher";
        ingredients[i].textContent = "A placeholder for the description of some recipe.";
    }

    clonedCarousel.setAttribute("id", `${filter.toLowerCase()}-recipe-container`);
    clonedCarousel.dataset.lookupMethod = lookupMethod;
    clonedCarousel.dataset.filter = filter;
    clonedCarousel.sliderIndex = 0;
    clonedCarousel.maxSliderIndex = getCarouselRecipeContainerObjs(clonedCarousel).length;

    const heading1 = clonedCarousel.getElementsByTagName("h2")[0];
    heading1.textContent = recentlyViewed ? `Because You Recently Viewed a ${filter} Recipe` : `${filter} Recipes`;

    mainElement.append(clonedCarousel);
    await renderCarousel(clonedCarousel, lookupMethod, filter);

    return clonedCarousel; // Returns the element for later use
}

// 
async function loadMoreCarousels() {
    const areasToLoad = 3;
    const areas = await fetchAreas();

    const newCarousels = [];

    for (let i = 0; i < areasToLoad && currentAreaIndex < areas.length; i++) {
        const area = areas[currentAreaIndex];
        const carousel = await createNewCarousel("cuisine", area);
        newCarousels.push(carousel); // Stores carousels to be initialized
        currentAreaIndex++;
    }

    setupCarousels(newCarousels);
}

function setupCarousels(carousels) {
    carousels.forEach((carousel) => {
        if (carousel.classList.contains("initialized")) return;
        carousel.classList.add("initialized");

        const [leftButton, rightButton] = carousel.getElementsByClassName("carousel-button");
        carousel.sliderIndex = 0;
        carousel.maxSliderIndex = getCarouselRecipeContainerObjs(carousel).length;

        leftButton.parentCarousel = carousel;
        rightButton.parentCarousel = carousel;
        rightButton.siblingButton = leftButton;

        leftButton.addEventListener("click", async () => {
        leftButton.disabled = true;
        const currentCarousel = leftButton.parentCarousel;
        currentCarousel.sliderIndex = Math.max(0, currentCarousel.sliderIndex - 3);

        const seenRecipeIds = JSON.parse(currentCarousel.dataset.seenRecipes);
        const relevantRecipeIds = seenRecipeIds.slice(currentCarousel.sliderIndex, currentCarousel.sliderIndex + 3);
        await renderCarouselWithOldElements(currentCarousel, relevantRecipeIds);

        leftButton.disabled = currentCarousel.sliderIndex <= 0;
        rightButton.disabled = currentCarousel.sliderIndex + 3 >= seenRecipeIds.length;
        });

        rightButton.addEventListener("click", async () => {
        rightButton.disabled = true;
        const currentCarousel = rightButton.parentCarousel;
        rightButton.siblingButton.disabled = false;

        currentCarousel.sliderIndex += 3;

        const seenRecipeIds = JSON.parse(currentCarousel.dataset.seenRecipes);
        const totalRecipes = seenRecipeIds.length;

        if (currentCarousel.sliderIndex >= currentCarousel.maxSliderIndex) {
            await renderCarousel(currentCarousel, currentCarousel.dataset.lookupMethod, currentCarousel.dataset.filter);
        } else {
            const start = currentCarousel.sliderIndex;
            const end = start + 3;
            const relevantRecipeIds = seenRecipeIds.slice(start, end);
            await renderCarouselWithOldElements(currentCarousel, relevantRecipeIds);
        }

        currentCarousel.maxSliderIndex = getMaxSliderIndex(currentCarousel);
        rightButton.disabled = currentCarousel.sliderIndex + 3 >= totalRecipes;
        leftButton.disabled = currentCarousel.sliderIndex <= 0;
        });

        // Add hover/click listeners to all recipe containers in this carousel
        const recipeContainers = getCarouselRecipeContainerObjs(carousel);
        recipeContainers.forEach(addEventListenersToRecipeContainer);
    });
}


// Initialize number of reviews displayed
async function fetchReviews(recipeId) {
    const response = await fetch(`/reviews/recipe/${recipeId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    });
    const result = await response.json();
    if (!response.ok) {
        console.log("Failed to load in reviews:", result.error)
        return;
    }
    return result;
}


function displayAverageStars(container, average) {
  const stars = Array.from(container.getElementsByClassName("fa-star"));
  stars.forEach((star, i) => {
    const fillPercent = Math.min(Math.max(average - i, 0), 1) * 100;
    const gradId = `grad-${i}-${Math.random().toString(36).slice(2)}`;

    // Create or reuse defs
    let defs = star.querySelector("defs");
    if (!defs) {
      defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      star.prepend(defs);
    }

    // Create gradient
    const grad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    grad.setAttribute("id", gradId);
    grad.setAttribute("x1", "0%");
    grad.setAttribute("x2", "100%");
    grad.setAttribute("y1", "0%");
    grad.setAttribute("y2", "0%");

    // Gold portion
    const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop1.setAttribute("offset", `${fillPercent}%`);
    stop1.setAttribute("stop-color", "gold");

    // Gray portion
    const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop2.setAttribute("offset", `${fillPercent}%`);
    stop2.setAttribute("stop-color", "transparent");

    grad.append(stop1, stop2);
    defs.innerHTML = ""; // clear any old gradients
    defs.appendChild(grad);

    // Apply gradient
    star.setAttribute("fill", `url(#${gradId})`);
  });
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

async function fetchAreas() {
    const response = await fetch("https://www.themealdb.com/api/json/v1/1/list.php?a=list");
    if (!response.ok) {
        throw "Error occured fetching data";
    }
    const data = await response.json()
    areas = data['meals']
    areasList = [];
    areas.forEach(
        (area) => {
            areasList.push(area.strArea);
        }
    )
    return areasList;
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

    const ratingContainer = recipeContainer.getElementsByClassName("rating-container")[0];

    const avgRating = recipeContainer.querySelector("#avg-rating");
    const numRatings = recipeContainer.querySelector("#num-ratings");

    const result = await fetchReviews(recipeId);
    const reviews = await result.items || [];

    const reviewsLength = reviews.length;

    sum = 0;
    reviews.forEach(
        (review) => {
            sum += parseInt(review.rating)
        }
    )

    const averageRating = (sum / reviewsLength).toFixed(1);

    numRatings.textContent = `(${reviewsLength})`;
    
    if (reviewsLength === 0) {
        displayAverageStars(ratingContainer, 0);
        avgRating.textContent = (0).toFixed(1);
    }
    else {
        displayAverageStars(ratingContainer, averageRating);
        avgRating.textContent = averageRating;
    }

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

function addEventListenersToRecipeContainer(recipeContainer) {
    const recipeBookmark = recipeContainer.getElementsByClassName("bookmark-recipe-icon")[0];
    const addToCollectionButton = recipeContainer.getElementsByClassName("more-options-icon")[0];
    const dropdownContent = recipeContainer.querySelector(".dropdown-content");
    const bookmarks = Array.from(recipeContainer.getElementsByClassName("bookmark-recipe-icon"));
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
}

// Organizes all the main flow of logic
async function main() {
    let loading = false;

    await renderAllCarousels();

    let initialCarousels = Array.from(document.getElementsByClassName("carousel-container"));

    // Initialize sliderIndex and maxSliderIndex for all carousels
    initialCarousels.forEach(carousel => {
        carousel.sliderIndex = 0;
        carousel.maxSliderIndex = getCarouselRecipeContainerObjs(carousel).length;
    });

    // Create new carousels based on previously viewed category and cuisine
    if (viewedRecipeTags) {
        await createNewCarousel("category", viewedRecipeTags.category, true);
        await createNewCarousel("cuisine", viewedRecipeTags.cuisine, true);
    }
    
    const carousels = Array.from(document.getElementsByClassName("carousel-container"));
    const recipeContainers = document.getElementsByClassName("recipe-container");
    const recipeContainersArray = Array.from(recipeContainers);

    // Applies event listeners to each recipe container
    recipeContainersArray.forEach(
        (recipeContainer) => {
            addEventListenersToRecipeContainer(recipeContainer);
        }
    );

    // 
    window.addEventListener(
        "scroll", async () => {
            const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
            if (nearBottom && !loading) {
                loading = true;
                await loadMoreCarousels();
                loading = false;
            }
        }
    )

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
            if (currentCarousel.sliderIndex < 0) {
                currentCarousel.sliderIndex = 0;
            }

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
