import { config } from "../config/_config.js";
import createHttpError from "http-errors";
import crypto from "crypto"
import PackageModel from "../Package/PackageModel.js";
import userModel from '../Users/userModel.js';
import Razorpay from "razorpay";
import mongoose from "mongoose";
import OrderModel from "./orderModel.js";
const isObjectId = /^[0-9a-fA-F]{24}$/;
import generateOrderID from "../Counter/counterController.js";
import AreaZoneModel from "../AreaZone/areaZoneModel.js";
import moment from "moment";
import cartTrackingModel from "./cartTrackingModel.js";
import bookingModel from "./bookingModel.js";
import bcrypt from "bcryptjs";


import {
    TRACK_CART_SCHEMA_VALIDATOR,
    VALIATE_ORDER_BODY_SCHEMA,
    PAGINATION_SCHEMA_VALIDATOR,
    UPDATE_ORDER_STATUS_VALIDATION_SCHEMA,
    ALL_ORDER_SCHEMA_VALIDATION,
    GET_FILTERED_ORDER_VALIDATION_SCHEMA,
    IS_ORDER_ID
} from "../Validators/Orders/schema.js"

import TransactionModel from "./transactionModel.js";
import logger from "../logger/index.js";


var instance = new Razorpay({
    key_id: config.RZR_PAY_ID,
    key_secret: config.RZR_PAY_SCRT,
});


// Create Orders
const NEW_ORDER = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const USER_ID = req.user.id;

        if (!USER_ID) {
            return next(createHttpError(400, "Something went wrong, Payment failed"));
        }

        const { error, value } = VALIATE_ORDER_BODY_SCHEMA.validate(req.body);

        if (error) {
            return next(createHttpError(400, error?.details.at(0).message));
        }
        const { packageID, qty, startDate, endDate } = req.body;

        // console.log(`LOG_DATE_FORMAT: ${startDate}-${endDate}`);

        // console.log(
        //     `
        //     PACKAGEID: ${packageID},
        //     QTY: ${qty},
        //     startDate: ${startDate},
        //     endDate: ${endDate}
        //     `
        // );


        const startBookingDate = new Date(startDate);
        //  new Date(startDate)
        const endBookingDate = new Date(endDate)

        // console.log(
        //     {
        //         startBookingDate,
        //         endBookingDate
        //     }
        // );

        // console.log("LOG_1");


        const productQuantity = qty || 1;

        const isUserAvailable = await userModel.findById(USER_ID);

        if (!isUserAvailable) {
            return next(createHttpError(400, "Invalid Request"))
        }

        if (!isUserAvailable.isVerified) {
            return next(createHttpError(400, "Please complete your profile"))
        }

        //CHECK_COPON_CODE

        // chech-for-availibilty
        const isOrderAvailableInYourPinCode = await AreaZoneModel.findOne(
            {
                areaPinCode: isUserAvailable.areaPin,
                isAvailable: true
            }
        );

        // console.log("LOG_2");

        if (!isOrderAvailableInYourPinCode) {
            return next(createHttpError(400, "Our Services are not avaialable in your area"))
        }

        // options--
        const notes = {
            fullName: isUserAvailable.fullName,
            email: isUserAvailable.email,
            contact: isUserAvailable.mobileNum
        }

        // Fetch package info
        const Package = await PackageModel.findById(packageID).lean();

        if (!Package) {
            return next(createHttpError(400, "Package not found"));
        }

        // console.log("LOG_3");

        //  check Booking available or not 
        const isBookingAvailable = await bookingModel.findOne(
            {
                startDate: startBookingDate,
                endDate: endBookingDate,
                status: "Confirmed"
            }
        ).lean();

        // console.log("LOG4");

        if (isBookingAvailable) {
            return res.status(404).json(
                {
                    success: false,
                    msg: "Already booked! Try selecting a different date from the calendar"
                }
            )
        }

        // console.log("LOG_5");

        const totalAmount = Package.price * productQuantity;

        // console.log("LOG_5.1");

        const razorpayOrder = await instance.orders.create({
            amount: totalAmount * 100,
            currency: "INR",
            receipt: `order_${new Date().getTime()}`,
        });

        // console.log("LOG_5.2");


        if (!razorpayOrder) {
            await session.abortTransaction();
            return next(createHttpError(500, "Payment gateway error"));
        }

        // console.log("LOG_6");

        // console.log("LOG_6.1");

        const createOrder = new OrderModel(
            {
                orderId: razorpayOrder.id,
                customer: USER_ID,
                product: {
                    productId: Package._id,
                    quantity: productQuantity,
                    price: totalAmount
                },
                totalAmount: totalAmount
            }
        );

        // console.log("LOG_6.2");

        if (!createOrder) {
            await session.abortTransaction();
            return next(createHttpError(400, "Failed to place order. Please try again."));
        }

        // CREATE_NEW_BOOKING
        const NEW_BOOKING = await bookingModel.create(
            [{
                startDate: startBookingDate,
                endDate: endBookingDate,
                resourceId: packageID,
                customerId: USER_ID,
                orderId: createOrder._id
            }],
            { session }
        );

        if (!NEW_BOOKING) {
            await session.abortTransaction();
            return next(createHttpError(400, "Oops eomthing went wrong, please try agaian later."))

        }

        createOrder.booking = NEW_BOOKING[0]._id;
        await createOrder.save({ session });

        // console.log("LOG_6.3");


        // CREATE_TRANSACTION
        const TRANSACTION = await TransactionModel.create(
            [
                {
                    user: USER_ID,
                    order: createOrder._id,
                    gatewayOrderId: razorpayOrder.id,
                    amount: totalAmount,
                    status: "processing"
                }
            ],
            { session: session }
        );


        if (!TRANSACTION) {
            await sessabortTransaction()
            return next(createHttpError(400, "Please Try again later-Internal Error"))
        }

        await session.commitTransaction();

        return res.status(201).json({
            status: 201,
            message: "Order created successfully",
            orderId: razorpayOrder.id,
            amount: totalAmount,
            notes //options-used in frontend
        });

    } catch (error) {
        logger.error(
            `Failed to prepare Order: ${error.message}, Error stack: ${error.stack}`
        );
        await session.abortTransaction();
        return next(createHttpError(500, error));
    } finally {
        session.endSession();
    }
};


