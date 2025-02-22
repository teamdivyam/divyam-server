import createHttpError from "http-errors";
import Joi from "joi";
import orderModel from "./orderModel.js";
import userModel from '../Users/userModel.js';
import PackageModel from "../Package/PackageModel.js";
import generateOrderID from "../Counter/counterController.js";
import { nanoid } from "nanoid/non-secure";
// import { GET_ALL_ORDERS } from "../Admin/orderControllers.js";
const isObjectId = /^[0-9a-fA-F]{24}$/;

const ORDER_SCHEMA_VALIDATION = Joi.object(
    {
        customer_id: Joi.string()
            .required()
            .messages({
                'string.base': 'Customer ID must be a string.',
                'any.required': 'Customer ID is required.',
            }),
        payment_method: Joi.string().required(),
        products: Joi.array().items({
            product_id: Joi.string().pattern(isObjectId),
            quantity: Joi.number().positive().required()
        })
    }
)


const newOrder = async (req, res, next) => {
    let total_Price = 0;
    let order_Products = [];

    try {
        const { error, value } = ORDER_SCHEMA_VALIDATION.validate(req.body);
        if (error) {
            return next(createHttpError(400, error?.details?.message))
        }
        const reqDATA = value;

        const user = await userModel.findById(reqDATA.customer_id).select("_id");

        if (!user) {
            return next(createHttpError(401, "Error during order creation.."));
        }

        // Check order type (isPackage)
        // if (reqDATA.isPackage) {
        //     try {
        //         const productDetails = await Promise.all(reqDATA.products.map(async (product) => {
        //             const productData = await PackageModel.findById(product.product_id).select("price");
        //             if (!productData) {
        //                 throw new Error("Invalid product ID");
        //             }
        //             return {
        //                 ...product,
        //                 price: productData.price,
        //             };
        //         }));

        //         // Compute total price
        //         total_Price = productDetails.reduce((total, product) => {
        //             return total + (product.price * (product.quantity || 1));
        //         }, 0);

        //         console.log("LOG_TO_CHECK_PRODUCT_INFO", total_Price);

        //         // Validate products before mapping
        //         // order_Products = productDetails
        //         //     .filter(product => product.quantity > 0 && product.price > 0)
        //         //     .map(product => ({
        //         //         productId: product.product_id,
        //         //         quantity: product.quantity,
        //         //         price: product.price,
        //         //     }));

        //         // console.log("Log_DATA=>", productInfo, productDetails);


        //         // if (order_Products.length === 0) {
        //         //     return next(createHttpError(401, "Invalid products in order"));
        //         // }

        //     } catch (error) {
        //         return next(createHttpError(401, error.message));
        //     }
        // }

        // Generate new OrderID
        const OrderID = await generateOrderID("orderID", "DVYM");
        if (!OrderID) {
            return next(createHttpError(401, "Error generating order ID"));
        }

        // Prepare order data
        const PRETTY_ORDER_DATA = {
            order_id: OrderID,
            customer_id: reqDATA.customer_id,
            isPackage: reqDATA.isPackage,
            total_amount: total_Price, // Use the computed total_Price
            payment_method: reqDATA.payment_method,
            products: order_Products
        };

        const makeNewOrder = await orderModel.create(PRETTY_ORDER_DATA);
        if (!makeNewOrder) {
            return next(createHttpError(401, "Error creating order"));
        }

        res.json(makeNewOrder);
    } catch (error) {
        return next(createHttpError(401, error.message));
    }
};


