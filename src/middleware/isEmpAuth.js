import createHttpError from "http-errors"
import jwt from 'jsonwebtoken';
import { config } from "../config/_config.js";

const isManager = async (req, res, next) => {
    const req_Headers = req.cookies;

    if (!req_Headers || !req_Headers?.authToken) {
        return next(createHttpError(401, "Authentication failed-01.."));
    }

    try {
        const decodeToken = jwt.verify(req_Headers.authToken, config?.EMPLOYEE_SECRET);

        if (!decodeToken) {
            return next(createHttpError(401, "Authentication failed-02.."))
        };

        const employee = {
            EMP_ID: decodeToken.empId,
            role: decodeToken.empId,
        };

        req.user = employee;
        next()
    } catch (error) {
        return next(createHttpError(401, `Authentication failed.`))
    }
}

export default isManager;