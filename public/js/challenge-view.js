import { getUsername } from "./users.js";

const challengeTitle = document.getElementById("challenge-name");
const challengeThumbnail = document.getElementById("challenge-img"); 
const timeframe = document.getElementById("calendar-date");
const username = document.getElementById("username");
const descriptionEl = document.getElementById("description");
const numPointsEl = document.getElementById("num-points");
const requirementsEl = document.getElementById("requirements");
const requiredIngredients = document.getElementById("required-ingredients");
const maxIngredients = document.getElementById("max-ingredients");
const numParticipantsEl = document.getElementById("num-participants");
const participateButton = document.getElementById("participate-button");

async function getChallenge(id) {
    try {
        const response = await fetch(`/challenges/${id}`);
        const result = await response.json();
        return result
    } catch (err) {
        console.error(err)
    }
}

async function main() {
    const params = new URLSearchParams(window.location.search);
    const challengeId = params.get("id");
    const challenge = await getChallenge(challengeId);
    let { user_id, title, thumbnail, description, start, cutoff, points, required_ingredients, max_ingredients } = challenge;

    challengeTitle.textContent = title;
    challengeThumbnail.src = `../uploads/challenge/${thumbnail}`;
    start = new Date(start).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
    });
    cutoff = new Date(cutoff).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric'
    });
    timeframe.textContent = `${start} - ${cutoff}`;
    username.textContent = await getUsername(user_id);
    descriptionEl.textContent = `${description}`;
    numPointsEl.textContent = `${points} pts`;
    for (let i=0; i < required_ingredients.length; i++) {
        const li = document.createElement("li");
        li.textContent = required_ingredients[i];
        requirementsEl.appendChild(li);
    }
    maxIngredients.textContent += max_ingredients;

    participateButton.addEventListener(
        "click", (event) => {
            event.preventDefault();
            event.stopPropagation();    // stop event from reaching parent elements
            participateButton.classList.toggle("participating");
            const numParticipants = parseInt(numParticipantsEl.textContent);

            if (participateButton.classList.contains("participating")) {
                participateButton.textContent = " Participating ✓";
                numParticipantsEl.textContent = `${numParticipants + 1} 👤`;
            }
            else {
                participateButton.textContent = " Participate";
                numParticipantsEl.textContent = `${numParticipants - 1} 👤`;
            }
        }
    );
}

main()