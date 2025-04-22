import logger from "../../config/logger.js";
import OrderModel from "../orderModel.js";

const handleFailedPayments = async (paymentInfo) => {

    const orderId = paymentInfo.order_id;
    const Order = await OrderModel.findOne({ orderId });

    if (!Order) {
        logger.info(`Can't proceed with this order ${orderId || "unknown"}`);
        return false
    }

    Order.orderStatus = "Failed";
    Order.payment.status = "Failed";
    Order.payment.method = paymentInfo.method;
    Order.notes = paymentInfo.error_description;

    logger.info(`${paymentInfo.error_description}`)

    await Order.save();

    // On SUCCESS
    return true;
}

export default handleFailedPayments;