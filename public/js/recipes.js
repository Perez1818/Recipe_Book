
// Retrieves recipe ID
export function getRecipeIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

// Returns a random recipe
export async function fetchRecipe(){
    const response = await fetch("https://www.themealdb.com/api/json/v1/1/random.php");
    if (!response.ok){
        throw "Error occurred fetching data";
    }
    const data = await response.json();
    return data['meals'][0];
}

// Returns the names of all cultures that have a recipe on TheMealDB site
export async function fetchAreas() {
    const response = await fetch("https://www.themealdb.com/api/json/v1/1/list.php?a=list");
    if (!response.ok) {
        throw "Error occured fetching data";
    }
    const data = await response.json();
    const areas = data['meals'];
    let areasList = [];
    areas.forEach(
        (area) => {
            areasList.push(area.strArea);
        }
    )
    return areasList;
}

// Returns recipe based on category (e.g., breakfast)
export async function fetchRecipesByCategory(category){
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`);
    if (!response.ok){
        throw "Error occurred fetching data";
    }
    const data = await response.json();
    return data['meals'];
}

// Returns recipe based on cuisine (e.g., British)
export async function fetchRecipesByCuisine(cuisine) {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${cuisine}`);
    if (!response.ok) {
        throw "Error occurred fetching data";
    }
    const data = await response.json();
    return data["meals"];
}

// Searches for the recipe based on ID provided in URL
export async function searchForRecipe(recipeId) {
    try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipeId}`);
        if (!response.ok) {
            throw "Error occurred fetching data!";
        }
        const data = await response.json();
        return data["meals"][0];
    } catch {
        const response = await fetch(`/recipes/${recipeId}`);
        if (!response.ok) {
            throw "Error occurred fetching data!";
        }
        const data = await response.json();
        return data;
    }
}

// Returns list of ingredients associated with a provided recipe
export function getIngredientsList(recipe){
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

// Returns an object consisting of all the necessary recipe attributes
export function initializeRecipeVariables(recipe){
    // Accesses recipe attributes and assigns them to variables
    const recipeName = recipe.strMeal || recipe.name;
    const recipeThumbnail = recipe.strMealThumb || `../uploads/multimedia/${recipe.thumbnail}`;
    const recipeId = recipe.idMeal || recipe.id;
    const recipeIngredients = getIngredientsList(recipe);
    const recipeOrigin = recipe.strSource || null;
    const recipeCategory = recipe.strCategory || recipe.tags;
    const recipeCusine = recipe.strArea || null;

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

// Returns list of recipes created by a particular user provided their user ID
export async function getRecipesByUser(userId) {
    try {
        const response = await fetch(`/recipes/user/${userId}`);
        const result = await response.json();
        return result;
    } catch (err) {
        console.error(err)
    }
}
