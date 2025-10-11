
// DOM Elements
const reviewToPost = document.getElementById("review-to-post");
const starRatings = document.querySelectorAll("input[name='stars']");
const starSvgs = document.querySelectorAll("label svg");
const postButton = document.getElementById("post-button");
const firstReview = document.getElementsByClassName("review")[0];
const reviewsSection = document.getElementById("reviews-section");
const numReviewsCounter = document.getElementById("num-reviews");
const noReviews = document.getElementById("no-reviews-placeholder");

// States
let lastStarClicked = null;
let currentStarClicked = null;
let numStarsRated = 0;

// Initialize number of reviews displayed
numReviewsCounter.textContent = reviewsSection.querySelectorAll(".review").length - 1;

function main() {

    // Helper Functions
    function removeInitialReviewContainer() {
        numReviews = parseInt(numReviewsCounter.textContent);
        console.log(numReviews);
        if (numReviews != 0) {
            noReviews.remove()
        }
    }

    function updatePostButtonState() {
        const hasReview = reviewToPost.value.trim() !== "";
        postButton.disabled = !(hasReview && numStarsRated > 0);
        postButton.style.cursor = postButton.disabled ? "not-allowed" : "pointer";
        removeInitialReviewContainer();
    }

    function fillInStars(n) {
        for (let i = 5; i > 0; i--) {
        const starSvg = document.querySelector(`label[for='${i}-star'] svg`);
        starSvg.style.fill = i <= n ? "yellow" : "whitesmoke";
        }
    }

    function addnewReview() {
        // DOM Elements for Review
        const newReview = firstReview.cloneNode(true);
        const reviewText = newReview.querySelector(".review-text");
        const timePosted = newReview.querySelector("time");
        const ratingContainer = newReview.querySelector(".rating-container-3");
        const starsPosted = ratingContainer.querySelectorAll("svg");
        const likeButton = newReview.querySelector(".like-button");
        const dislikeButton = newReview.querySelector(".dislike-button");
        // For managing review likes/dislikes
        const likeSvg = likeButton.querySelector("svg");
        const dislikeSvg = dislikeButton.querySelector("svg");
        const numLikes = likeButton.parentElement.querySelector(".feedback-number");
        const numDislikes = dislikeButton.parentElement.querySelector(".feedback-number")

        removeInitialReviewContainer()
        newReview.style.display = "flex";

        function generateTimeStr() {
            const timestamp = Date.now();
            timePosted.datetime = timestamp;
            const dateObject = new Date(timestamp)
            console.log(dateObject.getDay())
            const dateStr = `${dateObject.getMonth() + 1}/${dateObject.getDate()}/${dateObject.getFullYear()}`
            const timeStr = dateObject.toLocaleTimeString()
            const cleanedTimeStr = timeStr.replace(/((?:[^:]*:){2})[^:\s][^ ]*/, "$1").replace(/: +/, " ");
            return `${dateStr} ${cleanedTimeStr}`
        }

        timePosted.textContent = generateTimeStr();
        reviewText.textContent = reviewToPost.value;
        reviewToPost.value = "";

        for (let i = 0; i < 5; i++) {
            const star = starsPosted[i];
            star.setAttribute("fill", i < numStarsRated ? "yellow" : "whitesmoke");
        }

        reviewsSection.append(newReview);
        numReviewsCounter.textContent = parseInt(numReviewsCounter.textContent) + 1;

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
                    likeSvg.setAttribute("stroke", "green");
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

    }

    // Event Listeners

    reviewToPost.addEventListener("input", updatePostButtonState);
    postButton.addEventListener("click", addnewReview);

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
