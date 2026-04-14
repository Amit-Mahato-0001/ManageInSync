## Backend startup fail-fast update

### What was wrong

- The backend tried to connect to MongoDB when the app loaded.
- If the database connection failed, it only printed a message.
- The server could still continue starting in a bad state.

### Changes made

- The database connection now throws an error if `MONGO_URI` is missing.
- The database connection now throws an error if MongoDB connection fails.
- The app no longer connects to the database inside `app.js`.
- The server now connects to the database first in `server.js`.
- The server starts listening only after the database connection is successful.
- If the database connection fails, the server stops immediately with exit code `1`.

### Result

- The backend now fails fast on database problems.
- The server will not start if MongoDB is not available.
- This makes startup safer and easier to debug.
