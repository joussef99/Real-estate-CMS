<div align="center">

</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:** Node.js

1. Clone the repository.
2. Install dependencies:
   `npm install`
3. Run the app:
   `npm run dev`

The SQLite database (`realestate.db`) is not tracked in Git. On first start, the server automatically creates the database file and runs the schema from `server/db/schema.sql`.
