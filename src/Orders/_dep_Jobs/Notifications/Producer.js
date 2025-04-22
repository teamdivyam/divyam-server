import { Queue, Worker } from 'bullmq';
import redisConnection from '../redisConnection';

// new QUEUE
const NotificationQueue = new Queue('Notification_QUEUE', {
    connection: redisConnection
});

/**
 * 
 * Notifications Params
 * @param mobileNumber (req)
 * @param message (req)
 * 
 */

const SendNotifications = async (mobileNumber, message) => {
    try {
        const job = await NotificationQueue.add('Notification_QUEUE', {
            order
        });

        console.log(`Notifications Job id ${job.id}`);

    } catch (error) {
        throw new Error(error)
    }
}



OrderQueue.on('waiting', ({ id }) => {
    console.log(`Job ${id} is waiting`)

})

export default SendNotifications

