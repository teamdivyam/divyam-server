import { config } from "../config/_config.js";
import createHttpError from "http-errors";
import Joi from "joi";
import crypto from "crypto"
import PackageModel from "../Package/PackageModel.js";
import userModel from '../Users/userModel.js';
import Razorpay from "razorpay";
import mongoose from "mongoose";
import OrderModel from "./orderModel.js";
const isObjectId = /^[0-9a-fA-F]{24}$/;
import generateOrderID from "../Counter/counterController.js";
import AreaZoneModel from "../AreaZone/areaZoneModel.js";
import logger from "../config/logger.js";
import moment from "moment";
import cartTrackingModel from "./cartTrackingModel.js";
import { TRACK_CART_SCHEMA_VALIDATOR } from "../validations/Orders/index.js";
import bookingModel from "./bookingModel.js";

var instance = new Razorpay({
    key_id: config.RZR_PAY_ID,
    key_secret: config.RZR_PAY_SCRT,
});

// create Orders

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @description 
 * 
 * it takes two thing as a payload one is 
 * packageId another one is user ID that we 
 * get from middleware (req.users)
 * 
 * @returns 
 */

const VALIATE_ORDER_BODY_SCHEMA = Joi.object({
    packageID: Joi.string().pattern(isObjectId).required(),
    qty: Joi.number().positive().max(5).required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
});



/**
 * 
 * @param {
 * packageID => ObjectId,
 * quantity => 2
 * } 
 * 
 */

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

        console.log(`LOG_DATE_FORMAT: ${startDate}-${endDate}`);

        console.log(
            `
            PACKAGEID: ${packageID},
            QTY: ${qty},
            startDate: ${startDate},
            endDate: ${endDate}
            `
        );

        const startBookingDate = new Date(startDate)
        const endBookingDate = new Date(endDate)

        console.log(
            {
                startBookingDate,
                endBookingDate
            }
        )

        console.log("LOG_1");


        const productQuantity = qty || 1;

        const isUserAvailable = await userModel.findById(USER_ID);


        if (!isUserAvailable) {
            return next(createHttpError(400, "Invalid Request"))
        }

        if (!isUserAvailable.isVerified) {
            return next(createHttpError(400, "Please complete your profile"))
        }

        // chech-for-availibilty
        const isOrderAvailableInYourPinCode = await AreaZoneModel.findOne(
            {
                areaPinCode: isUserAvailable.areaPin,
                isAvailable: true
            }
        );

        console.log("LOG_2");

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

        console.log("LOG_3");

        //  check Booking available or not 
        const isBookingAvailable = await bookingModel.findOne(
            {
                startDate: startBookingDate,
                endDate: endBookingDate,
                status: "Confirmed"
            }
        ).lean();

        console.log("LOG4");

        if (isBookingAvailable) {
            return res.status(404).json(
                {
                    success: false,
                    msg: "Already booked! Try selecting a different date from the calendar"
                }
            )
        }

        console.log("LOG_5");


        const totalAmount = Package.price * productQuantity;
        console.log("LOG_5.1");

        const razorpayOrder = await instance.orders.create({
            amount: totalAmount * 100,
            currency: "INR",
            receipt: `order_${new Date().getTime()}`,
        });

        console.log("LOG_5.2");


        if (!razorpayOrder) {
            await session.abortTransaction();
            return next(createHttpError(500, "Payment gateway error"));
        }

        console.log("LOG_6");

        console.log("LOG_6.1");

        const INSERT_NEW_ORDER = await OrderModel.create(
            [
                {
                    orderId: razorpayOrder.id,
                    customer: USER_ID,
                    product: {
                        productId: Package._id,
                        quantity: productQuantity,
                        price: totalAmount
                    },
                    payment: {
                        currency: "INR",
                    },
                    totalAmount: totalAmount
                }
            ],
            { session }
        );

        console.log("LOG_6.2");

        if (!INSERT_NEW_ORDER) {
            await session.abortTransaction();
            return next(createHttpError(400, "Failed to place order. Please try again."));
        }

        // for booking slot available
        const NEW_BOOKING = await bookingModel.create(
            [{
                startDate: startBookingDate,
                endDate: endBookingDate,
                resourceId: packageID,
                customerId: USER_ID,
                orderId: INSERT_NEW_ORDER[0]._id
            }],
            { session }
        );

        if (!NEW_BOOKING) {
            await session.abortTransaction();
            return next(createHttpError(400, "Oops eomthing went wrong, please try agaian later."))
        }
        INSERT_NEW_ORDER.booking = NEW_BOOKING._id;
        await NEW_BOOKING.save();

        console.log("LOG_6.3");

        await session.commitTransaction();

        return res.status(201).json({
            status: 201,
            message: "Order created successfully",
            orderId: razorpayOrder.id,
            amount: totalAmount,
            notes //options
        });

    } catch (error) {
        logger.info(error.message);
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

        return res.status(200).json({
            status: "success",
            msg: "Payment has been completed successfully."
        });

    } catch (error) {
        console.error("Payment verification error:", error);
        return next(createHttpError(500, "Payment verification failed"));
    }
}

// const verifyPayments = async (req, res, next) => {
//     try {
//         const { razorpay_signature, razorpay_order_id, razorpay_payment_id } = req.body;


//         const generatedSignature = crypto
//             .createHmac("sha256", config.RZR_PAY_SCRT)
//             .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//             .digest("hex")

