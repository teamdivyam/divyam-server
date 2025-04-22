import createHttpError from "http-errors";
import ManagerModel from "../models/ManagerModel.js";
import { NEW_EMPLOYEE_SCHEMA_VALIDATION } from "../../validations/employee/index.js";

import SuperVisorModel from "../models/SupervisorModel.js";
import DeliveryPartnerModel from "../../DeliveryPartners/DeliveryPartnerModel.js";
import orderModel from '../../Orders/orderModel.js';
import moment from "moment";
import Joi from "joi";
import bcrypt from "bcryptjs"



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

const GET_MANAGER_STATS = async (req, res, next) => {
    try {
        const { EMP_ID, role } = req.user;

        const manager = await ManagerModel.findById(EMP_ID).select(
            { assignedSuperVisor: 1, assignedPinCodes: 1 });


        if (!manager) {
            return next(createHttpError(400, "oops something went wrong."))
        }
        const { assignedSuperVisor, assignedPinCodes } = manager;

        const totalSuperVisors = assignedSuperVisor.length;
        const totalAssignedPinCodes = assignedPinCodes.length;

        // const
        return res.json({
            success: true,
            totalSuperVisors, totalAssignedPinCodes
        });

    } catch (error) {
        return next(createHttpError(400, error))
    }
}

// get supervisor of Manger []
const GET_SUPERVISORS = async (req, res, next) => {
    try {
        const { EMP_ID } = req.user;  // manager- _id

        const getSuperVisorsOfManager = await ManagerModel.findById(EMP_ID).select({ assignedSuperVisor: 1, });

        const { assignedSuperVisor } = getSuperVisorsOfManager;

        if (!assignedSuperVisor) {
            return next(createHttpError(400, "No supervisors found for the manager"));
        }

        const getAllSuperVisors = await SuperVisorModel.find({
            _id: { $in: assignedSuperVisor }
        }).select({ fullName: 1, gender: 1, mobileNum: 1, email: 1, dob: 1, address: 1, role: 1 })



        if (!getAllSuperVisors.length) {
            return next(createHttpError(400, "Supervisors not found"));
        }

        return res.status(200).json({
            success: true,
            superVisors: getAllSuperVisors
        })

    } catch (error) {
        return next(createHttpError(400, "Internal errors"))
    }
}

const SHOW_COMPLETE_SUPERVISORS_PROFILE = async (req, res, next) => {
    try {
        const { SUPERVISOR_ID } = req.params;


        const getSuperVisor = await SuperVisorModel.findById(SUPERVISOR_ID,
            { manager: 0, __v: 0, password: 0, updatedAt: 0, createdAt: 0 }
        );

        if (!getSuperVisor) {
            return next(createHttpError(400, "something went wrong."))
        }


        const { assignedDeliveryPartners, orders } = getSuperVisor;

        // fetch-all-the-delivery-Partners-INFO-From []
        const assignedDeliveryPartnersObjects = await Promise.all(assignedDeliveryPartners.map(async (agenId) => {
            let agents = await DeliveryPartnerModel.findById(agenId, { __v: 0, password: 0 })
            return agents;
        }));


        // fetch-all-the-Order-INFO-From-DELIveryPartners []

        const getAllOrdersInfo = await Promise.all(orders.map(async (order) => {
            const getOrderInfo = await orderModel.findById(order);
            return getOrderInfo;

        }))


        const ResponseDATA =
        {
            ...getSuperVisor._doc,
            dob: `${moment(getSuperVisor.dob).format("DD-MM-YYYY")}`,
            assignedDeliveryPartners: assignedDeliveryPartnersObjects,
            orders: getAllOrdersInfo
        }

        return res.status(200).json({
            success: true,
            statusCode: 200,
            responseData: ResponseDATA,
            // deliveryAGents: assignedDeliveryPartnersObjects
        });
    } catch (error) {
        return next(createHttpError(400, "Internal errors"))
    }
}
// SHOW_ALL_THE_ORDER_UNDER_MANGER,
const WHO_AM_I = async (req, res, next) => {
    const { EMP_ID } = req.user;
    console.log("CALLED");

    try {
        const manager = await ManagerModel.findById(EMP_ID,
            {
                accessToken: 0,
                assignedPinCodes: 0,
                assignedSuperVisor: 0,
                password: 0,
                updatedAt: 0,
                __v: 0
            });
        if (!manager) {
            return next(createHttpError(400, "someting went wrong"))
        }

        const responseDATA = {
            ...manager._doc,
            dob: moment(manager.dob).format("DD-MM-YYYY"),
            createdAt: moment(manager.createdAt).format("DD-MM-YYYY")
        }

        return res.status(200).json(responseDATA)

    } catch (error) {
        return next(createHttpError(400, "Internal error"))
    }
}

const LOGOUT = async (req, res, next) => {
    try {
        res.clearCookie('authToken', { path: "/" });

        res.status(200).json(
            {
                msg: "Successfully logout.."
            }
        )
    } catch (error) {
        return next(createHttpError(400, "Something went wrong.."))
    }
}

const CHNAGE_PASSWORD_VALIDATE_SCHEMA = Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string()
        .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"))
        .required()
        .messages({
            "string.pattern.base": "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).",
        })
})

const CHNAGE_PASSWORD = async (req, res, next) => {
    try {
        const { error, value } = CHNAGE_PASSWORD_VALIDATE_SCHEMA.validate(req.body);

        if (error) {
            next(createHttpError(400, error?.details[0].message))
        }

        const { oldPassword, newPassword } = req.body;
        const managerId = req.user.EMP_ID;


        const isManagerExists = await ManagerModel.findById(managerId);
        if (!isManagerExists) {
            return next(createHttpError(400, "Invalid request."))
        }

        // check old password is correct or not
        const isMangerPasswordIsvalid = await bcrypt.compare(oldPassword, isManagerExists.password);


        if (!isMangerPasswordIsvalid) {
            return next(createHttpError(400, "Invalid request.."))
        }


        // on success
        const saltRound = 10;
        const updatedPassword = await bcrypt.hash(newPassword, saltRound);
        isManagerExists.password = updatedPassword;

        await isManagerExists.save();


        return res.status(200).json({
            success: true,
            msg: "password chnaged Successfully.."
        })

    } catch (error) {
        return next(createHttpError(400, error))
    }
}

export {
    UPDATE_PROFILE,
    GET_MANAGER_STATS,
    GET_SUPERVISORS,
    SHOW_COMPLETE_SUPERVISORS_PROFILE,
    WHO_AM_I,
    LOGOUT,
    CHNAGE_PASSWORD
};