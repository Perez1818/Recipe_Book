require("dotenv").config();
const { Client } = require("pg");

const client = new Client({
    connectionString: process.env.DATABASE_CONNECTION_STRING,
});

const readline = require('node:readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function ask(question){
    return new Promise(resolve => rl.question(question, answer => resolve(answer)));
}

async function addRecipe(){
    const name = await ask("Enter a recipe name: ");
    const description = await ask("Enter a description: ");
    const ingredients = await ask("Enter ingredients (seperated by a comma): ");
    const cook_time = await ask("Enter cook time (separate hour and minute by a colon): ");
    const tags = await ask("Enter tags associated with this food item (seperated by a comma): ");

    const ingredients_list = ingredients.split(",").map(s => s.trim().toLowerCase());
    const tags_list = tags.split(",").map(s => s.trim().toLowerCase());

    await client.query(`CREATE TABLE IF NOT EXISTS RECIPES(
        ID SERIAL PRIMARY KEY,
        NAME TEXT,
        DESCRIPTION TEXT,
        INGREDIENTS TEXT[],
        COOK_TIME TEXT,
        TAGS TEXT[]
    )`);

    const recipe = 
    {
        name,
        description,
        ingredients_list,
        cook_time,
        tags_list
    };

    await client.query(
        `INSERT INTO RECIPES (NAME, DESCRIPTION, INGREDIENTS, COOK_TIME, TAGS) 
        VALUES ($1, $2, $3, $4, $5)`,
        [
            recipe.name,
            recipe.description,
            recipe.ingredients_list,
            recipe.cook_time,
            recipe.tags_list
        ]
    );

    return recipe
}

async function viewingRecipes(){
    const response = await client.query("SELECT * FROM RECIPES");
    console.log(`${response.rows.length} Recipe(s) found:`, response.rows);
}

async function searchRecipes() {
    console.log("1. General (searches all fields)");
    console.log("2. Name");
    console.log("3. Description");
    console.log("4. Ingredients");
    console.log("5. Cook Time");
    console.log("6. Tags List");
    console.log("7. Quit");
    
    let choice = await ask("Select the field that you want to query by (1-7): ");
    let matching_recipes = [];

    while (choice !== '') {
        if (choice == '1') {
            // General search across multiple fields
            let recipe_features = await ask("Enter a keyword associated with the recipe you want to search for: ");
            let recipe_feature_lst = recipe_features.split(" ").map(s => s.trim().toLowerCase());

            matching_recipes = (
                await client.query("SELECT * FROM RECIPES")).rows.filter(recipe =>
                recipe_feature_lst.some(feature =>
                    recipe.name?.toLowerCase().includes(feature) ||
                    recipe.description?.toLowerCase().includes(feature) ||
                    (recipe.ingredients || []).some(ingr => ingr.toLowerCase().includes(feature)) ||
                    recipe.cook_time?.toLowerCase().includes(feature) ||
                    (recipe.tags || []).some(tag => tag.toLowerCase().includes(feature))
                )
            );
            break;
        } else if (choice === '2') {
            // Search by name
            let recipe_name = await ask("Enter a keyword associated with the name of the recipe you want to search for: ");
            matching_recipes = (
                await client.query("SELECT * FROM RECIPES"))
                    .rows.filter(recipe =>
                        recipe.name?.toLowerCase().includes(recipe_name.toLowerCase())
            );
            break;
        } else if (choice == '3') {
            // Search by description
            let recipe_description = await ask("Enter a keyword associated with the recipe you want to search for: ");
            let recipe_description_keywords = recipe_description.split(" ").map(s => s.trim().toLowerCase());
            matching_recipes = (
                await client.query("SELECT * FROM RECIPES"))
                    .rows.filter(recipe =>
                        recipe.description?.toLowerCase().includes(recipe_description_keywords)
            );
            break;
        } else if (choice == '4') {
            // Search by ingredients
            let recipe_ingredients = await ask("Enter the ingredients associated with the recipe you want to search for (Ex: ingred1, ingred2,...): ");
            let recipe_ingredients_lst = recipe_ingredients.split(",").map(s => s.trim().toLowerCase());
            matching_recipes = (
                await client.query("SELECT * FROM RECIPES"))
                    .rows.filter(recipe =>
                        recipe_ingredients_lst.some(feature =>
                        (recipe.ingredients || []).some(ingr => ingr.toLowerCase().includes(feature))
                )
            );
            break;
        } else if (choice == '5') {
            // Search by cooking time
            let recipe_cooking_time = await ask("Enter a keyword associated with the recipe you want to search for (HH:MM): ");
            matching_recipes = (
                await client.query("SELECT * FROM RECIPES"))
                    .rows.filter(recipe =>
                        recipe.cook_time?.includes(recipe_cooking_time)
            );
            break;
        } else if (choice == '6') {
            // Search by tags
            let recipe_tags = await ask("Enter a keyword associated with the recipe you want to search for: ");
            let recipe_tag_lst = recipe_tags.split(" ").map(s => s.trim().toLowerCase());

            matching_recipes = (await client.query("SELECT * FROM RECIPES")).rows.filter(recipe =>
                recipe_tag_lst.some(feature =>
                    (recipe.tags || []).some(tag => tag.toLowerCase().includes(feature))
                )
            );
            break;
        } else if (choice == '7') {
            // Quit the loop
            console.log("Quitting...");
            return;
        } else {
            console.log("Invalid choice. Please enter a number between 1-7.");
            choice = await ask("Select the field that you want to query by (1-7): ");
        }
    }
    // Display the results after the search
    console.log(`Found ${matching_recipes.length} Recipe(s):`, matching_recipes);
    return matching_recipes;
}

