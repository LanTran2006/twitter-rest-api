import  {Request, Response ,  NextFunction } from 'express';
export function errorHandling (err: any,req: Request,res: Response,next: NextFunction) {
    let message=err?.message || "something went wrong";
    res.status(400).send(message)
}
export function handleNotFound(req: Request,res: Response,next: NextFunction) {
    res.status(400).send('not found route')
}