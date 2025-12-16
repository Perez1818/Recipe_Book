// Gets details concering the user's relation to the challenge
export async function getUserChallengeDetails(userId, challengeId) {
    try {
        const response = await fetch(`/users-challenges/${userId}/${challengeId}`);
        const result = await response.json();
        return result;
    } catch (err) {
        console.error("getUserChallengeDetails:", err)
    }
}

// Like or unlike a challenge
export async function userLikesChallenge(userId, challengeId, liked = true) {
    try {
        const response = await fetch(`/users-challenges/${userId}/${challengeId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ liked }),
        });
        result = await response.json();
        return result;
    } catch (err) {
        console.error("userLikesChallenge error:", err);
    }
}

// Participate in a challenge
export async function userParticipatesInChallenge(userId, challengeId) {
    try {
        const response = await fetch(`/users-challenges/${userId}/${challengeId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "participating" }),
        });
        const result = await response.json();
        return result;
    } catch (err) {
        console.error("userParticipatesInChallenge error:", err);
    }
}

// Leave (cancel participation)
export async function userLeavesChallenge(userId, challengeId) {
    try {
        const response = await fetch(`/users-challenges/${userId}/${challengeId}`, {
            method: "DELETE",
        });
        const result = await response.json();
        return result;
    } catch (err) {
        console.error("userLeavesChallenge error:", err);
    }
}

// Complete a challenge
export async function userCompletesChallenge(userId, challengeId, recipeId) {
    try {
        const response = await fetch(`/users-challenges/${userId}/${challengeId}/${recipeId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "completed", recipe_id: recipeId }),
        });
        const result = await response.json();
        return result;
    } catch (err) {
            console.error("userCompletesChallenge error:", err);
    }
}

// Fetches like for a challenge
export async function getLikesForChallenge(challengeId) {
    try {
        const response = await fetch(`/users-challenges/${challengeId}/likes`);
        const result = await response.json();
        return result.likes;
    } catch (err) {
        console.error("getLikesForChallenge error:", err);
    }
}

// Fetches number of people who are participating but have not completed the challenge
export async function getNumParticipantsInChallenge(challengeId) {
    try {
        const response = await fetch(`/users-challenges/${challengeId}/participants`);
        const result = await response.json();
        return result.numOfParticipants;
    } catch (err) {
        console.error("getNumParticipantsInChallenge error:", err);
    }
}

// Fetches number of people who have completed the challenge
export async function getNumWinnersInChallenge(challengeId) {
    try {
        const response = await fetch(`/users-challenges/${challengeId}/winners`);
        const result = await response.json();
        return result.numOfWinners;
    } catch (err) {
        console.error("getNumWinnersInChallenge error:", err);
    }
}

// Assigns X number of points to user's profile
export async function awardChallengePointsToUser(userId, challengePoints) {
    try {
        const response = await fetch(`/users-challenges/${userId}/points`, {
            method: "PATCH",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({points: challengePoints})
        });
        const result = await response.json();
        return result
    } catch {
        console.error("addUserPoints error:", err);
    }
}