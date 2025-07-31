import createHttpError from "http-errors";
import userModel from './userModel.js'
import otpModel from './otpSchema.js'
import jwt from 'jsonwebtoken';
import { config } from '../config/_config.js'
import { nanoid } from "nanoid";
import UploadImageOnServer from "../services/UploadImageOnServer.js";
import generateOtp from "../utils/generateOtp.js";
import moment from "moment";
import { UAParser } from "ua-parser-js";
import sendOTP from "../services/sendOTP.js"
import isEmailUnique from "../utils/isEmailUnique.js";
import {
    RegisterUserValidateSchema,
    otpValidateSchema,
    UPDATE_USER_VALIDATE_SCHEMA,
    VALIDATE_USER_ADDRESS
} from "../Validators/users/schema.js";
import logger from "../logger/index.js";

// Register User with Mobile Number..
const RegisterUser = async (req, res, next) => {
    try {
        const { error, value } = RegisterUserValidateSchema.validate(req.body)

        if (error) {
            next(createHttpError(400, error.details.at(0).message))
            return
        }
        const reqDATA = value;

        /**
         *  Generate OTP
         * 
         */

        const generateOTP = generateOtp(4);

        // SEND OTP THROUGH  SMS_API
        // const OTP = await sendOTP(newOtp, reqDATA?.mobileNum)
        // console.log("OTP_DB", OTP);

        // if (OTP.return == false) {
        //     return next(createHttpError(401, "SMS_API_ERROR"))
        // }
        // USER MODEL...
        const isUserExists = await userModel.findOne({ mobileNum: reqDATA?.mobileNum })

        // FOR NEW USERS..
        if (!isUserExists) {
            const user_ID = nanoid();
            const newOTP = await otpModel.create({ otp: generateOTP, userId: null, isVerified: false });
            const user = await userModel.create({ id: user_ID, mobileNum: reqDATA.mobileNum, otp: newOTP?._id });

            newOTP.userId = user._id;
            await newOTP.save()
            // For New Users send  Response..
            return res.json(
                {
                    success: true,
                    otp: generateOTP
                }
            )

        }

        // FOR EXISTING USERS..
        try {
            const UserOtp = await otpModel.create({ otp: generateOTP, userId: isUserExists._id });
            isUserExists.otp = UserOtp._id;

            await isUserExists.save();

            return res.status(200).json({
                success: true,
                otp: generateOTP
            });
        } catch (error) {
            console.log(error);
            return next(createHttpError(401, "Something went wrong.."))
        }

    } catch (error) {
        logger.error(
            `Failed to Register User: ${error.message}, Error stack: ${error.stack}`
        );

        next(createHttpError(401, `ERR.${error}`))
        return;
    }
}


const UpdateUser = async (req, res, next) => {
    try {
        const USER_ID = req.user.id;

        if (!USER_ID) {
            return next(createHttpError(400, "Internal error"));
        }

        const { error, value } = UPDATE_USER_VALIDATE_SCHEMA.validate(req.body);

        if (error) {
            return next(createHttpError(400, error.details[0].message))
        }
        const { fullName, dob, email, address, areaPinCode, gender } = req.body;
        const isUniqueEmail = await isEmailUnique(email, USER_ID);

        if (!isUniqueEmail) {
            return next(createHttpError(400, "Email already in use by another account"));
        }

        const UPDATE_EXISTING_USER = await userModel.findByIdAndUpdate(
            { _id: USER_ID },
            {
                fullName,
                dob,
                email,
                address,
                areaPin: areaPinCode,
                gender
            }
        );

        if (!UPDATE_EXISTING_USER) {
            return next(createHttpError(400, "Opps! something went wrong please try again later."))
        }

        UPDATE_EXISTING_USER.isVerified = true;
        await UPDATE_EXISTING_USER.save();

        // onSuccess
        return res.status(200).json(
            {
                success: true,
                msg: "Profile updated successfully."
            }
        )
    } catch (error) {
        logger.error(
            `Failed to update user data: ${error.message}, Error stack: ${error.stack}`
        );

        return next(createHttpError(400, `something went wrong please try again later ${error}`))
    }
}

