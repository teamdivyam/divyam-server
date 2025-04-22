import mongoose from "mongoose";
import { config } from './_config.js'
import logger from "./logger.js";

const connectDb = async () => {
    try {
        // mongoose.set("debug", true);
        const db = await mongoose.connect(config.DB_URL);
        logger.info("Database Connected Successfully..")
    } catch (error) {
        console.log(error);
        console.log(`Can't connect to Database ==>${error}`);
        return;
    }
};


export default connectDb;