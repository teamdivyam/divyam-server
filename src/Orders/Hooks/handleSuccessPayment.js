import mongoose from "mongoose";
import logger from "../../config/logger.js";
import userModel from "../../Users/userModel.js";
import OrderModel from "../orderModel.js"
import TransactionModel from "../transactionModel.js";

const handleCapturedPayments = async (payment) => {
    const session = await mongoose.startSession();
    session.startTransaction()

    const orderId = payment.order_id;  //orderID
    try {
        const Order = await OrderModel.findOne({ orderId });

        if (!Order) {
            await session.abortTransaction();
            throw new Error("Something went wrong.")
        }

        if (!payment.captured) {
            await session.abortTransaction();
            throw new Error("Payment failed...");
        }

        const orderNotes = `
        discription:${payment.description}
        card_id:${payment.card_id}
        vpa:${payment.vpa}
        email:${payment.email}
        contact:${payment.contact}
        `;

        const Transaction = await TransactionModel.findOneAndUpdate(
            {
                gatewayOrderId: orderId
            },
            {
                status: "success",
                currency: "INR",
                completedAt: new Date(),
                paymentMethod: payment.method
            });

        if (!Transaction) {
            await session.abortTransaction();
            throw new Error("There is no transaction with this order id");
        }

        Order.orderStatus = "Pending";
        Order.transaction = Transaction._id
        Order.notes = orderNotes.trim();
        await Order.save();

        // attacch order with user 
        const user = await userModel.findById({ _id: Order.customer });
        if (!user) {
            await session.abortTransaction();
            throw new Error("Something went wrong.")
        }

        if (!user.orders.includes(Order._id)) {
            user.orders.push(Order._id);
            await user.save();
        }

        // ON-SUCCESS
        await session.commitTransaction();
        return true
    } catch (error) {
        session.abortTransaction()
        logger.info(error)
        return false
    }
    finally {
        await session.endSession()
    }
}

export default handleCapturedPayments