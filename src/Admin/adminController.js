import {
    RegisterUserValidateSchema,
    AdminLoginValidateSchema,
    CHANGE_ADMIN_PASSWORD_SCHEMA_VALIDATION,
    GET_ALL_USERS_SCHEMA_VALIDATION,
    VALIDATE_SEARCH_SCHEMA,
    SEARCH_AGENTS_VALIDATIONS_SCHEMA
} from "../Validators/admins/schema.js"

import bcrypt from "bcryptjs";
import createHttpError from "http-errors";
import adminModel from '../Admin/adminModel.js'
import { config } from "../config/_config.js";
import jwt from "jsonwebtoken";
import userModel from "../Users/userModel.js";
import orderModel from '../Orders/orderModel.js';

import UploadImageOnServer from "../services/UploadImageOnServer.js";
import handleImage from "../utils/handleImage.js";
import DeliveryPartnerModel from "../DeliveryPartners/DeliveryPartnerModel.js";
import verifyRecaptcha from "../utils/verifyRecaptchaToken.js";
import getPreSignedURL from "../services/getPreSignedUrl.js";
import Order from "../Orders/orderModel.js";
import moment from "moment";
import logger from "../logger/index.js";

const RegisterAdmin = async (req, res, next) => {

    if (!config.SHOW_ADMIN_REGISTER_PAGE) {
        return res.json(400).json({
            msg: "Can not register at this moment"
        })
    }
    try {
        // validate Req Body..
        const { error, value } = RegisterUserValidateSchema.validate(req?.body);

        if (!req?.file) {
            return next(createHttpError(400, "Failed to upload file  on server."))
        }

        const reqBody = value;
        if (error) {
            return next(createHttpError(401, `${error?.details[0]?.message}`))
        }
        // Check for user is exist in the DB or not..
        const isAdminExists = await adminModel.findOne(
            {
                mobileNum: reqBody.mobileNum,
                email: reqBody.email,
            }
        );

        if (isAdminExists) {
            return next(createHttpError(401, "Already Registered Please Login.."))
        }

        const hashPassword = await bcrypt.hash(reqBody.password, 10)
        if (!hashPassword) {
            return next(createHttpError(401, "Internal error."))
        }

        const uploadFile = await UploadImageOnServer(req?.file, "ADMIN");

        const fileName = uploadFile.fileName.split("/")[2]
        // On Success.
        const prettyData = {
            fullName: reqBody.fullName,
            mobileNum: reqBody.mobileNum,
            email: reqBody.email,
            password: hashPassword,
            avatar: fileName,
        }

        const admin = await adminModel.create(prettyData)

        if (!admin) {
            return next(createHttpError(401, "Internal Error.."))
        }


        res.status(200).json({
            success: true,
            msg: "Registered successfully.."
        })

    } catch (error) {
        logger.error(`${error}, Error msg ${error.message}`)
        next(createHttpError(401, `Err ${error.message}`))
    }
}

const LoginAdmin = async (req, res, next) => {
    try {
        const { error, value } = AdminLoginValidateSchema.validate(req.body)
        // Validate body..

        if (error) {
            logger.info(error)
            return next(createHttpError(401, `${error?.details[0]?.message}`))
        }
        const reqData = value

        // check-recaptcha-verification-only-in-production
        if (config.PRODUCTION === true) {
            const isValidRecaptchToken = await verifyRecaptcha(reqData.recaptchaToken);

            if (!isValidRecaptchToken) {
                return next(createHttpError(400, "reCAPTCHA failed or score too low"))
            }

            if (isValidRecaptchToken) {
                logger.info('ADMIN-Recaptch-verification passed')
            }
        }


        // Check user exist in the DB 
        const isAdmin = await adminModel.findOne({ email: reqData.email });

        if (!isAdmin) {
            return next(createHttpError(401, "Please Register Your account or check Your email address."))
        }

        // Check for Admin Email..
        // if (isAdmin.email !== reqData.email) {
        //     return next(createHttpError(401, "Please enter correct email address..."))
        // }

        const decodedPassword = await bcrypt.compare(reqData.password, isAdmin.password);

        if (!decodedPassword) {
            return next(createHttpError(401, "Please check your email and password.."))
        }

        const payload = { id: isAdmin._id, role: isAdmin.role };

        const accessToken = jwt.sign(payload, config.ADMIN_SECRET, { expiresIn: "7h" });

        // Save Token Inside DB TOO..
        isAdmin.accessToken = accessToken;
        await isAdmin.save()

        // On Success
        logger.info("Admin logged in successfully..");

        // Log in user and send token as a response
        return res.status(200).json(
            {
                success: true,
                token: accessToken,
            }
        );

    } catch (error) {
        logger.error(`${error}, Error msg ${error.message}`)
        return next(createHttpError(401, `log from Admin Login ${error}`))
    }

}


