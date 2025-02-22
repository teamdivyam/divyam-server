import createHttpError from "http-errors"
import jwt from 'jsonwebtoken';
import { config } from "../config/_config.js";
import userModel from "../Users/userModel.js";

const authUser = async (req, res, next) => {
    const req_Headers = req.cookies;

    if (!req_Headers || !req_Headers?.token) {
        return next(createHttpError(401, "Unauthorized"));
    }
    try {
        // also we will check for token expiry too..

        // const verify token
        const decodeToken = await jwt.verify(req_Headers.token, config.USER_SECRET);

        if (!decodeToken) {
            return next(createHttpError(401, "Unauthorize.."))
        }
        /* 

        */
        const isUserExists = await userModel.findById(decodeToken?.id);

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

export default authUser;