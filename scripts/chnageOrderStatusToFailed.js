import mongoose from 'mongoose';
import OrderModel from '../src/Orders/orderModel.js';
import connectDb from '../src/config/db.js';
import cron from 'node-cron';

/**
 * This script will be not runs at same time when the order is placed
 * 
 * after 5 min of ordered placed , it wil chnage order status to failed
 * 
 * USE Razorpay api to check the transaction paid or not.
 */

const UpdateOrder = async () => {
    await connectDb();

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const orders = await OrderModel.find({ orderStatus: "Failed" });

        orders.map(async (order) => {
            const newDate = new Date();
            const currentDate = newDate + 5

            if (order.createdAt != currentDate) {
                const updateOrder = await OrderModel.findByIdAndUpdate(order._id, { orderStatus: "Processing" });

                console.log("Executed successfully...");
            }
        });

    } catch (error) {
        await session.abortTransaction();
        throw new Error(error?.message);
    }
}

// runs every hours
cron.schedule("*/60 * * * *", async () => {
    UpdateOrder();
})