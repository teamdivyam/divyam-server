// 
// Not in use in production
// 

import mongoose from "mongoose";
const transactionSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
        razorpayOrderId: { type: String, required: true },
        razorpayPaymentId: { type: String },
        razorpaySignature: { type: String },
        amount: { type: Number, required: true },
        currency: { type: String, default: "INR" },
        status: { type: String, enum: ["PENDING", "PAID", "FAILED"], default: "PENDING" },
        paymentMethod: { type: String, default: "UPI" },
        failureReason: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
