import Joi from "joi";

const userRegisterSchema = Joi.object({
    fullName: Joi.string().max(20),
    mobileNum: Joi.string().max(10),
    age: Joi.string().max(25),
    gender: Joi.string().max(10),
    // 01/02/2024
    avatar: Joi.string().max(200),
    address: Joi.string().max(200),
    areaPin: Joi.string().max(20),
    role: Joi.string(),
    accessToken: Joi.string(),
    otp: Joi.string(),
    isVerified: Joi.boolean()
}, { timestamps: true });

export default userRegisterSchema




