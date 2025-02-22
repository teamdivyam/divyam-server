import { nanoid } from 'nanoid';
import bcrypt from "bcrypt";
import createHttpError from "http-errors";

import {
    NEW_EMPLOYEE_SCHEMA_VALIDATION,
    EMPLOYEE_LOG_IN_SCHEMA_VALIDATION
} from "../validations/employee/index.js";

import UploadImageOnServer from "../services/UploadImageOnServer.js";
import { config } from '../config/_config.js';
import moveFileFromOneFolderToAnother from '../services/moveFIleOnServer.js';
import handleImage from '../utils/handleImage.js';
import ManagerModel from './ManagerModel.js';
import jwt from "jsonwebtoken";
import SuperVisorModel from './SupervisorModel.js';
import Joi from 'joi';
import areaPinModel from '../AreaZone/areaPinCodeModel.js';

const AUTH_SCHEMA_VALIDATION = Joi.object({
    role: Joi.string().valid('manager', 'supervisor'),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(10).required()
})


const NEW_EMPLOYEE = async (req, res, next) => {
    try {
        const { error, value } = NEW_EMPLOYEE_SCHEMA_VALIDATION.validate(req.body);

        if (error) {
            return next(createHttpError(400, error?.details.at(0)?.message))
        }

        // check for Employee is exists or not in the Database
        if (value.role === "manager") {
            const isManagerExists = await ManagerModel.exists({
                $or: [
                    { email: new RegExp(`^${value.email}$`, "i") },
                    { mobileNum: value.mobileNum }
                ]
            });

            if (isManagerExists) {
                return next(createHttpError(400, "employee is already exits"))
            }

            var generatePassword = nanoid(10);
            const saltValue = 10;

            // hash password
            const hashPassword = await bcrypt.hash(generatePassword, saltValue);

            // gte-or-insert-area-pin-code-in-the-areaPinCodeModel
            const AssignedPinCodeDetails = await Promise.all(value?.assignedPinCode.map(async (pinCode) => {
                let existingAreaPinCode = await areaPinModel.findOne({ pinCode: pinCode });

                if (!existingAreaPinCode) {
                    existingAreaPinCode = await areaPinModel.create({ pinCode: pinCode })
                }

                return existingAreaPinCode;
            }))

            const getAssignedPinCodeDetails = await AssignedPinCodeDetails;

            const getPinCodeObjId = getAssignedPinCodeDetails.map((item) => {
                const id = item._id;
                return id.toString()
            });

            const prettyData = {
                fullName: value.fullName,
                gender: value.gender,
                mobileNum: value.mobileNum,
                dob: value.dob,
                email: value.email,
                address: value.address,
                pinCode: value.pinCode,
                password: hashPassword,
                profile: "uploads/img/ksk",
                assignedPinCodes: getPinCodeObjId, //ref-attach-pin-code-manager-model
            };

            const newManager = await ManagerModel.create(prettyData);
            await newManager.save();

            // send response 
            return res.status(200).json({
                msg: "new employee has been created successfully.",
                email: value?.email,
                password: generatePassword,
                role: value?.role
            });
        }

        // For supervisor store data inside supervisor collections
        else if (value.role === "supervisor") {
            const isSuperVisorExits = await SuperVisorModel.findOne({
                $or: [
                    { email: new RegExp(`^${value.email}$`, "i") },
                    { mobileNum: value.mobileNum }
                ]
            })

            if (isSuperVisorExits) {
                return next(createHttpError(400, "employee is already exits"))
            }


            var generatePassword = nanoid(10);
            const saltValue = 10;

            // hash password
            const hashPassword = await bcrypt.hash(generatePassword, saltValue);

            // gte-or-insert-area-pin-code-in-the-areaPinCodeModel
            const AssignedPinCodeDetails = await Promise.all(value?.assignedPinCode.map(async (pinCode) => {
                let existingAreaPinCode = await areaPinModel.findOne({ pinCode: pinCode });

                if (!existingAreaPinCode) {
                    existingAreaPinCode = await areaPinModel.create({ pinCode: pinCode })
                }

                return existingAreaPinCode;
            }));

            const getAssignedPinCodeDetails = await AssignedPinCodeDetails;

            const getPinCodeObjId = getAssignedPinCodeDetails.map((item) => {
                const id = item._id;
                return id.toString()
            });

            // Insert data into database
            const newSuperVisor = await SuperVisorModel.create(
                {
                    fullName: value.fullName,
                    gender: value.gender,
                    mobileNum: value.mobileNum,
                    dob: value.dob,
                    email: value.email,
                    address: value.address,
                    pinCode: value.pinCode,
                    password: hashPassword,
                    profile: "uploads/img/ksk",
                    assignedPinCodes: getPinCodeObjId, //ref-attach-pin-code-manager-model
                }
            );

            await newSuperVisor.save();

            // send response 
            return res.status(200).json({
                msg: "new employee has been created successfully.",
                email: value?.email,
                password: value?.password,
                role: value.role
            });

        }

    } catch (error) {
        return next(createHttpError(400, `Oops invalid request.. ${error}`))
    }
}

