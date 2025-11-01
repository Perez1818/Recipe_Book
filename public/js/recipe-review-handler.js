
// DOM Elements
const reviewToPost = document.getElementById("review-to-post");
const starRatings = document.querySelectorAll("input[name='stars']");
const starSvgs = document.querySelectorAll("label svg");
const postButton = document.getElementById("post-button");
const firstReview = document.getElementsByClassName("review")[0];
const reviewsSection = document.getElementById("reviews-section");
const numReviewsCounterTop = document.getElementById("num-comments");
const numReviewsCounterBottom = document.getElementById("num-reviews");
const noReviews = document.getElementById("no-reviews-placeholder");
const avgRating = document.getElementById("avg-rating");

// States
let lastStarClicked = null;
let currentStarClicked = null;
let numStarsRated = 0;


async function main() {

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
    result = await fetchReviews(getRecipeIdFromURL())
    console.log(result)

    // Helper Functions
    function removeInitialReviewContainer() {
        noReviews.remove()
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

    function updateRating(reviews) {
        if (reviews.length === 0) {
            avgRating.textContent = "0.0";
            displayAverageStars(ratingContainer, 0);
            numReviewsCounterTop.textContent = 0;
            numReviewsCounterBottom.textContent = 0;
            return;
        }

        sum = 0;
        reviews.forEach(
            (review) => {
                sum += parseInt(review.rating)
            }
        )
        averageRating = (sum / reviews.length).toFixed(1);
        avgRating.textContent = averageRating;
        ratingContainer = document.getElementsByClassName("rating-container")[0];

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
                (review) => {
                    renderExistingReview(review);
                }
            )

            updateRating(reviews)

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
                const resultReviews = await fetchReviews(getRecipeIdFromURL());
                const reviews = resultReviews.items || [];
                updateRating(reviews)
            }
            else {
                console.log(result.error)
            }

            return result
        } catch (err) {
            console.error(err);
        }
    }

    async function removeReviewFromDatabase(review) {
        try {
            const response = await fetch(
                `/reviews/${review.id}`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" }
            });
            result = await response.json();
            if (result.ok) {
                console.log("Review successfully deleted!")
                const resultReviews = await fetchReviews(getRecipeIdFromURL());
                const reviews = resultReviews.items || [];
                updateRating(reviews)
            }
        } catch (error) {
            console.error(error)
        }

        // Delete from DOM
        review.remove();

        numReviewsCounterTop.textContent = parseInt(numReviewsCounterTop.textContent) - 1;
        numReviewsCounterBottom.textContent = parseInt(numReviewsCounterBottom.textContent) - 1;
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

    function renderExistingReview(review) {
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
        const numLikes = likeButton.parentElement.querySelector(".feedback-number");
        const numDislikes = dislikeButton.parentElement.querySelector(".feedback-number");

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

        // Reattach like listeners
        likeButton.addEventListener("click", async () => {
            const isLiked = likeButton.classList.contains("liked");
            const isDisliked = dislikeButton.classList.contains("disliked");
            numLikesInt = parseInt(numLikes.textContent);
            numDislikesInt = parseInt(numDislikes.textContent);

            // Already previously liked, so like is removed
            if (isLiked) {
                likeButton.classList.remove("liked");
                likeButton.querySelector("svg").setAttribute("stroke", "black");
                numLikes.textContent = numLikesInt - 1;
                review.num_likes = numLikesInt - 1;
            } else {
                // Adds like
                likeButton.classList.add("liked");
                likeButton.querySelector("svg").setAttribute("stroke", "skyblue");
                numLikes.textContent = numLikesInt + 1;
                review.num_likes = numLikesInt + 1;
                
                // Previously disliked, removes dislike
                if (isDisliked) {
                    dislikeButton.classList.remove("disliked");
                    dislikeButton.querySelector("svg").setAttribute("stroke", "black");
                    numDislikes.textContent = Math.max(0, numDislikesInt - 1);
                    review.num_dislikes = numDislikesInt - 1;
                }
            }
            updatedContent = {
                num_likes: review.num_likes,
                num_dislikes: review.num_dislikes
            }
            await updateReviewInDatabase(review.id, updatedContent);
        });

        // Reattach dislike listeners
        dislikeButton.addEventListener("click", async () => {
            const isDisliked = dislikeButton.classList.contains("disliked");
            const isLiked = likeButton.classList.contains("liked");
            numLikesInt = parseInt(numLikes.textContent);
            numDislikesInt = parseInt(numDislikes.textContent);

            // Already previously disliked, removes dislike
            if (isDisliked) {
                dislikeButton.classList.remove("disliked");
                dislikeButton.querySelector("svg").setAttribute("stroke", "black");
                numDislikes.textContent = parseInt(numDislikes.textContent) - 1;
                numDislikes.textContent = numDislikes - 1;
                review.num_dislikes = numDislikesInt - 1;
            } else {
                // Adds dislike
                dislikeButton.classList.add("disliked");
                dislikeButton.querySelector("svg").setAttribute("stroke", "red");
                numDislikes.textContent = parseInt(numDislikes.textContent) + 1;
                numDislikes.textContent = numDislikesInt + 1;
                review.num_dislikes = numDislikesInt + 1;

                // Previously liked, removes like
                if (isLiked) {
                    likeButton.classList.remove("liked");
                    likeButton.querySelector("svg").setAttribute("stroke", "black");
                    numLikes.textContent = Math.max(0, numDislikesInt - 1);
                    review.num_likes = numLikesInt - 1;
                }
            }
            updatedContent = {
                num_likes: review.num_likes,
                num_dislikes: review.num_dislikes
            }
            await updateReviewInDatabase(review.id, updatedContent);
        });

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

        // Attach ID of review to element for purposes of updating/deletion later
        newReview.id = review.id;

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
        // For managing review likes/dislikes/stars
        const likeSvg = likeButton.querySelector("svg");
        const dislikeSvg = dislikeButton.querySelector("svg");
        const numLikes = likeButton.parentElement.querySelector(".feedback-number");
        const numDislikes = dislikeButton.parentElement.querySelector(".feedback-number")
        const numStars = Number(currentStarClicked);

        removeInitialReviewContainer()
        newReview.style.display = "flex";

        timePosted.textContent = generateTimeStr();
        reviewText.textContent = reviewToPost.value;
        reviewToPost.value = "";

        for (let i = 0; i < 5; i++) {
            const star = starsPosted[i];
            star.setAttribute("fill", i < numStarsRated ? "yellow" : "whitesmoke");
        }

        reviewsSection.append(newReview);
        numReviewsCounterTop.textContent = parseInt(numReviewsCounterTop.textContent) + 1;
        numReviewsCounterBottom.textContent = parseInt(numReviewsCounterBottom.textContent) + 1;

        // Reset state
        fillInStars(0);
        numStarsRated = 0;
        currentStarClicked = null;
        lastStarClicked = null;
        updatePostButtonState();

        likeButton.addEventListener(
            "click", () => {
                const isLiked = likeButton.classList.contains("liked");
                const isDisliked = dislikeButton.classList.contains("disliked");

                // Toggle off like
                if (isLiked) {
                    likeButton.classList.remove("liked");
                    likeSvg.setAttribute("stroke", "black");
                    numLikes.textContent = parseInt(numLikes.textContent) - 1;
                // Toggle on like
                } else {
                    likeButton.classList.add("liked");
                    likeSvg.setAttribute("stroke", "skyblue");
                    numLikes.textContent = parseInt(numLikes.textContent) + 1;
                    // Remove dislike if it was active
                    if (isDisliked) {
                        dislikeButton.classList.remove("disliked");
                        dislikeSvg.setAttribute("stroke", "black");
                        numDislikes.textContent = Math.max(0, parseInt(numDislikes.textContent) - 1);
                    }
                }
            }
        );

        dislikeButton.addEventListener(
            "click", () => {
                const isDisliked = dislikeButton.classList.contains("disliked");
                const isLiked = likeButton.classList.contains("liked");

                // Toggle off dislike
                if (isDisliked) {
                    dislikeButton.classList.remove("disliked");
                    dislikeSvg.setAttribute("stroke", "black");
                    numDislikes.textContent = parseInt(numDislikes.textContent) - 1;
                // Toggle on dislike
                } else {
                    dislikeButton.classList.add("disliked");
                    dislikeSvg.setAttribute("stroke", "red");
                    numDislikes.textContent = parseInt(numDislikes.textContent) + 1;
                    // Remove like if it was active
                    if (isLiked) {
                        likeButton.classList.remove("liked");
                        likeSvg.setAttribute("stroke", "black");
                        numLikes.textContent = Math.max(0, parseInt(numLikes.textContent) - 1);
                    }
                }
            }
        );

        const reviewData = {
            recipe_id: getRecipeIdFromURL(),
            user_id: 1,
            rating: Number(numStars),
            content: reviewText.textContent,
            num_likes: Number(numLikes.textContent),
            num_dislikes: Number(numDislikes.textContent),
            created_at: generateTimeStr()
        }

        result = await addReviewToDatabase(reviewData);
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
