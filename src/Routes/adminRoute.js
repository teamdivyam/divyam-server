import express from "express";
import {
    CHANGE_ADMIN_PASSWORD,
    DELETE_SINGLE_USERS,
    GET_ALL_USERS,
    GET_SINGLE_USERS,
    LoginAdmin,
    RegisterAdmin,
    SEARCH_AGENTS,
    SEARCH_ORDERS,
    SEARCH_USERS,
    VIEW_ADMIN_PROFILE
}
    from "../Admin/adminController.js";
import {
    ADD_NEW_PACKAGE,
    DELETE_SINGLE_PACKAGE,
    GET_ALL_PACKAGE,
    GET_SINGLE_PACKAGE,
    UPDATE_PACKAGE
} from "../Package/PackageController.js";
import {
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
    GET_ALL_PIN_CODES
} from "../AreaZone/areaZoneController.js";

import rateLimit from "express-rate-limit";

import Upload from "../utils/multerUpload.js";

import {
    DELETE_SINGLE_DELIVERY_AGENT,
    GET_DELIVERY_AGENTS,
    GET_SINGLE_DELIVERY_AGENT
} from "../DeliveryPartners/DeliveryControllers.js";

import {
    DELETE_EMPLOYEE,
    GET_EMPLOYEE,
    GET_SINGLE_EMPLOYEE,
    NEW_EMPLOYEE
} from "../Employee/EmployeeController.js";


const AdminRoute = express.Router();

// SET_RATE_LIMIT_FOR_ADMIN_LOGIN
const limitAdminLogin = rateLimit({
    windowMs: 600000,  // 10 minutes
    max: 10,
    message: '👋👋..',
})

// Routes For Admin..
AdminRoute.post('/register', Upload.single('avatar'), RegisterAdmin)
AdminRoute.post('/login', limitAdminLogin, LoginAdmin)
// AUTH ADMIN THEN PROCEED FOR THE NEXT TASK..

// Packages  
AdminRoute.post('/package', Upload.single("image"), ADD_NEW_PACKAGE)
AdminRoute.get('/package/', isAdmin, GET_ALL_PACKAGE);
AdminRoute.get('/package/:PKG_ID', isAdmin, GET_SINGLE_PACKAGE)
AdminRoute.patch('/package/:PKG_ID', isAdmin, Upload.single("image"), UPDATE_PACKAGE)
AdminRoute.delete('/package/:PKG_ID', isAdmin, DELETE_SINGLE_PACKAGE);

// Orders  (ALl THE ROUTES Manage by ADMIN..)
AdminRoute.get('/order/', isAdmin, GET_ALL_ORDERS)
AdminRoute.get('/order/:ORDER_ID', isAdmin, GET_SINGLE_ORDERS)
AdminRoute.get('/order-filter', isAdmin, GET_FILTERED_ORDER)
AdminRoute.patch('/order/:ORDER_ID', isAdmin, CHANGE_ORDER_STATUS)

// USER-INFO-MANAGED_BY_ADMIN
AdminRoute.get('/users/', isAdmin, GET_ALL_USERS)
AdminRoute.get('/user/:USER_ID', isAdmin, GET_SINGLE_USERS)
AdminRoute.delete('/user/:USER_ID', isAdmin, DELETE_SINGLE_USERS)
AdminRoute.get('/profile', isAdmin, VIEW_ADMIN_PROFILE)
AdminRoute.post('/change-password', isAdmin, CHANGE_ADMIN_PASSWORD)

// SEARCH USERS
AdminRoute.get('/search-user', isAdmin, SEARCH_USERS)
AdminRoute.get('/search-orders', isAdmin, SEARCH_ORDERS)

//  AREA ZONES
AdminRoute.post('/areas-zone', isAdmin, SET_NEW_AREA_ZONE)
AdminRoute.get("/areas-zone", isAdmin, GET_ALL_AREA_ZONES)
AdminRoute.patch("/areas-zone/:AREA_ZONE_ID", isAdmin, UPDATE_AREA_ZONE)
AdminRoute.get("/areas-zone/:AREA_ZONE_ID", isAdmin, GET_SINGLE_AREA_ZONE)
AdminRoute.delete("/areas-zone/:AREA_ZONE_ID", isAdmin, DELETE_AREA_ZONE)
AdminRoute.get("/areas", GET_ALL_PIN_CODES)
// Employee

AdminRoute.post('/employee', Upload.single("profile"), NEW_EMPLOYEE);
AdminRoute.get('/employees', isAdmin, GET_EMPLOYEE); //get-all-employee
AdminRoute.get('/employee/:EMP_ID', isAdmin, GET_SINGLE_EMPLOYEE);   //get-single-employee
AdminRoute.delete('/employee/:EMP_ID', isAdmin, DELETE_EMPLOYEE);

// DELIVERY partners
AdminRoute.get('/agents', isAdmin, GET_DELIVERY_AGENTS); //get-all-delivery-agents
AdminRoute.get('/agent/:AGENT_ID', GET_SINGLE_DELIVERY_AGENT) //get-single-agent
AdminRoute.get('/search', SEARCH_AGENTS) // SEARCH AGENTS
AdminRoute.delete('/agent/:AGENT_ID', DELETE_SINGLE_DELIVERY_AGENT); //delete-single-agent
export default AdminRoute;