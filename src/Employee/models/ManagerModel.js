import mongoose, { Schema } from "mongoose";

const MangerSchema = new Schema({
    fullName: {
        type: String, required: true
    },
    gender: {
        type: String, enum: ["male", "female", 'others'], required: true
    },
    mobileNum: {
        type: Number, unique: true, required: true
    },
    email: {
        type: String, unique: true, required: true
    },
    profile: {
        type: String,
        required: true
    },
    password: { type: String, required: true },
    dob: { type: Date, required: true },
    pinCode: { type: Number, required: true },
    address: { type: String, required: true },
    // to manage particular area-
    assignedPinCodes: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "areaZone" }],
        required: true
    },

    assignedSuperVisor: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "supervisor" }],
    },

    role: {
        type: String,
        enum: ['manager'],
        default: "manager"
    },

    accessToken: { type: String },
}, {
    timestamps: true
})

const ManagerModel = mongoose.model("manager", MangerSchema)
export default ManagerModel;