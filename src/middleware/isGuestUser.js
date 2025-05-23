import { config } from "../config/_config.js";
import jwt from 'jsonwebtoken';
import logger from "../logger/index.js";

const isGuestUser = async (req, res, next) => {
    let isUserGuest;
    let cookies = req.cookies;

    try {
        // logged in user 
        if (cookies.token) {
            isUserGuest = false;

            const user = await jwt.decode(cookies.token, config.USER_SECRET);

            if (!user) {
                isUserGuest = true
            }

            req.visitor = {
                visitor: user,
                isUser_Guest: isUserGuest
            }

            return next()
        }

        if (cookies.session) {
            isUserGuest = true;

            const decodedSession = await jwt.decode(cookies.session, config.GUEST_USERS_SECRET);

            if (!decodedSession) {
                logger.info("Error caught at=> GUEST USER_TRACKING")
            }

            console.log("DECODED_SESSION", decodedSession);

            req.visitor = {
                visitor: decodedSession,
                isUserGuest: isUserGuest
            };

            next();
        }

        // if session and token not available , allocate Fresh visitorId
        next()
    } catch (error) {
        throw new Error(error);
    }
}

export default isGuestUser