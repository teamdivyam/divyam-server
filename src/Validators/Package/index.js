import Joi
    from "joi";
const NEW__PKG__VALIDATE__SCHEMA = Joi.object({
    name: Joi.string().min(3).max(150).required(),
    description: Joi.string().min(3).max(1200).required(),
    packageListTextItems: Joi.array().required(),
    capacity: Joi.number().positive().required(),
    price: Joi.number().positive().required(),
    policy: Joi.string(),
    notes: Joi.string(),
    productBannerImgArr: Joi.array(),
    productMainImgArr: Joi.array(),
    rating: Joi.number().required()
})

const UPDATE__PKG__VALIDATE_SCHEMA = Joi.object({
    name: Joi.string().min(3).max(150),
    description: Joi.string().min(3).max(1200),
    packageListTextItems: Joi.array().required(),
    capacity: Joi.number().positive().required(),
    price: Joi.number().positive().required(),
    policy: Joi.string(),
    notes: Joi.string(),
    bannerImgs: Joi.array(),
    productImgs: Joi.array(),
    isFeaturedProduct: Joi.boolean().required(),
    isVisible: Joi.boolean().required(),
    rating: Joi.number().required()
});


export {
    NEW__PKG__VALIDATE__SCHEMA,
    UPDATE__PKG__VALIDATE_SCHEMA
}