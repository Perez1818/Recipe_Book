<div align="center">
    <h1>Recipe Book</h1>
    <img src="./public/img/recipe-book-hero.drawio.svg">
    <p>A Webapp for Sharing Recipes</p>
</div>

<details>
    <summary>Table of Contents</summary>
    <ol>
        <li>
            <a href="#about-the-project">About the Project</a>
            <ul>
                <li>
                    <a href="#built-with">Built With</a>
                </li>
            </ul>
        </li>
        <li>
            <a href="#features">Features</a>
        </li>
        <li>
            <a href="#getting-started">Getting Started</a>
            <ul>
                <li>
                    <a href="#prerequisites">Prerequisites</a>
                </li>
                <li>
                    <a href="#installation">Installation</a>
                </li>
                <li>
                    <a href="#database-setup">Database Setup</a>
                </li>
                <li>
                    <a href="#environment-configuration">Environment Configuration</a>
                </li>
                <li>
                    <a href="#testing">Testing</a>
                </li>
                <li>
                    <a href="#running-the-application">Running the Application</a>
                </li>
            </ul>
        </li>
        <li>
            <a href="#contributors">Contributors</a>
        </li>
        <li>
            <a href="#attributions">Attributions</a>
        </li>
    </ol>
</details>

## About the Project

***Recipe Book*** is a full-stack social networking platform for sharing recipes and was developed as a senior capstone project. The application allows users to create and publish recipes, discover new dishes, interact with other community members, participate in recipe challenges, manage personal collections, and organize meals through planning and shopping-list features.

### Built With

#### Programming Languages
- [![JavaScript][JavaScript-icon]][JavaScript-url]
- [![HTML][HTML-icon]][HTML-url]
- [![CSS][CSS-icon]][CSS-url]
- [![EJS][EJS-icon]][EJS-url]

#### Databases
- [![Postgres][Postgres-icon]][Postgres-url]

#### Frameworks
- [![Node.js][Node.js-icon]][Node.js-url]
- [![Express.js][Express.js-icon]][Express.js-url]

#### External API Integrations

- [![Google-Translate-API][Google-Translate-API-icon]][Google-Translate-API-url]
    - Translation support for recipe content and user interactions
- [![TheMealDB][TheMealDB-icon]][TheMealDB-url]
    - Provides recipe search functionality, homepage recipe population, and fallback content when user-created recipes are unavailable.
- [![Spoonacular][Spoonacular-icon]][Spoonacular-url]
    - Provides automatic shopping list generation, ingredient aggregation, and online ingredient purchasing support.


 ## Features

<ul>
    <details>
        <summary>Account Creation & Authentication</summary>
        <ul>
            <li>Users can register new accounts, log in securely, and maintain a personalized profile.</li>
        </ul>
    </details>
    <details>
        <summary>Recipe Discovery Homepage</summary>
        <ul>
            <li>The homepage displays curated collections of recipes from a variety of cultural cuisines, ensuring content is always available through API integration even when user-generated content is limited.</li>
        </ul>
    </details>
    <details>
        <summary>Recipe & Challenge Creation</summary>
        <ul>
            <li>Users can create, edit, and publish recipes as well as community challenges for other users to participate in.</li>
        </ul>
    </details>
    <details>
        <summary>Bookmarks & Collections</summary>
        <ul>
            <li>Users can bookmark recipes and organize them into personal collections for future reference.</li>
        </ul>
    </details>
    <details>
        <summary>Interactive Recipe Walkthrough</summary>
        <ul>
            <li>Each recipe includes:</p>
        <ul>
            <li>Step-by-step cooking instructions</li>
            <li>Ingredient measurement conversion</li>
            <li>Built-in timers for cooking steps</li>
            <li>Community tips and comments tied to individual recipe steps</li>
        </ul>
    </details>
    <details>
        <summary>Ratings & Reviews</summary>
        <ul>
            <li>Users can rate recipes, leave reviews, and engage with feedback from other community members.</li>
        </ul>
    </details>
    <details>
        <summary>Meal Planning Calendar</summary>
        <ul>
            <li>Users can schedule recipes on a personal calendar to organize meals and plan ahead.</li>
        </ul>
    </details>
    <details>
        <summary>Community Challenges & Leaderboards</summary>
        <ul>
            <li>Users can participate in challenges, submit qualifying recipes, earn points, and compete for positions on the community leaderboard.</li>
        </ul>
    </details>
    <details>
        <summary>Recipe Search & Filtering</summary>
        <ul>
            <li>Users can search for recipes and filter results by cultural cuisine and other criteria.</li>
        </ul>
    </details>
    <details>
        <summary>Automated Shopping Lists</summary>
        <ul>
            <li>Users can generate shopping lists automatically from bookmarked recipes and selected meal plans.</li>
        </ul>
    </details>
