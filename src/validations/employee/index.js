import Joi from "joi"

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
})


export {
    NEW_EMPLOYEE_SCHEMA_VALIDATION,
    EMPLOYEE_LOG_IN_SCHEMA_VALIDATION
}