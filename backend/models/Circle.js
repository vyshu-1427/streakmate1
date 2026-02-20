import mongoose from "mongoose";

const circleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    category: {
        type: String,
        required: true,
        trim: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    visibility: {
        type: String,
        enum: ["public", "private"],
        default: "public",
    },
    location: {
        type: {
            type: String,
            enum: ["Point"],
            required: false,
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: false,
        },
    },
    radius: {
        type: Number, // in kilometers or meters
        default: 10,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Create a 2dsphere index for geospatial queries
circleSchema.index({ location: "2dsphere" });

export default mongoose.model("Circle", circleSchema);