const GET_ALL_USERS = async (req, res, next) => {
    try {
        const { error, value } = GET_ALL_USERS_SCHEMA_VALIDATION.validate(req.query)

        if (error) {
            return next(createHttpError(401, error?.details[0].message))
        }
        const reqData = value;

        const page = parseInt(reqData.page) || 1
        const limit = parseInt(reqData.limit) || 1

        const skip = (page - 1) * limit;

        if (skip < 0) {
            return next(createHttpError(401, "Invalid request.."))
        }

        const users = await userModel.find({}, { updatedAt: 0, __v: 0, accessToken: 0, createdAt: 0, id: 0 }).limit(limit).skip(skip).lean();

        // map over array and insert prefix of cloudFront URL

        const ALL_USERS = users.map((user) => {
            var avatarURL;
            if (user.avatar) {
                avatarURL = `${config.CLOUDFRONT_PATH}/Uploads/users/${user.avatar}`;
            }

            return {
                ...user,
                avatar: avatarURL
            }
        })

        if (!users.length) {
            return next(createHttpError(401, "no records founds"))
        }


        return res.status(200).json(ALL_USERS)
    } catch (error) {
        logger.error(`${error}, Error msg ${error.message}`)
        return next(createHttpError(401, error))
    }
}

const GET_SINGLE_USERS = async (req, res, next) => {
    try {
        const USER_ID = req?.params?.USER_ID;
        if (!USER_ID) {
            return next(createHttpError(400, "Error  occurred.."))
        }

        const user = await userModel.findById(USER_ID,
            { updatedAt: 0, __v: 0, accessToken: 0, _id: 0, otp: 0 });

        if (!user) {
            return next(createHttpError(401, "Error occurred during fetching users..2"))
        }

        var avatarURL;
        if (user.avatar) {
            avatarURL = `${config.CLOUDFRONT_PATH}/Uploads/users/${user.avatar}`;
        }

        const userJoinedDate = moment(user.createdAt).format("DD-MM-YYYY");

        const prettyData = {
            fullName: user.fullName,
            gender: user.gender,
            address: user.address,
            mobileNum: user.mobileNum,
            role: user.role,
            areaPin: user.areaPin,
            avatar: avatarURL,
            dob: user.dob,
            createdAt: userJoinedDate,
            orders: user?.orders || null
        };

        return res.status(200).json(prettyData)


    } catch (error) {
        console.log(error);
        logger.error(`${error}, Error msg ${error.message}`)
        return next(createHttpError(401, "Internal error please try again later.."))
    }
}

const DELETE_SINGLE_USERS = async (req, res, next) => {
    try {

        const USER_ID = req?.params?.USER_ID;

        if (!USER_ID) {
            return next(createHttpError(401, "Unauthorized.."))
        }

        const user = await userModel.findOneAndDelete({ _id: USER_ID });

        if (!user) {
            return next(createHttpError(401, "User not found.."))
        }

        // On Success

        return res.status(200).json({
            success: true,
            msg: "Successfully deleted user.."
        })

    } catch (error) {
        logger.error(`${error}, Error msg ${error.message}`)
        return next(createHttpError(500, "Internal error"))
    }
}
// VIEW_ADMIN_PROFILE

const VIEW_ADMIN_PROFILE = async (req, res, next) => {
    try {

        const ADMIN_ID = req.user;

        const admin = await adminModel.findById(ADMIN_ID, {
            updatedAt: 0, accessToken: 0, __v: 0, password: 0, _id: 0
        });

        if (!admin) {
            return next(createHttpError(401, "Invalid  Id"))
        }

        res.status(200).json(admin)
    } catch (error) {
        logger.error(`${error}, Error msg ${error.message}`)
        return next(createHttpError(401, "Error during fetching admin profile..3"))
    }
}

