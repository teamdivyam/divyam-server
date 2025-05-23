import express from "express";
import rateLimit from "express-rate-limit";
import authUser from "../middleware/authUser.js";
import {
    GUEST_USER,
    LOGOUT_USER,
    RegisterUser,
    UPDATE_PROFILE_PICTURE,
    UpdateUser,
    USER_PRFOILE,
    VERIFY_OTP,
    WHOAMI
} from "../Users/userController.js";

import {
    GET_ALL_ORDERS_BY_USER_ID,
    GET_SINGLE_ORDERS,
    NEW_ORDER,
    ORDER_CANCEL,
    SAVE_CART,
    verifyPayments
} from "../Orders/orderController.js";

import {
    GET_ALL_FEATURED_PACKAGE,
    GET_ALL_PACKAGE,
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
    windowMs: 60000 * 30,
    max: config.OTP_RATE_LIMIT,
    standardHeaders: 'true',
    legacyHeaders: false,
    standardHeaders: true,
    message: 'Too many requests. Please try again later.',
    keyGenerator: (req) => req.ip
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
Route.post('/verify-payments', verifyPayments);

//call guest api when user visit for the first time 
Route.post('/session/guest', isGuestUser, GUEST_USER);
Route.post('/user/save-cart', isGuestUser, SAVE_CART);

// LOG-out-user
Route.get('/logout', authUser, LOGOUT_USER)

export default Route;