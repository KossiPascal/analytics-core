import { Router } from 'express';
import { Middelware } from "../middleware/auth";
import { ApisController } from "../controllers/api-token";

const ApisRouter = Router();

ApisRouter.post('/api-access-key', Middelware.authMiddleware, ApisController.AccessKeyList);


export = ApisRouter;
