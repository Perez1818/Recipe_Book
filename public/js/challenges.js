import { getUsername, getCurrentUserDetails } from "./users.js";
import { getUserChallengeDetails, userParticipatesInChallenge, userLikesChallenge, userLeavesChallenge, userCompletesChallenge, getLikesForChallenge, getNumParticipantsInChallenge, getNumWinnersInChallenge } from "./usersChallenges.js";

const challengesContainer = document.querySelector("#challenges-container");
const challengePlaceholder = document.querySelector("#no-challenges-placeholder");
const challengeContainerTemplate = challengesContainer.getElementsByClassName("challenge")[0];
challengeContainerTemplate.style.display = "none";

// Fetches all active challeges
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
        const numLikesEl = clonedChallengeContainer.querySelector(".likes");
        const numParticipantsEl = clonedChallengeContainer.querySelector(".participants");
        const numWinnersEl = clonedChallengeContainer.querySelector(".winners");

        titleEl.textContent = `${title}:`;
        imgEl.src = `../uploads/challenge/${thumbnail}`;
        const username = await getUsername(user_id);
        usernameEl.textContent = `@${username}`;
        usernameEl.href = `/user/${username}`
        descriptionEl.textContent = description;
        pointsEl.textContent = `(${points} pts)`;
        // clonedChallengeContainer.challengeId = challenge_id;

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

        // Displays number of participants and winners
        async function displayParticipantsAndWinners() {
            const numParticipants = await getNumParticipantsInChallenge(id);
            const numWinners = await getNumWinnersInChallenge(id);
            numParticipantsEl.textContent = `${numParticipants} 👤`;
            numWinnersEl.textContent = `${numWinners} 🏆`;
        }

        await displayParticipantsAndWinners();

        if (currentUser) {
            const userId = currentUser.id;

            let userChallengeDetails;
            userChallengeDetails = await getUserChallengeDetails(userId, id);

            if (userChallengeDetails && userChallengeDetails.status === "participating") {
                participateButton.classList.add("participating");
                participateButton.textContent = " Participating ✓";
                participateButton.style.backgroundColor = "salmon";
            }
            else if (userChallengeDetails && userChallengeDetails.status === "completed") {
                participateButton.classList.remove("participating");
                participateButton.textContent = " Completed";
                participateButton.style.backgroundColor = "lightgreen";
                participateButton.style.borderRadius = "5px";
                participateButton.style.border = "1px solid";
                participateButton.style.cursor = "not-allowed";
                participateButton.disabled = true;
            }
            else {
                participateButton.classList.remove("participating");
                participateButton.textContent = " Participate";
            }

            participateButton.addEventListener(
            "click", async (event) => {
                event.preventDefault();
                event.stopPropagation();         // stop event from reaching parent elements

                if (!participateButton.classList.contains("participating")) {
                    // Joining challenge
                    const joinResult = await userParticipatesInChallenge(userId, id);
                    if (joinResult && !joinResult.error) {
                        participateButton.classList.add("participating");
                        participateButton.textContent = " Participating ✓";
                    }
                }
                else {
                    // Leaving challenge
                    const leaveResult = await userLeavesChallenge(userId, id);
                    if (leaveResult != null && !leaveResult.error) {
                        participateButton.classList.remove("participating");
                        participateButton.textContent = " Participate";
                    }
                }
                await displayParticipantsAndWinners();
            }
        );
        }

        clonedChallengeContainer.addEventListener(
            "click", () => {
                window.location.href = `challenge-view.html?id=${id}`;
            }
        );

        challengesContainer.appendChild(clonedChallengeContainer);
    }
}

main();