const CHANGE_ADMIN_PASSWORD = async (req, res, next) => {
    try {
        const { error, value } = CHANGE_ADMIN_PASSWORD_SCHEMA_VALIDATION.validate(req.body);
        const reqDATA = value;
        const ADMIN_ID = req?.user;

        if (reqDATA.password === reqDATA.newPassword) {
            return next(createHttpError(401, "Invalid request.."));
        }


        if (!ADMIN_ID) {
            return next(createHttpError(406, "Invalid request.."))
        }

        if (error) {
            return next(createHttpError(401, error?.details.at(0).message))
        }

        // CHCEK PSWD IS SAME OR NOT  IF SAME RETURN 
        const Admin = await adminModel.findById(ADMIN_ID)

        if (!Admin) {
            return next(createHttpError(406, "Invalid request.."))
        }

        // Compare old password 
        const isOldPasswordValid = await bcrypt.compare(reqDATA.password, Admin.password)

        if (!isOldPasswordValid) {
            return next(createHttpError(401, "Inavlid password"))
        }


        // On Success of Password match

        const newPasswordHash = await bcrypt.hash(reqDATA.newPassword, 10)

        Admin.password = newPasswordHash;

        await Admin.save();

        console.log("Password changed successfully...");
        return res.status(201).json({ success: true, msg: "Password change successfully" })
    } catch (error) {
        logger.error(`${error}, Error msg ${error.message}`)
        return next(createHttpError(500, `Error from CHANGE PSWD${error} `))
    }
}

const SEARCH_USERS = async (req, res, next) => {
    try {
        const searchKey = req?.query?.s;

        if (!searchKey) {
            return next(createHttpError(401, "Invalid requests.."))
        }

        const mobileNumberRegex = /^(?!(\d)\1{9})[6789]\d{9}$/;

        let searchTypeMobileNumber = mobileNumberRegex.test(searchKey);

        const searchQuery = searchTypeMobileNumber ? { mobileNum: searchKey } : { fullName: new RegExp(searchKey, 'i') }

        if (searchTypeMobileNumber) {
            const users = await userModel.findOne(searchQuery, { accessToken: 0, role: 0, otp: 0, updatedAt: 0, __v: 0, id: 0 });

            if (!users) {
                return next(createHttpError(401, `Oops no user found with ${searchKey}`))
            }

            const prettyDATA = [users]
            return res.status(200).json(prettyDATA)
        }

        // if search key is user name
        const users = await userModel.find(searchQuery, { accessToken: 0, role: 0, otp: 0, updatedAt: 0, __v: 0, id: 0 });
        if (!users) {
            return next(createHttpError(401, `Oops no user found with ${searchKey}`))
        }

        return res.status(200).json(users)


    } catch (error) {
        logger.error(`${error}, Error msg ${error.message}`)
        return next(createHttpError(401, `Internal error ${error}`))
    }
}

const SEARCH_ORDERS = async (req, res, next) => {
    try {

        const { error, value } = VALIDATE_SEARCH_SCHEMA.validate(req.query)
        if (error) {
            return next(createHttpError(400, "Invalid request"))
        }
        let SEARCH_KEY = value.searchKey;

        if (SEARCH_KEY.startsWith('order_')) {
            SEARCH_KEY = value.searchKey.substring(6);
        }

        const Order = await orderModel.findOne({ orderId: `order_${SEARCH_KEY}` },
            { updatedAt: 0, __v: 0, order_id: 0, isPackage: 0, payment_method: 0, products: 0, total_amount: 0, createdAt: 0 });

        if (!Order) {
            return next(createHttpError(401, "Invalid order id."))
        }

        const prettyDATA = {
            success: true,
            ...Order?._doc
        }

        return res.json(prettyDATA)
    } catch (error) {
        logger.error(`${error}, Error msg ${error.message}`)
        return next(createHttpError(401, `Internal errors ${error.message}`))
    }
}


const SEARCH_AGENTS = async (req, res, next) => {
    try {
        const { error, value } = SEARCH_AGENTS_VALIDATIONS_SCHEMA.validate(req.query);

        if (error) {
            return next(createHttpError(400, "invalid requests.."))
        }

        const searchAgents = await DeliveryPartnerModel.find(
            { fullName: new RegExp(value.s, 'i') });

        // console.log(value, searchAgents);
        if (!searchAgents.length || !searchAgents) {
            return next(createHttpError(400, "Noo records found"))
        }

        // on Success
        return res.status(200).json(searchAgents)

    } catch (error) {
        return next(createHttpError(400, "Internal errors.."))
    }
}

