import createHttpError from "http-errors";
import ManagerModel from "./ManagerModel";
import { NEW_EMPLOYEE_SCHEMA_VALIDATION } from "../validations/employee";

const UPDATE_PROFILE = async (req, res, next) => {
    try {
        const { MANGER_ID } = req?.params;

        const { error, value } = NEW_EMPLOYEE_SCHEMA_VALIDATION.validate(req.body);

        if (error) {
            return next(createHttpError(400, error?.details.at(0)?.message))
        }

        const prettyDATA = {
            fullName: value.fullName,
            gender: value.gender,
            mobileNum: value.mobileNum,
            dob: value.dob,
            email: value.email,
            pinCode: value.pinCode,
            address: value.address,
            role: value.role,
        }

        const isManagerExists = await ManagerModel.findByIdAndUpdate(MANGER_ID, prettyDATA);

        if (!isManagerExists) {
            return next(createHttpError(400, "oops something went wrong."))
        }

        return res.status(201).json({
            msg: "success"
        });
    } catch (error) {
        return next(createHttpError(400, "Internal errors."))
    }
}


export default { UPDATE_PROFILE }