import { config } from "../config/_config.js";
import createHttpError from "http-errors";
import crypto, { createVerify } from "crypto"
import PackageModel from "../Package/PackageModel.js";
import userModel from '../Users/userModel.js';
import Razorpay from "razorpay";
import mongoose from "mongoose";
import OrderModel from "./orderModel.js";
import generateOrderID from "../Counter/counterController.js";
import AreaZoneModel from "../AreaZone/areaZoneModel.js";
import moment from "moment";
import cartTrackingModel from "./cartTrackingModel.js";
import bookingModel from "./bookingModel.js";
import CryptoJS from "crypto-js";


import {
    TRACK_CART_SCHEMA_VALIDATOR,
    VALIATE_ORDER_BODY_SCHEMA,
    PAGINATION_SCHEMA_VALIDATOR,
    UPDATE_ORDER_STATUS_VALIDATION_SCHEMA,
    ALL_ORDER_SCHEMA_VALIDATION,
    GET_FILTERED_ORDER_VALIDATION_SCHEMA,
    IS_ORDER_ID,
    VALIDATE_PAGINATION_QUERY
} from "../Validators/Orders/schema.js"

import TransactionModel from "./transactionModel.js";
import logger from "../logger/index.js";
import { invokeLambda } from "./Hooks/handleSuccessPayment.js";


var instance = new Razorpay({
    key_id: config.RZR_PAY_ID,
    key_secret: config.RZR_PAY_SCRT,
});

const encryptStr = (string, secret) => {
    var ciphertext = CryptoJS.AES.encrypt(string, secret).toString();
    const URI_ENCODED_CIPHER_TEXT = encodeURIComponent(ciphertext);
    return URI_ENCODED_CIPHER_TEXT;
}


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
        const { packageID, qty, startDate, endDate, referralCode, } = req.body;


        const startBookingDate = new Date(startDate);
        //  new Date(startDate)
        const endBookingDate = new Date(endDate)
        const productQuantity = qty || 1;
        const isUserAvailable = await userModel.findById(USER_ID);

        if (!isUserAvailable) {
            return next(createHttpError(400, "Invalid Request"))
        }

        if (!isUserAvailable?.orderAddress) {
            return next(createHttpError(400, "There is no address available for this order please add to procees"))
        }

        const orderDeliveryAddress = isUserAvailable?.orderAddress.filter((item, idx) => {
            if (item.isActive) {
                return item;
            }
        });

        if (!orderDeliveryAddress.length) {
            return next(createHttpError(400, "We need your complete address to proceed order"))
        }

        // chech-for-available-pinCode's
        const isOrderAvailableInYourPinCode = await AreaZoneModel.findOne(
            {
                areaPinCode: orderDeliveryAddress[0].pinCode,
                isAvailable: true
            }
        );

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


        //  check Booking available or not 
        // const isBookingAvailable = await bookingModel.findOne(
        //     {
        //         startDate: startBookingDate,
        //         endDate: endBookingDate,
        //         status: "Confirmed"
        //     }
        // ).lean();

        // if (isBookingAvailable) {
        //     return res.status(404).json(
        //         {
        //             success: false,
        //             msg: "Already booked! Try selecting a different date from the calendar"
        //         }
        //     )
        // }
        // calc price included referral code
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
                orderId: createOrder._id,
                address: {
                    landMark: orderDeliveryAddress[0].landMark,
                    city: orderDeliveryAddress[0].city,
                    state: orderDeliveryAddress[0].state,
                    contactNumber: isUserAvailable.mobileNum,
                    pinCode: orderDeliveryAddress[0].pinCode,
                    area: orderDeliveryAddress[0].area,
                }
            }],
            { session }
        );

        if (!NEW_BOOKING) {
            await session.abortTransaction();
            return next(createHttpError(400, "Oops eomthing went wrong, please try agaian later."))

        }

        createOrder.booking = NEW_BOOKING[0]._id;
        await createOrder.save({ session });

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
        return next(createHttpError(500, error.message));
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
const API_REQ = async (referralCode, userId, orderId, amount) => {
    const API = `https://api-referral.divyam.com/api/referral/create-referral-event?referralCode=${referralCode}&refereeId=${userId}&orderId=${orderId}&amount=${amount}`;

    try {
        const res = await fetch(API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
        });

        const data = await res.json();

        if (res.ok) {
            console.log(`Refferal APi Called ✅${data}`)
        }
    } catch (error) {
        console.log(`Something off ${error.message}`);
    }


}


const verifyPayments = async (req, res, next) => {
    const USER_ID = req.user.id;
    try {
        const { razorpay_signature, razorpay_order_id, razorpay_payment_id, referralCode } = req.body;
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
        console.log("VERIFY_API", rzrVerifyPayments);

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

        // call Referral API
        const totalAmount = rzrVerifyPayments.amount_paid / 100;
        const userComission = (totalAmount * 5) / 100;

        // Todo: - set comission amount
        await API_REQ(referralCode, USER_ID, Order._id, totalAmount);

        // redirect user location so he can download order Invoice
        const secret = config.SECRET;
        const API_DOMAIN = config.BACKEND_URL;
        const encryptedOrderId = encryptStr(razorpay_order_id, secret);
        const redirectPath = `${API_DOMAIN}/api/user/ordered?success=true&orderId=${encryptedOrderId}`;

        const resBody = {
            success: true,
            url: redirectPath
        }
        return res.status(200).json(resBody);
    } catch (error) {
        logger.error(
            `Failed to verify razaorpay payment: ${error.message}, Error stack: ${error.stack}`
        );
        return next(createHttpError(500, "Payment verification failed"));
    }
}


