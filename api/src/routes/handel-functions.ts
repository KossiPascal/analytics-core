import { NextFunction, Request, Response, Router } from 'express';
import { Middelware } from '../middleware/auth';

const functionsRouter = Router();

functionsRouter.post('/', Middelware.authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     return res.status(res.statusCode).json(found);
//   }
//   catch (err: any) {
//     return res.status(500).end();
//   }

});



export = functionsRouter;
