import express from "express";

import { AUTH_EMPLOYEE, GET_EMPLOYEE, GET_PROFILE } from "../Employee/controller/EmployeeController.js";

const EMPRoutes = express.Router();

// auth-
EMPRoutes.post('/auth', AUTH_EMPLOYEE);
EMPRoutes.get('/', GET_EMPLOYEE); //get-all-employee
EMPRoutes.get('/profile/:EMP_ID', GET_PROFILE);

export default EMPRoutes