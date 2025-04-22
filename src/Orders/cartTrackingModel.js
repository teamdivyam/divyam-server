import mongoose from "mongoose";

const cartTrackingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    sessionId: {
        type: String,
        default: null,
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    quantity: {
        type: Number,
        default: 1
    },
    addedAt: {
        type: Date,
        default: Date.now
    }

});

export default mongoose.model("CartTracking", cartTrackingSchema);
