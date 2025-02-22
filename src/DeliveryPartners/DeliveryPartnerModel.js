import mongoose from "mongoose";

const DeliveryPartner = new mongoose.Schema({
    fullName: { type: String, required: true },
    age: { type: Date, required: true, },
    email: { type: String, required: true, unique: true },
    gender: { type: String, enum: ['male', 'female', 'others'], required: true },
    city: { type: String, required: true, },
    pinCode: { type: String, required: true },
    address: {
        type: String, required: true,
    },

    orders: [
        {
            orderId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Order"
            }
        }
    ],

    delivery_counts: { type: Number },
    rating: { type: Number },
    phoneNum: { type: String, unique: true },
    status: { type: String, enum: ["available", "busy"], default: "available" },
})

const DeliveryPartnerModel = mongoose.model("DeliveryPartner", DeliveryPartner)

export default DeliveryPartnerModel
