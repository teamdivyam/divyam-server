import express from "express";
import { RegisterUser, UpdateUser, verifyOTP } from "../Users/userController.js";
import rateLimit from "express-rate-limit";
import {
    GET_ALL_ORDERS_BY_USER_ID,
    GET_SINGLE_ORDERS,
    NEW_ORDER
} from "../Orders/orderController.js";

import { GET_ALL_PACKAGE } from "../Package/PackageController.js";
import { CHECK_AREA_STATUS } from "../AreaZone/areaZoneController.js";
import authUser from "../middleware/authUser.js";
import Upload from "../utils/multerUpload.js"


const limitOTP = rateLimit({
    windowMs: 60 * 60 * 1000, //1hr
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
})

// Router for USERS...
const Route = express.Router();
//register user and send OTP..
Route.post('/users/otp', limitOTP, RegisterUser);
// Verify-user-With-Otp..
Route.post('/user/verify-otp', limitOTP, verifyOTP);
// Route.post('/user/verify-otp', limiter, verifyOTP);

// Update user Profile details
Route.patch('/user/update/:userID', authUser, Upload.single("avatar"), UpdateUser);

//  Create New Orders for users
// Route.post('/user/newOrder', authUser, newOrder)
Route.post('/user/newOrder', NEW_ORDER)

// SHOW PACKAGES
Route.get('/packages', GET_ALL_PACKAGE)
Route.get('/order/:USER_ID', authUser, GET_ALL_ORDERS_BY_USER_ID)
Route.get('/order/:ORDER_ID', authUser, GET_SINGLE_ORDERS)

Route.get('/availability-check', CHECK_AREA_STATUS)


export default Route;
