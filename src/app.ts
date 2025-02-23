import express, {Request, Response , Application, NextFunction } from 'express';
import dotenv from 'dotenv';
import startServer, { createFolder } from './db';
import indexRoute from './routes';
import cors from "cors";
import cookieParser from 'cookie-parser'
import { errorHandling, handleNotFound } from './middleware/errorHandling';
import path from 'path';
dotenv.config();
const app: Application = express();
const port = process.env.PORT || 8000;
startServer()
createFolder()
//neccessary middlewares
app.use(express.json())
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'uploads')));
app.use(cors({ origin: "*" ,credentials: true}));
app.use(express.urlencoded({ extended: true })); 
//handle routes
app.use(indexRoute)
app.use(errorHandling)
app.use(handleNotFound)

app.listen(port, () => {
  console.log(`Server is  running at port ${port}`);
});
