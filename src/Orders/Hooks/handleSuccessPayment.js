import mongoose from "mongoose";
import userModel from "../../Users/userModel.js";
import OrderModel from "../orderModel.js"
import TransactionModel from "../transactionModel.js";
import logger from "../../logger/index.js";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { config } from "../../config/_config.js";

const client = new LambdaClient({
    region: config.AWS_REGION,
    credentials: {
        accessKeyId: config.AWS_BUCKET_KEY,
        secretAccessKey: config.AWS_BUCKET_SECRET,
    },
});

const invokeLambda = async (payload) => {
    const command = new InvokeCommand({
        FunctionName: 'OrderInvoice_deploy',
        InvocationType: "Event",
        Payload: Buffer.from(JSON.stringify(payload))
    });

    try {
        const response = await client.send(command);
        console.log(`Lambda Invoked... ${JSON.stringify(response)}`);
    } catch (error) {
        console.error('Error invoking Lambda:', error);
    }
}



// for success payments
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
        // call lambda function
        const lambdaPayload = { orderId: orderId };
        await invokeLambda(lambdaPayload);
        // ON-SUCCESS
        await session.commitTransaction();
        console.log("✅- Success");
        return true
    } catch (error) {
        session.abortTransaction()
        logger.error(
            `Failed to process Razorpay [Success payment webhook]: ${error.message}, Error stack: ${error.stack}`
        );
        return false
    }
    finally {
        await session.endSession()
    }
}

export { invokeLambda, handleCapturedPayments }
