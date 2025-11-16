import { getUsername, getCurrentUserDetails } from "./users.js";
import { getRecipesByUser } from "./recipes.js";
import { getUserChallengeDetails, userLikesChallenge, userParticipatesInChallenge, userLeavesChallenge, userCompletesChallenge, getLikesForChallenge, getNumParticipantsInChallenge, getNumWinnersInChallenge, awardChallengePointsToUser } from "./usersChallenges.js";

// DOM elements to fill in
const challengeTitle = document.getElementById("challenge-name");
const challengeThumbnail = document.getElementById("challenge-img"); 
const timeframeEl = document.getElementById("calendar-date");
const usernameEl = document.getElementById("username");
const descriptionEl = document.getElementById("description");
const numPointsEl = document.getElementById("num-points");
const requirementsEl = document.getElementById("requirements");
const requiredIngredients = document.getElementById("required-ingredients");
const maxIngredientsEl = document.getElementById("max-ingredients");
const numParticipantsEl = document.getElementById("num-participants");
const numWinnersEl = document.getElementById("num-winners");
const participateButton = document.getElementById("participate-button");
const timeLeftElements = Array.from(document.getElementsByClassName("time-left"));
const userRecipesContainer = document.getElementById("user-recipe-container");
const submissionArea = document.getElementById("submission-section");

// Gets details based on the id parameter in URL
async function getChallenge(id) {
    try {
        const response = await fetch(`/challenges/${id}`);
        const result = await response.json();
        return result
    } catch (err) {
        console.error(err)
    }
}

function normalizeIngredientName(ingredientName) {
    if (typeof ingredientName !== "string") return ""; // safeguard
    ingredientName = ingredientName.toLowerCase();
    ingredientName = ingredientName.replace(/s$/, '');
    return ingredientName;
}

function preventRecipeFromBeingClicked(img) {
    img.classList.add("gray-out");
    img.style.cursor = "not-allowed";
    img.disabled = true;
}

