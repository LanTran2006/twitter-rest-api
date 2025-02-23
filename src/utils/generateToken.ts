import { Types } from "mongoose"
import {sign} from 'jsonwebtoken'
import { Response } from "express"
import { client } from "../db";

export async  function generateToken(res: Response,id: Types.ObjectId) {
    let sceretkey=process.env.JWT_SECRET || "mykey";
    let accessToken=sign({id},sceretkey,{
        expiresIn: '1d'
    })
    let refreshToken=sign({id},sceretkey,{
        expiresIn: '2d'
    })
    res.cookie("refreshToken",refreshToken,{
        maxAge: 24*3600*1000,
        httpOnly: true,
        sameSite: "strict",
    })
    await client.set("refreshToken",refreshToken)
    return {accessToken}
}