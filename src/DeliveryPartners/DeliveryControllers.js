import createHttpError from "http-errors";
import Joi from "joi";

import { DELIVERY_PARTNER_CREATE_PROFILE_VALIDATION }
    from "../validations/DeliveryPartners/index.js";

import DeliveryPartnerModel from './DeliveryPartnerModel.js';

const LOG_IN_DELIVERY_PARTNERS = async (req, res, next) => {
    try {
    } catch (error) {
        return next(createHttpError(error?.message))
    }
}

const LOG_OUT_DELIVERY_PARTNERS = async (req, res, next) => {
}

const CREATE_PROFILE = async (req, res, next) => {
    try {
        const { error, value } = DELIVERY_PARTNER_CREATE_PROFILE_VALIDATION.validate(req.body);

        if (error) {
            return next(createHttpError(400, error?.details?.at(0).message))
        }

        // check for agent already exists or not
        const isAgentExists = await DeliveryPartnerModel.findOne({
            $or: [
                {
                    email: value.email,
                },
                {
                    phoneNum: value.phoneNum

                }
            ]
        });


        if (isAgentExists) {
            return next(createHttpError(400, "agent is already exits"))
        }


        const newAgent = await DeliveryPartnerModel.create(value);


        return res.status(200).json({
            msg: "new agent created successfully..",
            agentId: newAgent._id
        })

    } catch (error) {
        return next(createHttpError(400, `Internal errors ${error}`))
    }
}

const QUERY_PAGINATION_SCHEMA = Joi.object({
    limit: Joi.number().positive().min(1).max(60).required(),
    page: Joi.number().positive().required()
});

const GET_DELIVERY_AGENTS = async (req, res, next) => {
    try {
        const { error, value } = QUERY_PAGINATION_SCHEMA.validate(req.query);

        if (error) {
            return next(createHttpError(400, "oops invalid request.."))
        }

        const Page = value.page || 1;
        const Limit = value.limit || 10;
        const skip = (Page - 1) * Limit;

        // fetch data from db
        const getDeliveryAgents = await DeliveryPartnerModel.find({},
            { __v: 0, orders: 0, status: 0, phoneNum: 0 }).skip(skip).limit(Limit);


        if (!getDeliveryAgents.length) {
            return next(createHttpError(400, "No records available."))
        }

        return res.json(getDeliveryAgents);
    } catch (error) {
        return next(createHttpError(400, `Internal errors..`))
    }
}

const GET_SINGLE_DELIVERY_AGENT = async (req, res, next) => {
    try {
        const { AGENT_ID } = req.params;

        const getAgents = await DeliveryPartnerModel.findById(AGENT_ID, { __v: 0, _id: 0 });

        return res.status(200).json(getAgents)

    } catch (error) {
        return next(createHttpError(400, "Invalid request.."))
    }
}

const DELETE_SINGLE_DELIVERY_AGENT = async (req, res, next) => {
    try {
        const { AGENT_ID } = req.params;

        const Agents = await DeliveryPartnerModel.findByIdAndDelete(AGENT_ID);

        if (!Agents) {
            return next(createHttpError(400, "Something went wrong."))
        }

        // on success of del req.
        return res.json({
            statusCode: "204",
            msg: "Employee deleted successfully."
        })

    } catch (error) {
        return next(createHttpError(400, "internal error"))
    }
}

export {
    GET_SINGLE_DELIVERY_AGENT,
    GET_DELIVERY_AGENTS,
    LOG_OUT_DELIVERY_PARTNERS,
    LOG_IN_DELIVERY_PARTNERS, CREATE_PROFILE,
    DELETE_SINGLE_DELIVERY_AGENT
}