async function main() {
    // Obtains variables associated with the given challenge
    const params = new URLSearchParams(window.location.search);
    const challengeId = params.get("id");
    const challenge = await getChallenge(challengeId);
    let { user_id, title, thumbnail, description, start, cutoff, points, required_ingredients, max_ingredients } = challenge;


    //  Obtains all the recipes created by currently registered user
    let userRecipes;
    let currentUser;
    let userId;
    try {
        currentUser = await getCurrentUserDetails();
        userId = currentUser.id;
        const userRecipesResult = await getRecipesByUser(userId);
        userRecipes = userRecipesResult.recipes;
        const userRecipeIngredients = userRecipesResult.ingredients;

        let recipeIngredients = {};

        // Builds dictionary of ingredients associated with each recipe ID
        for (const ingredient of userRecipeIngredients) {
            const recipeId = ingredient.recipe_id;
            const ingredientName = normalizeIngredientName(ingredient.name);
            if (recipeIngredients[recipeId]) {
                recipeIngredients[recipeId].push(ingredientName);
            }
            else {
                recipeIngredients[recipeId] = [ingredientName];
            }
        }

        // Populate section with list of user's recipes
        for (let i=0; i < userRecipes.length; i++) {
            const recipeId = userRecipes[i].id;
            const ingredients = recipeIngredients[recipeId] || [];
            const numIngredients = ingredients.length;

            const img = document.createElement("img");
            const thumbnail = userRecipes[i].thumbnail;

            img.src = `uploads/multimedia/${thumbnail}`;
            img.title = userRecipes[i].name;
            img.recipeId = recipeId;
            userRecipesContainer.appendChild(img);

            // Recipes with 0 ingredients should not be submitted
            if (numIngredients === 0) {
                preventRecipeFromBeingClicked(img);
            }

            // Recipes with more ingredients than specified should not be submitted
            if (max_ingredients) {
                if (numIngredients > max_ingredients) {
                    preventRecipeFromBeingClicked(img);
                }
            }
            
            // Recipes that are missing one of the required ingredients should not be submitted
            if (required_ingredients[0]) {
                for (let j=0; j < required_ingredients.length; j++) {
                    const requiredIngredient = normalizeIngredientName(required_ingredients[j]);
                    if (!ingredients.includes(requiredIngredient)) {
                        preventRecipeFromBeingClicked(img);
                    }
                }
            }
        }   
    } catch (err) {
        participateButton.disabled = true;
        participateButton.style.cursor = "not-allowed";
    }

    // Fetches all images that have not been grayed out
    const satisfiableUserRecipes = Array.from(userRecipesContainer.querySelectorAll(":not(img.gray-out)"));

    // Prevents user from attempting to participate in challenge that has already expired
    if (new Date(cutoff) < new Date()) {
        participateButton.disabled = true;
        participateButton.style.cursor = "not-allowed";
    }

    // Pads time with 0s to keep consistent length of 2
    function padTime(timeUnit) {
        return String(timeUnit).padStart(2, "0");
    }

    // Writes the difference between the starting and the cutoff date
    function calcTimeDiff() {
        const target = new Date(cutoff);
        const now = new Date();

        let diff = target - now; // Gets milliseconds
        if (diff < 0) diff = 0;  // Date already passed

        const days = padTime(Math.floor(diff / (1000 * 60 * 60 * 24)));
        const hours = padTime(Math.floor((diff / (1000 * 60 * 60)) % 24));
        const minutes = padTime(Math.floor((diff / (1000 * 60)) % 60));
        const seconds = padTime(Math.floor((diff / 1000) % 60));

        // Writes days, hours, minutes, and seconds to corresponding elements
        for(let i=0; i < timeLeftElements.length; i++) {
            timeLeftElements[i].textContent = [days, hours, minutes, seconds][i];
        }
    }

    // Updates the time left displayed on the webpage every second 
    setInterval(calcTimeDiff, 1_000);

    // Fills in title and thumbnail
    challengeTitle.textContent = title;
    challengeThumbnail.src = `../uploads/challenge/${thumbnail}`;

    // Gets start and cutoff dates in "Month Day" format
    start = new Date(start).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric'
    });
    const _cutoff = new Date(cutoff).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric'
    });

    // Obtains months and days concerining time period
    const [startMonth, startDay] = start.split(" ");
    const [cutoffMonth, cutoffDay] = _cutoff.split(" ");

    // Writes unique months once
    if (startMonth != cutoffMonth) {
        timeframeEl.textContent += `${start} - ${_cutoff}`;
    }
    // Writes shared month and days between start and cutoff date
    else {
        timeframeEl.textContent += `${startMonth} ${startDay} - ${cutoffDay}`;
    }

    // Fills in username, description and points
    usernameEl.textContent = await getUsername(user_id);
    descriptionEl.textContent = `${description}`;
    numPointsEl.textContent = `${points} pts 🎯`;

    // Adds bullets to display required ingredients if there are any
    if (required_ingredients[0]) {
        for (let i=0; i < required_ingredients.length; i++) {
            const li = document.createElement("li");
            li.textContent = required_ingredients[i];
            requirementsEl.appendChild(li);
        }
    }

    // Displays maximum number of ingredients allowed if any exist
    if (max_ingredients) {
        maxIngredientsEl.textContent += max_ingredients;
    }
    else {
        maxIngredientsEl.remove();
    }

    // Displays number of participants and winners
    async function displayParticipantsAndWinners() {
        const numParticipants = await getNumParticipantsInChallenge(challengeId);
        const numWinners = await getNumWinnersInChallenge(challengeId);
        numParticipantsEl.textContent = `${numParticipants} 👤`;
        numWinnersEl.textContent = `${numWinners} 🏆`;
    }

    await displayParticipantsAndWinners()

    // Allows the user recipes that are qualified to be clickable until one is chosen
    satisfiableUserRecipes.forEach(
        async (userRecipe) => {
            userRecipe.addEventListener("click", async () => {
                const recipeId = userRecipe.recipeId;
                try {
                    const result = await userCompletesChallenge(userId, challengeId, recipeId);

                    // Only mark as completed if no error from backend
                    if (!result || result.error) throw new Error(result?.error || "failed");

                    await awardChallengePointsToUser(userId, challenge.points)

                    // Only runs if recipe successfully attached
                    participateButton.disabled = true;
                    participateButton.textContent = "Completed";
                    participateButton.style.cursor = "not-allowed";
                    participateButton.style.backgroundColor = "lightgreen";
                    submissionArea.style.display = "none";

                    await displayParticipantsAndWinners();

                    satisfiableUserRecipes.forEach(img => {
                    preventRecipeFromBeingClicked(img);
                    });
                } catch (err) {
                    console.warn("Recipe submission failed:", err.message);
                    // Disable just this recipe to prevent retry with same ID
                    preventRecipeFromBeingClicked(userRecipe);
                }
            });
        }
    );

    if (currentUser) {
        let userChallengeDetails;
        userChallengeDetails = await getUserChallengeDetails(userId, challengeId) || null;

        // Set initial button state based on user challenge details
        if (userChallengeDetails && userChallengeDetails.status === "participating") {
            participateButton.classList.add("participating");
            participateButton.textContent = " Participating ✓";
            participateButton.style.backgroundColor = "salmon";
            submissionArea.style.display = "flex";
        }
        else if (userChallengeDetails && userChallengeDetails.status === "completed") {
            participateButton.classList.remove("participating");
            participateButton.textContent = " Completed";
            participateButton.style.backgroundColor = "lightgreen";
            participateButton.style.cursor = "not-allowed";
            participateButton.disabled = true;
        }
        else {
            participateButton.classList.remove("participating");
            participateButton.textContent = " Participate";
            participateButton.style.backgroundColor = "lightgray";
        }
    }

    participateButton.addEventListener(
        "click", async (event) => {
            event.preventDefault();
            event.stopPropagation();    // Stops event from reaching parent elements

            // Updates participant stats for challenge updates database
            if (!participateButton.classList.contains("participating")) {
                // Joining challenge
                const joinResult = await userParticipatesInChallenge(userId, challengeId);
                if (joinResult && !joinResult.error) {
                    participateButton.classList.add("participating");
                    participateButton.textContent = " Participating ✓";
                    participateButton.style.backgroundColor = "salmon";
                }

                // Displays submission area for participant
                submissionArea.style.display = "flex";
                // Scrolls the submission area into view
                submissionArea.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
            else {
                // Leaving challenge
                const leaveResult = await userLeavesChallenge(userId, challengeId);
                if (leaveResult != null && !leaveResult.error) {
                    participateButton.classList.remove("participating");
                    participateButton.textContent = " Participate";
                    participateButton.style.backgroundColor = "lightgray";
                }
                
                submissionArea.style.display = "none";
            }

            await displayParticipantsAndWinners();
        }
    );
}

main()