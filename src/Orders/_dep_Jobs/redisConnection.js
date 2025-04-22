import Redis from "ioredis";
import logger from "../../config/logger.js";

const redisConfig = {
    port: 6379,
    host: '127.0.0.1',
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
};

const redisConnection = new Redis(redisConfig);

redisConnection.on('connect', () => {
    logger.info('Redis connected successfully..')
});


export default redisConnection;
