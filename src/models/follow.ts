import mongoose from "mongoose";

let followSchema=new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "Users",
        required: true
    },
    followedUserId: {
        type: mongoose.Types.ObjectId,
        ref: "Users",
        required: true
    }
})
export const followModel=mongoose.model("follows",followSchema)