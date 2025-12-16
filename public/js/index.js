
import { fetchReviews } from "./reviews.js";
import { fetchRecipe, initializeRecipeVariables, fetchRecipesByCategory, searchForRecipe, fetchRecipesByCuisine, fetchAreas } from "./recipes.js";
import { getCurrentUserDetails, getUserDetails, getUsername } from "./users.js";
import { createCollection, getCollectionByName, addRecipeToBookmarks, removeRecipeFromCollection, fetchCollections } from "./collections.js";


// Obtains reference to HTML objects for reference
const initialCarousel = document.getElementById("trending-container");
const mainElement = document.getElementsByTagName("main")[0];
const viewedRecipeTags = JSON.parse(localStorage.getItem("recipeTags"));
const selectCollection = document.querySelector("select");
const scrollContainer = document.getElementById("bookmarked-recipes");

// Keeps track of bookmarks
let bookmarkCollection;
let bookmarkedRecipes = [];
// Keeps track of the number of cuisines loaded in
let currentAreaIndex = 0;

// Runs when user cycles through their collections
selectCollection.addEventListener(
    "change", async () => {
        let collectionName = selectCollection.value;

        // User chooses "Create New Collection"
        if (collectionName === "__create__") {
            collectionName = prompt("Enter a name for your new collection:", "My Bookmarks");

            // If user cancels or enters nothing, reverts selection
            if (!collectionName) {
                selectCollection.value = "My Bookmarks";
                return;
            }

            // Creates collection
            await createCollection(collectionName);

             // Adds the new option as selectable collection
            const option = new Option(collectionName, collectionName);

            // Inserts before the "Create New Collection" option
            const createOption = selectCollection.querySelector("option[value='__create__']");
            selectCollection.insertBefore(option, createOption);

            // Selects newly created collection
            selectCollection.value = collectionName;
        } 

        await loadCollection(collectionName);
    }
)

// Loads in all recipes in a given collection
async function loadCollection(collectionName) {
    const overlayContainers = [...scrollContainer.getElementsByClassName("overlay-container")];

    // Removes existing containers when loading new collection
    overlayContainers.forEach(
        (container) => {
            container.remove();
        }
    );

    bookmarkCollection = await getCollectionByName(collectionName);
    bookmarkedRecipes = bookmarkCollection.recipe_ids || [];

    // Showcases recipes associated with collection and attaches event listeners
    for (let i=0; i < bookmarkedRecipes.length; i++) {
        const recipeId = bookmarkedRecipes[i];
        const div = document.createElement("div");
        const img = document.createElement("img");
        const hiddenSvg = document.getElementsByClassName("remove-icon")[0];
        const svg = hiddenSvg.cloneNode(true);
        const recipe = await searchForRecipe(recipeId);
        const recipeName = recipe.strMeal || recipe.name;

        img.src = recipe.strMealThumb || `../uploads/multimedia/${recipe.thumbnail}`;
        img.title = recipeName;
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
                const collection = await getCollectionByName(collectionName);
                let collectionId = null;
                if (collection) {
                    collectionId = collection.id;
                }
                if (!collectionId) {
                    collectionId = await createCollection("My Bookmarks");
                }
                removeRecipeFromCollection(collectionId, recipeId);
                div.remove();
                svg.remove();
            }
        );

        div.appendChild(img)
        div.appendChild(svg)
        scrollContainer.appendChild(div);
    }
}

