import createHttpError from "http-errors";
import ManagerModel from "../models/ManagerModel.js";
import SuperVisorModel from "../models/SupervisorModel.js";
import Joi from "joi";
import mongoose from "mongoose";
import bcrypt from 'bcryptjs';
import { nanoid } from "nanoid";

const SUPERVISOR_SCHEMA = Joi.object({
    SUPERVISOR_ID: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/).message('Invalid ObjectId format')
});

const UNSET_SUPERVISOR_FROM_MANAGER = async (req, res, next) => {
    const session = await mongoose.startSession();

    session.startTransaction();   // start transactions--

    try {
        const { error, value } = SUPERVISOR_SCHEMA.validate(req.params)

        if (error) {
            return next(createHttpError(400, error?.details.at(0)?.message))
        }
        const { EMP_ID } = req.user; //managerID

        const manager = await ManagerModel.findByIdAndUpdate(
            EMP_ID,
            { $pull: { assignedSuperVisor: value.SUPERVISOR_ID } },
            { new: true }
        );

        if (!manager) {
            return next(createHttpError(400, "Internal errors.."))
        }

        // remove link from supervisor ref managerID
        const superVisors = await SuperVisorModel.findByIdAndUpdate({ _id: value?.SUPERVISOR_ID },
            {
                $unset: { manager: 1 },
            },
            { new: true }
        );


        if (!superVisors) {
            return next(createHttpError(400, "Internal errors"))
        }

        await session.commitTransaction();
        session.endSession()
        return res.status(200).json({
            success: true,
            msg: "successfully removed"
        })

    } catch (error) {
        await session.abortTransaction();
        session.endSession()
        return next(createHttpError(400, error))
    }
}

const NEW_SUPERVISOR_VALIDATE_SCHEMA = Joi.object({
    fullName: Joi.string().min(3).required(),
    gender: Joi.string().valid().required(),
    email: Joi.string().email().required(),
    dob: Joi.date().required(),
    mobileNum: Joi.string().required(),
    pinCode: Joi.number().required(),
    address: Joi.string().min(10).max(100).required()
});

const NEW_SUPERVISOR = async (req, res, next) => {
    try {
        const { error, value } = NEW_SUPERVISOR_VALIDATE_SCHEMA.validate(req.body);

        if (error) {
            return next(createHttpError(400, error?.details.at(0)?.message))
        }

        const { fullName, gender, email, mobileNum, pinCode, address, dob } = req.body;
        const isSuperVisorExits = await SuperVisorModel.findOne({
            $or: [
                { email: email },
                { mobileNum: mobileNum }
            ]
        });

        if (isSuperVisorExits) {
            return next(createHttpError(400, "Supervisors already exits "))
        }

        // hashPassword
        const randomPassword = nanoid(10);
        const hashPassword = await bcrypt.hash(randomPassword, 10)

        // On Success - Insert-Data-On-DataBase
        const prettyData = {
            fullName,
            gender,
            dob,
            email,
            mobileNum,
            pinCode,
            address,
            password: hashPassword,
            profile: `uploads/${new Date()}.png`

        }

        const newSuperVisor = await SuperVisorModel.create(prettyData);

        if (!newSuperVisor) {
            return next(createHttpError(400, "Internal error.."))
        }

        return res.status(200).json({
            success: true,
            msg: "Successfully new supervisor created.",
            responseData: {
                email: email,
                password: randomPassword,
            }
        });

    } catch (error) {
        return next(createHttpError(400, error))
    }
}

// WHo am I

const WHO_AM_I = async (req, res, next) => {
    try {
        const EMP = req.user;
        const { EMP_ID } = EMP;

        if (!EMP_ID) {
            return next(createHttpError(400, "SOmething went wrong.."))
        }

        const isSuperVisor = await SuperVisorModel.findById(EMP_ID, {
            fullName: 1,
            gender: 1,
            mobileNum: 1,
            profile: 1,
            email: 1,
            role: 1
        })

        if (!isSuperVisor) {
            return next(createHttpError(400, "bad request."))
        }
        return res.status(200).json(isSuperVisor)

    } catch (error) {
        return next(createHttpError(400, "Internal error"))
    }
}

const CHANGE_PASSWORD_VALIDATE_SCHEMA = Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string()
        .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"))
        .required()
        .messages({
            "string.pattern.base": "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).",
        })
})


const CHANGE_PASSWORD = async (req, res, next) => {
    try {
        const { error, value } = CHANGE_PASSWORD_VALIDATE_SCHEMA.validate(req.body);

        if (error) {
            next(createHttpError(400, error?.details[0].message))
        }
        const superVisorID = req.user.EMP_ID;

        const { oldPassword, newPassword } = req.body;


        const isSuperVisorExits = await SuperVisorModel.findById(superVisorID);

        if (!isSuperVisorExits) {
            return next(createHttpError(400, "Invalid request."))
        }

        // check old password is correct or not
        const isSuperVisorPasswordIsvalid =
            await bcrypt.compare(oldPassword, isSuperVisorExits.password);


        if (!isSuperVisorPasswordIsvalid) {
            return next(createHttpError(400, "Invalid request.."))
        }


        // on success
        const saltRound = 10;
        const updatedPassword = await bcrypt.hash(newPassword, saltRound);
        isSuperVisorExits.password = updatedPassword;

        await isSuperVisorExits.save();

        return res.status(200).json({
            success: true,
            msg: "password chnaged Successfully.."
        })

    } catch (error) {
        return next(createHttpError(400, "bad request please try again later."))
    }
}


const SUPERVISOR_ANAYALYTICS = async (req, res, next) => {
    try {
        // get-total delivery agents 
        // get-total-orders
        //get-total-pendings orders
        // get-total-completed-orders

    } catch (error) {
        return next(createHttpError(400, "internal erros"))
    }
}

export {
    UNSET_SUPERVISOR_FROM_MANAGER, NEW_SUPERVISOR, WHO_AM_I, CHANGE_PASSWORD,
    SUPERVISOR_ANAYALYTICS
}