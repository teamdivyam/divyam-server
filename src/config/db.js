import mongoose from "mongoose";
import { config } from './_config.js'
import logger from "./logger.js";

const connectDb = async () => {
    try {
        const db = await mongoose.connect(config.DB_URL)
        logger.info("Database Connected Successfully..")
    } catch (error) {
        console.log(error.message);
        return;
    }
}
export default connectDb;