</ul>

## Getting Started

### Prerequisites

Before starting, ensure the following software is installed:
 
- Node.js
- PostgreSQL
 
> [!TIP]
> Installation instructions can be found through The Odin Project:
>
> - Node.js: https://www.theodinproject.com/lessons/foundations-installing-node-js
> - PostgreSQL: https://www.theodinproject.com/lessons/nodejs-installing-postgresql

### Installation

1. Clone the repository
```
git clone <REPOSITORY_URL>
cd Recipe_Book
```

2. Install dependencies with:
```
npm init -y
npm install
```

### Database Setup
1. Open the PostgreSQL shell by running the following command:
```
psql
```
2. Create a database:
```
CREATE DATABASE database_name;
```
3. Exit with:
```
\q
```

### Environment Configuration
Create a `.env` file with this structure:
```
DATABASE_CONNECTION_STRING=postgres://{username}:{password}@localhost:{database-port}/{database-name}
SERVER_PORT={server-port}
EXPRESS_SESSION_SECRET={secret-string}
BCRYPT_SALT_LENGTH={positive-integer}

SERVER_EMAIL={user-with-two-factor-authentication}@gmail.com
SERVER_EMAIL_APP_PASSWORD={16-digit-code-for-gmail-user-above}

APP_URL=http://localhost:{server-port}
JSON_WEB_TOKEN_SECRET={another-secret-string}
SPOONACULAR_KEY={spoonacular-api-key}
```

> [!IMPORTANT]
> The database name created from database setup must match the value specified in the above DATABASE_CONNECTION_STRING.

As an example, the `.env` file might look something like this:
```
DATABASE_CONNECTION_STRING=postgres://user:12345@localhost:5432/db
SERVER_PORT=3000
EXPRESS_SESSION_SECRET=secret1
BCRYPT_SALT_LENGTH=10

SERVER_EMAIL=...@gmail.com
SERVER_EMAIL_APP_PASSWORD=abcdefghijklmnop

APP_URL=http://localhost:3000
JSON_WEB_TOKEN_SECRET=secret2
SPOONACULAR_KEY=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
```

