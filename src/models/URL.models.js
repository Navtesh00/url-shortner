import mongoose from "mongoose";

const urlSchema = new mongoose.Schema({
    longURL: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2048
    },
    shortURL: {
        type: String,
        required: true,
        unique: true,
        index: true,
        minlength: 6,
        maxlength: 10,
        match: /^[A-Za-z0-9]+$/
    },
    totalVisits: {
        type: Number,
        default: 0,
        min: 0,
    },
    lastVisitedAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: new Date(),
        immutable: true
    }
}, { timestamps: true });

const URL = mongoose.model("URL", urlSchema);

export default URL;