// Checks if user is signed in and obtains their bookmarked recipes
let current_user = null;
document.addEventListener("DOMContentLoaded", async () => {
    try {
        current_user = await getCurrentUserDetails();

        if (!current_user) {
            throw new Error("User not logged in.");
        }

        // Gets the names of all the collections a user has created
        let collectionItems = await fetchCollections();
        collectionItems = [...collectionItems.items]
        const collectionNames = [...new Set(collectionItems.map(item => item.collection_name)) ];

        // Allows user to select a collection of theirs
        const optionsData = [];
        for (const name of collectionNames) {
            optionsData.push( { value: name, text: name } );
        }
        optionsData.forEach(
            optionData => {
                const option = new Option(optionData.text, optionData.value);
                selectCollection.add(option);
                selectCollection.value = optionData.text;
            }
        );

        // Add "Create New Collection" option
        selectCollection.add(new Option("➕ Create New Collection", "__create__"));

        // Collection loaded by default
        try {
            let bookmarkCollection = await getCollectionByName("My Bookmarks") || null;

            if (!bookmarkCollection) {
                await createCollection("My Bookmarks");
            }

            await loadCollection("My Bookmarks");
        } catch (err) {
            console.error("Failed to load or create 'My Bookmarks' collection:", err);
        }

        // Scrolling behavior for container showcasing collections
        let scrollDirection = 1;
        let autoScroll;

        function startAutoScroll() {
            autoScroll = setInterval(() => {
                scrollContainer.scrollLeft += scrollDirection * 1;

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

        // Controls when container displaying collection starts/stops scrolling
        scrollContainer.addEventListener("mouseenter", stopAutoScroll);
        scrollContainer.addEventListener("mouseleave", startAutoScroll);

        startAutoScroll();
    } catch (err) {
        console.log(err);
        scrollContainer.remove();
        selectCollection.remove();
        return;
    }
});

// Removes/adds recipe to a given collection
async function toggleRecipeInCollection(collectionName, recipeId) {
    const collection = await getCollectionByName(collectionName);

    let collectionId = collection?.id;
    if (!collectionId) {
        const newCol = await createCollection(collectionName);
        collectionId = newCol.id;
    }

    const isInCollection = collection.recipe_ids.includes(recipeId);

    if (isInCollection) {
        await removeRecipeFromCollection(collectionId, recipeId);
        return false;
    } else {
        await addRecipeToBookmarks(collectionId, recipeId);
        return true;
    }
}

// Attaches all event listeners associated for any given recipe container
async function addEventListenersToRecipeContainer(recipeContainer) {
    const recipeBookmarkIcon = recipeContainer.querySelector(".bookmark-recipe-icon");
    const addToCollectionButton = recipeContainer.querySelector(".add-to-collection-button");
    const addToCollectionIcon = recipeContainer.querySelector(".more-options-icon");
    const dropdownContent = recipeContainer.querySelector(".dropdown-content");
    const bookmarks = Array.from(recipeContainer.getElementsByClassName("bookmark-recipe-icon"));

    // Hover behavior for icons
    recipeContainer.addEventListener("mouseover", () => {
        if (recipeBookmarkIcon) recipeBookmarkIcon.style.display = "block";
        if (addToCollectionIcon) addToCollectionIcon.style.display = "block";
    });

    recipeContainer.addEventListener("mouseleave", () => {
        if (recipeBookmarkIcon) recipeBookmarkIcon.style.display = "none";
        if (addToCollectionIcon) addToCollectionIcon.style.display = "none";
        if (dropdownContent) dropdownContent.style.display = "none";
    });

    // Bookmark icon behavior
    bookmarks.forEach((bookmark) => {
        bookmark.addEventListener("mouseenter", () => {
            bookmark.setAttribute("fill", "#E34234");
        });

        bookmark.addEventListener("mouseleave", () => {
            if (!bookmark.classList.contains("bookmarked")) {
                bookmark.setAttribute("fill", "whitesmoke");
            }
        });

        // Three-dots / "add to collection" button
        addToCollectionButton.addEventListener("click", async (e) => {
            e.preventDefault();   // Prevents submit forms / follow links
            e.stopPropagation();  // Prevents trigger of recipeContainer's click
            dropdownContent.style.display = "block";
        });

        bookmark.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const recipeId = Number(JSON.parse(recipeContainer.dataset.recipeId));
            const added = await toggleRecipeInCollection("My Bookmarks", recipeId);
            const dropdownContent = recipeContainer.getElementsByClassName("dropdown-content")[0];
            const links = dropdownContent.getElementsByClassName("collection");

            let link;
            for (const l of links) {
                if (l.textContent == "My Bookmarks") {
                    link = l;
                }
            }

            if (added) {
                bookmark.setAttribute("fill", "#E34234");
                bookmark.classList.add("bookmarked");
                link.style.backgroundColor = "lightgray";
            } else {
                bookmark.setAttribute("fill", "whitesmoke");
                bookmark.classList.remove("bookmarked");
                link.style.backgroundColor = "";
            }
        });
    });
}

// Toggles filling color of bookmark for recipe based on bookmark status
async function checkBookmarked(recipe, recipeContainer) {
    const recipeId = Number(recipe.idMeal || recipe.id);
    const bookmark = recipeContainer.getElementsByClassName("bookmark-recipe-icon")[0];
    const bookmarkedRecipes = await getCollectionByName("My Bookmarks");
    let isBookmarked = bookmarkedRecipes.recipe_ids.includes(recipeId);

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
        Boolean(bookmarkedRecipes.recipe_ids.includes(recipeId))
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

    // Default behavior to override cloned behavior
    const [leftButton, rightButton] = clonedCarousel.getElementsByClassName("carousel-button");
    leftButton.disabled = true;
    rightButton.disabled = false;

    await renderCarousel(clonedCarousel, lookupMethod, filter);

    return clonedCarousel; // Returns the element for later use
}

// Adds carousels to webpage as user scrolls fown
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

// Initializes recipe container with event listeners, bookmark, and dropdown menu
async function initializeRecipeContainer(recipe, recipeContainer) {
    await setRecipeContainer(recipe, recipeContainer);
    if (current_user) {
        await checkBookmarked(recipe, recipeContainer);
        await addEventListenersToRecipeContainer(recipeContainer);
        await buildDropdownForRecipe(recipeContainer);
    }
}

// Intializes carousel variables and attaches event listeners
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

        // Left Button click logic
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

        // Right Button click logic
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
                    const recipeId = Number(JSON.parse(recipeContainer.dataset.recipeId));
                    const recipe = await searchForRecipe(recipeId);
                    await initializeRecipeContainer(recipe, recipeContainer);
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
    recipeContainerChildren.forEach((recipeContainer) => {
        const id = Number(JSON.parse(recipeContainer.dataset.recipeId || null));

        if (!seenRecipes.includes(id)) {
            seenRecipes.push(id);
        }
    });

    // Attaches "seenRecipes" data to the carousel
    carousel.dataset.seenRecipes = JSON.stringify(seenRecipes);
}

