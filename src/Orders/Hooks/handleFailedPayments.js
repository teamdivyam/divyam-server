import OrderModel from "../orderModel.js";
import mongoose from 'mongoose'
import TransactionModel from "../transactionModel.js";
import logger from "../../logger/index.js";

const handleFailedPayments = async (paymentInfo) => {

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const orderId = paymentInfo.order_id;
        const Order = await OrderModel.findOne({ orderId });

        if (!Order) {
            logger.info(`Can't proceed with this order ${orderId || "unknown"}`);
            await session.abortTransaction()
            return false
        }

        console.log("Log1__2")

        Order.orderStatus = "Failed";
        await Order.save({ session });


        const failureReason = `
        error_code=>${paymentInfo.error_code} \n,
        description=>${paymentInfo.error_description} \n,
        error_source=>${paymentInfo.error_source}\n,
        error_step=>${paymentInfo.error_step}\n,
        error_reason=>${paymentInfo.error_reason}\n,
        `;

        console.log("Log1__3")



        const Transaction = await TransactionModel.findOne(
            {
                gatewayOrderId: orderId,
                status: "failed",
                paymentMethod: "failed"
            }
        );


        if (!Transaction || Transaction.status == "success") {
            await session.abortTransaction();
            throw new Error("Oops Something went wrong during transaction processing");
        }

        Transaction.status = "failed";
        Transaction.currency = "INR";
        Transaction.paymentMethod = paymentInfo.method;
        Transaction.amount = paymentInfo.amount;
        Transaction.failureReason = failureReason.trim();

        await Transaction.save()

        console.log("Log1__4")

        Order.orderStatus = "Failed";
        Order.transaction = Transaction._id;
        Order.notes = failureReason.trim();

        // On SUCCESS
        console.log("❌- failed");
        return true;
    } catch (error) {
        logger.error(
            `Failed to process Razorpay [failed payment webhook]: ${error.message}, Error stack: ${error.stack}`
        );

        await session.abortTransaction()
    }
    finally {
        await session.endSession()
    }
}

export default handleFailedPayments;