# Requirements
- Node.js
- Express.js
- Embedded JavaScript Templates (ejs)
- PostgreSQL Client (pg)
- Express Validator (express-validator)
- Express Session (express-session)
- Passport (passport)
- Passport Local Strategy (passport-local)
- Bcrypt (bcryptjs)

# Setup
Open Node.js command prompt and:
```
cd project_root
```
Then create a ".env" file containing:
```
DATABASE_CONNECTION_STRING=type_string_here
SERVER_PORT=type_server_port_number_here
EXPRESS_SESSION_SECRET=type_session_secret_here
BCRYPT_SALT_LENGTH=type_salt_length_here
```
Finally, install dependencies:
```
npm init -y
npm install
```

# Run
```
node main.js
```
