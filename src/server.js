import connectDb from "./config/db.js";
import { config } from "./config/_config.js";
import logger from "./config/logger.js";
import app from "./app.js";

// Set Default Port in case Of Failure
const PORT = config.APP_PORT || 3001

// Connect With Database
try {
    connectDb();
} catch (error) {
    console.log(error.message);
}

app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
    logger.info('App is running on Port', { port: PORT })
})