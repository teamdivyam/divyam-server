import createHttpError from 'http-errors';
import AreaZoneModel from './areaZoneModel.js';
// regex for areaPinCode
import logger from '../config/logger.js';

import {
    NEW__AREA__ZONE__VALIDATE__SCHEMA,
    GET__AREA__ZONE__VALIDATE__SCHEMA,
    GET_ALL_AREA_ZONES_SCHEMA_VALIDATION,
    PIN_CODE_VERIFY_SCHEMA,
} from "../validations/areaZone/index.js"
import areaPinModel from './areaPinCodeModel.js';
import moment from 'moment';



const SET_NEW_AREA_ZONE = async (req, res, next) => {
    try {
        const { error, value } = NEW__AREA__ZONE__VALIDATE__SCHEMA.validate(req.body);

        if (error) {
            return next(createHttpError(error?.details[0].message))
        }

        const reqDATA = value;

        const start = new Date(reqDATA?.startDate)
        const end = new Date(reqDATA?.endDate)


        const query = {
            areaPinCode: reqDATA?.areaPinCode,
            state: reqDATA?.state,
            district: reqDATA?.district,
            startDate: start,
            endDate: end,
        }

        const AreaZone = await AreaZoneModel.find(query);

        if (AreaZone.length > 0) {
            return next(createHttpError(401, "Area is already registered "))
        }

        // DATA 
        const prettyDATA = {
            areaPinCode: reqDATA?.areaPinCode,
            state: reqDATA?.state,
            district: reqDATA?.district,
            startDate: start,
            endDate: end,
            "isAvailable": reqDATA?.isAvailable
        }



        const newAreaZone = await AreaZoneModel.create(prettyDATA)

        if (!newAreaZone) {
            return next(createHttpError(401, "invalid request."))
        }


        res.status(201).json({ success: true, msg: "Successfully new area zone is created." })
    } catch (error) {
        return next(createHttpError(400, `Invalid requests || ${error}`))
    }
}

const CHECK_AREA_STATUS = async (req, res, next) => {
    try {
        const { error, value } = GET__AREA__ZONE__VALIDATE__SCHEMA.validate(req.body);

        if (error) {
            return next(createHttpError(400, `ERR_MSG${error?.details[0]?.message}`));
        }

        const { state, district, startDate, endDate, areaPinCode } = req.body;

        // build query

        let start = moment.tz(startDate, 'DD/MM/YYYY', 'Asia/Kolkata');
        let end = moment.tz(endDate, 'DD/MM/YYYY', 'Asia/Kolkata');


        let searchQuery = { state, district, areaPinCode };


        if (!start.isValid() || !end.isValid()) {
            console.log('start or end is invalid');
            return next(createHttpError(400, "Invalid date format"));
        } else {
            start = start.toISOString();
            end = end.toISOString();
        }

        // insert dates inside query
        searchQuery["start"] = start;
        searchQuery["end"] = end;

        if (moment(start).isAfter(moment(end))) {
            return next(createHttpError(400, "Start date cannot be after end date"));
        }

        // MongoDB Query to check availability
        const isAvailable = await AreaZoneModel.find({
            startDate: { $lte: start },
            endDate: { $gte: end },
            areaPinCode: areaPinCode,
            district: district
        });

        if (!isAvailable.length) {
            return next(createHttpError(404, "No results found"));
        }


        return res.status(200).json({
            success: true,
            responseStatus: 200,
            msg: "Services are available in your area",
        });


    } catch (error) {
        logger.error(`Error on areaZoneController ${error.message}`)
        return next(createHttpError(401, `ERR_0${error}`))
    }
}


const UPDATE_AREA_ZONE = async (req, res, next) => {
    try {
        const AREA_ZONE_ID = req?.params?.AREA_ZONE_ID;

        if (!AREA_ZONE_ID) {
            return next(createHttpError(400, "invalid request."))
        }
        const { error, value } = NEW__AREA__ZONE__VALIDATE__SCHEMA.validate(req.body);
        if (error) {
            return next(createHttpError(401, error?.details.at(0).message))
        }

        const reqDATA = value;

        const isAreaExist = await AreaZoneModel.findById(AREA_ZONE_ID);

        if (!isAreaExist) {
            return next(createHttpError(400, "oops Invalid request."))
        }

        const prettyDATA = {
            state: reqDATA?.state,
            district: reqDATA?.district,
            areaPinCode: reqDATA?.areaPinCode,
            startDate: new Date(reqDATA?.startDate),
            endDate: new Date(reqDATA?.endDate),
            isAvailable: reqDATA?.isAvailable,
        }

        const update_AreaZone = await AreaZoneModel.findByIdAndUpdate(AREA_ZONE_ID, prettyDATA)

        if (!update_AreaZone) {
            return next(createHttpError(401, "Internal error.."))
        }

        return res.status(201).json({
            success: true,
            msg: "Successfully updated area zones"
        })

    } catch (error) {
        logger.error(`Error on areaZoneController ${error.message}`)
        return next(createHttpError(401, `Internal error ${error?.message}`))
    }
}

