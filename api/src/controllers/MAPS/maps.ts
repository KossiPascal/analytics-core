import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../data-source';
import { RecoDataMapsDbOutput } from '../../models/maps';

let Connection: DataSource = AppDataSource.manager.connection;


const paramettersErrorMsg = 'Les paramettres renseignés sont vides';
const notAuthorizedMsg = `Vous n'êtes pas autorisé à effectuer cette action!`;
const serverErrorMsg = (error: any) => `${error || 'Erreur Interne Du Serveur'}`;


export async function GET_RECO_DATA_MAPS(req: Request, res: Response, next: NextFunction) {
    try {
        let { userId, months, year, recos, sync } = req.body;
        if (!userId) return res.status(201).json({ status: 201, data: notAuthorizedMsg });
        if (!months || !year || !recos) return res.status(201).json({ status: 201, data: paramettersErrorMsg });

        recos = Array.isArray(recos) ? recos : [recos];
        months = Array.isArray(months) ? months : [months];

        const monthsPlaceholders = months.map((_: any, i: number) => `$${i + 1}`).join(',');
        const yearPlaceholders = `$${months.length + 1}`;
        const recosPlaceholders = recos.map((_: any, i: number) => `$${months.length + 2 + i}`).join(',');

        const datas: RecoDataMapsDbOutput[] = await Connection.query(`
                SELECT * FROM reco_data_map_view 
                WHERE month IN (${monthsPlaceholders})
                AND year = ${yearPlaceholders}
                AND (reco->>'id')::text IN (${recosPlaceholders})
            `, [...months, year, ...recos]);

        return res.status(200).json({ status: 200, data: datas });
    } catch (err: any) {
        return res.status(500).json({ status: 500, data: serverErrorMsg(err) });
    }
};