const UPDATE_PROFILE_PICTURE = async (req, res, next) => {
    try {
        const USER_ID = req.user.id;

        if (!USER_ID) {
            return next(createHttpError(400, "Please try again later."))
        }
        const file = req.file;

        if (!file) {
            return next(createHttpError(400, `something went wrong please try again later`))
        }

        const UPLOAD_FILE_ON_SERVER = await UploadImageOnServer(file, "USER");
        const SPLIT_FILE_NAME = UPLOAD_FILE_ON_SERVER.fileName.split("/");

        const fileName = SPLIT_FILE_NAME[SPLIT_FILE_NAME.length - 1];

        const avatarURL = `${config.CLOUDFRONT_PATH}/Uploads/users/${fileName}`;
        if (!avatarURL) {
            return next(createHttpError(400, "Something went wrong."))
        }

        const USER = await userModel.findByIdAndUpdate(
            { _id: USER_ID },
            { avatar: fileName }
        );

        if (!USER) {
            return next(createHttpError(400, `something went wrong please try again later`))
        }

        // onSuccess

        return res.status(200).json(
            {
                msg: "profile picture uploaded successfully",
                avatar: avatarURL
            }
        )

    } catch (error) {
        logger.error(
            `Failed to update user profile picture: ${error.message}, Error stack: ${error.stack}`
        );

        return next(createHttpError(400, `something went wrong please try again later`))
    }
}

const USER_PRFOILE = async (req, res, next) => {
    try {
        const USER_ID = req.user.id;
        const User = await userModel.findById(USER_ID,
            { accessToken: 0, updatedAt: 0, role: 0, otp: 0, orders: 0, __v: 0, createdAt: 0, orderAddress: 0 });

        if (!User) {
            return next(createHttpError(400, "Something went wrong"));
        }

        let formatDOB;
        if (User?.dob) {
            formatDOB = moment(User?.dob).format("DD/MM/YYYY");
        }

        var profile;
        if (User.avatar) {
            profile = `${config.CLOUDFRONT_PATH}/Uploads/users/${User.avatar}`;
        }

        const user = {
            ...User._doc,
            dob: formatDOB || null,
            avatarURL: profile,
        }

        return res.status(200).
            json(
                {
                    success: true,
                    user
                }
            );

    } catch (error) {
        logger.error(
            `Failed to get user profile : ${error.message}, Error stack: ${error.stack}`
        );
        return next(createHttpError(400, "Oops internal errors "))
    }
}

// WHOAMI
const WHOAMI = async (req, res, next) => {
    try {
        const USER_ID = req.user.id;

        if (!USER_ID) {
            return next(createHttpError(400, "Oops somethimg went wrong"))
        }

        const user = await userModel.findById(USER_ID).lean();



        if (!user) {
            return next(createHttpError(400, "Something went wrong"))
        }

        // on success

        const deviceIdInHeader = req?.headers['x-device-id'] || null;
        console.log(deviceIdInHeader);

        // let deviceId;
        // if (deviceIdInHeader === null) {
        //     // create fesh device id 
        //     (async () => {
        //         deviceId = nanoid(20)
        //     })()
        // }
        // // use old one as a device id
        // deviceId = deviceIdInHeader

        // on-Success
        return res.status(200).json(
            {
                success: true,
                statusCode: 200,
                user: {
                    isVerified: user?.isVerified,
                    fullName: user?.fullName || null,
                    role: user.role || 'user',
                }
            }
        );

    } catch (error) {
        logger.error(
            `WHOAMI: ${error.message}, Error stack: ${error.stack}`
        );

        return next(createHttpError(400, "Something went wrong"))
    }
}

