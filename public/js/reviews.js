// Initialize number of reviews displayed
export async function fetchReviews(recipeId) {
    const response = await fetch(`/reviews/recipe/${recipeId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    });
    const result = await response.json();
    if (!response.ok) {
        console.log("Failed to load in reviews:", result.error)
        return;
    }
    return result;
}

export async function updateReviewInDatabase(reviewId, updatedContent) {
    try {
        const response = await fetch (`/reviews/${reviewId}`, {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(updatedContent)
        });
        const result = await response.json();
        if (response.ok) {
            console.log("Review was sucessfully updated!")
        }
    } catch (error) {
        console.error("Error updating review:", error);
    }
}

export async function toggleFeedback(reviewId, isLike) {
    try {
            const response = await fetch(`/reviews/${reviewId}/feedback`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_like: isLike })
        });

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
            console.error("Non-JSON response:", await response.text());
            return false;
        }

        const result = await response.json();
        if (!response.ok) {
            alert(result.error);
            return false;
        }

        return true; // success
    } catch (err) {
        console.error("toggleFeedback failed:", err);
        return false;
    }
}
