import mongoose, { Schema } from "mongoose";

const superVisorSchema = new Schema({
    fullName: { type: String, required: true },
    gender: { type: String, enum: ['male', 'female', 'others'], required: true },
    mobileNum: { type: Number, unique: true, required: true },
    email: { type: String, required: true, unique: true, },
    profile: { type: String, required: true },
    password: { type: String, required: true },
    dob: { type: Date, required: true },
    pinCode: { type: Number, required: true },
    address: { type: String, required: true },

    manager: { type: mongoose.Schema.Types.ObjectId, ref: "Manager" },

    assignedDeliveryPartners: [{ type: mongoose.Schema.Types.ObjectId, ref: "DeliveryPartner" }],

    // managed order by supervisors
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],

    // Areas this supervisor is responsible for
    assignedPinCodes: [{ type: mongoose.Schema.Types.ObjectId, ref: "areaZone" }],

    role: { type: String, enum: ['supervisor'], default: 'supervisor' },
    accessToken: { type: String },
}, {
    timestamps: true
})

const SuperVisorModel = mongoose.model('supervisor', superVisorSchema)

export default SuperVisorModel