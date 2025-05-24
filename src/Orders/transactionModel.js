import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },

        gatewayOrderId: { type: String, required: true },
        gatewaySignature: { type: String },

        amount: { type: Number, required: true },
        currency: { type: String, default: "INR" },

        status: {
            type: String,
            enum: [
                'initiated',
                'processing',
                'success',
                'failed',
                'cancelled',
                'expired',
                'refunded',
                'partially_refunded',
            ],
            default: 'initiated',
        },

        paymentMethod: {
            type: String,
            enum: ['upi', 'wallet', 'card', 'netbanking', 'emi', 'bank_transfer', 'failed'],
        },

        gateway: {
            type: String,
            enum: ['razorpay', 'cashfree'],
            default: 'razorpay',
        },

        failureReason: { type: String },

        completedAt: { type: Date },
        refundedAt: { type: Date },
    },
    { timestamps: true }
);

// Idexes...
transactionSchema.index({ razorpayOrderId: 1 }, { unique: true });
transactionSchema.index({ user: 1 });
transactionSchema.index({ order: 1 });

const TransactionModel = mongoose.model("Transaction", transactionSchema);

export default TransactionModel