const GET_PRESIGNED_URL = async (req, res, next) => {
    try {
        const fileType = 'image/png';
        const { fileName } = req.body;

        if (!fileName) {
            return next(createHttpError(400, "Bad request please try again later."))
        }

        const signedUrl = await getPreSignedURL(config.BUCKET_NAME, fileName, fileType);

        if (!signedUrl) {
            return next(createHttpError(400, "something went wrong"))
        }
        // log data
        // console.log(`ALL_IFNO`, signedUrl, "File-path", filePath, "fileType", fileType);

        return res.status(200).json({
            success: true,
            url: signedUrl
        });
    } catch (error) {
        logger.info(`Failed during genrating PreSigned URL ${error}`)
        return next(createHttpError(400, "Something went wrong"))
    }
}


const ADMIN_DASHBOARD_ANALYTICS = async (req, res, next) => {
    try {
        // get-user-info
        // get-order-info
        const fetchOrder = await orderModel.find({}, { _id: 0 });

        // on error
        if (!fetchOrder || !fetchOrder.length) {
            return next(createHttpError(400, "Something went wrong"))
        }


        const fetchUsers = await userModel.find();

        // on error
        if (!fetchUsers || !fetchUsers) {
            return next(createHttpError(400, "Something went wrong"))
        }

        return res.json({
            Orders: fetchOrder.length,
            Users: fetchUsers.length
        })

    } catch (error) {
        return next(createHttpError(400, "Internal error"))
    }
}

const VIEW_SINGLE_ORDER_ADMIN = async (req, res, next) => {
    try {
        const { ORDER_ID } = req.params;

        const order = await orderModel.findById(ORDER_ID, { _id: 0, updatedAt: 0, __v: 0 })
            .populate(
                {
                    path: "product",
                    populate: {
                        path: "productId",
                        model: "Package",
                        select: {
                            name: 1,
                            slug: 1,
                            description: 1,
                            capacity: 1,
                            price: 1,
                            productImg: 1
                        },
                        populate: {
                            path: "productImg",
                            model: "productsimg",
                            select: {
                                imagePath: 1,
                                _id: 0
                            }
                        }
                    }
                }
            )
            .populate(
                {
                    path: "customer",
                    model: "User",
                    select: {
                        fullName: 1, gender: 1, email: 1, dob: 1, avatar: 1, address: 1, _id: 0
                    }
                }
            )
            .populate({
                path: "booking",
                select: "-_id -resourceId -customerId -__v -orderId -updatedAt"
            })
            .populate(
                {
                    path: "transaction",
                    select: "-_id -user -order -__v"
                }
            )
            .exec()


        if (!order) {
            return next(createHttpError(400, "Something went wrong."))
        }

        // response 
        return res.status(200)
            .json(
                {
                    success: true,
                    order
                }
            )

    } catch (error) {
        console.log(error)
        return next(createHttpError(400, "Something went wrong.."))
    }
}


// Only for internal Communication
const GET_ORDER_DETAILS = async (req, res, next) => {
    try {

        const { orderId } = req.body;
        const Order = await orderModel.findOne({ orderId }, { __v: 0, notes: 0 }).populate({
            path: "product",
            populate: {
                path: 'productId',
                model: "Package",
                select: { _id: 0, isVisible: 0, packageListTextItems: 0, productImg: 0, productBannerImgs: 0, __v: 0, createdAt: 0, updatedAt: 0, policy: 0, notes: 0 }
            }
        })
            .populate({
                path: "customer",
                model: "User",
                select: { _id: 0, __v: 0, otp: 0, accessToken: 0, }
            })
            .populate({
                path: "transaction",
                model: "Transaction",
                select: { _id: 0, __v: 0, createdAt: 0, updatedAt: 0, user: 0, order: 0 }
            })
            .populate({
                path: "booking",
                model: "Booking",
                select: { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 }
            })
            .lean();

        if (!Order) {
            return next(createHttpError(400, "Internal Error | can't fetch order details "))
        }

        const orderCompletedAt = moment(Order?.transaction?.completedAt).format("MM/DD/YYYY HH:mm:ss")

        return res.status(200).json({
            success: true,
            Order,
            orderCompletedAt
        });

    } catch (error) {
        return next(createHttpError(400, `Internal error ${error}`))
    }
}

export {
    RegisterAdmin,
    LoginAdmin,
    GET_ALL_USERS,
    GET_SINGLE_USERS,
    DELETE_SINGLE_USERS,
    VIEW_ADMIN_PROFILE,
    CHANGE_ADMIN_PASSWORD,
    SEARCH_USERS,
    SEARCH_ORDERS,
    SEARCH_AGENTS,
    GET_PRESIGNED_URL,
    ADMIN_DASHBOARD_ANALYTICS,
    VIEW_SINGLE_ORDER_ADMIN,
    GET_ORDER_DETAILS
}