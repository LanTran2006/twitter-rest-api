import { Response, Router, Request, NextFunction } from "express";
import {
  checkAuth,
  requestUserTypes,
  UserJwtPayload,
  verifyToken,
} from "../middleware/verifyToken";
import { hastagModel } from "../models/hastag";
import { tweetModel } from "../models/tweet";
import { ObjectId, Types } from "mongoose";
import { error } from "console";
import { userInfo } from "os";
import { UserTypes } from "../models/user";
import { followModel } from "../models/follow";
let tweetRouter = Router();

tweetRouter.post(
  "/create",
  verifyToken,
  async (req: requestUserTypes, res: Response, next: NextFunction) => {
    try {
      let { id } = req.user as UserJwtPayload;
      let hastags = req.body.hastag || [];

      let hastagId = await Promise.all(
        hastags.map((item: string) =>
          hastagModel
            .findOneAndUpdate(
              { name: item },
              { name: item },
              { upsert: true, new: true }
            )
            .select("_id")
        )
      );

      let hastagDocs = hastagId.map((item) => item._id);
      console.log(hastagDocs);
      let newtweet = await new tweetModel({
        ...req.body,
        hastag: hastagDocs,
        userId: id,
      }).save();

      res.status(200).send(newtweet);
    } catch (error) {
      next(error);
    }
  }
);
tweetRouter.get(
  "/newsfeed",
  checkAuth,
  async (req: requestUserTypes, res: Response,next: NextFunction) => {
    try {
      let { id } = req.user as UserJwtPayload;
      let { limit = 4, page = 1 } = req.query as {
        limit?: string;
        page?: string;
      };
      limit = Number(limit);
      page = Number(page);
      if (!id) {
        let tweets = await tweetModel
          .find({ type: "Tweet" })
          .sort({ createdAt: -1 })
          .skip(limit * (page - 1))
          .limit(limit);
        res.status(200).send(tweets);
        return;
      }
     
      let followers = await followModel.find({ userId: id });
      let followersId = followers.map((item) => item.followedUserId);
      console.log(followersId);
      let foundTweets = await tweetModel.aggregate([
        { $match: { userId: { $in:[... followersId] } } },
        {
          $lookup: {
            from: "hastags",
            localField: "hastag",
            foreignField: "_id",
            as: "hastag",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userInfo",
          },
        },
        { $unwind: { path: "$userInfo" } },
        {
          $lookup: {
            from: "tweets",
            localField: "_id",
            foreignField: "parentId",
            as: "tweetChildren",
          },
        },
        {
          $addFields: {
            comments: {
              $filter: {
                input: "$tweetChildren",
                as: "child",
                cond: { $eq: ["$$child.type", "Comment"] },
              },
            },
          },
        },
        { $sort: { createdAt: -1 } },
        { $project: { userId: 0, "userInfo.password": 0, __v: 0 ,tweetChildren: 0} },
      ]);
      res.status(200).send(foundTweets);
    } catch (error) {
      next(error);
    }
  }
);
tweetRouter.get("/search",checkAuth,async (req: requestUserTypes, res: Response, next: NextFunction) => {
  try {
    let {q="tweet",type,range="public"}=req.query as {
      q?: string;
      type?: string;
      range?: string;
    };
    let { id } = req.user as UserJwtPayload;
    
    let queryType=type ? type : {
      $in: ["video","image"]
    }
    if (range=="follower" && id) {
      let followers = await followModel.find({ userId: id });
      let followersId = followers.map((item) => item.followedUserId);
      let foundedTweets=await tweetModel.aggregate([
        {
          $match: {
            $text: {
              $search: q
            },
            "media.type": queryType,
            userId: {
              $in: followersId
            }
          }
        }
      ])
      res.status(200).send(foundedTweets);
      return
    } else if (!id) {
      throw new Error("you are not authenticated")
    }
    let foundedTweets=await tweetModel.aggregate([
     {
       $match: {
         $text: {
           $search: q
         },
         "media.type": queryType
       }
     }
   ])
   res.status(200).send(foundedTweets);
  } catch (error) {
    next(error)
  }
})
tweetRouter.get(
  "/:tweetId",
  checkAuth,
  async (req: requestUserTypes, res: Response, next: NextFunction) => {
    try {
      let id = req.user?.id;
      let tweetId = req.params.tweetId;
      console.log(id, tweetId);
      let [foundTweet] = await tweetModel.aggregate([
        {
          $match: {
            _id: new Types.ObjectId(tweetId),
          },
        },
        {
          $lookup: {
            from: "hastags",
            localField: "hastag",
            foreignField: "_id",
            as: "hastag",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userInfo",
          },
        },
        {
          $unwind: {
            path: "$userInfo",
          },
        },
        {
          $project: {
            userId: 0,
            "userInfo.password": 0,
            __v: 0,
          },
        },
        {
          $lookup: {
            from: "tweets",
            localField: "_id",
            foreignField: "parentId",
            as: "tweetChildren",
          },
        },
        {
          $addFields: {
            comments: {
              $filter: {
                input: "$tweetChildren",
                as: "child",
                cond: {
                  $eq: ["$$child.type", "Comment"],
                },
              },
            },
          },
        },
      ]);

      await tweetModel.findByIdAndUpdate(tweetId, {
        $inc: { [id ? "userViews" : "guessViews"]: 1 },
      });
      if (foundTweet?.audience == "private") {
        throw new Error("this tweet is private");
      }
      if (foundTweet?.audience == "circle") {
        if (!id) throw new Error("you are not allowed to access");
        let isValid =
          foundTweet.userInfo.circle.some((item: Types.ObjectId) =>
            new Types.ObjectId(id).equals(item)
          ) || new Types.ObjectId(id).equals(foundTweet.userInfo._id);
        if (!isValid) {
          throw new Error("you are not allowed to access");
        }
      }
      res.status(200).send(foundTweet);
    } catch (error) {
      next(error);
    }
  }
);
tweetRouter.get(
  "/comments/:parentId",
  checkAuth,
  async (req: requestUserTypes, res: Response, next: NextFunction) => {
    try {
      let { id } = req.user as UserJwtPayload;
      let { limit = 2, page = 1 } = req.query as {
        limit?: string;
        page?: string;
      };
      limit = Number(limit);
      page = Number(page);

      let parentId = req.params.parentId;
      let parent = await tweetModel
        .findById(parentId)
        .populate("userId")
        .lean();
      let status = parent?.audience;
      if (status == "private") {
        throw new Error("you are not allowed to access");
      }
      if (status == "circle") {
        let userDoc = parent?.userId as UserTypes;
        let isValid = userDoc.circle.some((item: Types.ObjectId) =>
          new Types.ObjectId(id).equals(item)
        );
        if (!isValid && userDoc._id != id) {
          throw new Error("you are not allowed to access");
        }
      }
      let comments = await tweetModel
        .find({ parentId, type: "Comment" })
        .skip(limit * (page - 1))
        .limit(limit);
      res.status(200).send(comments);
    } catch (error) {
      next(error);
    }
  }
);

export default tweetRouter;
