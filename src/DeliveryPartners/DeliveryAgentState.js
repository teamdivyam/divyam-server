import mongoose from "mongoose";

// Tracks the status and performance of delivery agents,
//  including their current location, delivery count, and overall status

const AgentPerformanceSchema = new mongoose.model({
    id: { type: mongoose.Schema.ObjectId, ref: "deliveryPartner" },
    delivery_count: { type: Number },
    success_delivery_count: { type: Number },
    failed_delivery_count: { type: Number },
})

const AgentPerformance = mongoose.model("AgentPerformance", AgentPerformanceSchema)
export default AgentPerformance;