> [!IMPORTANT]
> - `DATABASE_CONNECTION_STRING` allows the app to connect to a PostgreSQL database.
> - `SERVER_EMAIL` is a gmail account with two factor authentication enabled.
> - `SERVER_EMAIL_APP_PASSWORD` is a special 16-digit code for a gmail account that can only be created when two factor authentication is enabled. For instructions on how to get an app password for a gmail account, see the following link: [Sign in with app passwords](https://support.google.com/accounts/answer/185833?hl=en)
> - `SPOONACULAR_KEY` is an API key from Spoonacular. To get a key, see the following link: [Spoonacular API](https://spoonacular.com/food-api)

### Testing
For testing purposes, there is a sample user in the database once you run:
```
node ./database/seed.js
```
As a result, you can test part of the app as a logged-in user even if you don't provide a `SERVER_EMAIL` and `SERVER_EMAIL_APP_PASSWORD` in the `.env` file mentioned below.

The login details are as follows:
```
Username: guest
Password: guest
```

### Running the Application
1. Seed the database by running the following script:
```
node ./database/seed.js
```

2. Run the app:
```
node app.js
```

## Contributors

<a href="https://github.com/Perez1818/Recipe_Book/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Perez1818/Recipe_Book" alt="contrib.rocks image" />
</a>

## Attributions

[![WikimediaCommons][WikimediaCommons-icon]][WikimediaCommons-url-1]
- [Portrait_Placeholder.png](https://commons.wikimedia.org/wiki/File:Portrait_Placeholder.png) from [Wikimedia Commons](https://commons.wikimedia.org/wiki/Main_Page) by Greasemann, [Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/).

[![WikimediaCommons][WikimediaCommons-icon]][WikimediaCommons-url-2]
- [Planta_rodadora_o_Estepicursor.gif](https://commons.wikimedia.org/wiki/File:Planta_rodadora_o_Estepicursor.gif) by La Nada, [Attribution-Share Alike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/).

[![SimpleMaps][SimpleMaps-icon]][SimpleMaps-url]
- [world.svg](https://simplemaps.com/resources/svg-world) from [Simple Maps](https://simplemaps.com/) by Chris Youderian, [SVG Map Library License](https://simplemaps.com/resources/svg-license).

[![SimpleMaps][SimpleMaps-icon]][SimpleMaps-url]
- [countries.json](https://simplemaps.com/resources/svg-world) (modified for this project) derived from [Simple Maps](https://simplemaps.com/) by Chris Youderian, [SVG Map Library License](https://simplemaps.com/resources/svg-license).

[![GeeksForGeeks][GeeksForGeeks-icon]][GeeksForGeeks-url]
- Referred to in [challenge-view.css](./public/css/challenge-view.css) for code that converts an image to a grayscale-version of itself.

[![W3Schools][W3Schools-icon]][W3Schools-url]
- Referred to in [index.html](./public/index.html) and [recipe-view.html](./public/recipe-view.html) for code that loads in a dropdown menu.

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

<!-- Programming Languages -->
[CSS-icon]: https://img.shields.io/badge/CSS-639?style=for-the-badge&logo=css&logoColor=fff
[CSS-url]: https://developer.mozilla.org/en-US/docs/Web/CSS
[EJS-icon]: https://img.shields.io/badge/EJS-B4CA65?style=for-the-badge&logo=ejs&logoColor=fff
[EJS-url]: https://ejs.co/
[HTML-icon]: https://img.shields.io/badge/HTML-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white
[HTML-url]: https://developer.mozilla.org/en-US/docs/Web/HTML
[JavaScript-icon]: https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=000
[JavaScript-url]: https://developer.mozilla.org/en-US/docs/Web/JavaScript

<!-- Databases -->
[Postgres-icon]: https://img.shields.io/badge/Postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white
[Postgres-url]: https://www.postgresql.org/

<!-- Frameworks -->
[Node.js-icon]: https://img.shields.io/badge/Node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white
[Node.js-url]: https://nodejs.org/
[Express.js-icon]: https://img.shields.io/badge/Express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB
[Express.js-url]: https://expressjs.com/

<!-- APIs -->
[Google-Translate-API-icon]: https://img.shields.io/badge/Google_Translate_API-4285F4?style=for-the-badge&logo=googletranslate&logoColor=white
[Google-Translate-API-url]: https://cloud.google.com/translate
[TheMealDB-icon]: https://img.shields.io/badge/TheMealDB-Recipe_API-orange?style=for-the-badge
[TheMealDB-url]: https://www.themealdb.com/
[Spoonacular-icon]: https://img.shields.io/badge/Spoonacular-Food_API-85C441?style=for-the-badge
[Spoonacular-url]: https://spoonacular.com/food-api

<!-- Attributions -->
[SimpleMaps-icon]: https://img.shields.io/badge/SimpleMaps-Interactive_Maps-0099FF?style=for-the-badge
[SimpleMaps-url]: https://simplemaps.com
[WikimediaCommons-icon]: https://img.shields.io/badge/Wikimedia_Commons-006699?style=for-the-badge&logo=wikimediacommons&logoColor=white
[WikimediaCommons-url-1]: https://commons.wikimedia.org/wiki/File:Portrait_Placeholder.png
[WikimediaCommons-url-2]: https://commons.wikimedia.org/wiki/File:Planta_rodadora_o_Estepicursor.gif

<!-- Education -->
[GeeksForGeeks-icon]: https://img.shields.io/badge/GeeksforGeeks-298D46?style=for-the-badge&logo=geeksforgeeks&logoColor=white
[GeeksForGeeks-url]: https://www.geeksforgeeks.org/css/convert-an-image-into-grayscale-image-using-html-css/
[W3Schools-icon]: https://img.shields.io/badge/W3Schools-04AA6D?style=for-the-badge&logo=w3schools&logoColor=fff
[W3Schools-url]: https://www.w3schools.com/howto/howto_js_dropdown.asp