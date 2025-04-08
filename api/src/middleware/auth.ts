import { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { getUsersRepository, userTokenGenerated } from "../entities/User";
import { APP_AUTH_TOKEN, SECRET_PRIVATE_KEY, APP_ADMIN_PRIVILEGE } from "../providers/constantes";
import { roleAuthorizations } from "../providers/authorizations-pages";

export class Middelware {
  static authMiddleware = async (req: Request, res: Response, next: any) => {
    const { userId, privileges, appLoadToken } = req.body;

    const noPermissionsMsg = {status: 500, action: 'logout', data:'Vous n\'navez pas les permissions necessaires'};
    const notAuthenticated = {status: 500, action: 'logout', data:'Vous n\'êtes pas authentifié!'};

    if (privileges == APP_ADMIN_PRIVILEGE) return next();
    if (appLoadToken !== APP_AUTH_TOKEN) return res.status(500).send(notAuthenticated);
    const authHeader = req.get('Authorization');
    
    if (!authHeader || !userId) return res.status(500).send(notAuthenticated);
    const token = authHeader.split(' ')[1];
    const _repo = await getUsersRepository();
    
    // if (!token || token=='' || token != user?.token) return res.status(500).send(notAuthenticated);
    if (!token || token=='') return res.status(500).send(notAuthenticated);
    const user = await _repo.findOneBy({ id: userId });
    if (!user) return res.status(500).send(noPermissionsMsg);

    jwt.verify(token, SECRET_PRIVATE_KEY, function (err: any, decoded: any) {
      return err ? res.status(500).send(notAuthenticated) : next();
    });
  };

  static validateReportsMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.body.userId;
        if (!userId) return res.status(400).json({ status: 400, data: 'Aucun utilisateur sélectionné' });

        const _repo = await getUsersRepository();
        const user = await _repo.findOneBy({ id: userId });

        if (!user || !user.isActive || user.isDeleted) return res.status(403).json({ status: 403, data: 'Utilisateur non autorisé ou inactif' });

        const userToken = await userTokenGenerated(user);
        if (!userToken) return res.status(401).json({ status: 401, data: 'Non autorisé' });

        const role = roleAuthorizations(userToken.authorizations ?? [], userToken.routes ?? []);
        if (!role.canValidateData) return res.status(403).json({ status: 403, data: 'Accès refusé' });

        next();
    } catch (err) {
        console.error('Erreur middleware promotion-reports:', err);
        return res.status(500).json({ status: 500, data: 'Erreur serveur' });
    }
};

static sendReportsToDhis2Middleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
      const userId = req.body.userId;
      if (!userId) return res.status(400).json({ status: 400, data: 'Aucun utilisateur sélectionné' });

      const _repo = await getUsersRepository();
      const user = await _repo.findOneBy({ id: userId });

      if (!user || !user.isActive || user.isDeleted) return res.status(403).json({ status: 403, data: 'Utilisateur non autorisé ou inactif' });

      const userToken = await userTokenGenerated(user);
      if (!userToken) return res.status(401).json({ status: 401, data: 'Non autorisé' });

      const role = roleAuthorizations(userToken.authorizations ?? [], userToken.routes ?? []);
      if (!role.canSendDataToDhis2) return res.status(403).json({ status: 403, data: 'Accès refusé' });

      next();
  } catch (err) {
      console.error('Erreur middleware promotion-reports:', err);
      return res.status(500).json({ status: 500, data: 'Erreur serveur' });
  }
};




}