async function updateRecipe(){
    const selected_recipes = await searchRecipes();

    // Check to prevent crash
    if (!selected_recipes){
        return;
    }
    // Multiple Recipes were returned, but we should only delete one...
    else if (selected_recipes.length !== 1) {
        console.log("Please select exactly one recipe!");
        return;
    }
    
    const selected_recipe = selected_recipes[0];

    console.log("How do you wish to update your recipe?");
    console.log("1. Name");
    console.log("2. Description");
    console.log("3. Ingredients");
    console.log("4. Cook Time");
    console.log("5. Tags");
    console.log("6. Quit")

    let choice = "";

    while (choice !== 6){
        const choice = await ask("\nChoose a number 1-5: ");
        switch (choice) {
            case '1':
                console.log("Old Name:", selected_recipe.name);
                const updated_name = await ask("Updated Name: ");
                await client.query(
                    `UPDATE RECIPES
                    SET NAME = $1
                    WHERE ID = $2`,
                    [
                        updated_name,
                        selected_recipe.id
                    ]
                );
                break;
            case '2':
                console.log("Old Description:", selected_recipe.description);
                const updated_description = await ask("Updated Description: ");
                await client.query(
                    `UPDATE RECIPES
                    SET DESCRIPTION = $1
                    WHERE ID = $2`,
                    [
                        updated_description,
                        selected_recipe.id
                    ]
                );
                break;
            case '3':
                console.log("Old List of Ingredients:", selected_recipe.ingredients_list);
                const updated_ingredients = await ask("Updated List of Ingredients: ");
                const updated_ingredients_list = updated_ingredients.split(",").map(s => s.trim());
                await client.query(
                    `UPDATE RECIPES
                    SET INGREDIENTS = $1
                    WHERE ID = $2`,
                    [
                        updated_ingredients_list,
                        selected_recipe.id
                    ]
                );
                break;
            case '4':
                console.log("Old Cook Time:", selected_recipe.cook_time);
                const updated_cook_time = await ask("Updated Description: ");
                await client.query(
                    `UPDATE RECIPES
                    SET COOK_TIME = $1
                    WHERE ID = $2`,
                    [
                        updated_cook_time,
                        selected_recipe.id
                    ]
                );
                break;
            case '5':
                console.log("Old Tags:", selected_recipe.tags);
                const updated_tags = await ask("Updated Tags (seperated by a comma): ");
                const updated_tags_list = updated_tags.split(",").map(s => s.trim());
                await client.query(
                    `UPDATE RECIPES
                    SET TAGS = $1
                    WHERE ID = $2`,
                    [
                        updated_tags_list,
                        selected_recipe.id
                    ]
                );
                break;
            case '6':
                console.log("Quiting...");
                return
            default:
                console.log("Invalid input! Try numbers 1-6.");
                break;
        }
    }
}

async function deleteRecipe(){
    let selected_recipes = await searchRecipes();

    // Check to prevent crash
    if (!selected_recipes){
        return;
    }
    // Multiple Recipes were returned, but we should only delete one...
    else if (selected_recipes.length !== 1) {
        console.log("Please select exactly one recipe!");
        return;
    }

    selected_recipe = selected_recipes[0];

    while (true){
        confirmation = await ask(`Do you confirm that you want to delete ${selected_recipe.name}
            from the database (Y/N)? `)
        if (["y", "yes"].includes(confirmation.toLowerCase())){
            await client.query(
                `DELETE FROM RECIPES
                WHERE ID = $1`,
                [
                    selected_recipe.id
                ]
            );
            return;
        }
        else if (["n", "no"].includes(confirmation.toLowerCase())){
            return;
        }
        else {
            console.log("Invalid input. Try inputting 'yes' or 'no.'");
        }
    }
}


async function main() { 
    await client.connect();

    let choice = '';

    while (choice !== "5"){

        console.log("\n***** Recipe Book *****");
        console.log("1. Add recipe");
        console.log("2. View all recipes");
        console.log("3. Update a recipe");
        console.log("4. Delete a recipe");
        console.log("5. Exit");

        const choice = await ask("Choose a number 1-5: ");

        switch (choice) {
            case '1':
                console.log("Adding a recipe...");
                await addRecipe();
                break;
            case '2':
                console.log("Fetching recipes...");
                await viewingRecipes();
                break;
            case '3':
                console.log("Updating a recipe...");
                await updateRecipe();
                break;
            case '4':
                console.log("Deleting a recipe...");
                await deleteRecipe();
                break;
            case '5':
                console.log("Exiting...");
                rl.close();
                process.exit(0);
            default:
                console.log("Invalid input. Please input numbers 1-5.");
                break;
        }

    }
    rl.close();
    await client.end();
}

main().catch(console.error);