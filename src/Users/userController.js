import createHttpError from "http-errors";
import Joi from "joi";
import userModel from './userModel.js'
import otpModel from './otpSchema.js'
import userRegisterSchema from "./userRegisterValidateSchema.js";
import jwt from 'jsonwebtoken';
import { config } from '../config/_config.js'
import sendOTP from "../services/sendOTP.js"
import { nanoid } from "nanoid";
import UploadImageOnServer from "../services/UploadImageOnServer.js";
import handleImage from '../utils/handleImage.js';

import {
    RegisterUserValidateSchema,
    otpValidateSchema
} from "../validations/users/index.js"


// Register User with Mobile Number..
const RegisterUser = async (req, res, next) => {
    try {
        const { error, value } = RegisterUserValidateSchema.validate(req.body)

        if (error) {
            next(createHttpError(400, "Please fill the form carefully"))
            return
        }
        const reqDATA = value;

        //   Function return OTP..
        function generateOTP() {
            const newOtp = Math.floor(100000 + Math.random() * 900000);
            return newOtp.toString();
        }
        const newOtp = generateOTP()

        // SEND OTP THROUGH  SMS_API
        const OTP = await sendOTP(newOtp, reqDATA?.mobileNum)
        console.log("OTP_DB", OTP);

        if (OTP.return == false) {
            return next(createHttpError(401, "SMS_API_ERROR"))
        }
        // END-- SMS_API

        // USER MODEL...
        const isUserExists = await userModel.findOne({ mobileNum: reqDATA?.mobileNum })

        // FOR NEW USERS..
        if (!isUserExists) {
            const user_ID = nanoid();
            const newOTP = await otpModel.create({ otp: newOtp, userId: null, isVerified: false });
            const user = await userModel.create({ id: user_ID, mobileNum: reqDATA.mobileNum, otp: newOTP?._id });

            newOTP.userId = user._id;
            await newOTP.save()

            // For New Users send  Response..
            return res.json(
                {
                    success: true,
                }
            )

        }

        // FOR EXISTING USERS..
        try {
            const UserOtp = await otpModel.create({ otp: newOtp, userId: isUserExists._id, isVerified: false });

            isUserExists.otp = UserOtp._id;

            await isUserExists.save();

            return res.status(200).json({
                success: true,
            });
        } catch (error) {
            return next(createHttpError(401, "Something went wrong.."))
        }


    } catch (error) {
        console.log(error);
        next(createHttpError(401, `ERR.${error}`))
        return
    }


    //  insert user Mobile number into Db..
    //  Generate OTP using MAth obj
    //  store otp into db 
    // if all is good return success


}

const UpdateUser = async (req, res, next) => {
    const userID = req.params.userID;
    if (!userID) {
        next(createHttpError(401, "Please fill the form carefully.."))
    }

    if (userID !== req.user) {
        return next(createHttpError(401, "Unauthorize.."))
    }

    const { fullName, age, gender, address, role, areaPin } = req.body;

    const { error, value } = userRegisterSchema.validate(req.body)

    if (error) {
        next(createHttpError(401, "Please fill the form carefully.."))
    }

    if (!userID) {
        next(createHttpError(401, "User Id Required.."))
    }

    try {
        const isExistingUser = await userModel.findById(userID)

        if (!isExistingUser) {
            next(createHttpError(401, "User Id Not found...."))
        }

        // check for file is present or not
        let fileName;
        if (req.file) {
            // const processImage = await handleImage(req.file)
            const UploadProfile = await UploadImageOnServer(req.file, "USER")
            fileName = UploadProfile.fileName.split("/")[2]
        }

        // Update all the details..
        isExistingUser.fullName = fullName;
        isExistingUser.age = age;
        isExistingUser.gender = gender;
        isExistingUser.address = address;
        isExistingUser.role = role;
        isExistingUser.areaPin = areaPin;

        isExistingUser.avatar = fileName ? fileName : null

        if (isExistingUser.fullName &&
            isExistingUser.age &&
            isExistingUser.gender &&
            isExistingUser.address &&
            isExistingUser.role &&
            isExistingUser.areaPin
        ) {
            isExistingUser.isVerified = true;
        }

        await isExistingUser.save();
        // Temp..
        res.json({
            success: "true",
            msg: "Successfully updated..",
            // user: isExistingUser

        })
    } catch (error) {
        next(createHttpError(401, `${error.message}`))
    }
}

// Validate SChema for OTP

const verifyOTP = async (req, res, next) => {
    /*
     1 get mobile number and OTP from clint and validate it.
     2 check for mobile isMobileNumber new ..
     3   
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
            return next(createHttpError(401, "Invalid otp..1"))
        }

        const Otp = await otpModel.findById(userOtp);

        if (!Otp) {
            return next(createHttpError(401, "invalid Otp.2"))
        }

        // if OTP is already use or Verified return false..
        if (Otp.isVerified) {
            return next(createHttpError(400, "resend otp."))
        }
        // validate client and DB OTP

        console.log("LOG OTP=>", clientOtp, Otp.otp);

        if (clientOtp !== Otp.otp) {
            return next(createHttpError(400, "Invalid Otp..3"))
        }

        // ON Success..

        // // send auth User Id to frontend for Verification
        // // along with simple response we will also. send Token for AUTH..

        const token = jwt.sign({ id: user._id, role: user.role }, config.USER_SECRET)
        user.accessToken = token;

        // validate otp in the OTP_DB for validation
        Otp.isVerified = true;

        await Otp.save()

        await user.save();
        // Save Token inside Db Too..

        // SEND COOKIES
        res.cookie('token', token, {
            httpOnly: true,
            secure: 'production',
            sameSite: 'strict'
        });

        return res.status(200).json({
            success: "true",
            msg: "OTP verified successfully",
            accessToken: token
        });

        // On Success 
        // Delete OTP FROM DB TO..

    } catch (error) {
        console.error(error.message);
        next(createHttpError(500, `error occurred ${error}`));
    }
};



export { RegisterUser, UpdateUser, verifyOTP }