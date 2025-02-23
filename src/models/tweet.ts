import mongoose from "mongoose";

let tweetsSchema = new mongoose.Schema(
  {
    content: {
      type: String,
    },
    type: {
      type: String,
      enum: ["Tweet", "Retweet", "Comment", "QuoteTweet"],
      required: true,
    },
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    parentId: {
      type: mongoose.Types.ObjectId,
    },
    audience: {
      type: String,
      required: true,
      enum: ["public", "circle", "private"],
      default: "public"
    },
    hastag: [
      {
        type: mongoose.Types.ObjectId,
        ref: "hastags"
      },
    ],
    userViews: {
      type: Number,
      default: 0,
    },
    mentions: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Users"
      },
    ],
    guestViews: {
      type: Number,
      default: 0,
    },
    media: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);
export const tweetModel = mongoose.model("Tweets", tweetsSchema);
