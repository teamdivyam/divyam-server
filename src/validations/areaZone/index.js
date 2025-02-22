import Joi from "joi"

const areaPinValidateRGX = /^[1-9]{1}[0-9]{5}$/;

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
    areaPinCode: Joi.string().regex(areaPinValidateRGX).required()
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
    areaPinCode: Joi.string().pattern(areaPinValidateRGX).required(),
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


// const SET_NEW_AREA_ZONE = async (req, res, next) => {
//     try {
//         const { error, value } = NEW__AREA__ZONE__VALIDATE__SCHEMA.validate(req.body)
//         if (error) {
//             return next(createHttpError(error?.details[0].message))
//         }

//         const reqDATA = value;


//         const start = new Date(reqDATA?.startDate)
//         const end = new Date(reqDATA?.endDate)


//         const query = {
//             areaPinCode: reqDATA?.areaPinCode,
//             state: reqDATA?.state,
//             district: reqDATA?.district,
//             startDate: start,
//             endDate: end,
//         }

//         const AreaZone = await AreaZoneModel.find(query);

//         if (AreaZone.length > 0) {
//             return next(createHttpError(401, "Area is already registered "))
//         }



//         // DATA 
//         const prettyDATA = {
//             areaPinCode: reqDATA?.areaPinCode,
//             state: reqDATA?.state,
//             district: reqDATA?.district,
//             startDate: start,
//             endDate: end,
//             "isAvailable": reqDATA?.isAvailable
//         }



//         const newAreaZone = await AreaZoneModel.create(prettyDATA)

//         if (!newAreaZone) {
//             return next(createHttpError(401, "invalid request."))
//         }


//         res.status(201).json({ success: true, msg: "Successfully new area zone is created." })
//     } catch (error) {
//         return next(createHttpError(400, `Invalid requests || ${error}`))
//     }
// }


export {
    NEW__AREA__ZONE__VALIDATE__SCHEMA,
    GET__AREA__ZONE__VALIDATE__SCHEMA,
    GET_ALL_AREA_ZONES_SCHEMA_VALIDATION,
    // SET_NEW_AREA_ZONE
}