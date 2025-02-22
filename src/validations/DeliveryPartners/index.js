import Joi from "joi"
const areaPinValidateRGX = /^[1-9]{1}[0-9]{5}$/;

const DELIVERY_PARTNER_CREATE_PROFILE_VALIDATION = Joi.object({
    fullName: Joi.string().trim().min(2).max(50).required(),
    age: Joi.date().required(),
    email: Joi.string().trim().email().required(),
    gender: Joi.string().valid('male', 'female', 'others').required(),
    phoneNum: Joi.string().length(10).pattern(/^[0-9]+$/).required(),
    city: Joi.string().min(2).max(50).required(),
    pinCode: Joi.string().pattern(areaPinValidateRGX).required(),
    address: Joi.string().min(5).max(100).required(),
    orders: Joi.array().items({
        orderId: Joi.object({ orderId: Joi.string().required() })
    }),
    delivery_count: Joi.number(),
});

export { DELIVERY_PARTNER_CREATE_PROFILE_VALIDATION }