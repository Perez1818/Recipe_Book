
// Retrieves all of a user's collections
export async function fetchCollections() {
    const response = await fetch(`/collections/`);
    if (!response.ok) {
        throw "Error occurred fetching data!";
    }
    const result = await response.json();
    return result;
}

// Retrieves a user's collection by name
export async function getCollectionByName(collectionName) {
    try {
        const response = await fetch(`/collections/name/${collectionName}`);
        const result = await response.json();
        if (response.ok) {
            console.log(`The collection ${collectionName} was found: ${result}`);
        }
        else {
            throw new Error(result.error);
        }
        return result;
    } catch (err) {
        return null
    }
}

// Creates a collection for current registered user
export async function createCollection(collectionName, recipeIds=[]) {
    try {
        const response = await fetch(`/collections`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include", // <-- important if using cookies/session
                body: JSON.stringify({
                    collectionName: collectionName,
                    recipeIds: recipeIds
                })
            }
        );
        const result = await response.json();
        if (response.ok) {
            console.log("Collection successfully created.");
        }
        else {
            throw new Error(result.error);
        }
        console.log(result, result.collection.id)
        return result.collection.id
    } catch (err) {
        console.error(err);
        return null
    }
}

// Adds recipe to registered user's bookmarks
export async function addRecipeToBookmarks(collectionId, recipeId) {
    try {
        const response = await fetch(`/collections/${collectionId}/recipes/${recipeId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });
    
        const result = await response.json();

        if (response.ok) {
            console.log("Recipe successfully added to Bookmark");
        }
        else {
            throw new Error(result.error)
        }
        return result
    } catch (err) {
        console.error(err);
    }
}

// Removes a given recipe from a specific collection
export async function removeRecipeFromCollection(collectionId, recipeId) {
    try {
        const response = await fetch(
            `/collections/${collectionId}/recipes/${recipeId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" }
        });
        const result = await response.json();
        if (response.ok) {
            console.log("Recipe successfully deleted from collection!");
        }
        else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error(error);
    }
}

// Deletes a user's personal collection
export async function deleteCollectionById(id) {
  const res = await fetch(`/collections/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete collection");
  return await res.json();
}

