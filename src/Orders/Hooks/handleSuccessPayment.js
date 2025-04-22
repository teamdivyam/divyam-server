import logger from "../../config/logger.js";
import userModel from "../../Users/userModel.js";
import OrderModel from "../orderModel.js"

const handleCapturedPayments = async (payment) => {
    // orderID
    const orderId = payment.order_id;

    try {
        const Order = await OrderModel.findOne({ orderId });

        if (!Order) {
            throw new Error("Something went wrong.")
        }

        if (!payment.captured) {
            throw new Error("Payment failed...");
        }

        const orderNotes = `
        discription:${payment.description}
        card_id:${payment.card_id}
        vpa:${payment.vpa}
        email:${payment.email}
        contact:${payment.contact}
        `;

        Order.orderStatus = "Pending";
        Order.payment.status = "Paid";
        Order.payment.method = payment.method;
        Order.notes = orderNotes.trim();

        await Order.save();

        const user = await userModel.findById({ _id: Order.customer });

        if (!user) {
            throw new Error("Something went wrong.")
        }

        // attach order to user
        if (!user.orders.includes(Order._id)) {
            user.orders.push(Order._id);
            await user.save();
        }

        // ON-SUCCESS
        return true
    } catch (error) {
        logger.info(error)
        return false
    }
}

export default handleCapturedPayments