// Validate SChema for OTP
const VERIFY_OTP = async (req, res, next) => {
    /*
     1 get mobile number and OTP from clint and verify it.
    */
    try {
        // Validate request body
        const { error, value } = otpValidateSchema.validate(req.body);
        if (error) {
            return next(createHttpError(401, error?.details[0]?.message));
        }

        const { mobileNum, clientOtp } = value;

        const user = await userModel.findOne({ mobileNum });

        if (!user) {
            return next(createHttpError(401, "Unauthorized..1"))
        }

        // extract Otp Id from user Db..
        const userOtp = user.otp;

        if (!userOtp) {
            return next(createHttpError(401, "Please try agaian later"))
        }

        const Otp = await otpModel.findById(userOtp);

        if (!Otp) {
            return next(createHttpError(401, "Please try agaian later"))
        }

        // if OTP is already use or Verified return false..
        if (Otp.isVerified) {
            return next(createHttpError(400, "Please try agaian later"))
        }
        // validate client and DB OTP

        if (clientOtp !== Otp.otp) {
            return next(createHttpError(400, "Please try agaian later"))
        }

        // ON Success..
        const token = jwt.sign({ id: user._id, role: user.role }, config.USER_SECRET,
            { expiresIn: "7d" });

        // validate otp in the OTP_DB for validation
        Otp.isVerified = true;
        await Otp.save()
        await user.save();


        // SEND COOKIES -
        const COOKIES_CONFIG = {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        }

        res.cookie('token', token, COOKIES_CONFIG);

        return res.status(200).json({
            id: user?._id,
            success: "true",
            msg: "OTP verified successfully",
        });

    } catch (error) {
        logger.error(
            `Failed to verify user: ${error.message}, Error stack: ${error.stack}`
        );
        next(createHttpError(500, `error occurred ${error}`));
    }
};


const GUEST_USER = async (req, res, next) => {
    const visitor = req.visitor;
    const parser = new UAParser();

    try {
        const userAgent = req.headers["user-agent"];

        if (!userAgent) {
            return next(createHttpError(400, "Invalid request"))
        }

        parser.setUA(userAgent);
        const browser = parser.getResult();

        const userInfo = {
            browserName: browser.browser.name,
            browserVersion: browser.browser.version,
            osName: browser.os.name,
            osVersion: browser.os.version,
            device: browser.device.model || 'Unknown',
            isMobile: /Mobi|Android/i.test(browser),
            isTablet: /Tablet|iPad/i.test(browser),
            isDesktop: !/Mobi|Android|Tablet|iPad/i.test(browser) &&
                (browser.os.name === 'macOS' || browser.os.name === 'Windows' || browser.os.name === 'Linux'),
        }


        const session_ID = await jwt.sign(
            userInfo,
            config.GUEST_USERS_SECRET,
            { expiresIn: "7d" }
        );

        const COOKIES_CONFIG = {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: true,
            maxAge: 8 * 24 * 60 * 60 * 1000 // 8 days
        }


        // if visitor visit for the first time 
        if (!visitor || !visitor.length) {
            res.cookie("session", session_ID, COOKIES_CONFIG);
        }

        return res.status(200).json(
            {
                deviceId: nanoid(20),
                success: true,
                status: 200,
            }
        )

    } catch (error) {
        logger.error(
            `Failed to extract guest Users: ${error.message}, Error stack: ${error.stack}`
        );
        return next(createHttpError(400, error))
    }
}

const LOGOUT_USER = async (req, res, next) => {
    try {
        res.clearCookie('token', { path: "/" });

        return res.status(200).json({
            success: true,
        });

    } catch (error) {
        logger.error(
            `Failed to Log-out user: ${error.message}, Error stack: ${error.stack}`
        );
        return next(createHttpError(400, "Something went wrong"))
    }
}

// Address

const ADD_NEW_ADDRESS = async (req, res, next) => {
    try {
        const USER_ID = req.user.id;

        const { error, value } = VALIDATE_USER_ADDRESS.validate(req.body);
        const { area, landMark, pinCode, state, contactNumber, city } = req.body;

        if (error) {
            return next(createHttpError(error?.details[0].message));
        }

        const isAddressLengthGreaterThanTen = await userModel.findById(USER_ID);

        if (isAddressLengthGreaterThanTen?.orderAddress?.length >= 10) {
            return next(createHttpError(400, "Limit reached Remove an address to add a new one"));
        }

        const Insert_New_Address = await userModel.findById(USER_ID);

        Insert_New_Address.orderAddress.push({
            area,
            landMark,
            city,
            state,
            contactNumber,
            pinCode,
        });

        await Insert_New_Address.save();

        if (!Insert_New_Address) {
            return next(createHttpError(400, "Something wen wrong"))
        }

        return res.status(200).json(
            {
                success: true,
                msg: "successfully new address added"
            }
        )

    } catch (error) {
        return next(createHttpError(400, "Internal error", error))
    }
}

