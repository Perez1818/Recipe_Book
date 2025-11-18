
import { fetchReviews } from "./reviews.js";
import { fetchRecipe, initializeRecipeVariables, fetchRecipesByCategory, searchForRecipe, fetchRecipesByCuisine, fetchAreas, getRecipeIdFromURL } from "./recipes.js";
import { getCurrentUserDetails } from "./users.js";
import { createCollection, getCollectionByName, addRecipeToBookmarks, removeRecipeFromCollection, fetchCollections } from "./collections.js";


// Obtains reference to HTML objects for reference
const initialCarousel = document.getElementById("trending-container");
const mainElement = document.getElementsByTagName("main")[0];
const viewedRecipeTags = JSON.parse(localStorage.getItem("recipeTags"));

// Keeps track of bookmarks
let bookmarkCollection;
let bookmarkedRecipes = [];
// Keeps track of the number of cuisines loaded in
let currentAreaIndex = 0;

// Checks if user is signed in and obtains theit bookmarked recipes
let current_user = null;
document.addEventListener("DOMContentLoaded", async () => {
    try {
        current_user = await getCurrentUserDetails();

        // Alerts user that they're not signed in and provides redirect to signup page
        if (!current_user) {
            const currentUrl = new URL(window.location.href);
            const portNum = currentUrl.port;
            if (confirm(`It looks like you're not registered! Click "OK" to visit "http://localhost:${portNum}/signup" to register to fully utilize our services.`)) {
                window.location.href = `http://localhost:${portNum}/signup`;
            }
        }

        const scrollContainer = document.getElementById("bookmarked-recipes");
        bookmarkCollection = await getCollectionByName("My Bookmarks");
        bookmarkedRecipes = bookmarkCollection.recipe_ids || [];

        for (let i=0; i < bookmarkedRecipes.length; i++) {
            const recipeId = bookmarkedRecipes[i];
            const div = document.createElement("div");
            const img = document.createElement("img");
            const hiddenSvg = document.getElementsByClassName("remove-icon")[0];
            const svg = hiddenSvg.cloneNode(true);
            const recipe = await searchForRecipe(recipeId);
            img.src = recipe.strMealThumb || `../uploads/multimedia/${recipe.thumbnail}`;
            div.classList.add("overlay-container");
            img.onclick = () => {
                window.location.href = `recipe-view.html?id=${recipeId}`
            }
            img.addEventListener(
                "mouseenter", () => {
                    svg.style.display = "block";
                }
            );
            div.addEventListener(
                "mouseleave", () => {
                    svg.style.display = "none";
                }
            );
            svg.addEventListener(
                "mouseenter", () => {
                    svg.style.fill = "transparent";
                }
            );
            svg.addEventListener(
                "mouseleave", () => {
                    svg.style.fill = "white";
                }
            );
            svg.addEventListener(
                "click", async () => {
                    const collection = await getCollectionByName("My Bookmarks");
                    let collectionId = null;
                    if (collection) {
                        collectionId = collection.id;
                    }
                    if (!collectionId) {
                        collectionId = await createCollection("My Bookmarks");
                    }
                    removeRecipeFromCollection(collectionId, recipeId);
                    img.remove();
                    svg.remove();
                }
            );
            div.appendChild(img)
            div.appendChild(svg)
            scrollContainer.appendChild(div);
        }

        let scrollDirection = 1;
        let autoScroll;

        function startAutoScroll() {
            autoScroll = setInterval(() => {
                scrollContainer.scrollLeft += scrollDirection * 1;

                // detect edges with tolerance buffer
                const atRightEdge =
                    scrollContainer.scrollLeft >= scrollContainer.scrollWidth - scrollContainer.clientWidth - 1;

                const atLeftEdge = scrollContainer.scrollLeft <= 0;

                if (atRightEdge || atLeftEdge) {
                    scrollDirection *= -1;
                }
            }, 10);
        }

        function stopAutoScroll() {
            clearInterval(autoScroll);
        }

        scrollContainer.addEventListener("mouseenter", stopAutoScroll);
        scrollContainer.addEventListener("mouseleave", startAutoScroll);

        startAutoScroll();
    } catch {
        scrollContainer.remove();
        return;
    }
});