/**
 * 
 * AFTER VERIFICATION OF SIGNATURE I PROCESS ORDERS
 * NOTIFICATIONS AND OTHER QUEUE BASED SERVICES
 * 
 */

const verifyPayments = async (req, res, next) => {
    try {
        const { razorpay_signature, razorpay_order_id, razorpay_payment_id } = req.body;

        // Validate required parameters
        if (!razorpay_signature || !razorpay_order_id || !razorpay_payment_id) {
            return next(createHttpError(400, "Missing required payment parameters"));
        }

        const generatedSignature = crypto
            .createHmac("sha256", config.RZR_PAY_SCRT)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        const isSignatureValid = generatedSignature === razorpay_signature;

        if (!isSignatureValid) {
            return next(createHttpError(400, "Payment signature verification failed"));
        }

        const rzrVerifyPayments = await instance.orders.fetch(razorpay_order_id);

        if (rzrVerifyPayments.status !== 'paid') {
            return next(createHttpError(400, "Payment not completed"));
        }

        const Order = await OrderModel.findOne({ orderId: razorpay_order_id });

        if (!Order) {
            return next(createHttpError(404, "Order not found"));
        }

        // Order.payment.status = rzrVerifyPayments.status;

        const rzrPaygatewayKeyandSignature = {
            razorpay_signature,
            razorpay_payment_id
        }

        Order.gateway = rzrPaygatewayKeyandSignature;
        await Order.save();

        // redirect to another location so he can download order Invoice
        const hostName = req.host;
        const domainName = "https://www.divaym.com"
        const saltRound = 7
        const hashOrderId = await bcrypt.hash(razorpay_order_id, saltRound);

        // const pathToRedirect = `${domainName}/api/user/ordered?success=true&order=${hashOrderId}&source=${hostName}`;
        const redirectPath = `${domainName}/about?success=true&orderId=${hashOrderId}&source=${hostName}`

        res.redirect(redirectPath);
    } catch (error) {
        logger.error(
            `Failed to verify razaorpay payment: ${error.message}, Error stack: ${error.stack}`
        );
        return next(createHttpError(500, "Payment verification failed"));
    }
}


const INIT_FOR_INVOICE = async (req, res, next) => {
    try {
        const query = req.query;

        return res.status(200).
            json(query);

    } catch (error) {
        throw new Error(error);
    }
}