const NEW_ORDER = async (req, res, next) => {
    try {
        const { error, value } = ORDER_SCHEMA_VALIDATION.validate(req.body);
        if (error) {
            return next(createHttpError(400, "oops invalid request."))
        }

        const isCustomerExists = await userModel.findById(value.customer_id)

        if (!isCustomerExists) {
            return next(createHttpError(400, "oops invalid request.."))
        }

        const pkg_Id = "67ab26d4a4ce24786697f4f3";
        // fetch_order_data;

        const singlePackagePrice = await PackageModel.findById(pkg_Id).select("price");

        const prettyDATA = {
            customer_id: isCustomerExists._id,
            total_amount: singlePackagePrice.price,
            payment_method: "Debit Card"
        }
        const new_Order = await orderModel.create(prettyDATA)
        return res.json({ new_Order })

        /*
        validate payloads
        get_product_data_from db
        check_quantity
        */
    } catch (error) {
        return next(createHttpError(400, `${'internal error', error}`))
    }
}

const GET_ALL_ORDERS_BY_USER_ID = async (req, res, next) => {
    try {
        const USER_ID = req?.params?.USER_ID;

        if (!USER_ID) {
            return next(createHttpError(401, "Invalid request"))
        }

        // get all the orders from db of Customers 

        const orders = await orderModel.find({ customer_id: USER_ID }, { _id: 0, __v: 0, updatedAt: 0, order_date: 0 })

        if (!orders || orders.length <= 0) {
            return next(createHttpError(401, "Invalid request"))
        }

        // on success



        return res.status(200).json(orders[0]);


    } catch (error) {
        return next(createHttpError(401, `Internal error ${error.message}`))
    }
}

const GET_SINGLE_ORDERS = async (req, res, next) => {
    try {
        const ORDER_ID = req.params.ORDER_ID;

        if (!ORDER_ID) {
            return next(createHttpError(401, "Invalid Order Id"))
        }

        const order = await orderModel.findOne({ _id: ORDER_ID }, { __v: 0, _id: 0, updatedAt: 0 })
        const prettyData = {
            success: true,
            statusCode: 200,
            ...order?._doc,
        }
        res.status(200).json(prettyData)

    } catch (error) {
        return next(createHttpError(401, "Something went wrong during fetching Orders from database"))
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
        const Order = await orderModel.findByIdAndUpdate(ORDER_ID, { status: reqData?.status })

        if (!Order) {
            return next(createHttpError(401, "Cannot able to update order status"))
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
})

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

    const orders = await orderModel.find().select("-updatedAt  -__v").limit(limit).skip(skip);

    if (!orders) {
        return next(createHttpError(401, "No Orders.."))
    }

    res.json(orders)
}


const GET_FILTERED_ORDER_VALIDATION_SCHEMA = Joi.object(
    {
        filterBy: Joi.string().trim().valid(
            'Pending',
            'Processing',
            'Shipped',
            'Delivered',
            'Success',
            'Cancelled',
            'Returned',
            'Refunded',
            'Failed',
            'On Hold',
            'Out for Delivery',
            'Declined'
        ),
        page: Joi.number().required(),
        limit: Joi.number().required()
    }
)

const GET_FILTERED_ORDER = async (req, res, next) => {
    try {

        const { error, value } = GET_FILTERED_ORDER_VALIDATION_SCHEMA.validate(req.query)
        if (error) {
            return next(createHttpError(401, `${error?.details[0]?.message}`))
        }
        // const { FILTER_BY, page, limit } = req.params;
        const page = parseInt(value.page) || 1;
        const limit = parseInt(value.limit) || 10;

        const skip = (page - 1) * limit;

        if (skip < 0 || page < 0 || limit < 0) {
            return next(createHttpError(400, "Invalid request.."))
        }

        const getOrders = await orderModel.find(
            { status: value.filterBy },
            { __v: 0, updatedAt: 0, createdAt: 0 })
            .limit(limit).skip(skip);

        return res.status(200).json({
            success: true,
            statusCode: 200,
            // page: 1,
            // limit,
            length: getOrders.length,
            responseData: getOrders,
        })

    } catch (error) {
        return next(createHttpError(401, error))
    }
}



export { NEW_ORDER, GET_ALL_ORDERS_BY_USER_ID, GET_SINGLE_ORDERS, GET_ALL_ORDERS, CHANGE_ORDER_STATUS, GET_FILTERED_ORDER }