async function addEventListenersToRecipeContainer(recipeContainer) {
    const recipeBookmark = recipeContainer.getElementsByClassName("bookmark-recipe-icon")[0];
    const addToCollectionButton = recipeContainer.getElementsByClassName("more-options-icon")[0];
    const dropdownContent = recipeContainer.querySelector(".dropdown-content");
    const bookmarksCollection = dropdownContent.querySelector("collection-1");
    const bookmarks = Array.from(recipeContainer.getElementsByClassName("bookmark-recipe-icon"));

    const collectionItems = await fetchCollections();
    let collections = [...collectionItems.items];
    if (collections.length === 0){
        collections = await createCollection("My Bookmarks")
    }
    for (let i = 0; i < collections.length; i++) {
        const collectionName = collections[i].collection_name;
        const collectionId = collections[i].id;
        const recipeId = JSON.parse(recipeContainer.dataset.recipeId);

        const link = document.createElement("a");
        link.href = "";
        link.className = "collection-1";
        link.title = `Add to ${collectionName}`;
        link.textContent = `${collectionName}`; // optional visible text
        // attach click handler properly
        link.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();         // stop event from reaching parent elements
            await addRecipeToBookmarks(collectionId, recipeId);
        });
        dropdownContent.appendChild(link);
    }

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
            const dropdownContentVisible = dropdownContent.style.display;
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
                    const recipeId = Number(JSON.parse(parentRecipeContainer.dataset.recipeId));

                    (async () => {
                        const collection = await getCollectionByName("My Bookmarks");
                        let collectionId = null;
                        if (collection) {
                            collectionId = collection.id;
                        }
                        if (!collectionId) {
                            collectionId = await createCollection("My Bookmarks");
                        }
                        if (bookmarkedRecipes.includes(recipeId)) {
                            await removeRecipeFromCollection(collectionId, recipeId);
                        }
                        else {
                            await addRecipeToBookmarks(collectionId, recipeId);
                        }
                    })()
                }
            );
        }
    );
}

function checkBookmarked(recipe, recipeContainer) {
    const recipeId = Number(recipe.idMeal || recipe.id);
    const bookmark = recipeContainer.getElementsByClassName("bookmark-recipe-icon")[0];
    let isBookmarked = bookmarkedRecipes.includes(recipeId);

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
        Boolean(bookmarkedRecipes.includes(recipeId))
        // Boolean(bookmarkedRecipes[recipeId])
    );
}

// Adds a new recipe carousel to the page
async function createNewCarousel(lookupMethod, filter, recentlyViewed = false) {
    const clonedCarousel = initialCarousel.cloneNode(true);
    const images = clonedCarousel.querySelectorAll("img");
    const recipeNames = clonedCarousel.getElementsByClassName("recipe-name");
    const authors = clonedCarousel.getElementsByClassName("username");
    const ingredients = clonedCarousel.querySelectorAll("p");

    for (let i = 0; i < images.length; i++) {
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
        if (current_user) {
            recipeContainers.forEach(
                async (recipeContainer) => {
                    await addEventListenersToRecipeContainer(recipeContainer);
            });
        }
    });
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
    let domainName;
    if (!url) {
        domainName = "AnonymousPublisher";
    }
    // Otherwise, obtain the domain name of the site
    else {
        const urlComponentsToRemove = ["https://", "http://", "www."];
        for (let i = 0; i < urlComponentsToRemove.length; i++){
            url = url.replace(urlComponentsToRemove[i], "");
        }
        const startIndex = 0;
        const endIndex = url.indexOf(".");
        domainName = url.substring(startIndex, endIndex);
    }

    return domainName;
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
        const id = JSON.parse(recipeContainer.dataset.recipeId || null);

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

    // Sets username displayed 
    const usernameEl = recipeContainer.getElementsByClassName("username")[0];

    if (recipe.user_id) {
        const recipeOwner = await getUserDetails(recipe.user_id);
        const usernameEl = recipeContainer.getElementsByClassName("username")[0];
        const username = recipeOwner.username;
        let url = new URL(window.location.href);
        url.pathname = `user/${username}`
        url.search = "";
        usernameEl.href = url;
    }
    else {
        const usernameEl = recipeContainer.getElementsByClassName("username")[0];
        usernameEl.href = "#";
    }

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

        if (recipeContainer.hasAttribute("data-recipe-id")) {
            window.location.href = `recipe-view.html?id=${recipeId}`;
        }
    }

    // Shows full name of recipe when user hovers over container
    recipeContainer.title = recipeName 

    // Writes the name and description of the recipe and shows its thumbnail
    const recipeHeading = recipeContainer.getElementsByClassName("recipe-name")[0];
    recipeHeading.textContent = recipeName;
    const thumbnail = recipeContainer.getElementsByTagName("img")[0];
    thumbnail.src = recipeThumbnail;
    const recipeDescription = recipeContainer.getElementsByClassName("description")[0];
    recipeDescription.textContent = recipeIngredients.join(", ");
    const recipeOwnerId = recipe.user_id;

    let username = null;
    
    if (!recipeOwnerId) {
        username = await listPublisher(recipeOrigin, recipeContainer);
    }
    else {
        username = await getUsername(recipeOwnerId);
    }

    usernameEl.textContent = `@${username}`;

    const ratingContainer = recipeContainer.getElementsByClassName("rating-container")[0];

    const avgRating = recipeContainer.querySelector("#avg-rating");
    const numRatings = recipeContainer.querySelector("#num-ratings");

    const result = await fetchReviews(recipeId);
    const reviews = await result.items || [];

    const reviewsLength = reviews.length;

    let sum = 0;
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

