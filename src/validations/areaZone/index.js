import Joi from "joi"
import { isAreaPin_SIX_DIGIT } from "../REGEX/index.js"

const NEW__AREA__ZONE__VALIDATE__SCHEMA = Joi.object({
    state: Joi.string().trim().min(3).max(20).required().messages({
        'string.length': 'oops! Invalid entry',
        'string.empty': 'state must be a valid string',
        'string.base': 'State must be a string',
        'any.required': 'State is required'
    }),
    district: Joi.string().trim().min(3).max(25).required()
        .messages({
            'string.empty': 'district must be a valid string',
            'string.base': 'District must be a string',
            'any.required': 'District is required'
        }),
    areaPinCode: Joi.string().regex(isAreaPin_SIX_DIGIT).required()
        .messages({
            'string.empty': "Area Pincode must be a valid string",
            'string.base': 'Area Pincode must be a string',
            'string.length': 'Area Pincode must be exactly 6 digits',
            'string.pattern.base': 'Area Pincode must start with a non-zero digit and be 6 digits long',
            'any.required': 'Area Pincode is required'
        }),
    startDate: Joi.date().iso().required().messages({
        'date.base': 'Start Date must be a valid date',
        'any.required': 'Start Date is required',
        'string.pattern.base': 'Start Date must be a valid date',
    }),
    endDate: Joi.string().trim().required().messages({
        'date.base': 'End Date must be a valid date',
        'any.required': 'End Date is required',
        'string.pattern.base': 'End Date must be a valid date',
    }),
    isAvailable: Joi.boolean().required().messages({
        'boolean.empty': 'isAvailable must be a valid string',
        'boolean.base': 'isAvailable must be a valid string',
        'boolean.required': 'isAvailable must be a valid string'
    }),
})


const GET__AREA__ZONE__VALIDATE__SCHEMA = Joi.object({
    state: Joi.string().trim().min(3).max(20).messages({
        'string.length': 'oops! Invalid entry',
        'string.empty': 'state must be a valid string',
        'string.base': 'State must be a string',
        'any.required': 'State is required'
    }),
    district: Joi.string().trim().min(3).max(25)
        .messages({
            'string.empty': 'district must be a valid string',
            'string.base': 'District must be a string',
            'any.required': 'District is required'
        }),
    areaPinCode: Joi.string().pattern(isAreaPin_SIX_DIGIT).required(),
    startDate: Joi.string().trim().message({
        'string.empty': "date can't be empty",
        'any.required': 'End Date is required',
    }),
    endDate: Joi.string().trim().messages({
        'string.empty': "date can't be empty",
        'any.required': 'End Date is required',
    }),
})


const GET_ALL_AREA_ZONES_SCHEMA_VALIDATION = Joi.object({
    page: Joi.string().min(1).required(),
    limit: Joi.string().min(1),
})



const PIN_CODE_VERIFY_SCHEMA = Joi.object({
    areaPinCode: Joi.string().pattern(isAreaPin_SIX_DIGIT).required()
})


export {
    NEW__AREA__ZONE__VALIDATE__SCHEMA,
    GET__AREA__ZONE__VALIDATE__SCHEMA,
    GET_ALL_AREA_ZONES_SCHEMA_VALIDATION,
    PIN_CODE_VERIFY_SCHEMA
    // SET_NEW_AREA_ZONE
}