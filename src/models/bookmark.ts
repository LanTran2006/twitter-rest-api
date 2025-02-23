import mongoose from "mongoose";

let bookMarkSchema=new mongoose.Schema({
    tweetId: {
        type: mongoose.Types.ObjectId,
        ref: "Tweets",
        required: true
    },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "Users",
        required: true
    }
},{timestamps: true})
export const bookmarkModel=mongoose.model("Bookmarks",bookMarkSchema)