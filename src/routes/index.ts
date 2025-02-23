import express from 'express'
import authRouter from './auth';
import UserRouter from './user';
import mediaRouter from './media';
import tweetRouter from './tweet';
let indexRoute=express.Router();

indexRoute.use('/auth',authRouter)
indexRoute.use('/user',UserRouter)
indexRoute.use('/upload',mediaRouter)
indexRoute.use('/tweet',tweetRouter)

export default indexRoute