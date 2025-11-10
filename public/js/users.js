// Gets details pertaining to current logged in user (if logged in)
export async function getCurrentUserDetails() {
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

// Writes "username" to recipe container
export async function getUsername(userId) {
    const response = await fetch(`/userDetails/${userId}`);
    if (!response.ok) {
        throw "Error occurred fetching data!";
    }
    const result = await response.json();
    const username = result.username;
    return username;
}

// Gets details pertaining to a specific user given their ID
export async function getUserDetails(id) {
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
