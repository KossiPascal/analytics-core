import { Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { getUsersRepository, jwSecretKey } from "../entities/User";

export class Middelware {
  static authMiddleware = async (req: Request, res: Response, next: any) => {
    const { userId, privileges, appLoadToken } = req.body;

    
    if (privileges == true) return next();
    if (appLoadToken != 'Kossi TSOLEGNAGBO') return res.status(500).send('You do not have access');
    const authHeader = req.get('Authorization');
    
    if (!authHeader || !userId) return res.status(res.statusCode).send('Not authenticated!');
    const token = authHeader.split(' ')[1];
    const userRepo = await getUsersRepository();
    const user = await userRepo.findOneBy({ id: userId });
    if (!token || token=='' || token != user?.token) return res.status(res.statusCode).send('Not authenticated!');

    if (user) {
      const jws = await jwSecretKey({});
      jwt.verify(token, jws.secretOrPrivateKey, function (err: any, decoded: any) {
        if (err) {
          return res.status(res.statusCode).send(err);
        } else {
          return next();
        }
      });
    } else {
      return res.status(500).send('You do not have access');
    }
  };
}
