
// DOM Elements
const reviewToPost = document.getElementById("review-to-post");
const starRatings = document.querySelectorAll("input[name='stars']");
const starSvgs = document.querySelectorAll("label svg");
const postButton = document.getElementById("post-button");
const likeRecipeButton = document.querySelector("#likes");
const firstReview = document.getElementsByClassName("review")[0];
const postReviewSection = document.getElementById("post-review-container");
const reviewsSection = document.getElementById("reviews-section");
const numReviewsCounterTop = document.getElementById("num-comments");
const numReviewsCounterBottom = document.getElementById("num-reviews");
const noReviews = document.getElementById("no-reviews-placeholder");
const avgRating = document.getElementById("avg-rating");
const profilePic = document.getElementById("current-user-profile-pic");

// States
let lastStarClicked = null;
let currentStarClicked = null;
let numStarsRated = 0;

// Gets details pertaining to current logged in user (if logged in)
async function getCurrentUserDetails() {
    const response = await fetch(`/userDetails/me`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    });
    const result = await response.json();
    if (!response.ok) {
        console.log("Failed to load in user details:", result.error)
        return;
    }
    return result;
}

// Gets details pertaining to a specific user given their ID
async function getUserDetails(id) {
    const response = await fetch(`/userDetails/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    });
    const result = await response.json();
    if (!response.ok) {
        console.log("Failed to load in user details:", result.error)
        return;
    }
    return result;
}

async function main() {
    // Check if user is logged in
    try {
        const userResult = await getCurrentUserDetails();
        const { username, avatar } = userResult;

        if (avatar) {
            profilePic.src = avatar;
        }
    } catch {
        // Prevents unregistered users from making any reviews
        userResult = null;
        likeRecipeButton.style.pointerEvents = "None";
        postReviewSection.title = "You need to be signed in before you can post a review!";

        for (const child of postReviewSection.children) {
            child.style.pointerEvents = "None";
            child.title = "You need to be signed in before you can post a review!";
            child.style.cursor = "not-allowed";
        }
        postReviewSection.style.cursor = "not-allowed";

        const ratingContainer = document.getElementsByClassName("rating-container")[0];
        ratingContainer.style.pointerEvents = "None";
    }

    await updateRating();

    function getRecipeIdFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get("id");
    }

    // Initialize number of reviews displayed
    async function fetchReviews(recipeId) {
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

    // Helper Functions
    function removeInitialReviewContainer() {
        noReviews.style.display = "none";
    }

    function addInitialReviewContainer() {
        noReviews.style.display = "flex";
    }

    loadExistingReviewsFromDatabase(getRecipeIdFromURL())

    function updatePostButtonState() {
        const hasReview = reviewToPost.value.trim() !== "";
        postButton.disabled = !(hasReview && numStarsRated > 0);
        postButton.style.cursor = postButton.disabled ? "not-allowed" : "pointer";
    }

    function fillInStars(n) {
        for (let i = 5; i > 0; i--) {
        const starSvg = document.querySelector(`label[for='${i}-star'] svg`);
        starSvg.style.fill = i <= n ? "yellow" : "whitesmoke";
        }
    }

    function updateEditFlag(review) {
        const editFlag = review.querySelector(".edit-flag");
        editFlag.textContent = "(edited)";
    }

    function generateTimeStr(timestamp=null) {
            timestamp = timestamp
            // Creates timestamp when new review is being added
            if (!timestamp) {
                timestamp = Date.now();
            }

            const dateObject = new Date(timestamp)
            const dateStr = `${dateObject.getMonth() + 1}/${dateObject.getDate()}/${dateObject.getFullYear()}`
            const timeStr = dateObject.toLocaleTimeString()
            const cleanedTimeStr = timeStr.replace(/((?:[^:]*:){2})[^:\s][^ ]*/, "$1").replace(/: +/, " ");
            return `${dateStr} ${cleanedTimeStr}`
    }

    function editReview(editButton) {
        const review = editButton.closest(".review");
        const p = review.querySelector(".review-text");
        const div = document.createElement("div");
        const input = document.createElement("input");
        const saveButton = document.createElement("button");
        const cancelButton = document.createElement("button");
        const oldContent = p.textContent;
        div.className = "edit-review";

        input.value = oldContent;
        saveButton.textContent = "Save";
        cancelButton.textContent = "Cancel";

        saveButton.addEventListener(
            "click", async () => {                        
                const newP = document.createElement("p")
                const newContent = input.value;
                newP.className = "review-text";
                newP.textContent = newContent;
                div.replaceWith(newP);

                // Early return if content hasn't changed
                if (oldContent === newContent) {
                    return;
                }

                updateEditFlag(review)

                updatedContent = {
                    content: input.value,
                    edited_flag: true
                }
                await updateReviewInDatabase(review.id, updatedContent);
            }
        );

        cancelButton.addEventListener(
            "click", () => {
                div.replaceWith(p);
            }
        );

        div.append(input, saveButton, cancelButton);
        p.replaceWith(div);
    }

    async function updateRating() {
        const ratingContainer = document.getElementsByClassName("rating-container")[0];
        const result = await fetchReviews(getRecipeIdFromURL());
        const reviews = await result.items || [];

        if (reviews.length === 0) {
            avgRating.textContent = "0.0";
            displayAverageStars(ratingContainer, 0);
            numReviewsCounterTop.textContent = 0;
            numReviewsCounterBottom.textContent = 0;
            addInitialReviewContainer();
            return;
        }

        sum = 0;
        reviews.forEach(
            (review) => {
                sum += parseInt(review.rating)
            }
        )
        const averageRating = (sum / reviews.length).toFixed(1);
        avgRating.textContent = averageRating;

        function displayAverageStars(container, average) {
            const stars = container.querySelectorAll(".fa-star");
            stars.forEach((star, i) => {
                const fillPercent = Math.min(Math.max(average - i, 0), 1) * 100;

                // Apply inline style using a gradient for partial fill
                star.style.background = `linear-gradient(90deg, gold ${fillPercent}%, lightgray ${fillPercent}%)`;
                star.style.webkitBackgroundClip = "text";
                star.style.webkitTextFillColor = "transparent";
            });
        }

        displayAverageStars(ratingContainer, averageRating);

        numReviewsCounterTop.textContent = reviews.length;
        numReviewsCounterBottom.textContent = reviews.length;
    }

    async function loadExistingReviewsFromDatabase(recipeId) {
        try {
            result = await fetchReviews(recipeId)

            const reviews = await result.items || [];

            // If no reviews are available, placeholder remains
            if (reviews.length === 0) {
                return;
            }

            removeInitialReviewContainer();

            reviews.forEach(
                async (review) => {
                    await renderExistingReview(review);
                }
            )

            await updateRating();

        } catch(err) {
            console.error(err);
        }
    }

    async function addReviewToDatabase(reviewData) {
        try {
            const response = await fetch("/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(reviewData)
            })
        
            const result = await response.json();

            if (response.ok) {
                console.log("Review successfully added");
                await updateRating();
            }
            else {
                console.log(result.error)
            }

            return result
        } catch (err) {
            console.error(err);
        }
    }

    async function toggleFeedback(reviewId, isLike) {
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

    async function refreshReviewFeedback(review, numLikesEl, numDislikesEl) {
        const response = await fetch(`/reviews/${review.id}`);
        if (!response.ok) return;

        const updated = await response.json();
        numLikesEl.textContent = updated.num_likes;
        numDislikesEl.textContent = updated.num_dislikes;
    }


    async function removeReviewFromDatabase(review) {
        try {
            const response = await fetch(
                `/reviews/${review.id}`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" }
            });
            result = await response.json();
            if (response.ok) {
                console.log("Review successfully deleted!");
                review.remove();  // Delete from DOM
                await updateRating();
            }
        } catch (error) {
            console.error(error);
        }
    }

    async function updateReviewInDatabase(reviewId, updatedContent) {
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

    async function renderExistingReview(review) {
        const newReview = firstReview.cloneNode(true);
        newReview.style.display = "flex";

        const reviewText = newReview.querySelector(".review-text");
        const timePosted = newReview.querySelector("time");
        const ratingContainer = newReview.querySelector(".rating-container-3");
        const starsPosted = ratingContainer.querySelectorAll("svg");
        const likeButton = newReview.querySelector(".like-button");
        const dislikeButton = newReview.querySelector(".dislike-button");
        const editButton = newReview.querySelector(".edit-button");
        const deleteButton = newReview.querySelector(".delete-button");
        const profilePic = newReview.querySelector(".profile-pic");
        const numLikes = likeButton.parentElement.querySelector(".feedback-number");
        const numDislikes = dislikeButton.parentElement.querySelector(".feedback-number");
        const usernameElement = newReview.querySelector(".username");

        const userId = review.user_id;
        reviewCreator = await getUserDetails(userId);
        const username = reviewCreator.username;
        const avatar = reviewCreator.avatar;
        usernameElement.textContent = `@${username}`;
        if (avatar) {
            profilePic.src = avatar;
        }

        // Fill in content from database
        reviewText.textContent = review.content;
        numLikes.textContent = review.num_likes || 0;
        numDislikes.textContent = review.num_dislikes || 0;
        timePosted.textContent = generateTimeStr(review.created_at);


        // Fill in stars
        for (let i = 0; i < 5; i++) {
            const star = starsPosted[i];
            star.setAttribute("fill", i < review.rating ? "yellow" : "whitesmoke");
        }

        if (review.edited_flag) {
            updateEditFlag(newReview);
        }

        likeButton.addEventListener("click", async () => {
            const isLiked = likeButton.classList.contains("liked");
            const isDisliked = dislikeButton.classList.contains("disliked");

            // tell backend first
            const success = await toggleFeedback(review.id, true);
            if (!success) return;

            // visual update on success
            if (isLiked) {
                likeButton.classList.remove("liked");
                likeButton.querySelector("svg").setAttribute("stroke", "black");
            } else {
                likeButton.classList.add("liked");
                likeButton.querySelector("svg").setAttribute("stroke", "skyblue");
                if (isDisliked) {
                    dislikeButton.classList.remove("disliked");
                    dislikeButton.querySelector("svg").setAttribute("stroke", "black");
                }
            }

            await refreshReviewFeedback(review, numLikes, numDislikes);
        });

        dislikeButton.addEventListener("click", async () => {
            const isDisliked = dislikeButton.classList.contains("disliked");
            const isLiked = likeButton.classList.contains("liked");

            const success = await toggleFeedback(review.id, false);
            if (!success) return;

            if (isDisliked) {
                dislikeButton.classList.remove("disliked");
                dislikeButton.querySelector("svg").setAttribute("stroke", "black");
            } else {
                dislikeButton.classList.add("disliked");
                dislikeButton.querySelector("svg").setAttribute("stroke", "red");
                if (isLiked) {
                    likeButton.classList.remove("liked");
                    likeButton.querySelector("svg").setAttribute("stroke", "black");
                }
            }

            await refreshReviewFeedback(review, numLikes, numDislikes);
        });

        // Attach ID of review to element for purposes of updating/deletion later
        newReview.id = review.id;

        try {
            const userResult = await getCurrentUserDetails();
            const { id } = userResult;
            // Limits editing/deleting reviews to user's personal reviews
            if (userId === id) {
                newReview.addEventListener(
                "mouseenter", () => {
                    const deleteAndEditButtons = newReview.querySelector(".review-buttons");
                    deleteAndEditButtons.style.display = "flex";
                    }
                );
                newReview.addEventListener(
                    "mouseleave", () => {
                        const deleteAndEditButtons = newReview.querySelector(".review-buttons");
                        deleteAndEditButtons.style.display = "none";
                    }
                );
                editButton.addEventListener(
                    "click", async () => {
                        editReview(editButton);
                    }
                );
                deleteButton.addEventListener(
                    "click", async () => {
                        await removeReviewFromDatabase(newReview);
                    }
                );
            }
        } catch (err) {
            console.log(err);
            newReview.style.pointerEvents = "None";
        }

        // Append to DOM
        reviewsSection.appendChild(newReview);
    }


    async function addNewReview() {
        // DOM Elements for Review
        const newReview = firstReview.cloneNode(true);
        const reviewText = newReview.querySelector(".review-text");
        const timePosted = newReview.querySelector("time");
        const ratingContainer = newReview.querySelector(".rating-container-3");
        const starsPosted = ratingContainer.querySelectorAll("svg");
        const likeButton = newReview.querySelector(".like-button");
        const dislikeButton = newReview.querySelector(".dislike-button");
        const editButton = newReview.querySelector(".edit-button");
        const deleteButton = newReview.querySelector(".delete-button");
        const usernameElement = newReview.querySelector(".username");
        const avatarImg = newReview.querySelector(".profile-pic");
        // For managing review likes/dislikes/stars
        const likeSvg = likeButton.querySelector("svg");
        const dislikeSvg = dislikeButton.querySelector("svg");
        const numLikes = likeButton.parentElement.querySelector(".feedback-number");
        const numDislikes = dislikeButton.parentElement.querySelector(".feedback-number")
        const numStars = Number(currentStarClicked);

        const userResult = await getCurrentUserDetails();

        if (!userResult) {
            return;
        }
        
        const { id, username, avatar } = userResult;

        removeInitialReviewContainer()
        newReview.style.display = "flex";

        timePosted.textContent = generateTimeStr();
        reviewText.textContent = reviewToPost.value;
        reviewToPost.value = "";

        usernameElement.textContent = `@${username}`;
        if (avatar) {
            avatarImg.src = avatar;
        }

        for (let i = 0; i < 5; i++) {
            const star = starsPosted[i];
            star.setAttribute("fill", i < numStarsRated ? "yellow" : "whitesmoke");
        }

        const reviewData = {
            recipe_id: getRecipeIdFromURL(),
            user_id: id,
            rating: Number(numStars),
            content: reviewText.textContent,
            num_likes: Number(numLikes.textContent),
            num_dislikes: Number(numDislikes.textContent),
        }

        result = await addReviewToDatabase(reviewData);
        console.log("Result after adding review to Database:", result);
        
        if (result.error) {
            return;
        }

        reviewsSection.append(newReview);

        // Reset state
        fillInStars(0);
        numStarsRated = 0;
        currentStarClicked = null;
        lastStarClicked = null;
        updatePostButtonState();

        likeButton.addEventListener("click", async () => {
            const isLiked = likeButton.classList.contains("liked");
            const isDisliked = dislikeButton.classList.contains("disliked");

            const success = await toggleFeedback(newReview.id, true);
            if (!success) return; // stop if server rejected the action

            // toggle visual state only on success
            if (isLiked) {
                likeButton.classList.remove("liked");
                likeSvg.setAttribute("stroke", "black");
            } else {
                likeButton.classList.add("liked");
                likeSvg.setAttribute("stroke", "skyblue");
                if (isDisliked) {
                    dislikeButton.classList.remove("disliked");
                    dislikeSvg.setAttribute("stroke", "black");
                }
            }

            await refreshReviewFeedback(newReview, numLikes, numDislikes);
        });

        dislikeButton.addEventListener("click", async () => {
            const isDisliked = dislikeButton.classList.contains("disliked");
            const isLiked = likeButton.classList.contains("liked");

            const success = await toggleFeedback(newReview.id, false);
            if (!success) return;

            if (isDisliked) {
                dislikeButton.classList.remove("disliked");
                dislikeSvg.setAttribute("stroke", "black");
            } else {
                dislikeButton.classList.add("disliked");
                dislikeSvg.setAttribute("stroke", "red");
                if (isLiked) {
                    likeButton.classList.remove("liked");
                    likeSvg.setAttribute("stroke", "black");
                }
            }

            await refreshReviewFeedback(newReview, numLikes, numDislikes);
        });


        const reviewId = result.review.id;
        newReview.id = reviewId;
        
        newReview.addEventListener(
            "mouseenter", () => {
                const deleteAndEditButtons = newReview.querySelector(".review-buttons");
                deleteAndEditButtons.style.display = "flex";
            }
        );
        newReview.addEventListener(
            "mouseleave", () => {
                const deleteAndEditButtons = newReview.querySelector(".review-buttons");
                deleteAndEditButtons.style.display = "none";
            }
        );
        editButton.addEventListener(
            "click", async () => {
                editReview(editButton);
            }
        );
        deleteButton.addEventListener(
            "click", async () => {
                await removeReviewFromDatabase(newReview);
            }
        );
    }

    // Event Listeners

    reviewToPost.addEventListener("input", updatePostButtonState);
    postButton.addEventListener("click", addNewReview);

    const starLabels = document.querySelectorAll("label[for$='-star']");

    starLabels.forEach((label) => {
        const forAttr = label.getAttribute("for"); // e.g., "3-star"
        const starValue = parseInt(forAttr.split("-")[0]);
        const starInput = document.getElementById(forAttr); // associated input

        // Hover preview
        label.addEventListener("mouseover", () => {
        fillInStars(starValue);
        });

        // Restore previous selection on hover out
        label.addEventListener("mouseout", () => {
        fillInStars(currentStarClicked || 0);
        });

        // Deselect on double-click
        starInput.addEventListener("click", () => {
            if (currentStarClicked === starValue) {
                // Deselect if same star clicked again
                starInput.checked = false;
                currentStarClicked = null;
                lastStarClicked = null;
                numStarsRated = 0;
                fillInStars(0);
            } else {
                // Select new star
                lastStarClicked = currentStarClicked;
                currentStarClicked = starValue;
                numStarsRated = starValue;
                fillInStars(numStarsRated);
            }
            updatePostButtonState();
            });
    });
}

main();