const UPDATE_EXISTING_ADDRESS = async (req, res, next) => {
    try {
        const USER_ID = req.user.id;
        const ADDRESS_ID = req.params.ADDRESS_ID;

        const { error, value } = VALIDATE_USER_ADDRESS.validate(req.body);
        if (error) {
            return next(createHttpError(400, error?.details[0].message))
        }

        const { area, landMark, pinCode, state, contactNumber, city } = req.body;

        const user = await userModel.findById(USER_ID);

        if (!user) {
            return next(createHttpError(400, "Something went wrong"))
        }

        const updatedValue = {
            area, landMark, pinCode, state, contactNumber, city
        }

        let addressFound = false;

        const updatedAddresses = user.orderAddress.map((item) => {
            if (item._id.toString() === ADDRESS_ID.toString()) {
                addressFound = true;
                return { ...item.toObject(), ...updatedValue }; // preserve _id
            }
            return item;
        });


        user.orderAddress = updatedAddresses;
        await user.save();

        // On Success
        return res.status(200).json(
            {
                success: true,
                msg: "successfully Updated address with new value"
            }
        )

    } catch (error) {
        return next(createHttpError(400, "Internal error"))
    }
}

const SET_DEFAULT_ADDRESS = async (req, res, next) => {
    try {
        const USER_ID = req.user.id;
        const ADDRESS_ID = req.params.ADDRESS_ID;

        const user = await userModel.findById(USER_ID);

        if (!user) {
            return next(createHttpError(400, "Something went wrong.."))
        }

        const defaultAddress = user.orderAddress.map((item) => {
            if (item._id.toString() == ADDRESS_ID.toString()) {
                return { ...item.toObject(), isActive: true }
            }
            return { ...item.toObject(), isActive: false }
        });

        user.orderAddress = defaultAddress;
        await user.save();

        // onSuccess
        return res.status(200).json(
            {
                success: true,
            }
        )

    } catch (error) {
        return next(createHttpError(400, "Something went wrong"))
    }
}

const GET_PRIMARY_ADDRESS = async (req, res, next) => {
    try {
        const USER_ID = req.user.id;

        const user = await userModel.findById(USER_ID).lean();

        if (!user) {
            return next(createHttpError(400, "Something went wrong."));
        }

        const primaryAddress = user.orderAddress.filter((item) => {
            if (item.isActive === true) {
                return item
            }
        });

        return res.status(200).
            json(
                {
                    success: true,
                    shippingAddress: primaryAddress
                }
            )
    } catch (error) {
        return next(createHttpError(400, "Something went wrong.."))
    }
}


const GET_ALL_ADDRESS = async (req, res, next) => {
    try {
        const USER_ID = req.user.id;
        const user = await userModel.findById(USER_ID).lean();

        if (!user || !user.orderAddress) {
            return next(createHttpError(400, "Something went wrong"))
        }

        if (!user.orderAddress.length) {
            return next(createHttpError(400, "There is no address with this user"))
        }

        return res.status(200).json({
            msg: "Success",
            address: user.orderAddress
        })


    } catch (error) {
        return next(createHttpError(400, "Internal error"))
    }
}


const DELETE_SINGLE_ADDRESS = async (req, res, next) => {
    try {
        const USER_ID = req.user.id;
        const ADDRESS_ID = req.params.ADDRESS_ID;

        if (!USER_ID || !ADDRESS_ID) {
            return next(createHttpError(400, "Something went wrong"))
        }
        const user = await userModel.findById(USER_ID);

        if (!user.orderAddress) {
            return next(createHttpError(400, "Address is not available at this moment"))
        }

        if (!user) {
            return next(createHttpError(400, "Something went wrong"))
        }

        user.orderAddress.pull({ _id: ADDRESS_ID })
        await user.save();

        return res.status(200).json(
            {
                success: true,
                msg: "Address removed successfully"
            }
        )
    } catch (error) {
        return next(createHttpError(400, "Internal error."))
    }
}

export {
    RegisterUser,
    VERIFY_OTP,
    UpdateUser,
    UPDATE_PROFILE_PICTURE,
    LOGOUT_USER,
    USER_PRFOILE,
    WHOAMI,
    GUEST_USER,
    ADD_NEW_ADDRESS,
    GET_ALL_ADDRESS,
    SET_DEFAULT_ADDRESS,
    DELETE_SINGLE_ADDRESS,
    UPDATE_EXISTING_ADDRESS,
    GET_PRIMARY_ADDRESS
}