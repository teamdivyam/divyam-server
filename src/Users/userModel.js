import mongoose from "mongoose";


const address = new mongoose.Schema({
    area: { type: String, },
    landmark: { type: String, },
    city: { type: String },
    state: { type: String },
    contactNumber: { type: Number, required: true },
    pinCode: { type: String },
    area: { type: String },
    isActive: { type: String, default: false }
});

const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    fullName: { type: String },
    gender: { type: String },
    mobileNum: { type: String, required: true, unique: true },
    email: { type: String },
    dob: { type: Date },
    avatar: { type: String },
    address: { type: String },
    areaPin: { type: String },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order', unique: true }],
    address: [{
        type: address,
        default: "null"
    }],
    role: {
        type: String,
        enum: ["user"],
        default: "user"
    },
    accessToken: { type: String },
    otp: { type: mongoose.Types.ObjectId, ref: "otp", require: true },
    isVerified: { type: Boolean, default: false },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
}
);


const userModel = mongoose.model("User", userSchema);
export default userModel;
