import mongoose from "mongoose";
import { config } from './_config.js'
import logger from "../logger/index.js";

const connectDb = async () => {
    try {
        // mongoose.set("debug", true);
        const db = await mongoose.connect(config.DB_URL);
        logger.info("Database connected ✅")
    } catch (error) {
        logger.error(`Can't connect to Database ==>${error.message}`);
        return;
    }
};


export default connectDb;