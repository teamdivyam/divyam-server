import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import { config } from "../config/_config.js";
import adminModel from "../Admin/adminModel.js";

/*
MISSING_TOKEN = ERR_DVYM_AUTH20
*/

const isAdmin = async (req, res, next) => {
    try {
        const tokenHeader = req.headers['authorization'];

        if (!tokenHeader) {
            return next(createHttpError('401', 'Unauthorized-access|ERRDVYM_AUTH20'))
        }
        if (!tokenHeader.startsWith('Bearer ')) {
            return next(createHttpError('401', 'Unauthorized-access|ERRDVYM_AUTH21'))
        }

        const token = tokenHeader.split(" ").at(1);

        if (!token) {
            return next(createHttpError('401', 'Unauthorized-access|ERRDVYM_AUTH22'))
        }

        // decode token and verify it from db Too.. 
        // it could be costly operation

        const decodedToken = jwt.verify(token, config.ADMIN_SECRET)
        if (!decodedToken) {
            return next(createHttpError('401', 'Unauthorized-access|ERRDVYM_AUTH23'))
        }

        // check token inside DB TO..
        // const admin = await adminModel.findById(decodedToken.id);

        // if (!admin) {
        //     return next(createHttpError('401', 'Unauthorized-access|ERRDVYM_AUTH24'))
        // }

        // // Match Token For Verification too..
        // if (!admin.accessToken) {
        //     return next(createHttpError('401', 'Unauthorized-access|ERRDVYM_AUTH25'))
        // }

        // // console.log("AUTH_TOKEN", admin.accessToken, "\n CLIENT_TOKEN =>", token);
        // if (admin.accessToken !== token) {
        //     console.log("Inalid Token.");
        //     return next(createHttpError('401', 'Unauthorized-access|ERRDVYM_AUTH26'))
        // }
        // On Success
        req.user = decodedToken.id;
        next()
    } catch (error) {
        return next(createHttpError(401, error.message))
    }
}


export default isAdmin
