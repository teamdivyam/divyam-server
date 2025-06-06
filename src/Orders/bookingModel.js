import mongoose from "mongoose";


const bookingAddresSchema = new mongoose.Schema({
    area: { type: String, },
    landMark: { type: String, },
    city: { type: String },
    state: { type: String },
    contactNumber: { type: Number },
    pinCode: { type: String },
    area: { type: String },
    isActive: { type: Boolean, default: false }
});

const bookingSchema = new mongoose.Schema({
    resourceId: { type: mongoose.Schema.Types.ObjectId, ref: "Package", required: true },  //packageId
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },   //customerId
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    orderInvoice: { type: String, },
    address: { type: bookingAddresSchema, },
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