// Dynamically creates dropdown menu for a given recipe
async function buildDropdownForRecipe(recipeContainer) {
    const dropdownContent = recipeContainer.querySelector(".dropdown-content");
    dropdownContent.innerHTML = "";

    const recipeId = Number(JSON.parse(recipeContainer.dataset.recipeId));
    const collectionItems = await fetchCollections();
    const collections = collectionItems.items || [];

    for (const c of collections) {
        const link = document.createElement("a");
        link.className = "collection";
        link.textContent = c.collection_name;
        link.href = "#";

        let isInCollection = c.recipe_ids.includes(recipeId);
        link.style.backgroundColor = isInCollection ? "lightgray" : "";

        link.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const recipeId = Number(JSON.parse(recipeContainer.dataset.recipeId));
            const added = await toggleRecipeInCollection(c.collection_name, recipeId);

            if (added) {
                link.style.backgroundColor = "lightgray";
            } else {
                link.style.backgroundColor = "";
            }

            if (c.collection_name == "My Bookmarks") {
                const bookmark = recipeContainer.querySelector(".bookmark-recipe-icon");

                if (added) {
                    bookmark.setAttribute("fill", "#E34234");
                    bookmark.classList.add("bookmarked");
                } else {
                    bookmark.setAttribute("fill", "whitesmoke");
                    bookmark.classList.remove("bookmarked");
                }
            }
        });
        dropdownContent.appendChild(link);
    }
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
    recipeContainer.addEventListener("click", () => {
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
    });

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

    for (let [ index, recipeContainer ] of carouselRecipeContainers.entries() ) {
        let recipeId = recipeIds[index];
       
        recipeContainer.onclick = () => {
            window.location.href = `recipe-view.html?id=${recipeId}`;
        }
        const recipe = await searchForRecipe(recipeId);
        await initializeRecipeContainer(recipe, recipeContainer);
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
            let recipes = [];

            for (let recipe of recipeList) {
                const recipeId = recipe.id;
                const response = await fetch(`/recipes/${recipeId}`);
                const result = await response.json();

                if (!result) {
                    throw Error(result.error);
                }

                recipes.push(result);
            }

            for (let i = 0; i < carouselRecipeContainers.length; i++) {
                const recipe = recipes[i];
                const recipeContainer = carouselRecipeContainers[i];
                           
                if (!recipes[i]) break;
                await initializeRecipeContainer(recipe, recipeContainer);
            }
            // carousel.dataset.seenRecipes = JSON.stringify(recipeIds);
        } catch (err) {
            // Carousels without a specified "lookup" are filled with random recipes
            console.error(err)
            for (let recipeContainer of carouselRecipeContainers) {
                const recipe = await fetchRecipe();
                await initializeRecipeContainer(recipe, recipeContainer);
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
            await initializeRecipeContainer(fullRecipe, recipeContainer);
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

    // Listens for moment when user scrolls to bottom to add more carousels
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

            // rightButton.disabled = false;
        });
    }

}

main();
