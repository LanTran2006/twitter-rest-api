import mongoose from "mongoose";

let hastagSchema=new mongoose.Schema({
   name: {
      type: String,
      required: true
   }
})
export const hastagModel=mongoose.model("hastags",hastagSchema)