import express, { Request, Response, NextFunction } from "express";
import { handleUploadImage } from "../utils/upload";
import { tweetModel } from "../models/tweet";
let mediaRouter = express.Router();

mediaRouter.post(
  "/image",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let { files , fields } = await handleUploadImage(req,res);
      let uploadedFile= files.file?.map(item=>('http://localhost:5000/images/'+item.newFilename));

      res.send(uploadedFile);
    } catch (error) {
        next(error)
    }
  }
);

export default mediaRouter;