const GET_ALL_ORDERS_BY_USER_ID = async (req, res, next) => {
    try {
        const USER_ID = req.user.id;

        if (!USER_ID) {
            return next(createHttpError(401, "Invalid request"))
        }

        const { error, value } = PAGINATION_SCHEMA_VALIDATOR.validate(req.query);

        if (error) {
            return next(createHttpError(400, "Something went wrong."))
        }

        const UserOrders = await userModel.findById(USER_ID)
            .populate({
                path: "orders",
                select: "product orderStatus payment totalAmount",
                populate: {
                    path: "product.productId",
                    model: "Package",
                    select: "name description productImg slug",
                    populate: {
                        path: "productImg",
                        model: "productsimg",
                        select: { imgSrc: 1, imagePath: 1, id: 1 }
                    }
                }
            })
            .exec();

        if (!UserOrders) {
            return next(createHttpError(400, "oops something went wrong"));
        }


        return res.status(200)
            .json(
                {
                    success: true,
                    orders: UserOrders.orders
                }
            );

    } catch (error) {
        logger.error(
            `Failed to get users Orders: ${error.message}, Error stack: ${error.stack}`
        );
        return next(createHttpError(401, `Internal error ${error.message}`))
    }
}


/**
 * 
 * used in
 * user-controller
 * 
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */

const GET_SINGLE_ORDERS = async (req, res, next) => {
    try {
        const ORDER_ID = req.params.ORDER_ID;

        if (!ORDER_ID) {
            return next(createHttpError(401, "Invalid Order Id"))
        }

        const order = await OrderModel.findOne(
            { _id: ORDER_ID }
        );

        if (!order) {
            return next(createHttpError(400, "no order avaialable with this orderid"))
        }
        const productID = order.product.productId;

        const Package = await PackageModel.findById(productID, {
            name: 1,
            description: 1,
            capacity: 1,
            price: 1,
            productImg: 1,
            slug: 1,
        })
            .populate(
                {
                    path: "productImg",
                    select: { imgSrc: 1, imagePath: 1, imageType: 1 }
                }
            );

        if (!Package) {
            return next(createHttpError(400, "Something went wrong"))
        }

        const prettyData = {
            success: true,
            statusCode: 200,
            order: {
                package: Package,
                orderId: order.orderId,
                orderdate: moment(order.createdAt).format("DD-MM-YYYY"),
                orderStatus: order.orderStatus,
            }
        };

        res.status(200).json(prettyData);
    } catch (error) {
        logger.error(
            `Failed to get user [single]Order: ${error.message}, Error stack: ${error.stack}`
        );
        return next(createHttpError(401, `Something went wrong during fetching Orders from database  ${error}`))
    }
}


// Change Order Status of Orders

const CHANGE_ORDER_STATUS = async (req, res, next) => {
    try {
        const ORDER_ID = req.params?.ORDER_ID;

        if (!ORDER_ID) {
            return next(createHttpError(400, "invalid request."))
        }
        const { error, value } = UPDATE_ORDER_STATUS_VALIDATION_SCHEMA.validate(req.body);

        if (error) return next(createHttpError(400, error?.details[0]?.message))
        const Order = await OrderModel.findById(ORDER_ID);

        if (!Order) {
            return next(createHttpError(401, "Failed to update order status"))
        }
        console.log(Order.orderStatus);

        if (Order.orderStatus === "Cancelled" ||
            Order.orderStatus === "Refunded" ||
            Order.orderStatus === "Delivered"
        ) {
            return next(createHttpError(400, "Order status can't be chnaged at this moment"))
        }

        // Update Order staus
        Order.orderStatus = value?.status;
        await Order.save();


        // On Success
        return res.status(201).json({
            statusCode: 200,
            msg: "order status changed successfully."
        })
    } catch (error) {
        logger.error(
            `Failed to change order status: ${error.message}, Error stack: ${error.stack}`
        );
        return next(createHttpError(401, "Unauthorize.."))
    }
}

// /items?page=${page}&limit=${limit}


const GET_ALL_ORDERS = async (req, res, next) => {
    const { error, value } = ALL_ORDER_SCHEMA_VALIDATION.validate(req.query);

    if (error) {
        return next(createHttpError(401, "Invalid request."))
    }

    // assign req body to reqDATA 
    const reqDATA = value;
    const page = parseInt(reqDATA.page) || 1;
    const limit = parseInt(reqDATA.limit) || 10;
    const skip = (page - 1) * limit;

    if (skip < 0) {
        return next(createHttpError(401, "Invalid request.."))
    }

    // const orders = await OrderModel.find().select("-updatedAt  -__v").limit(limit).skip(skip);
    const orders = await OrderModel.find().select("-updatedAt -__v -notes")
        .populate({
            path: "transaction",
            select: "amount status gateway paymentMethod -_id"
        }).lean()

    if (!orders) {
        return next(createHttpError(401, "No Orders.."))
    }

    res.json(orders)
}


