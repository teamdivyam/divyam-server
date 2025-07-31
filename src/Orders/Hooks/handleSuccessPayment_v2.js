import mongoose from "mongoose"
import OrderModel from "../orderModel";
import TransactionModel from "../transactionModel";
import bookingModel from "../bookingModel";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";

const client = new LambdaClient({
    region: config.AWS_REGION,
    credentials: {
        accessKeyId: config.AWS_BUCKET_KEY,
        secretAccessKey: config.AWS_BUCKET_SECRET,
    },
});


const InvokeLambda = async (payload) => {
    try {
        const params = {
            FunctionName: "OrderInvoice_deploy",
            InvocationType: "Event",
            Payload: Buffer.from(JSON.stringify(payload))

        }
        const command = new InvokeCommand(params);
        const response = await client.send(command);
        console.log(`LAMBDA_INVOKED: ${response}`);

    } catch (error) {
        throw new Error(error)
    }
}


/**
 * Todo:
 *    #UPDATE_INSIDE_ORDER_DOCS
 *      -ORDER_STATUS = SUCCESS
 *       add notes data form razorpay info
 *       UPDATE_Transuction docs 
 *       Update_booking_info
 *       invoke lmabda       
 */

export const handleCapturedPayment_V2 = async (payment) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const orderId = payment.order_id;
        const Order = await OrderModel.findOne({ orderId });

        if (!Order) {
            await session.abortTransaction();
            throw new Error("Internal error can't process payment..")
        }

        // update Order status
        //  after payment complete order will goes into pending state
        Order.orderStatus = "Pending";
        await Order.save();

        // Update Booking Information 
        const booking = await bookingModel.findById(Order.booking);
        if (!booking) {
            await session.abortTransaction();
            throw new Error("Internal error can't process payment..");
        }

        booking.status = "Confirmed";
        await booking.save();

        // Update Transaction document
        const Transaction = await TransactionModel.findOne({ gatewayOrderId: orderId });


        if (!Transaction) {
            await session.abortTransaction();
            throw new Error("Internal error can't process payment..");
        }

        /**
         * Todo:-
         *      verify transaction amount from database..
         *      model transaction amount ===  razorpay webhook payment value
         */

        // Transaction.amount = ;
        Transaction.status = "success";
        await Transaction.save();

        // after Everything done
        await InvokeLambda();

    } catch (error) {
        throw new Error()
    }
}