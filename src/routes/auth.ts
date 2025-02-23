import express, { Request, Response, NextFunction } from "express";
import { userModel } from "../models/user";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken";
import generateOTP from "../utils/generateOTP";
import {
  requestUserTypes,
  UserJwtPayload,
  verifyRefreshToken,
  verifyToken,
} from "../middleware/verifyToken";
let UserRouter = express.Router();

UserRouter.post(
  "/login",
  async (req: Request, res: Response, next: NextFunction) => {
    let { email } = req.body;
    if (!email || !req.body.password) {
      throw new Error("invalid credentials");
    }
    try {
      let foundUser = await userModel.findOne({ email });

      if (!foundUser) {
        throw new Error("user not found");
      }

      let match = await bcrypt.compare(req.body.password, foundUser.password as string);

      if (!match) {
        throw new Error("wrong password");
      }
      if (!foundUser.isVerified) {
        foundUser.emailVerifyToken = generateOTP().toString();
        foundUser.exprireEmail = new Date(Date.now() + 60 * 60 * 1000);
        //send to user email
        await foundUser.save();
      }
      
      let { password, ...userInfo } = foundUser.toObject();
      let { accessToken } = await generateToken(res, foundUser._id);

      res.status(200).send({ ...userInfo, accessToken });
    } catch (error) {
      next(error);
    }
  }
);
UserRouter.post(
  "/register",
  async (req: Request, res: Response, next: NextFunction) => {
    let { email, username } = req.body;
    
    try {
      if (!email || !username || !req.body.password) {
        throw new Error("invalid credentials");
      }
      let foundUser = await userModel.findOne({ email });
      if (foundUser) {
        throw new Error("user existed");
      }
      let hashedPassword = await bcrypt.hash(req.body.password, 10);
      let newUser = await new userModel({
        ...req.body,
        password: hashedPassword,
      }).save();

      let { password, emailVerifyToken, ...userInfo } = newUser.toObject();
      res.status(200).send(userInfo);
    } catch (error) {
      next(error);
    }
  }
);
UserRouter.post(
  "/verify-email",
  verifyToken,
  async (req: requestUserTypes, res: Response, next: NextFunction) => {
    let { id } = req.user as UserJwtPayload;
    let { code } = req.body;

    try {
      let foundUser = await userModel.findById(id);
      if (!foundUser) {
        throw new Error("user not found");
      }
      if (code != foundUser.emailVerifyToken) {
        throw new Error("wrong code");
      }
      if (new Date() > new Date(foundUser?.exprireEmail as string)) {
        throw new Error("exprired code");
      }
      foundUser.emailVerifyToken = undefined;
      foundUser.exprireEmail = undefined;
      foundUser.isVerified = true;
      await foundUser.save();
      res.status(200).send("verified successflly");
    } catch (error) {
      next(error);
    }
  }
);
UserRouter.post(
  "/forgot",
  async (req: Request, res: Response, next: NextFunction) => {
    let { email } = req.body;

    try {
      let code = generateOTP().toString();
      let doc = await userModel.findOneAndUpdate(
        { email },
        {
          resetToken: code,
          exprireReset: new Date(Date.now() + 60 * 1000),
        }
      );
      if (!doc) {
        throw new Error("user no found");
      }
      res.status(200).send("code sent successflly");
    } catch (error) {
      next(error);
    }
  }
);
UserRouter.get(
  "/refreshToken",
  verifyRefreshToken,
  async (req: requestUserTypes, res: Response, next: NextFunction) => {
      let {id}=req.user as UserJwtPayload
      let { accessToken } = await generateToken(res, id);
      res.status(200).send({
         accessToken,
      })
  }
);


export default UserRouter;
