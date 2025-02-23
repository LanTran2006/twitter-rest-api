import mongoose, { Document, Types } from "mongoose";
export interface UserTypes extends Document {
  username: string;
  avatar?: string;
  isVerified: boolean;
  emailVerifyToken?: string;
  exprireEmail?: Date;
  resetToken?: string;
  exprireReset?: Date;
  email: string;
  password: string;
  circle: Types.ObjectId[];
  bio?: string;
  location?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
let userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "avatar.png",
    },
    isVerified: {
      type: Boolean,
      default: false,
      required: true,
    },
    emailVerifyToken: {
      type: String,
    },
    exprireEmail: {
      type: Date,
    },
    resetToken: {
      type: String,
    },
    exprireReset: {
      type: Date,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    circle: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Users",
        default: []
      },
    ],
    bio: {
        type: String,
    },
    location: {
        type: String,
    }
  },
  { timestamps: true }
);
export const userModel = mongoose.model("Users", userSchema);
