import express from "express";
import rateLimit from "express-rate-limit";
import authUser from "../middleware/authUser.js";
import {
    ADD_NEW_ADDRESS,
    DELETE_SINGLE_ADDRESS,
    GET_ALL_ADDRESS,
    GET_PRIMARY_ADDRESS,
    GetProducts,
    GetSingleProduct,
    GUEST_USER,
    LOGOUT_USER,
    RegisterUser,
    SET_DEFAULT_ADDRESS,
    UPDATE_EXISTING_ADDRESS,
    UPDATE_PROFILE_PICTURE,
    UpdateUser,
    USER_PRFOILE,
    VERIFY_OTP,
    WHOAMI
} from "../Users/userController.js";
import {
    DOWNLOAD_INVOICE,
    GET_ALL_ORDERS_BY_USER_ID,
    GET_SINGLE_ORDERS,
    NEW_ORDER,
    NEW_ORDER_V2,
    ORDER_CANCEL,
    SAVE_CART,
    verifyPayments
} from "../Orders/orderController.js";

import {
    GET_ALL_FEATURED_PACKAGE,
    GET_ALL_PACKAGE_FOR_USERS,
    GET_SINGLE_PACKAGE_FOR_USERS
} from "../Package/PackageController.js";

import {
    CHECK_AREA_STATUS,
    PINCODE_VERIFY
} from "../AreaZone/areaZoneController.js";

import Upload from "../utils/multerUpload.js"
import { config } from "../config/_config.js";
import isGuestUser from "../middleware/isGuestUser.js";

const limitOTP = rateLimit({
    windowMs: 60000 * 5, //5 minutes
    max: config.OTP_RATE_LIMIT || 5,
    standardHeaders: 'true',
    legacyHeaders: false,
    standardHeaders: true,
    message: 'Too many requests. Please try again later.',
    keyGenerator: (req) => {
        const deviceId = req?.headers['x-device-id'];
        console.log("DEVICE_ID", deviceId);
        return deviceId;
    }
});

// Router for USERS...
const Route = express.Router();
//register user and send OTP..
Route.post('/user/register', limitOTP, RegisterUser);
// Verify-user-With-Otp..
Route.post('/user/verify-otp', limitOTP, VERIFY_OTP);
// Update Profile
Route.get('/user/profile', authUser, USER_PRFOILE);
Route.get('/user/me', authUser, WHOAMI);
Route.patch('/user/update/', authUser, UpdateUser);
Route.patch('/user/change-profile-pic', authUser,
    Upload.single("profile"), UPDATE_PROFILE_PICTURE);

// ADDRESS
Route.get('/user/address', authUser, GET_ALL_ADDRESS); //get-address
Route.patch('/user/address', authUser, ADD_NEW_ADDRESS); // create New address
Route.patch('/user/address/:ADDRESS_ID', authUser, UPDATE_EXISTING_ADDRESS); // update existing address
Route.patch('/user/address/active/:ADDRESS_ID', authUser, SET_DEFAULT_ADDRESS); // set-default-address
Route.get('/user/address/primary', authUser, GET_PRIMARY_ADDRESS)
Route.delete('/user/address/:ADDRESS_ID', authUser, DELETE_SINGLE_ADDRESS); //del-address

//  PACKAGES
Route.get('/packages', GET_ALL_PACKAGE_FOR_USERS);
Route.get('/featured-package', GET_ALL_FEATURED_PACKAGE);
Route.get('/package/:SLUG', GET_SINGLE_PACKAGE_FOR_USERS);
Route.get('/user/orders', authUser, GET_ALL_ORDERS_BY_USER_ID);  //req.user-All_Orders
Route.get('/user/order/:ORDER_ID', authUser, GET_SINGLE_ORDERS);  //Single_Orders
Route.get('/user/order-cancel/:ORDER_ID', authUser, ORDER_CANCEL);  //cancel-order
Route.post('/availability-check', CHECK_AREA_STATUS);
Route.post('/check-pincode', PINCODE_VERIFY);

// Route.post('/new-order', authUser, NEW_ORDER);
Route.post('/user/new-order', authUser, NEW_ORDER);
Route.post('/user/v1/new-order', authUser, NEW_ORDER_V2);
// Route.post('/user/new-order', authUser, NEW_ORDER);
Route.post('/verify-payments', authUser, verifyPayments);
Route.get('/user/ordered', DOWNLOAD_INVOICE) // open new page where user ca download their invoice

//call guest api when user visit for the first time 
Route.post('/session/guest', isGuestUser, GUEST_USER);
Route.post('/user/save-cart', isGuestUser, SAVE_CART);
// ------LOGIN_END_POINT
// Route.post('/auth',)

// LOG-out-user
Route.get('/logout', authUser, LOGOUT_USER)

Route.get('/products', GetProducts)
Route.get('/products/:productId', GetSingleProduct)


export default Route;