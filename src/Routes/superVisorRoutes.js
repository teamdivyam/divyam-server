import express, { Router } from "express";
import isSuperVisor from "../middleware/isEmpAuth.js"
import { WHO_AM_I, CHANGE_PASSWORD, SUPERVISOR_ANAYALYTICS } from "../Employee/controller/SupervisorControllers.js";
const route = express.Router();

route.get('/me', isSuperVisor, WHO_AM_I);
route.get('/stats', isSuperVisor, SUPERVISOR_ANAYALYTICS);
route.patch('/change-password', isSuperVisor, CHANGE_PASSWORD);



export { route as SuperVisorRoutes }