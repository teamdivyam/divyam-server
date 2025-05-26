import { isObjectId } from "../REGEX/index.js"
import Joi from "joi"
import moment from "moment";

const TRACK_CART_SCHEMA_VALIDATOR = Joi.object({
    packageId: Joi.string().pattern(isObjectId).required(),
    qty: Joi.number().default(1).required()
});

const VALIATE_ORDER_BODY_SCHEMA = Joi.object({
    packageID: Joi.string().pattern(isObjectId).required(),
    qty: Joi.number().positive().max(5).required(),
    startDate: Joi.date().iso().greater(
        moment().add(6, 'months').toDate()
    ).required(),
    endDate: Joi.date().iso().min(Joi.ref("startDate")).required(),
});

const PAGINATION_SCHEMA_VALIDATOR = Joi.object({
    page: Joi.string().trim().required(),
    limit: Joi.string().trim().max(20).required()
})

const UPDATE_ORDER_STATUS_VALIDATION_SCHEMA = Joi.object({
    status: Joi.string().trim()
        .valid(
            "Pending",
            "Packed",
            "Shipped",
            "Failed",
            "Refunded",
            "Out for Delivery",
            "Delivered",
            "Refunded",
            "Cancelled"
        )
        .required()
})

const ALL_ORDER_SCHEMA_VALIDATION = Joi.object({
    page: Joi.string().min(1).required(),
    limit: Joi.string(),
});

const GET_FILTERED_ORDER_VALIDATION_SCHEMA = Joi.object(
    {
        filterBy: Joi.string().trim().valid(
            "Pending",
            "Packed",
            "Shipped",
            "Refunded",
            "Cancelled",
            "Failed",
            "Out for Delivery",
            "Delivered",
            "Success", //status used in only admin dashboard
            "CANCELLATION_REQUESTED"
        ),
        page: Joi.number().required(),
        limit: Joi.number().required()
    }
);

const IS_ORDER_ID = Joi.object({
    ORDER_ID: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .message('Invalid Order id'),

})

export {
    TRACK_CART_SCHEMA_VALIDATOR,
    VALIATE_ORDER_BODY_SCHEMA,
    PAGINATION_SCHEMA_VALIDATOR,
    UPDATE_ORDER_STATUS_VALIDATION_SCHEMA,
    ALL_ORDER_SCHEMA_VALIDATION,
    GET_FILTERED_ORDER_VALIDATION_SCHEMA,
    IS_ORDER_ID
}