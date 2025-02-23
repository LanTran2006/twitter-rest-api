import { Request, Response } from "express";
import path from "path";
import formidable, { Files, Fields, Part } from "formidable";

const uploadDir = path.join(path.dirname(__dirname), "uploads/images");

export function handleUploadImage(req: Request, res: Response): Promise<{ fields: Fields; files: Files }> {
 
  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFiles: 20,
    filter: ({ mimetype }) => {
      const valid = mimetype && mimetype.includes("image");
      
      return Boolean(valid)},
    filename: (name: string, ext: string, part: Part) => {
      return `${Date.now()}${ext}`;
    }
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        // Custom error handling
        if (err.message === 'Invalid type of image') {
          res.status(400).send(err.message);
        } else {
          res.status(500).send('An error occurred while processing the file');
        }
        reject(err);
      } else {
        resolve({ fields, files });
      }
    });
  });
}
