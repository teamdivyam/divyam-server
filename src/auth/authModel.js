import mongoose from "mongoose"

const authSchema = mongoose.Schema({


}, { timestamps: true });


export const authModel = mongoose.model("auth", authSchema);

