import Joi from "joi";

const RegisterUserValidateSchema = Joi.object({
    mobileNum: Joi.string().length(10).required()
});

const otpValidateSchema = Joi.object({
    mobileNum: Joi.string().length(10).pattern(/^[0-9]+$/).required(),
    clientOtp: Joi.string().length(6).required(),
});

export { RegisterUserValidateSchema, otpValidateSchema }