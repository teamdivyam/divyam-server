import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        orderId: { type: String, unique: true, required: true, index: true },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
            index: true,
        },
        referralCode: { type: String, default: null },
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
        },

        // pincode: { type: Number, required: true, index: true },

        // assignedRoles: {
        //     supervisor: { type: mongoose.Schema.Types.ObjectId, ref: "supervisor" },
        //     manager: { type: mongoose.Schema.Types.ObjectId, ref: "manager" },
        //     deliveryAgent: { type: mongoose.Schema.Types.ObjectId, ref: "deliverypartners" },
        // },

        product: {
            productId: { type: String, required: true },
            quantity: { type: Number, required: true, default: 1 },
            price: { type: Number, required: true },
        },

        orderStatus: {
            type: String,
            enum: [
                "Processing",  //Initiated by system while new order created
                "Pending", // after Payment Completed
                "Packed", // set by admin
                "Shipped", // set by admin
                "Delivered", // set by admin
                "CANCELLATION_REQUESTED", // user make req 
                "REFUND_REQUESTED", // user make req for 
                "Cancelled", // set by admin
                "Refunded", // set by admin
                "Out for Delivery", // set by admin
                "Failed", // it could be set by admin or payment failure
            ],
            default: "Processing",
        },
        transaction: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Transaction"
        },

        // payment: {
        //     status: {
        //         type: String,
        //         enum: [
        //             "Paid",
        //             "Failed",
        //             "Pending"
        //         ],
        //         default: "Pending",
        //         index: true,
        //     },
        //     method: {
        //         type: String,
        //         enum: [
        //             "processing",
        //             "card",
        //             "debit",
        //             "credit",
        //             "netbanking",
        //             "upi",
        //             "wallet",
        //         ],

        //         default: "processing",
        //     },
        //     gateway: {
        //         razorpaySignature: { type: String },
        //         razorpayPaymentId: { type: String },
        //     },
        // },


        notes: { type: String, default: "" },
        totalAmount: { type: Number, required: true },
    },
    { timestamps: true }
);

orderSchema.index({ orderId: 1 });
orderSchema.index({ customer: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ pincode: 1 });
// orderSchema.index({ "payment.status": 1 });

const OrderModel = mongoose.model("Order", orderSchema);
export default OrderModel;
