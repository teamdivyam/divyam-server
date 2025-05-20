import Joi from "joi"
const objIdRegex = /^[a-fA-F0-9]{24}$/;

const NEW_EMPLOYEE_SCHEMA_VALIDATION = Joi.object({
    fullName: Joi.string().trim().min(3).required(),
    gender: Joi.string().trim().required(),
    mobileNum: Joi.string().trim().length(10).required(),
    dob: Joi.string().required(),
    email: Joi.string().email().required(),
    pinCode: Joi.string().length(6).required(),
    address: Joi.string().trim().min(5).required(),
    role: Joi.string().valid('supervisor', 'manager'),
    assignedPinCode: Joi.array().items(),
});

const EMPLOYEE_LOG_IN_SCHEMA_VALIDATION = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(10).max(50).required()
});

const VALIDATE_OBJ_ID = Joi.object({
    managerObjId: Joi.string().pattern(objIdRegex).required(),
    superVisorObjId: Joi.string().pattern(objIdRegex).required(),
})


const VALIDATE_UNSET_SUPERVISOR_FROM_MANAGER = Joi.object({
    managerID: Joi.string().required(),
    superVisorID: Joi.string().required(),
});

const AUTH_SCHEMA_VALIDATION = Joi.object({
    role: Joi.string().valid('manager', 'supervisor'),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(30).required()
});

export {
    NEW_EMPLOYEE_SCHEMA_VALIDATION,
    EMPLOYEE_LOG_IN_SCHEMA_VALIDATION,
    VALIDATE_OBJ_ID,
    AUTH_SCHEMA_VALIDATION,
    VALIDATE_UNSET_SUPERVISOR_FROM_MANAGER
}