//         var isSignatureValid = generatedSignature === razorpay_signature;

//         if (!isSignatureValid) { return next(createHttpError(400, "Payment failed..")) }


//         const rzrVerifyPayments = await instance.orders.fetch(razorpay_order_id);
//         const isPaymentPaid = rzrVerifyPayments.status === 'paid' ? true : false;


//         console.log(rzrVerifyPayments);


//         if (!isPaymentPaid) {
//             return next(createHttpError(400, "Something went wrong.."))
//         }

//         const Order = await orderModel.findOne({ order_id: razorpay_order_id });

//         Order.payment.status = rzrVerifyPayments.status;
//         Order.gateway.razorpay_signature = razorpay_signature;
//         Order.gateway.razorpay_payment_id = razorpay_payment_id

//         console.log("LOG_VERIFICATIONS");


//         // if (!Order) {
//         //     return next(createHttpError(400, "Payments failed.."))
//         // }


//         /**
//          * RUN JOBS FOR NOTIFICATIONS
//          */

//         return res.status(200).json({ msg: "Payment is successfull" });

//     } catch (error) {
//         return next(createHttpError(400, "internal error can"))
//     }
// }

const PAGINATION_SHEMA_VALIDATOR = Joi.object({
    page: Joi.string().trim().required(),
    limit: Joi.string().trim().max(20).required()
})


const GET_ALL_ORDERS_BY_USER_ID = async (req, res, next) => {
    try {
        const USER_ID = req.user.id;

        if (!USER_ID) {
            return next(createHttpError(401, "Invalid request"))
        }

        const { error, value } = PAGINATION_SHEMA_VALIDATOR.validate(req.query);

        if (error) {
            return next(createHttpError(400, "Something went wrong."))
        }

        const UserOrders = await userModel.findById(USER_ID, { orders: 1, _id: 0 })
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
                        select: { imgSrc: 1, imagePath: 1 }
                    }
                }
            })
            .exec()


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
        return next(createHttpError(401, `Something went wrong during fetching Orders from database  ${error}`))
    }
}


// Change Order Status of Orders

const UPDATE_ORDER_STATUS_VALIDATION_SCHEMA = Joi.object({
    status: Joi.string().trim().required()
})

const CHANGE_ORDER_STATUS = async (req, res, next) => {
    try {
        const ORDER_ID = req.params?.ORDER_ID;

        if (!ORDER_ID) {
            return next(createHttpError(400, "invalid request."))
        }
        const { error, value } = UPDATE_ORDER_STATUS_VALIDATION_SCHEMA.validate(req.body);

        if (error) return next(createHttpError(400, error?.details[0]?.message))

        const reqData = value;

        const Order = await OrderModel.findByIdAndUpdate(
            ORDER_ID,
            { orderStatus: reqData?.status }
        )

        if (!Order) {
            return next(createHttpError(401, "Failed to update order status"))
        }

        return res.status(201).json({
            statusCode: 200,
            msg: "order status changed successfully."
        })
    } catch (error) {
        return next(createHttpError(401, "Unauthorize.."))
    }
}

// /items?page=${page}&limit=${limit}

const ALL_ORDER_SCHEMA_VALIDATION = Joi.object({
    page: Joi.string().min(1).required(),
    limit: Joi.string(),
});

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

    const orders = await OrderModel.find().select("-updatedAt  -__v").limit(limit).skip(skip);

    if (!orders) {
        return next(createHttpError(401, "No Orders.."))
    }

    res.json(orders)
}



const GET_FILTERED_ORDER_VALIDATION_SCHEMA = Joi.object(
    {
        filterBy: Joi.string().trim().valid(
            "Pending",
            "Packed",
            "Shipped",
            "Delivered",
            "Cancelled",
            "Completed",
            "Refunded",
            "Failed",
            "On Hold",
            "Out for Delivery",
            "CANCELLATION_REQUESTED"
        ),
        page: Joi.number().required(),
        limit: Joi.number().required()
    }
)

const GET_FILTERED_ORDER = async (req, res, next) => {
    try {
        const { error, value } = GET_FILTERED_ORDER_VALIDATION_SCHEMA.validate(req.query);

        if (error) {
            return next(createHttpError(401, `${error?.details[0]?.message}`))
        }

        const { page, limit, filterBy } = req.query;
        const skip = (page - 1) * limit;

        if (skip < 0 || page < 0 || limit < 0) {
            return next(createHttpError(400, "Invalid request.."))
        }

        const getOrder = await OrderModel.find(
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
        ).skip(skip).limit(limit);

        return res.status(200).json({
            success: true,
            statusCode: 200,
            responseData: getOrder
        })

    } catch (error) {
        return next(createHttpError(401, error))
    }
}


const IS_ORDER_ID = Joi.object({
    ORDER_ID: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .message('Invalid Order id'),

})


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
        await session.abortTransaction();
        return next(createHttpError(400, "Something went wrong."))
    }
    finally {
        await session.endSession()
    }
}


const SAVE_CART = async (req, res, next) => {
    try {
        const { error, value } = TRACK_CART_SCHEMA_VALIDATOR.validate(req.body);

        if (error) {
            return next(createHttpError(400, error?.details.at(0).message))
        }

        const { packageId, qty } = req.body;

        const visitor = req.visitor;
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
        // return next(createHttpError(400, "Something went wrong | Internal error"));
        return next(createHttpError(400, error));
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

}