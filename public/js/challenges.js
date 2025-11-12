import { getUsername, getCurrentUserDetails } from "./users.js";

const challengesContainer = document.querySelector("#challenges-container");
const challengePlaceholder = document.querySelector("#no-challenges-placeholder");
const challengeContainerTemplate = challengesContainer.getElementsByClassName("challenge")[0];
challengeContainerTemplate.style.display = "none";

async function getListChallenges() {
    try {
        const response = await fetch("/challenges/list");
        const result = await response.json();
        return result
    } catch (err) {
        console.error(err)
    }
}

async function main() {
    const challengesResult = await getListChallenges();
    const challenges = [...challengesResult.items];
    let todaysDate = new Date().toISOString().split('T')[0];

    if (challenges.length >= 1) {
        challengePlaceholder.remove()
    }

    for (const challenge of challenges) {
        const clonedChallengeContainer = challengeContainerTemplate.cloneNode(true);
        clonedChallengeContainer.style.display = "inline-flex";
        clonedChallengeContainer.style.cursor = "pointer";

        const participateButton = clonedChallengeContainer.getElementsByClassName("participate-button")[0];
        const currentUser = await getCurrentUserDetails();

        // Prevent unregistered users from participating in any challenges
        if (!currentUser) {
            participateButton.disabled = true;
            participateButton.style.cursor = "not-allowed";
        }

        const  { id, user_id, title, description, thumbnail, start, cutoff, required_ingredients, points, max_ingredients } = challenge;
        const titleEl = clonedChallengeContainer.querySelector(".challenge-title");
        const imgEl = clonedChallengeContainer.querySelector("img");
        const descriptionEl = clonedChallengeContainer.querySelector(".challenge-description");
        const pointsEl = clonedChallengeContainer.querySelector(".challenge-award-points");
        const timeLeftEl = clonedChallengeContainer.querySelector(".days-left");
        const usernameEl = clonedChallengeContainer.querySelector(".username");
        const likesEl = clonedChallengeContainer.querySelector(".likes");
        const numParticipantsEl = clonedChallengeContainer.querySelector(".participants");

        titleEl.textContent = `${title}:`;
        imgEl.src = `../uploads/challenge/${thumbnail}`;
        usernameEl.textContent = await getUsername(user_id);
        descriptionEl.textContent = description;
        pointsEl.textContent = `(${points} pts)`;

        let cutoffDate = new Date(cutoff).toISOString().split('T')[0];

        const diffDays = Math.ceil((new Date(cutoffDate) - new Date(todaysDate)) / (1000 * 60 * 60 * 24));
        // Represents days until challenge closes out
        if (diffDays != 0) {
            timeLeftEl.textContent = `⏱️ ${diffDays} days left`;
        }
        // Represents hours until challenge closes out
        else {
            todaysDate = new Date();
            cutoffDate = new Date(cutoffDate);
            const midnight = new Date(cutoffDate);
            midnight.setDate(cutoffDate.getDate() + 1);
            midnight.setHours(0, 0, 0, 0);
            const diffHours = Math.ceil((midnight - todaysDate) / (1000 * 60 * 60)); // divide by 1 hour
            timeLeftEl.textContent = `⏱️ ${diffHours} hours left`;
        }

        participateButton.addEventListener(
            "click", (event) => {
                event.preventDefault();
                event.stopPropagation();         // stop event from reaching parent elements
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

        clonedChallengeContainer.addEventListener(
            "click", () => {
                window.location.href = `challenge-view.html?id=${id}`;
            }
        );

        challengesContainer.appendChild(clonedChallengeContainer);
    }
}

main();