import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    order_id: { type: String, unique: true },
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "manager"
    },
    delivery_agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "deliverypartners"
    },
    products: [
        {
            productId: { type: String, required: true },
            quantity: { type: Number, required: true, default: 1 },
            price: { type: Number, required: true }
        }
    ],

    order_date: {
        type: Date,
        default: Date.now,
    },

    status: {
        type: String,
        enum: ['Processing', 'Pending', 'Packed', 'Shipped', 'Delivered', 'Success', 'Cancelled', 'Refunded', 'Failed', 'On Hold', 'Out for Delivery', 'Declined'],
        default: "Pending",
        required: true,
    },
    payment_method: {
        type: String,
        enum: ['Credit Card', 'Debit Card', 'Bank Transfer', 'Digital Wallet'],
        required: true,
    },

    total_amount: {
        type: Number,
        required: true,
    },
}, { timestamps: true });

const orderModel = mongoose.model('order', orderSchema);
export default orderModel