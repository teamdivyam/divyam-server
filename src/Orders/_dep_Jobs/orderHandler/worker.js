import { Worker } from "bullmq";
import redisConnection from "../redisConnection.js";

// import { AssignOrderRoleService } from "../../../services/assignOrderRolesServices.js";
/**
 * CONSUMER  || WORKER
 * 
 */

/**
 * get Order extraxt order-object id or order_id {ORDER_ID, ORDEr _PINCoDE}
 * find manager and Supervisor based on Order-pincode
 * Update manage and supervisor
 * if no on catch do nothing just 
 * store order and user summery info into an file for future 
 * 
 * 
 */


new Worker('RoleAssignmentQueue', async (job) => {
    try {
        console.log(`🔥 Job is running on ${job.id}`);
        return { success: true };
    } catch (error) {
        console.error(`Role assignment failed: ${error.message}`, error);
        throw error;
    }

}, { connection: redisConnection })
