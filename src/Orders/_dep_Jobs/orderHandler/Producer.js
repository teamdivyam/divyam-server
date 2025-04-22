import { Queue } from 'bullmq';
import redisConnection from '../redisConnection.js';

const RoleQueue = new Queue('RoleAssignmentQueue', {
    connection: redisConnection,

    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'fixed',
            delay: 5 * 1000
        },
        removeOnComplete: 100,
        removeOnFail: 500
    }
});


const AssignOrderRoles = async (order) => {
    try {
        const JOB = await RoleQueue.add('AssignRolesJob', { order });

        console.log(`✅ New Job with JOB_ID=> ${JOB.id} added to RoleAssignmentQueue`);
    } catch (error) {
        console.error(" Failed to add job:", error);
    }
};

// Queue events
RoleQueue.on('waiting', ({ id }) => {
    console.log(`⏳ Job ${id} is waiting`);
});




export default AssignOrderRoles;
