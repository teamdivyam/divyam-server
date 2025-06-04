import express from "express";
import rateLimit from "express-rate-limit";
import {
    ADMIN_DASHBOARD_ANALYTICS,
    CHANGE_ADMIN_PASSWORD,
    DELETE_SINGLE_USERS,
    GET_ALL_USERS,
    GET_ORDER_DETAILS,
    GET_PRESIGNED_URL,
    GET_SINGLE_USERS,
    LoginAdmin,
    RegisterAdmin,
    SEARCH_AGENTS,
    SEARCH_ORDERS,
    SEARCH_USERS,
    VIEW_ADMIN_PROFILE,
    VIEW_SINGLE_ORDER_ADMIN
} from "../Admin/adminController.js";
import {
    ADD_NEW_PACKAGE,
    DELETE_SINGLE_PACKAGE,
    GET_ALL_PACKAGE,
    GET_SINGLE_PACKAGE,
    UPDATE_PACKAGE
} from "../Package/PackageController.js";
import {
    ATTACH_INVOICE_WITH_ORDER,
    CHANGE_ORDER_STATUS,
    GET_ALL_ORDERS,
    GET_ALL_ORDERS_BY_USER_ID,
    GET_FILTERED_ORDER,
    GET_SINGLE_ORDERS
} from "../Orders/orderController.js";
// AUTH..
import isAdmin from "../middleware/isAdmin.js";

import {
    DELETE_AREA_ZONE,
    GET_ALL_AREA_ZONES,
    GET_SINGLE_AREA_ZONE,
    SET_NEW_AREA_ZONE,
    UPDATE_AREA_ZONE,
    GET_ALL_PIN_CODES,
} from "../AreaZone/areaZoneController.js";

import Upload from "../utils/multerUpload.js";
import {
    DELETE_SINGLE_DELIVERY_AGENT,
    GET_DELIVERY_AGENTS,
    GET_SINGLE_DELIVERY_AGENT
} from "../DeliveryPartners/DeliveryControllers.js";

import {
    DELETE_EMPLOYEE,
    GET_ALL_UNASSIGNED_SUPERVISORS,
    GET_EMPLOYEE,
    GET_SINGLE_EMPLOYEE,
    NEW_EMPLOYEE,
    SET_SUPERVISOR,
    UNSET_SUPERVISOR_FROM_MANAGER
} from "../Employee/controller/EmployeeController.js";
import { nanoid } from "nanoid";
import logger from "../logger/index.js";

const AdminRoute = express.Router();

// SET_RATE_LIMIT_FOR_ADMIN_LOGIN
const LIMIT_ADMIN_LOGIN = rateLimit({
    windowMs: 6000 * 30,  // 30 minutes
    max: 20,
    message: 'Please try agian later',

    keyGenerator: (req) => {
        const randomDigits = nanoid(10);
        const clientId = `${req.ip}-${randomDigits}`;
        return clientId;
    }
});

// Routes For Admin..
AdminRoute.post('/register', Upload.single('avatar'), RegisterAdmin);
AdminRoute.post('/login', LIMIT_ADMIN_LOGIN, LoginAdmin);

// AUTH ADMIN THEN PROCEED FOR THE NEXT TASK..

// ANALYTICS

AdminRoute.get('/analytics', isAdmin, ADMIN_DASHBOARD_ANALYTICS);

// Packages  
AdminRoute.post('/package', isAdmin, Upload.single("image"), ADD_NEW_PACKAGE);
AdminRoute.get('/package', isAdmin, GET_ALL_PACKAGE);
AdminRoute.get('/package/:PERMALINK', isAdmin, GET_SINGLE_PACKAGE);
AdminRoute.patch('/package/:PERMALINK', isAdmin, UPDATE_PACKAGE);
AdminRoute.delete('/package/:PKG_ID', isAdmin, DELETE_SINGLE_PACKAGE);

// Orders  (ALl THE ROUTES Manage by ADMIN..)
AdminRoute.get('/order/', isAdmin, GET_ALL_ORDERS);
AdminRoute.get('/order/:ORDER_ID', isAdmin, VIEW_SINGLE_ORDER_ADMIN);
AdminRoute.get('/order-filter', isAdmin, GET_FILTERED_ORDER);
AdminRoute.patch('/order/:ORDER_ID', isAdmin, CHANGE_ORDER_STATUS);
AdminRoute.post('/order-details', GET_ORDER_DETAILS); // For Internal comunication
AdminRoute.post('/attach-invoice', ATTACH_INVOICE_WITH_ORDER)

// USER-INFO-MANAGED_BY_ADMIN

AdminRoute.get('/users/', isAdmin, GET_ALL_USERS);
AdminRoute.get('/user/:USER_ID', isAdmin, GET_SINGLE_USERS);
AdminRoute.delete('/user/:USER_ID', isAdmin, DELETE_SINGLE_USERS);
AdminRoute.get('/profile', isAdmin, VIEW_ADMIN_PROFILE);
AdminRoute.post('/change-password', isAdmin, CHANGE_ADMIN_PASSWORD);

// get-order-details-by-user

// SEARCH USERS
AdminRoute.get('/search-user', isAdmin, SEARCH_USERS);
AdminRoute.get('/search-orders', isAdmin, SEARCH_ORDERS);

//  AREA ZONES
AdminRoute.post('/areas-zone', isAdmin, SET_NEW_AREA_ZONE);
AdminRoute.get("/areas-zone", isAdmin, GET_ALL_AREA_ZONES);
AdminRoute.patch("/areas-zone/:AREA_ZONE_ID", isAdmin, UPDATE_AREA_ZONE);
AdminRoute.get("/areas-zone/:AREA_ZONE_ID", isAdmin, GET_SINGLE_AREA_ZONE);
AdminRoute.delete("/areas-zone/:AREA_ZONE_ID", isAdmin, DELETE_AREA_ZONE);
AdminRoute.get("/areas", isAdmin, GET_ALL_PIN_CODES);

// Employee
AdminRoute.post('/employee', isAdmin, Upload.single("avatar"), NEW_EMPLOYEE);
AdminRoute.get('/employees', isAdmin, GET_EMPLOYEE); //get-all-employee
AdminRoute.get('/employee/:EMP_ID', isAdmin, GET_SINGLE_EMPLOYEE);   //get-single-employee
AdminRoute.delete('/employee/:EMP_ID', isAdmin, DELETE_EMPLOYEE);
AdminRoute.post('/set-supervisor', isAdmin, SET_SUPERVISOR);
AdminRoute.patch('/unset-supervisor', isAdmin, UNSET_SUPERVISOR_FROM_MANAGER)
AdminRoute.get('/get-all-unassigned-supervisor', isAdmin, GET_ALL_UNASSIGNED_SUPERVISORS);

// DELIVERY partners
AdminRoute.get('/agents', isAdmin, GET_DELIVERY_AGENTS); //get-all-delivery-agents
AdminRoute.get('/agent/:AGENT_ID', isAdmin, GET_SINGLE_DELIVERY_AGENT); //get-single-agent
AdminRoute.get('/search', isAdmin, SEARCH_AGENTS); // SEARCH AGENTS
AdminRoute.delete('/agent/:AGENT_ID', isAdmin, DELETE_SINGLE_DELIVERY_AGENT); //delete-single-agent

AdminRoute.post('/get-presigned-url', isAdmin, GET_PRESIGNED_URL)

export default AdminRoute;