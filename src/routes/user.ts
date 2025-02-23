import express, { Request, Response, NextFunction } from "express";
import {
  requestUserTypes,
  UserJwtPayload,
  verifyToken,
} from "../middleware/verifyToken";
import { userModel } from "../models/user";
import bcrypt from "bcryptjs";
import { followModel } from "../models/follow";
import { isValidObjectId } from "mongoose";
import { bookmarkModel } from "../models/bookmark";
let UserRouter = express.Router();

UserRouter.post(
  "/changePass",
  verifyToken,
  async (req: requestUserTypes, res: Response, next: NextFunction) => {
    let { newpass } = req.body;
    try {
      let { id } = req.user as UserJwtPayload;
      let user = await userModel.findById(id);
      let isMatch = await bcrypt.compare(
        req.body.password,
        user?.password as string
      );
      if (!isMatch) {
        throw new Error("wrong password");
      }
      let hashedPassword = await bcrypt.hash(newpass, 10);
      await userModel.findByIdAndUpdate(id, {
        password: hashedPassword,
      });
      res.status(200).send("password changed successflly");
    } catch (error) {
      next(error);
    }
  }
);
UserRouter.get(
  "/profile",
  verifyToken,
  async (req: requestUserTypes, res: Response, next: NextFunction) => {
    try {
      let { id } = req.user as UserJwtPayload;
      let user = await userModel.findById(id).select("-password");
      if (!user) {
        throw new Error("user no found");
      }
      res.status(200).send(user);
    } catch (error) {}
  }
);
UserRouter.post(
  "/resetPass",
  async (req: Request, res: Response, next: NextFunction) => {
    let { password } = req.body;
    let code = req.query.code;
    console.log(code);
    try {
      let user = await userModel.findOne({ resetToken: code }).lean();
      if (!user) {
        throw new Error("wrong code");
      }
      if (new Date() > new Date(user.exprireReset as Date)) {
        throw new Error("exprired code");
      }
      let hashedPassword = await bcrypt.hash(password, 10);
      await userModel.findOneAndUpdate(
        { resetToken: code },
        {
          password: hashedPassword,
          $unset: {
            exprireReset: 1,
            resetToken: 1,
          },
        }
      );
      res.status(200).send("reset successflly");
    } catch (error) {
      next(error);
    }
  }
);
UserRouter.post(
  "/follow",
  verifyToken,
  async (req: requestUserTypes, res: Response, next: NextFunction) => {
    try {
      let { id: userId } = req.user as UserJwtPayload;
      let followedId = req.body.followed;
      if (!isValidObjectId(followedId)) {
        throw new Error("invalid id");
      }
      if (followedId == userId) {
        throw new Error("you cannot follow yourself");
      }
      let [foundDoc,foundUser] = await Promise.all([followModel.findOne({
        userId,
        followedUserId: followedId,
      }),userModel.findById(followedId)])
      if (foundDoc) {
        throw new Error("you followed this user");
      }
      if (!foundUser) {
        throw new Error("user not found");
      }
      await new followModel({ userId, followedUserId: followedId }).save();
      res.status(200).send("you followed");
    } catch (error) {
      next(error);
    }
  }
);
UserRouter.post(
  "/unfollow",
  verifyToken,
  async (req: requestUserTypes, res: Response, next: NextFunction) => {
    try {
      let { id: userId } = req.user as UserJwtPayload;
      let followedId = req.body.followed;
      if (!isValidObjectId(followedId)) {
        throw new Error("invalid id");
      }
      if (followedId == userId) {
        throw new Error("you cannot unfollow yourself");
      }
      await followModel.findOneAndDelete({
        userId,
        followedUserId: followedId,
      });
      res.status(200).send("you unfollowed");
    } catch (error) {
      next(error);
    }
  }
);
UserRouter.post(
  "/bookmark",
  verifyToken,
  async (req: requestUserTypes, res: Response, next: NextFunction) => {
    try {
      let { id: userId } = req.user as UserJwtPayload;
      let tweetId = req.body.tweet;
      if (!isValidObjectId(tweetId)) {
        throw new Error("invalid id");
      }
      let foundTweet = await bookmarkModel.findOne({ tweetId });
      if (foundTweet) {
        await foundTweet.deleteOne();
        res.status(200).send("you unbookmarked this tweet");
      } else {
        await new bookmarkModel({ tweetId, userId }).save();
        res.status(200).send("you bookmarked this tweet");
      }
    } catch (error) {
      next(error);
    }
  }
);
UserRouter.get(
  "/bookmarks",
  verifyToken,
  async (req: requestUserTypes, res: Response, next: NextFunction) => {
    try {
      let { id: userId } = req.user as UserJwtPayload;
      let foundTweets = await bookmarkModel.aggregate([
        {
          $match: {
            userId
          }
        },
        {
          $lookup: {
            from: "tweets", 
            localField: "tweetId",
            foreignField: "_id",
            as: "tweets"
          }
        },
        {
          $unwind: "$tweets"
        },
        {
          $replaceRoot: {
             newRoot: "$tweets"
          }
        }
      ]);
      foundTweets;
    } catch (error) {
      next(error);
    }
  }
);
export default UserRouter;
