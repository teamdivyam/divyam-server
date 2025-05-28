import Joi from "joi";
import { isAreaPin_SIX_DIGIT, isMobileNumberTenDigit } from "../REGEX/index.js";
import moment from "moment";

const RegisterUserValidateSchema = Joi.object({
    mobileNum: Joi.string().length(10).pattern(isMobileNumberTenDigit).required(),
});

const otpValidateSchema = Joi.object({
    mobileNum: Joi.string().length(10).pattern(isMobileNumberTenDigit).required(),
    clientOtp: Joi.string().length(4).required(),
});

const UPDATE_USER_VALIDATE_SCHEMA = Joi.object({
    fullName: Joi.string().min(3).max(30).required(),
    gender: Joi.string().valid('male', 'female', 'others').required(),
    dob: Joi.date()
        .max(moment()
            .subtract(19, 'years')
            .toDate())
        .required()
        .messages({
            'date.max': 'You must be at least 18 years old',
            'any.required': 'Date of birth is required',
        }),
    email: Joi.string().email().label("email"),
    address: Joi.string().min(20).max(200).label("Address"),
    areaPinCode: Joi.string().pattern(isAreaPin_SIX_DIGIT).required().label("PinCode")
});


const VALIDATE_USER_ADDRESS = Joi.object({
    area: Joi.string().min(3).max(65).required(),
    city: Joi.string().min(3).max(65).required(),
    landMark: Joi.string().min(3).max(65).required(),
    state: Joi.string().min(3).max(20).required(),
    pinCode: Joi.string().pattern(isAreaPin_SIX_DIGIT).required(),
    contactNumber: Joi.string().pattern(isMobileNumberTenDigit).required()
});


export {
    RegisterUserValidateSchema,
    otpValidateSchema,
    UPDATE_USER_VALIDATE_SCHEMA,
    VALIDATE_USER_ADDRESS
}