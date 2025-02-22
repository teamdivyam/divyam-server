import createHttpError from "http-errors";
import { config } from '../config/_config.js'
import jwt from 'jsonwebtoken';
import userModel from "../Users/userModel.js";

const UserAuth = async (req, res, next) => {
    try {
        const Auth = req.headers['authorization'];
        if (!Auth || !Auth.startsWith('Bearer ')) {
            return next(createHttpError(401, 'Unauthorize..'))
        }
        const token = Auth.split(" ").at(1);
        // verify Token 
        if (!token) {
            return res.status(403).json({ error: 'Invalid or missing token' });
        }

        const decodeToken = await jwt.verify(token, config.USER_SECRET);

        if (!decodeToken) {
            return next(createHttpError(401, 'Unauthorize..'))
        }

        // Check Token inside DB TOO..
        const reqUserId = decodeToken?.id

        const isUserIdValid = await userModel.findById(reqUserId)

        if (!isUserIdValid) {
            return next(createHttpError(400, "Unauthorize."))
        }

        if (!isUserIdValid || isUserIdValid.accessToken !== token) {
            return next(createHttpError(401, "Unauthorized"));
        }
        // on Success

        req.user = decodeToken.id
        next()
    } catch (error) {
        // return next(createHttpError(401, "Unauthorized: Invalid token"))
        if (error.name === 'TokenExpiredError') {
            return next(createHttpError(401, 'Unauthorized: Token has expired.'));
        } else if (error.name === 'JsonWebTokenError') {
            return next(createHttpError(401, 'Unauthorized: Invalid token.'));
        } else {
            return next(createHttpError(500, `Error in authentication middleware: ${error.message}`));
        }
    }

}

export default UserAuth;
