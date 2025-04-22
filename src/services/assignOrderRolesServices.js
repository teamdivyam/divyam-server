import orderModel from "../Orders/orderModel.js"
import ManagerModel from '../Employee/models/ManagerModel.js';
import userModel from "../Users/userModel.js";
import SuperVisorModel from '../Employee/models/SupervisorModel.js';


/**
 * DONT USE HTTP_ERROR=> THROW ERRORS
 * @param {ObjectId} orderId 
 * @param {ObjectId} userId
 * 
 */

export const AssignOrderRoleService = async (orderId, userId) => {
    try {
        // get users
        const isUserExists = await userModel.findById(userId);

        if (!isUserExists) {
            throw new Error("User is not availabe..")
        }

        // get Order info
        const isOrderexits = orderModel.findById(orderId);

        if (!isOrderexits) {
            throw new Error(`There is no Order with ${orderId} `)
        }

        // set manager 
        const isManagerAvailabe = await ManagerModel.findOne({
            pinCode: isOrderexits.pinCode
        })

        if (!isManagerAvailabe) {
            throw new Error(`No managers are available for this Order ${isOrderexits._id}`)
        }

        // on Success of manager- set Role
        const isSuperVisorAvailabe = await SuperVisorModel.findOne({
            pinCode: isOrderexits.pinCode
        })

        if (!isSuperVisorAvailabe) {
            throw new Error(`No supervisors are available for this Order ${isOrderexits._id}`)
        }

        // on success Supervisor availabilty  (UPDATE SUPERVISOR);


        // check updations if all Roles are set then retun true 
        // if any one failed then save it on file 

    } catch (error) {
        throw new Error(`Error occured during assignOrderRoles ${error.message}`)
    }
}
