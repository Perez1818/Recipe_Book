// --- DOM references ---
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const cookTimeSelect = document.getElementById("cook-time-select");
const categorySelect = document.getElementById("category-select");
const restrictionsSelect = document.getElementById("restrictions-select");
const resultsContainer = document.getElementById("searched-items-container");

// --- Helper: TheMealDB API calls ---

// Search by recipe name
async function fetchByName(query) {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Error fetching recipes by name");
    const data = await res.json();
    return data.meals || [];
}

// Search by ingredient (returns lighter objects: id, name, thumb)
async function fetchByIngredient(query) {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Error fetching recipes by ingredient");
    const data = await res.json();
    return data.meals || [];
}

// Lookup full recipe details by ID (for ingredient results if needed)
async function fetchRecipeById(id) {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
    if (!res.ok) throw new Error("Error fetching recipe details");
    const data = await res.json();
    return data.meals ? data.meals[0] : null;
}

// --- Core search logic ---

// Main search: try name first, fall back to ingredient
async function searchRecipes(query) {
    const trimmed = query.trim();
    if (!trimmed) {
        return [];
    }

    // 1) Try matching recipe names
    let meals = await fetchByName(trimmed);

    // 2) If nothing found by name, try ingredient
    if (!meals || meals.length === 0) {
        const ingredientResults = await fetchByIngredient(trimmed);

        // Optional: limit number to avoid tons of follow-up calls
        const limited = ingredientResults.slice(0, 12);

        // Fetch full details for each of these
        const fullMeals = [];
        for (const m of limited) {
            const full = await fetchRecipeById(m.idMeal);
            if (full) fullMeals.push(full);
        }
        meals = fullMeals;
    }

    // Apply category / cuisine filter (using strArea) if selected
    const selectedCategory = categorySelect.value;
    if (selectedCategory && selectedCategory !== "explore-more") {
        meals = meals.filter(meal =>
            meal.strArea &&
            meal.strArea.toLowerCase() === selectedCategory.toLowerCase()
        );
    }

    // (Cook time + dietary restrictions aren't in TheMealDB,
    // so they'd need custom data. You can hook that up later.)

    return meals;
}

// --- Rendering ---

function clearResults() {
    resultsContainer.innerHTML = "";
}

function renderNoResults(query) {
    clearResults();
    const p = document.createElement("p");
    p.className = "no-results";
    p.textContent = `No recipes found for "${query}". Try a different recipe name or ingredient.`;
    resultsContainer.appendChild(p);
}

function renderResults(meals) {
    clearResults();

    meals.forEach(meal => {
        const item = document.createElement("div");
        item.classList.add("search-item");

        // When a result is clicked, save tags + navigate to detail page
        item.addEventListener("click", () => {
            const recipeTags = {
                category: meal.strCategory,
                cuisine: meal.strArea
            };
            if (meal.strCategory && meal.strArea) {
                localStorage.setItem("recipeTags", JSON.stringify(recipeTags));
            }
            window.location.href = `recipe-view.html?id=${meal.idMeal}`;
        });

        const img = document.createElement("img");
        img.src = meal.strMealThumb;
        img.alt = meal.strMeal;

        const detailsDiv = document.createElement("div");
        detailsDiv.classList.add("recipe-details");

        const title = document.createElement("h2");
        title.textContent = meal.strMeal;

        const desc = document.createElement("p");
        // Use first couple of sentences of the instructions, if available
        const instructions = meal.strInstructions || "";
        if (instructions) {
            const short = instructions.split(". ").slice(0, 2).join(". ");
            desc.textContent = short + (short.endsWith(".") ? "" : ".");
        } else {
            desc.textContent = "Click to view the full recipe details.";
        }

        detailsDiv.appendChild(title);
        detailsDiv.appendChild(desc);

        item.appendChild(img);
        item.appendChild(detailsDiv);
        resultsContainer.appendChild(item);
    });
}

// --- Event handlers ---

async function handleSearch(event) {
    if (event) event.preventDefault();

    const query = searchInput.value;
    if (!query.trim()) {
        renderNoResults("");
        return;
    }

    try {
        const meals = await searchRecipes(query);
        if (!meals || meals.length === 0) {
            renderNoResults(query);
        } else {
            renderResults(meals);
        }
    } catch (err) {
        console.error(err);
        clearResults();
        const p = document.createElement("p");
        p.className = "no-results";
        p.textContent = "An error occurred while searching. Please try again.";
        resultsContainer.appendChild(p);
    }
}

// --- Wire up events ---

searchButton.addEventListener("click", handleSearch);
searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        handleSearch(e);
    }
});

// Optional: re-run search when category changes (if a query is present)
categorySelect.addEventListener("change", () => {
    if (searchInput.value.trim()) {
        handleSearch();
    }
});
