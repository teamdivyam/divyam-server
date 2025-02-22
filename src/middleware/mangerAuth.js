import createHttpError from "http-errors"
import jwt from 'jsonwebtoken';
import { config } from "../config/_config.js";
// import ManagerModel from "../Manager/ManagerModel.js";

const isManager = async (req, res, next) => {
    const req_Headers = req.cookies;

    if (!req_Headers || !req_Headers?.token) {
        return next(createHttpError(401, "Unauthorized"));
    }
    try {
        console.log("RAW_HEADERS", req?.rawHeaders);

        const decodeToken = jwt.verify(req_Headers.token, config.MANGER_AUTH_SECRET);
        if (!decodeToken) {
            return next(createHttpError(401, "Unauthorize.."))
        }
        /* 

        */
        const isUserExists = await ManagerModel.findById(decodeToken?.id);

        if (!isUserExists) {
            return next(createHttpError(401, "Unauthorized.."))
        }
        req.user = isUserExists;

        // on success call next()
        next()
    } catch (error) {
        return next(createHttpError(401, `${error} Authentication failed.`))
    }
}

export default isManager;