const GET_ALL_AREA_ZONES = async (req, res, next) => {
    try {
        const { error, value } = GET_ALL_AREA_ZONES_SCHEMA_VALIDATION.validate(req.query);

        if (error) {
            return next(createHttpError(401, error?.details.at(0).message))
        }

        const reqDATA = value;

        const page = parseInt(reqDATA.page) || 1;
        const limit = parseInt(reqDATA.limit) || 10;

        const skip = (page - 1) * limit;

        if (skip < 0) {
            return next(createHttpError(401, "Invalid request.."))
        }

        const areaZone = await AreaZoneModel.find({},
            { __v: 0, createdAt: 0, updatedAt: 0 }).limit(limit).skip(skip);


        if (!areaZone.length) {
            return next(createHttpError(401, "Oops no data found"))
        }


        return res.status(200).json({ success: true, responseData: areaZone })
    } catch (error) {
        logger.error(`Error on areaZoneController ${error.message}`)
        return next(createHttpError(401, "Internal Errors"))
    }
}

const GET_SINGLE_AREA_ZONE = async (req, res, next) => {
    try {
        const AREA_ZONE_ID = req?.params.AREA_ZONE_ID;
        if (!AREA_ZONE_ID) {
            return next(createHttpError(401, "Invalid Area ID"))
        }

        const AreaZone = await AreaZoneModel.findById(AREA_ZONE_ID, { createdAt: 0, updatedAt: 0, __v: 0 });

        if (!AreaZone) {
            return next(createHttpError(400, "Invalid requests"))
        }
        // On Success
        return res.json({ success: true, responseData: AreaZone })
    } catch (error) {
        logger.error(`Error on areaZoneController ${error.message}`)
        return next(createHttpError(401, "Internal error"))
    }
}
const DELETE_AREA_ZONE = async (req, res, next) => {
    try {
        const AREA_ZONE_ID = req?.params?.AREA_ZONE_ID;

        if (!AREA_ZONE_ID) {
            return next(createHttpError(400, "invalid request"))
        }

        const AreaZone = await AreaZoneModel.findByIdAndDelete(AREA_ZONE_ID);
        if (!AreaZone) {
            return next(createHttpError(400, "invalid area zone id"))
        }
        // On Success
        return res.status(201).json({ success: true, msg: "Successfully deleted." })

    } catch (error) {
        logger.error(`Error on areaZoneController ${error.message}`)
        return next(createHttpError(401, "Internal error"))
    }
}

const GET_ALL_PIN_CODES = async (req, res, next) => {
    try {
        const fetchPinCodeDetails = await AreaZoneModel.find({}, {
            _id: 0,
            startDate: 0, endDate: 0, updatedAt: 0, __v: 0
        });

        if (!fetchPinCodeDetails) {
            return next(createHttpError(401, "Oops No data available"))
        }

        return res.status(200).json(fetchPinCodeDetails)

    } catch (error) {
        logger.info(error.message)
        return next(createHttpError(400, "Internal error.."))
    }
}


const PINCODE_VERIFY = async (req, res, next) => {
    try {
        const { error, value } = PIN_CODE_VERIFY_SCHEMA.validate(req.body);
        if (error) {
            return next(createHttpError(400, error?.details[0].message))
        }

        const { areaPinCode } = req.body;

        const isPinCodeAvailable = await AreaZoneModel.findOne(
            {
                areaPinCode: areaPinCode,
                isAvailable: true
            }
        );

        if (isPinCodeAvailable) {
            return next(createHttpError(400, "We haven’t reached your area yet, but we’re expanding soon!"));
        }

        // onSuccess
        return res.status(200).json(
            {
                success: true,
                msg: "Welcome! We’re happy to serve your area. Let’s get started!"
            }
        );

    } catch (error) {
        return next(createHttpError(400, "Something went wrong."))
    }
}

export {
    CHECK_AREA_STATUS,
    SET_NEW_AREA_ZONE,
    UPDATE_AREA_ZONE,
    GET_ALL_AREA_ZONES,
    DELETE_AREA_ZONE,
    GET_SINGLE_AREA_ZONE,
    GET_ALL_PIN_CODES,
    PINCODE_VERIFY
}

