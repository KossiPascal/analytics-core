import { Request, Response, NextFunction } from 'express';
import { getApiTokenAccessRepository, ApiTokenAccess } from '../entities/Api-token';

export class ApisController {
    static AccessKeyList = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId, id, token, isActive, action } = req.body;
            if (userId) {
                const apiRepo = await getApiTokenAccessRepository();

                if (action == 'list') {
                    const apis = await apiRepo.find();
                    return res.status(200).json({ status: 200, data: apis });
                } else if (action == 'create' && !id && token) {
                    const api = new ApiTokenAccess();
                    api.token = token;
                    api.isActive = isActive;
                    await apiRepo.save(api);
                    const apis = await apiRepo.find();
                    return res.status(200).json({ status: 200, data: apis });
                } else if (action == 'update' && id && token) {
                    const api = await apiRepo.findOneBy({ id: id });
                    if (api) {
                        api.token = token;
                        api.isActive = isActive;
                        await apiRepo.update(id, api);
                        const apis = await apiRepo.find();
                        return res.status(200).json({ status: 200, data: apis });
                    }
                } else if (action == 'delete' && id) {
                    const api = await apiRepo.findOneBy({ id: id });
                    if (api) {
                        await apiRepo.delete(api);
                        const apis = await apiRepo.find();
                        return res.status(200).json({ status: 200, data: apis });
                    }
                }
                return res.status(201).json({ status: 201, data: 'error' });
            }
            return res.status(201).json({ status: 201, data: 'Aucun utilisateur selectionné' });
        } catch (err) {
            return res.status(500).json({ status: 500, data: `${err}` });
        }
    }
}