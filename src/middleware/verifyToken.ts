import { NextFunction, Request, Response } from "express";
import { JwtPayload, verify } from "jsonwebtoken";
import { client } from "../db";
import { Types } from "mongoose";

export interface UserJwtPayload extends JwtPayload {
   id: Types.ObjectId | "";
 }
export interface requestUserTypes extends Request {
   user?: UserJwtPayload
}
export function verifyToken(req: requestUserTypes,res: Response,next: NextFunction) {
   try {
    let token=req.headers.token;
    if (!token) {
        throw new Error('you are not authenticated')
    }
   let sceretkey=process.env.JWT_SECRET || "mykey";
   if (typeof token=="string") {
      token=token.split(" ")[1];
   } else {
      token=token[0].split(" ")[1];
   }
    let decoded=verify(token,sceretkey);
    req.user=decoded as UserJwtPayload;
    next();
   } catch (error) {
    
      next(error)
   }
}
export function checkAuth(req: requestUserTypes,res: Response,next: NextFunction) {
   try {
    let token=req.headers.token;
    if (!token) {
        throw new Error()
    }
   let sceretkey=process.env.JWT_SECRET || "mykey";
   if (typeof token=="string") {
      token=token.split(" ")[1];
   } else {
      token=token[0].split(" ")[1];
   }
    let decoded=verify(token,sceretkey);
    req.user=decoded as UserJwtPayload;
    next();
   } catch (error) {
      req.user={id: ""}
      next()
   }
}
export async function verifyRefreshToken(req: requestUserTypes,res: Response,next: NextFunction) {
   try {
    let token=req.cookies.refreshToken;
    if (!token) {
        throw new Error('session expired')
    }
   
   let sceretkey=process.env.JWT_SECRET || "mykey";
    let decoded=verify(token,sceretkey);
    let storedToken=await client.get("refreshToken")
    console.log(storedToken,"\n",token);
    if (storedToken!==token) {
      throw new Error('old token')
    }
    req.user=decoded as UserJwtPayload;
    next();
   } catch (error) {
      next(error)
   }
}