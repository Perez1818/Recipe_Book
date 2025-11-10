
// 
export async function fetchCollections() {
    const response = await fetch(`/collections/`);
    if (!response.ok) {
        throw "Error occurred fetching data!";
    }
    const result = await response.json();
    console.log(result)
    return result;
}

// 
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
        console.error(err);
        return null
    }
}

// 
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

// 
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

// 
export async function removeRecipeFromCollection(collectionId, recipeId) {
    try {
        const response = await fetch(
            `/${collectionId}/recipes/${recipeId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" }
        });
        result = await response.json();
        if (response.ok) {
            console.log("Recipe successfully deleted from collection!");
        }
    } catch (error) {
        console.error(error);
    }
}
