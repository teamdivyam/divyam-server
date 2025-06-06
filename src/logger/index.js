import devLogger from "./devLogger.js";
import uatLogger from "./uatLogger.js";
import { config } from "../config/_config.js";
import productionLogger from './productionLogger.js';


let logger = null;

switch (config.NODE_ENV) {
    case "production": {
        logger = productionLogger();
        break;
    }

    case "uat": {
        logger = uatLogger();
        break;
    }

    case "development": {
        logger = devLogger();
        break;
    }
}


export default logger;