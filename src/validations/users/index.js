import Joi from "joi";
import { isMobileNumberTenDigit } from "../REGEX/index.js";

const RegisterUserValidateSchema = Joi.object({
    mobileNum: Joi.string().length(10).pattern(isMobileNumberTenDigit).required(),
});

const otpValidateSchema = Joi.object({
    mobileNum: Joi.string().length(10).pattern(isMobileNumberTenDigit).required(),
    clientOtp: Joi.string().length(4).required(),
});

export { RegisterUserValidateSchema, otpValidateSchema }