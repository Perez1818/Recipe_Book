# Testing
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

# Installation
## Database (PostgreSQL)
Follow [these instructions](https://www.theodinproject.com/lessons/nodejs-installing-postgresql) to install and configure PostgreSQL on Linux.

Once this is done, open the PostgreSQL shell by running the following command:
```
psql
```
With the shell open, create a database:
```
CREATE DATABASE database_name;
```
Moreover, exit by typing:
```
\q
```

Before moving on, note that `database_name` must match `{database-name}` in the `.env` file below.

## Runtime Environment (Node.js)
Follow [these instructions](https://www.theodinproject.com/lessons/foundations-installing-node-js) to install Node.js on Linux.

## App
Clone the repository
```
git clone REPOSITORY_URL
```
Navigate to your local copy of the repository, for example:
```
cd Recipe_Book
```

### Environment File
Then create a `.env` file with this structure:
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

Important notes about the `.env` file are as follows:
- `DATABASE_CONNECTION_STRING` allows the app to connect to a PostgreSQL database.
- `SERVER_EMAIL` is a gmail account with two factor authentication enabled.
- `SERVER_EMAIL_APP_PASSWORD` is a special 16-digit code for a gmail account that can only be created when two factor authentication is enabled. For instructions on how to get an app password for a gmail account, see the following link: [Sign in with app passwords](https://support.google.com/accounts/answer/185833?hl=en)
- `SPOONACULAR_KEY` is an API key from Spoonacular. To get a key, see the following link: [Spoonacular API](https://spoonacular.com/food-api)

## Dependencies

Then install dependencies with:
```
npm init -y
npm install
```

## Run
Seed the database by running the following script:
```
node ./database/seed.js
```

Finally, run the app:
```
node app.js
```

# Tech Stack
- Node.js
- Express.js
- Embedded JavaScript Templates (ejs)
- PostgreSQL Client (pg)
- Express Validator (express-validator)
- Express Session (express-session)
- Passport (passport)
- Passport Local Strategy (passport-local)
- Bcrypt (bcryptjs)
- Connect PG Simple (connect-pg-simple)
- Multer (multer)
- Mime Types (mime-types)
- Nodemailer (nodemailer)
- JSON Web Token (jsonwebtoken)

# Attributions
- [Portrait_Placeholder.png](https://commons.wikimedia.org/wiki/File:Portrait_Placeholder.png) from [Wikimedia Commons](https://commons.wikimedia.org/wiki/Main_Page) by Greasemann, [Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/)
- [world.svg](https://simplemaps.com/resources/svg-world) from [Simple Maps](https://simplemaps.com/) by Chris Youderian, [SVG Map Library License](https://simplemaps.com/resources/svg-license)
- [countries.json](https://simplemaps.com/resources/svg-world) (modified for this project) derived from [Simple Maps](https://simplemaps.com/) by Chris Youderian, [SVG Map Library License](https://simplemaps.com/resources/svg-license)
- [Planta_rodadora_o_Estepicursor.gif](https://commons.wikimedia.org/wiki/File:Planta_rodadora_o_Estepicursor.gif) by La Nada, [Attribution-Share Alike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/)
