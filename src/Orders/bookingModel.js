import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
    resourceId: { type: mongoose.Schema.Types.ObjectId, ref: "Package", required: true },  //packageId
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },   //customerId
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    orderInvoice: { type: String, },
    status: {
        type: String,
        enums: [
            "Pending",
            "Awaiting Payment",
            "Confirmed",
            "Cancelled",
            "Refunded",
            "Completed"
        ],
        default: "Pending",
        index: true
    },
    cancellationPolicy: { type: String },
}, { timestamps: true });

const bookingModel = mongoose.model("Booking", bookingSchema);




export default bookingModel;