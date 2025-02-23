import { config } from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
const imagePath = path.join(__dirname, "uploads/images");
const videoPath = path.join(__dirname, "uploads/videos");
import express, { Request, Response } from "express";
import { createClient } from "redis";

export const client = createClient({
  url: 'redis://127.0.0.1:6379'
});

config();
export default async function startServer() {
  try {
    let url = process.env.URL || "";
    await Promise.all([mongoose.connect(url),client.connect()]) ;
    console.log("connected to mongodb");
  } catch (error) {
    console.log(error);
  }
}
export function createFolder() {
  if (!fs.existsSync(imagePath)) {
    fs.mkdirSync(imagePath, { recursive: true });
  }
  if (!fs.existsSync(videoPath)) {
    fs.mkdirSync(videoPath, { recursive: true });
  }
}
