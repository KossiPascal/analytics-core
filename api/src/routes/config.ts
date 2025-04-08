import { NextFunction, Request, Response, Router } from 'express';
import { JsonDatabase } from '../json-data-source';
import { Middelware } from '../middleware/auth';
import { appVersion } from '../functions/functions';

const configRouter = Router();

configRouter.post('/', Middelware.authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const _repoConfig = new JsonDatabase('configs');
    const found = (Object.values(_repoConfig.all()))[0];
    // const _repoConfig = await getConfigRepository();
    // const found = (await _repoConfig.find())[0];
    return res.status(res.statusCode).json(found);
  }
  catch (err: any) {
    if (!err.statusCode) err.statusCode = 500;
    return res.status(err.statusCode).end();
  }

});

configRouter.post('/version', Middelware.authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  return res.status(200).json(appVersion());
});


export = configRouter;