// get-all-employee
const QUERY_VALIDATION = Joi.object({
    role: Joi.string().valid('manager', 'supervisor').required(),
    page: Joi.number().positive().required(),
    limit: Joi.number().positive().required(),
})
const GET_EMPLOYEE = async (req, res, next) => {
    const { error, value } = QUERY_VALIDATION.validate(req.query);

    if (error) {
        return next(createHttpError(400, error?.details.at(0)?.message))
    }

    const page = value.page || 1;
    const limit = value.limit || 1;
    const skip = (page - 1) * limit;

    try {
        const [manager, supervisor] = await Promise.all([
            ManagerModel.find({ role: value.role },
                { password: 0, assignedPinCodes: 0, assignedSupervisors: 0, updatedAt: 0, __v: 0, address: 0, profile: 0 }).skip(skip).limit(limit),
            SuperVisorModel.find({ role: value.role }, { password: 0, assignedPinCodes: 0, assignedSupervisors: 0, updatedAt: 0, __v: 0, address: 0, profile: 0, orders: 0 }).skip(skip).limit(limit)
        ]);

        const employees = [...manager, ...supervisor];

        return res.status(200).json(employees);
    } catch (error) {
        return next(createHttpError(400, "Internal errors."))
    }
}

// get-single-employee
const GET_SINGLE_EMPLOYEE = async (req, res, next) => {
    try {
        const { EMP_ID } = req.params;

        const [manager, supervisor] = await Promise.all([ManagerModel.findById(EMP_ID,
            { password: 0, assignedSupervisors: 0, assignedPinCodes: 0, profile: 0, updatedAt: 0, __v: 0 }),
        SuperVisorModel.findById(EMP_ID, { password: 0, assignedDeliveryPartners: 0, assignedPinCodes: 0, profile: 0, updatedAt: 0, __v: 0 })]);

        const employee = manager || supervisor;

        if (!employee) {
            return next(createHttpError(400, "No records founds.."))
        }

        return res.status(200).json(employee)
    } catch (error) {
        return next(createHttpError(400, error))
    }
}

// delete-single-employee
const DELETE_EMPLOYEE = async (req, res, next) => {
    try {
        const { EMP_ID } = req?.params;

        const [manager, supervisor] = await Promise.all(
            [ManagerModel.findByIdAndDelete(EMP_ID),
            SuperVisorModel.findByIdAndDelete(EMP_ID)]
        )

        const employee = manager || supervisor;

        if (!employee) {
            return next(createHttpError(400, "oops something went wrong."))
        }

        return res.status(200).json({ msg: "Employee deleted successfully." })
    } catch (error) {
        return next(createHttpError(400, "Internal error"))
    }
}

// for employee dashboard-
const AUTH_EMPLOYEE = async (req, res, next) => {
    try {
        const { error, value } = AUTH_SCHEMA_VALIDATION.validate(req.body);
        // validate req-body
        if (error) {
            return next(createHttpError(400, error?.details?.at(0)?.message))
        }
        // check employee is manager or supervisor
        const isEmployeeRoleManager = value?.role == 'manager' ? true : false;
        const isEmployeeRoleSupervisor = value?.role == 'supervisor' ? true : false;


        // for employee ===  manager
        if (isEmployeeRoleManager) {
            // check manager is exists or not 
            const isMangersExists = await ManagerModel.findOne(
                { email: value?.email }
            );

            if (!isMangersExists) {
                return next(createHttpError(400, "Please register yourself.."))
            };

            // compare db passwords
            const isDbPasswordValid =
                await bcrypt.compare(value?.password, isMangersExists?.password);


            if (!isDbPasswordValid) {
                return next(createHttpError(400, "please check your email password.."))
            }

            const JWT_PAYLOAD = { empId: isMangersExists?._id, role: isMangersExists?.role };


            const token = await jwt.sign(JWT_PAYLOAD, config?.EMPLOYEE_SECRET, {
                expiresIn: "2hr"
            });

            // send token aas a cookies;
            res.cookie('authToken', token, {
                httpOnly: true,
                secure: true,
                sameSite: true,
            })

            // On-success
            return res.status(200).json(
                {
                    statusCode: 200,
                    msg: "Employee login successfully",
                    accessToken: token
                }
            );

        }


        // auth => supervisor
        if (isEmployeeRoleSupervisor) {
            // check manager is exists or not 
            const isSuperVisor = await SuperVisorModel.findOne(
                { email: value?.email }
            );

            if (!isSuperVisor) {
                return next(createHttpError(400, "Please register yourself.."))
            };

            // compare db passwords
            const isDbPasswordValid =
                await bcrypt.compare(value?.password, isSuperVisor?.password);


            if (!isDbPasswordValid) {
                return next(createHttpError(400, "please check your email password.."))
            }

            const JWT_PAYLOAD = { empId: isSuperVisor?._id, role: isSuperVisor?.role };

            const token = await jwt.sign(JWT_PAYLOAD, config?.EMPLOYEE_SECRET, {
                expiresIn: "2hr"
            });

            // send token aas a cookies;
            res.cookie('authToken', token, {
                httpOnly: true,
                secure: true,
                sameSite: true,
            })

            // on success
            return res.status(200).json(
                {
                    statusCode: 200,
                    msg: "Employee login successfully",
                    accessToken: token
                }
            );
        }

        // check employee or manager is exists or not in the db
        // validate password
        // on success return token


    } catch (error) {
        return next(createHttpError(400, error))
    }
};

const GET_PROFILE = async (req, res, next) => {
    try {
        const { EMP_ID } = req?.params;
        // check-for-role;
        const [manager, profile] =
            await Promise.all([ManagerModel.findById(EMP_ID, {

            }),
            SuperVisorModel.findById(EMP_ID, {
                assignedDeliveryPartners: 0,
                orders: 0,
                assignedPinCodes: 0,
                __v: 0,
                password: 0
            })
            ]);

        const employee = manager || profile;
        return res.status(200).json(employee);
    } catch (error) {
        return next(createHttpError(400, error))
    }
}

export {
    NEW_EMPLOYEE,
    AUTH_EMPLOYEE,
    GET_EMPLOYEE,
    GET_SINGLE_EMPLOYEE,
    DELETE_EMPLOYEE,

    GET_PROFILE,
}