
const recipeContainers = document.getElementsByClassName("recipe-container");
const recipeContainersArray = Array.from(recipeContainers);
const bookmarks = Array.from(document.getElementsByClassName("bookmark-recipe-icon"));
const carousels = Array.from(document.getElementsByClassName("carousel-container"));
let bookmarkedRecipes = {};

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
    console.log(username.href)
}

function addVisibleRecipesFromCarousel(carousel){
    const recipeContainerChildren = getCarouselRecipeContainerObjs(carousel);
    seenRecipes = JSON.parse(carousel.dataset.seenRecipes);
    recipeContainerChildren.forEach(
        (recipeContainer) => {
            const id = JSON.parse(recipeContainer.dataset.recipeId);
            seenRecipes.push(id);
        }
    )
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

async function setRecipeContainer(recipe, recipeContainer) {
    const { recipeName, recipeThumbnail, recipeId, recipeIngredients, recipeOrigin } = initializeRecipeVariables(recipe);
    recipeContainer.dataset.recipeId = JSON.stringify(recipeId);

    recipeContainer.onclick = () => {
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
    return {
        recipeName,
        recipeThumbnail,
        recipeId,
        recipeIngredients,
        recipeOrigin
    }
}

async function renderAllCarousels(){
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

async function renderCarousel(carousel){
    carouselRecipeContainers = getCarouselRecipeContainerObjs(carousel);
    for (let recipeContainer of carouselRecipeContainers) {
        let recipe = await fetchRecipe();
        setRecipeContainer(recipe, recipeContainer);
        checkBookmarked(recipe, recipeContainer);
        // addVisibleRecipesFromRecipeContainer(recipeContainer);
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

                parentRecipeContainer = bookmark.closest(".recipe-container");
                recipeId = JSON.parse(parentRecipeContainer.dataset.recipeId);
                if (recipeId in bookmarkedRecipes) {
                    delete bookmarkedRecipes[recipeId];
                }
                else {
                    bookmarkedRecipes[recipeId] = true;
                }
            });
        }
    );

    for (let i = 0; i < carousels.length; i++){
        let currentCarousel = carousels[i];
        let [ leftButton, rightButton ] = currentCarousel.getElementsByClassName("carousel-button");
        [ leftButton.parentCarousel, rightButton.parentCarousel ] = [ currentCarousel, currentCarousel ];
        rightButton.siblingButton = leftButton;
        currentCarousel.sliderIndex = 0;
        currentCarousel.maxSliderIndex = 0;

        leftButton.addEventListener("click", async () => {
            leftButton.disabled = true;
            currentCarousel = leftButton.parentCarousel;
            endingIndex = currentCarousel.sliderIndex;
            startingIndex = endingIndex - 3;
            seenRecipeIds = JSON.parse(currentCarousel.dataset.seenRecipes);
            relevantRecipeIds = seenRecipeIds.slice(startingIndex, endingIndex);

            await renderCarouselWithOldElements(currentCarousel, relevantRecipeIds);

            currentCarousel.sliderIndex -= 3;

            if (currentCarousel.sliderIndex != 0){
                leftButton.disabled = false;
            }
        });

        rightButton.addEventListener("click", async () => {
            rightButton.disabled = true;
            currentCarousel = rightButton.parentCarousel;
            rightButton.siblingButton.disabled = false;
            // To render new elements
            if(currentCarousel.sliderIndex >= currentCarousel.maxSliderIndex){
                await renderCarousel(currentCarousel);
            }
            // To render old elements
            else {
                startingIndex = currentCarousel.sliderIndex + 3;
                endingIndex = startingIndex + 3;
                seenRecipeIds = JSON.parse(currentCarousel.dataset.seenRecipes);
                relevantRecipeIds = seenRecipeIds.slice(startingIndex, endingIndex);

                await renderCarouselWithOldElements(currentCarousel, relevantRecipeIds);
            }
            currentCarousel.sliderIndex += 3;
            currentCarousel.maxSliderIndex = getMaxSliderIndex(currentCarousel);
            rightButton.disabled = false;
        });
    }
}

main();
