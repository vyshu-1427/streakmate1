import mongoose from "mongoose";

const joinRequestSchema = new mongoose.Schema({
    circleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Circle",
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Prevent duplicate requests
joinRequestSchema.index({ circleId: 1, userId: 1 }, { unique: true });

export default mongoose.model("JoinRequest", joinRequestSchema);
