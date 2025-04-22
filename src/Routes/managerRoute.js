import express from "express"
import { CHNAGE_PASSWORD, GET_MANAGER_STATS, GET_SUPERVISORS, LOGOUT, SHOW_COMPLETE_SUPERVISORS_PROFILE, WHO_AM_I }
    from "../Employee/controller/MangerController.js"

import isManager from '../middleware/isEmpAuth.js';
import { GET_PROFILE, GET_SINGLE_EMPLOYEE }
    from "../Employee/controller/EmployeeController.js";
import { NEW_SUPERVISOR, UNSET_SUPERVISOR_FROM_MANAGER }
    from "../Employee/controller/SupervisorControllers.js";
import Upload from "../utils/multerUpload.js";

const ManagerRoute = express.Router();

//---------[MANAGER]---------
// create-new-supervisor
// can-delete-supervisor
// can-assigns-pinCodes-to-supervisor
// monitors-supervisors-(stats)
// can-see-supervisors-orders-details
// stats-


ManagerRoute.get('/me', isManager, WHO_AM_I,);
ManagerRoute.get('/logout', isManager, LOGOUT);
ManagerRoute.get('/get-manager-stats', isManager, GET_MANAGER_STATS); //basic-analytics
ManagerRoute.get('/supervisors', isManager, GET_SUPERVISORS); //get-all-supervisors
ManagerRoute.get('/supervisor/:EMP_ID', GET_SINGLE_EMPLOYEE); //get-single-employee
ManagerRoute.post('/supervisor/:SUPERVISOR_ID', isManager, UNSET_SUPERVISOR_FROM_MANAGER);
ManagerRoute.get('/supervisor-profile/:SUPERVISOR_ID', SHOW_COMPLETE_SUPERVISORS_PROFILE);

//UNSET
//takes-managerID and SupervisorID as a payload
ManagerRoute.post('/supervisor', Upload.single('profile'), NEW_SUPERVISOR);
ManagerRoute.patch('/change-password', isManager, CHNAGE_PASSWORD)


export default ManagerRoute;