// Renders elements previously seen when clicking left button
async function renderCarouselWithOldElements(carousel, recipeIds){
    const carouselRecipeContainers = getCarouselRecipeContainerObjs(carousel);

    for (let [ index, recipeContainer] of carouselRecipeContainers.entries() ) {
        let recipeId = recipeIds[index];
        
        recipeContainer.onclick = () => {
            window.location.href = `recipe-view.html?id=${recipeId}`;
        }
        const recipe = await searchForRecipe(recipeId);
        setRecipeContainer(recipe, recipeContainer);
        checkBookmarked(recipe, recipeContainer);
    }
}

// Returns highest slider index value seen
function getMaxSliderIndex(carousel) {
    return Math.max(carousel.sliderIndex, carousel.maxSliderIndex);
}

// Returns list of ingredients associated with a provided recipe
function getIngredientsList(recipe){
    let recipeIngredients = [];

    if (recipe.ingredients) {
        for (const ingredient of recipe.ingredients) {
            recipeIngredients.push(ingredient.name);
        }
        return recipeIngredients;
    }

    // Iterates through all ingredients of a recipe and adds them to `recipeIngredients`
    const upperbound =  20;
    for (let i = 1; i <= upperbound; i++){
        const ingredient = recipe[`strIngredient${i}`]
        
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

async function renderCarousel(carousel, lookupMethod=null, filter=null){
    // Obtains reference to all existing recipe container 
    const carouselRecipeContainers = getCarouselRecipeContainerObjs(carousel);
    // Sets up `startIndex` and `batchSize`
    const startIndex = carousel.sliderIndex || 0;
    const batchSize = carouselRecipeContainers.length;

    // Checks if carousel is associated with a "lookup method"
    if (!lookupMethod) {
        try {
            const response = await fetch(`/recipes/`);
            const result = await response.json();
            if (!result) {
                throw Error(result.error);
            }
            else if (result.items.length == 0) {
                throw Error("No exclusive recipes found!");
            }
            const recipeList = result.items;
            recipes = [];

            for(let recipe of recipeList) {
                recipeId = recipe.id;

                const response = await fetch(`/recipes/${recipeId}`);
                const result = await response.json();
                if (!result) {
                    throw Error(result.error);
                }
                recipes.push(result);
            }

            for (let i = 0; i <= carouselRecipeContainers.length; i++) {
                const recipe = recipes[i];
                const recipeContainer = carouselRecipeContainers[i];
                
                if (!recipes[i]) {
                    break;
                }
                
                if (recipe) {
                    await setRecipeContainer(recipe, recipeContainer);
                    checkBookmarked(recipe, recipeContainer);
                }
            }
        } catch (err) {
            // Carousels without a specified "lookup" are filled with random recipes
            for (let recipeContainer of carouselRecipeContainers) {
                const recipe = await fetchRecipe();
                await setRecipeContainer(recipe, recipeContainer);
                checkBookmarked(recipe, recipeContainer);
            }
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

async function renderAllCarousels(){
    // Obtains reference to all carousels on the webpage
    const carousels = Array.from(document.getElementsByClassName("carousel-container"));

    // For each carousel, sets `seenRecipes` to be empty list and renders it
    for (let carousel of carousels) {
        carousel.dataset.seenRecipes = JSON.stringify([]);
        await renderCarousel(carousel);
    }
}

// Returns array of the recipe containers inside a particular carousel
function getCarouselRecipeContainerObjs(carousel){
    const recipeContainerChildren = carousel.getElementsByClassName("recipe-container");
    return Array.from(recipeContainerChildren);
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
        async (recipeContainer) => {
            if (recipeContainer.hasAttribute("data-recipe-id")) {
                if (current_user) {
                    await addEventListenersToRecipeContainer(recipeContainer);
                }
                recipeContainer.style.cursor = "";
            }
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
            const currentCarousel = leftButton.parentCarousel;

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
            const currentCarousel = rightButton.parentCarousel;
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