const GET_FILTERED_ORDER = async (req, res, next) => {
    try {
        const { error, value } = GET_FILTERED_ORDER_VALIDATION_SCHEMA.validate(req.query);

        if (error) {
            return next(createHttpError(401, `${error?.details[0]?.message}`))
        }

        let { page, limit, filterBy } = req.query;
        const skip = (page - 1) * limit;

        if (skip < 0 || page < 0 || limit < 0) {
            return next(createHttpError(400, "Invalid request.."))
        }

        if (filterBy === "Success") {
            filterBy = "Delivered"
        }
        console.log(filterBy);

        const Order = await OrderModel.find(
            {
                orderStatus: filterBy
            },
            {
                __v: 0,
                updatedAt: 0,
                product: 0,
                orderDate: 0,
                notes: 0
            }
        ).skip(skip).limit(limit)
            .populate({
                path: "transaction",
                select: "amount status gateway paymentMethod -_id"
            })

        return res.status(200).json({
            success: true,
            statusCode: 200,
            responseData: Order
        })

    } catch (error) {
        logger.error(
            `Failed to get filter order: ${error.message}, Error stack: ${error.stack}`
        );
        return next(createHttpError(401, error))
    }
}


const ORDER_CANCEL = async (req, res, next) => {
    const { ORDER_ID } = req.params;

    const { error, value } = IS_ORDER_ID.validate(req.params);

    if (error) {
        return next(createHttpError(400, error?.details[0].message))
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const USER_ID = req.user.id;

        const user = await userModel.findById(USER_ID)
            .session(session);

        if (!user) {
            await session.abortTransaction();
            return next(createHttpError(400, "Something went wrong."))
        }

        const Order = await OrderModel.findById(ORDER_ID)
            .session(session)

        if (!Order) {
            await session.abortTransaction()
            return next(createHttpError(400, "Something went wrong"))
        }

        if (
            Order.orderStatus === "CANCELLATION_REQUESTED" ||
            Order.orderStatus === "Completed"
        ) {
            await session.abortTransaction()
            return next(createHttpError(400, "We’re sorry, but your order cannot be canceled at this moment."));
        }

        // chnage Order status to cancellation Req;
        Order.orderStatus = "CANCELLATION_REQUESTED";
        await Order.save();


        // commit-transactions
        await session.commitTransaction();


        // call worker to send some notifications sms's

        return res.status(200)
            .json(
                {
                    success: true,
                    msg: "Your order has been successfully canceled. A refund will be processed shortly if applicable."
                }
            );


    } catch (error) {
        logger.error(
            `Failed to cancel user order: ${error.message}, Error stack: ${error.stack}`
        );
        await session.abortTransaction();
        return next(createHttpError(400, "Something went wrong."))
    }
    finally {
        await session.endSession()
    }
}


const SAVE_CART = async (req, res, next) => {
    try {
        console.log(req);
        const { error, value } = TRACK_CART_SCHEMA_VALIDATOR.validate(req.body);

        if (error) {
            return next(createHttpError(400, error?.details.at(0).message))
        }

        const { packageId, qty } = req.body;

        const visitor = req.visitor;
        console.log("BROWSER_INFO", req.visitor)

        const currTimstamp = new Date();

        const newCart = await cartTrackingModel.create({
            userId: visitor?.id || null,
            sessionId: JSON.stringify(visitor),
            productId: packageId,
            quantity: qty,
            addedAt: currTimstamp
        });

        if (!newCart) {
            return next(createHttpError(400, "Something went wrong"))
        }

        return res.status(200).json(
            {
                success: true
            }
        );

    } catch (error) {
        logger.error(
            `Failed to save user cart: ${error.message}, Error stack: ${error.stack}`
        );
        return next(createHttpError(400, "Internal error"));
    }
}


export {
    NEW_ORDER,
    GET_ALL_ORDERS_BY_USER_ID,
    GET_SINGLE_ORDERS,
    GET_ALL_ORDERS,
    CHANGE_ORDER_STATUS,
    GET_FILTERED_ORDER,
    verifyPayments,
    ORDER_CANCEL,
    SAVE_CART,
    INIT_FOR_INVOICE
}