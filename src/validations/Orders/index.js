import { isObjectId } from "../REGEX/index.js"
import Joi from "joi"

const TRACK_CART_SCHEMA_VALIDATOR = Joi.object({
    packageId: Joi.string().pattern(isObjectId).required(),
    qty: Joi.number().default(1).required()
})


export { TRACK_CART_SCHEMA_VALIDATOR }