const ATTACH_INVOICE_WITH_ORDER = async (req, res, next) => {
    console.log("ATTACHED_INVOICE_WITH_ORDER", req.body);
    try {
        const { invoiceUrl, orderId } = req.body;

        const isValidOrder = await OrderModel.findOne({ orderId: orderId });

        if (!isValidOrder) {
            return next(createHttpError(400, "Invalid order id"))
        }

        const booking = await bookingModel.findById({ _id: isValidOrder.booking });
        if (!booking) {
            return next(createHttpError(400, "Invalid Order id .."))
        }

        console.log(`invoiceUrl => ${invoiceUrl}`)
        booking.orderInvoice = invoiceUrl;
        await booking.save();

        console.log("Successfully Attach Invoice With Order");
        // on Success
        return res.status(200).
            json(
                {
                    success: true,
                    msg: "Successfully added invoice to it Order"
                }
            )
    } catch (error) {
        return next(createHttpError(400, `Internal Error ${error}`))
    }
}


const cryptoDecrypto = (cipherText, secret) => {
    try {
        var bytes = CryptoJS.AES.decrypt(cipherText, secret)
        var originalText = bytes.toString(CryptoJS.enc.Utf8);
        console.log(originalText);
        return originalText;
    } catch (error) {
        console.log(error);
    }
}

// doenload Invoice
const DOWNLOAD_INVOICE = async (req, res, next) => {
    try {
        const { orderId } = req.query;
        if (!orderId) {
            return next(createHttpError(400, "Order ID is required"));
        }

        const secret = config.SECRET;
        const originalOrderId = cryptoDecrypto(orderId, secret);

        if (!originalOrderId) {
            return next(createHttpError(400, "Invalid order ID"));
        }

        // Fetch Order
        const Order = await OrderModel.findOne({ orderId: originalOrderId });
        if (!Order) {
            return next(createHttpError(404, "Order not found"));
        }

        // Fetch Booking
        const Booking = await bookingModel.findOne({ orderId: Order._id });
        if (!Booking) {
            return next(createHttpError(404, "Booking not found"));
        }


        if (!Booking.orderInvoice) {
            const payload = { orderId: originalOrderId };
            await invokeLambda(payload);
            console.log("Lambda invoked for invoice generation");
            return res.status(202).json({
                success: true,
                statusCode: 202,
                message: "Your invoice is generated... Please check back shortly."
            });
        }

        return res.status(200).json({
            success: true,
            statusCode: 200,
            invoiceUrl: Booking.orderInvoice
        });

    } catch (error) {
        console.error("Invoice download error:", error);
        next(error);  // Pass to Express error handler
    }
};


// USED_IN_THE_USER_DASHBOARD
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
                populate: {
                    path: "product.productId",
                    model: "Package",
                    populate: {
                        path: "productImg",
                        model: "productsimg",
                    }
                },

                populate: {
                    path: "booking",
                    model: "Booking",
                    select: "address"
                }
            }).exec()

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

/**
 * TODO:
 *      Implement it on Admin Ui
 *      Fix null responses
 */


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

    const orders = await OrderModel.find(
        {
            orderStatus: "Pending",
            booking: { $ne: null }
        }
    )
        .select({ __v: 0, notes: 0, updatedAt: 0 })
        .populate({
            path: "booking",
            select: { status: 1 }
        })
        .populate({ path: "transaction", select: "paymentMethod" })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

    const filteredOrder = orders && orders.map((order) => {
        const formattedCreatedDate = moment(order.createdAt).utc().format("DD-MM-YYYY:HH:mm:ss");
        // pending and confirmed
        const isFreshOrder = order?.orderStatus === "Pending" && order?.booking?.status == "Confirmed";

        return { ...order, createdAt: formattedCreatedDate, isFreshOrder }

    });


    if (!orders) {
        return next(createHttpError(401, "Oops something went wrong."))
    }

    return res.status(200)
        .json(
            {
                success: true,
                orders: filteredOrder
            }
        )

}


const GET_BOOKINGS = async (req, res, next) => {
    try {
        const BOOKING_ID = req.params.BOOKING_ID;
        const bookings = await bookingModel.findById(BOOKING_ID)
            .populate({
                path: "resourceId",
            })
            .populate({
                select: "customerId"
            })
            .populate({
                select: "orderId"
            }).lean();

        if (!bookings) {
            return next(createHttpError(400, "Internal error "))
        }

        return res.status(200).
            json(
                {
                    success: true,
                    bookings
                }
            )

    } catch (error) {

    }
}

const GET_ALL_BOOKINGS = async (req, res, next) => {
    try {
        const { error, value } = VALIDATE_PAGINATION_QUERY.validate(req.query);

        if (error) {
            return next(createHttpError(400, error?.details[0].message))
        }

        const Page = value.page;
        const Limit = value.limit;
        const skip = (Page - 1) * Limit;

        const bookings = await bookingModel.find().skip(skip).limit(Limit)
            .populate({
                path: "resourceId",
            })
            .populate({
                select: "customerId"
            })
            .populate({
                select: "orderId"
            });


        if (!bookings) {
            return next(createHttpError(400, "Something went wrong | internal error"))
        }

        return res.status(200).json(
            {
                totalLength: bookings.length,
                success: true,
                bookings: bookings
            }
        )
    } catch (error) {

        return next(createHttpError(400, "Something went wrong.."))
    }
}

const GET_FILTERED_ORDER = async (req, res, next) => {
    console.log("CALLED")
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
                select: "amount status gateway paymentMethod -_id",
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
    DOWNLOAD_INVOICE,
    ATTACH_INVOICE_WITH_ORDER,
    GET_ALL_BOOKINGS,
    GET_BOOKINGS
}